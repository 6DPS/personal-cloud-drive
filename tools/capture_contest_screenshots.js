const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "output", "contest-submission", "screenshots");
const STORAGE = "C:\\Temp\\pcd-contest-demo-storage";
const PORT = 19181;
const BASE = `http://127.0.0.1:${PORT}`;

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 25000) {
    try {
      const res = await fetch(`${BASE}/api/me`);
      if (res.ok) return;
    } catch {}
    await wait(300);
  }
  throw new Error("Demo server did not start in time.");
}

async function api(route, { method = "GET", token = "", json, body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : body,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(`${method} ${route} failed: ${res.status} ${text}`);
  return data;
}

async function uploadText(token, folder, filename, content) {
  const boundary = `----pcd-contest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`),
    Buffer.from("Content-Type: text/plain; charset=utf-8\r\n\r\n"),
    Buffer.from(content, "utf8"),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return api(`/api/upload?path=${encodeURIComponent(folder)}`, {
    method: "POST",
    token,
    body,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
  });
}

async function seedData() {
  const username = `contest_demo_${Date.now()}`;
  const password = "DemoPass_123";
  const register = await api("/api/register", { method: "POST", json: { username, password } });
  const token = register.token;

  await api("/api/folder", { method: "POST", token, json: { path: "", name: "课题资料", password: "", adminPassword: "" } });
  await api("/api/folder", { method: "POST", token, json: { path: "", name: "竞赛材料", password: "", adminPassword: "" } });
  await api("/api/folder", { method: "POST", token, json: { path: "", name: "加密资料", password: "folder123", adminPassword: password } });
  await api("/api/folder", { method: "POST", token, json: { path: "课题资料", name: "组会记录", password: "", adminPassword: "" } });

  await uploadText(token, "课题资料", "论文阅读笔记.txt", "AI大模型、资料检索、科研资料管理、智能搜索、课题组协作。");
  await uploadText(token, "课题资料/组会记录", "第九次组会纪要.txt", "本次组会讨论智云引擎的AI搜索、文件夹加密和多端访问。");
  await uploadText(token, "竞赛材料", "商业计划书提纲.txt", "项目简介、背景痛点、产品技术、市场分析、商业模式、风险控制。");

  return { username, password, token };
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    wait(5000).then(() => child.kill("SIGKILL")),
  ]);
}

async function main() {
  await fsp.rm(STORAGE, { recursive: true, force: true });
  await fsp.mkdir(OUT, { recursive: true });

  const child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: "127.0.0.1",
      STORAGE_BASE_ROOT: STORAGE,
      PUBLIC_ACCESS_URL: BASE,
      CLOUD_DRIVE_USER: "admin",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => (stderr += chunk.toString()));

  try {
    await waitForServer();
    const demo = await seedData();

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT, "01-login.png"), fullPage: true });

    await page.fill("#username", demo.username);
    await page.fill("#password", demo.password);
    await page.click("#loginSubmitBtn");
    await page.waitForSelector("#driveView:not(.hidden)", { timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, "02-dashboard.png"), fullPage: true });

    await page.fill("#searchInput", "课题");
    await page.click("#searchBtn");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, "03-smart-search.png"), fullPage: true });

    await page.click("#aiModeToggleBtn");
    await page.waitForTimeout(500);
    await page.click("#aiGlobalSearchBtn");
    await page.waitForSelector("#aiDrawer:not(.hidden)", { timeout: 10000 });
    await page.fill("#aiPromptInput", "请帮我查找课题和竞赛相关资料");
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, "07-ai-mode.png"), fullPage: true });
    await page.click("#aiDrawerCloseBtn");
    await page.waitForFunction(() => document.querySelector("#aiDrawer")?.classList.contains("hidden"), null, { timeout: 10000 });

    await page.click("#clearSearchBtn").catch(() => {});
    await page.waitForTimeout(500);
    await page.click("#selectModeBtn");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, "04-bulk-actions.png"), fullPage: true });

    const encrypted = page.getByRole("button", { name: /加密资料/ }).first();
    await encrypted.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, "05-folder-password.png"), fullPage: true });

    await page.fill('input[type="password"]', "folder123").catch(() => {});
    await page.getByRole("button", { name: /确认|进入|确定/ }).first().click().catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, "06-encrypted-folder-open.png"), fullPage: true });

    await browser.close();
    console.log(OUT);
  } catch (error) {
    console.error(stderr);
    throw error;
  } finally {
    await stop(child);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
