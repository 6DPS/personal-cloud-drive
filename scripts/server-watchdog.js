const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function loadDotEnv(envPath = path.join(ROOT, ".env")) {
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {}
}
loadDotEnv();

const LOG_DIR = path.join(ROOT, "logs");
const LOCK_FILE = path.join(LOG_DIR, "server-watchdog.pid");
const PORT = Number(process.env.PORT || 8081);
const HOST = process.env.HOST || "0.0.0.0";
const HEALTH_HOST = process.env.WATCHDOG_HEALTH_HOST || "127.0.0.1";
const HEALTH_PATH = process.env.WATCHDOG_HEALTH_PATH || "/api/me";
const HEALTH_INTERVAL_MS = Number(process.env.WATCHDOG_HEALTH_INTERVAL_MS || 15000);
const HEALTH_TIMEOUT_MS = Number(process.env.WATCHDOG_HEALTH_TIMEOUT_MS || 4000);
const HEALTH_FAIL_LIMIT = Number(process.env.WATCHDOG_HEALTH_FAIL_LIMIT || 3);
const STARTUP_GRACE_MS = Number(process.env.WATCHDOG_STARTUP_GRACE_MS || 12000);
const RESTART_MIN_DELAY_MS = Number(process.env.WATCHDOG_RESTART_MIN_DELAY_MS || 3000);
const RESTART_MAX_DELAY_MS = Number(process.env.WATCHDOG_RESTART_MAX_DELAY_MS || 60000);
const LOG_ROTATE_MAX_BYTES = Math.max(1024 * 1024, Number(process.env.WATCHDOG_LOG_ROTATE_MAX_MB || 8) * 1024 * 1024);
const LOG_ROTATE_KEEP = Math.max(1, Number(process.env.WATCHDOG_LOG_ROTATE_KEEP || 5));

fs.mkdirSync(LOG_DIR, { recursive: true });

const watchdogLog = path.join(LOG_DIR, "server-watchdog.log");
const serverOutLog = path.join(LOG_DIR, "server-8081.out.log");
const serverErrLog = path.join(LOG_DIR, "server-8081.err.log");

let child = null;
let stopping = false;
let failureCount = 0;
let restartDelayMs = RESTART_MIN_DELAY_MS;
let nextHealthAt = 0;
let healthTimer = null;
let restartTimer = null;

function now() {
  return new Date().toISOString();
}

function rotateLogFile(filePath) {
  try {
    if (!LOG_ROTATE_MAX_BYTES || !fs.existsSync(filePath)) return;
    const stat = fs.statSync(filePath);
    if (stat.size < LOG_ROTATE_MAX_BYTES) return;
    for (let index = LOG_ROTATE_KEEP - 1; index >= 1; index -= 1) {
      const source = `${filePath}.${index}`;
      const target = `${filePath}.${index + 1}`;
      if (fs.existsSync(target)) fs.rmSync(target, { force: true });
      if (fs.existsSync(source)) fs.renameSync(source, target);
    }
    const firstRotated = `${filePath}.1`;
    if (fs.existsSync(firstRotated)) fs.rmSync(firstRotated, { force: true });
    fs.renameSync(filePath, firstRotated);
  } catch (error) {
    process.stderr.write(`[${now()}] failed to rotate ${filePath}: ${error.message}\n`);
  }
}

function appendLogFile(filePath, chunk) {
  rotateLogFile(filePath);
  fs.appendFile(filePath, chunk, () => {});
}

function log(message) {
  const line = `[${now()}] ${message}\n`;
  rotateLogFile(watchdogLog);
  fs.appendFileSync(watchdogLog, line);
  process.stdout.write(line);
}

