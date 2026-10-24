/**
 * ==============================================================================
 * DPSir 智云盘 - Cloudflare 公网隧道生命周期协同管理器
 * 实现与网盘客户端/后台服务的同步启停（方案 A 智能联动）
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function findCloudflaredExe() {
  const candidates = [
    path.join(ROOT, "tools", "cloudflared.exe"),
    path.join(process.env.USERPROFILE || "", ".cloudflared", "cloudflared.exe"),
    "C:\\Program Files\\cloudflared\\cloudflared.exe",
    "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function findConfigFile() {
  const candidates = [
    path.join(ROOT, ".cloudflared", "config.yml"),
    path.join(ROOT, ".cloudflared", "config.yaml"),
    path.join(process.env.USERPROFILE || "", ".cloudflared", "config.yml"),
    path.join(process.env.USERPROFILE || "", ".cloudflared", "config.yaml"),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function isTunnelRunning() {
  if (process.platform !== "win32") return false;
  try {
    const out = execSync('tasklist /FI "IMAGENAME eq cloudflared.exe" /NH', { encoding: "utf8" });
    return out.toLowerCase().includes("cloudflared.exe");
  } catch {
    return false;
  }
}

let tunnelChild = null;

function startTunnel() {
  if (process.platform !== "win32") return { ok: false, reason: "unsupported_platform" };

  const cfExe = findCloudflaredExe();
  const cfgPath = findConfigFile();

  if (!cfExe || !cfgPath) {
    return { ok: false, reason: "tunnel_not_configured" };
  }

  if (isTunnelRunning()) {
    return { ok: true, alreadyRunning: true };
  }

  try {
    const logDir = path.join(ROOT, "logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const outLog = path.join(logDir, "cloudflared.out.log");
    const errLog = path.join(logDir, "cloudflared.err.log");

    const outStream = fs.openSync(outLog, "a");
    const errStream = fs.openSync(errLog, "a");

    const args = ["tunnel", "--edge-ip-version", "4", "--config", cfgPath, "run"];

    tunnelChild = spawn(cfExe, args, {
      cwd: ROOT,
      detached: true,
      stdio: ["ignore", outStream, errStream],
      windowsHide: true,
    });

    tunnelChild.unref();

    return { ok: true, pid: tunnelChild.pid };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function stopTunnel() {
  if (process.platform !== "win32") return;
  try {
    execSync("taskkill /F /IM cloudflared.exe /T", { stdio: "ignore" });
  } catch {}
}

module.exports = {
  findCloudflaredExe,
  findConfigFile,
  isTunnelRunning,
  startTunnel,
  stopTunnel,
};