function isProcessAlive(pid) {
  if (!pid || Number.isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock() {
  try {
    const existing = fs.existsSync(LOCK_FILE) ? Number(fs.readFileSync(LOCK_FILE, "utf8").trim()) : 0;
    if (isProcessAlive(existing)) {
      console.log(`\n======================================================`);
      console.log(`[提示] DPSir 智云盘服务已经在后台稳定运行中 (PID: ${existing})！`);
      console.log(`无需重复启动。访问地址如下：`);
      console.log(`- 本机访问：http://127.0.0.1:${PORT}`);
      console.log(`- 局域网/公网地址请直接双击运行: show-addresses.bat`);
      console.log(`======================================================\n`);
      log(`watchdog already running as pid ${existing}; exiting duplicate starter`);
      process.exit(0);
    }
    fs.writeFileSync(LOCK_FILE, `${process.pid}\n`, { flag: "w" });
  } catch (error) {
    log(`failed to acquire watchdog lock: ${error.message}`);
    process.exit(1);
  }
}

function releaseLock() {
  try {
    const existing = fs.existsSync(LOCK_FILE) ? Number(fs.readFileSync(LOCK_FILE, "utf8").trim()) : 0;
    if (existing === process.pid) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch {
    // Best effort cleanup only.
  }
}

function pipeToLog(stream, filePath, echoStream) {
  stream.on("data", (chunk) => {
    appendLogFile(filePath, chunk);
    echoStream.write(chunk);
  });
}

function scheduleRestart(reason) {
  if (stopping || restartTimer) return;
  const delay = restartDelayMs;
  restartDelayMs = Math.min(restartDelayMs * 2, RESTART_MAX_DELAY_MS);
  log(`${reason}; restarting server in ${Math.round(delay / 1000)}s`);
  restartTimer = setTimeout(() => {
    restartTimer = null;
    startServer();
  }, delay);
}

function startServer() {
  if (stopping || child) return;
  failureCount = 0;
  nextHealthAt = Date.now() + STARTUP_GRACE_MS;
  const env = { ...process.env, HOST, PORT: String(PORT) };
  log(`starting server.js on ${HOST}:${PORT}`);
  child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  pipeToLog(child.stdout, serverOutLog, process.stdout);
  pipeToLog(child.stderr, serverErrLog, process.stderr);

  child.on("exit", (code, signal) => {
    const details = signal ? `signal ${signal}` : `code ${code}`;
    child = null;
    if (stopping) return;
    scheduleRestart(`server exited with ${details}`);
  });

  child.on("error", (error) => {
    child = null;
    if (stopping) return;
    scheduleRestart(`failed to start server: ${error.message}`);
  });
}

function stopChild(reason) {
  if (!child) return;
  log(`stopping server because ${reason}`);
  child.kill("SIGTERM");
  const target = child;
  setTimeout(() => {
    if (child === target && target.exitCode === null && target.signalCode === null) {
      target.kill("SIGKILL");
    }
  }, 5000).unref();
}

function healthCheck() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        host: HEALTH_HOST,
        port: PORT,
        path: HEALTH_PATH,
        timeout: HEALTH_TIMEOUT_MS,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode >= 200 && response.statusCode < 400);
      },
    );
    request.on("timeout", () => {
      request.destroy(new Error("health check timeout"));
    });
    request.on("error", () => resolve(false));
  });
}

async function tick() {
  if (stopping) return;
  if (Date.now() < nextHealthAt) return;

  const healthy = await healthCheck();
  if (healthy) {
    if (failureCount > 0) log("health check recovered");
    failureCount = 0;
    restartDelayMs = RESTART_MIN_DELAY_MS;
    return;
  }

  failureCount += 1;
  log(`health check failed ${failureCount}/${HEALTH_FAIL_LIMIT}`);

  if (failureCount < HEALTH_FAIL_LIMIT) return;

  failureCount = 0;
  if (child) {
    stopChild(`health check failed ${HEALTH_FAIL_LIMIT} times`);
  } else {
    scheduleRestart(`origin is not responding on ${HEALTH_HOST}:${PORT}${HEALTH_PATH}`);
  }
}

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  log(`watchdog received ${signal}; shutting down`);
  if (healthTimer) clearInterval(healthTimer);
  if (restartTimer) clearTimeout(restartTimer);
  releaseLock();
  if (!child) {
    process.exit(0);
  }
  child.once("exit", () => process.exit(0));
  child.kill("SIGTERM");
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("exit", releaseLock);

async function main() {
  acquireLock();
  log("watchdog started");

  const healthy = await healthCheck();
  if (healthy) {
    log(`existing origin is healthy on ${HEALTH_HOST}:${PORT}${HEALTH_PATH}; monitoring it`);
  } else {
    startServer();
  }

  healthTimer = setInterval(() => {
    tick().catch((error) => log(`watchdog tick error: ${error.stack || error.message}`));
  }, HEALTH_INTERVAL_MS);
  tick().catch((error) => log(`watchdog initial tick error: ${error.stack || error.message}`));
}

main().catch((error) => {
  log(`watchdog fatal error: ${error.stack || error.message}`);
  releaseLock();
  process.exit(1);
});
