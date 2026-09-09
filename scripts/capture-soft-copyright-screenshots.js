const fs = require("fs");
const fsp = require("fs/promises");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const serverEntry = path.join(repoRoot, "server.js");
const outputDir = path.join(repoRoot, "output", "soft-copyright-screenshots");
const nodeModulesPath = "C:\\Users\\17480\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

process.env.NODE_PATH = [nodeModulesPath, process.env.NODE_PATH || ""].filter(Boolean).join(path.delimiter);
require("module").Module._initPaths();
const { chromium } = require("playwright");

function randomPort() {
  return 21000 + Math.floor(Math.random() * 2000);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startMockDeepSeek() {
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      if (req.url.includes("/v1/messages")) {
        res.end(JSON.stringify({
          content: [{
            type: "text",
            text: "示例回答：当前资料库包含项目说明、学习资料和数据表，可通过预览、下载或单文件 AI 对话继续查看。",
          }],
          usage: { server_tool_use: { web_search_requests: 0 } },
        }));
        return;
      }
      res.end(JSON.stringify({
        choices: [{
          message: {
            content: "示例回答：该文件主要用于演示资料管理、内容预览和 AI 摘要能力。",
          },
        }],
      }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function startServer(storageRoot, port, deepSeekBaseUrl) {
  return spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      STORAGE_BASE_ROOT: storageRoot,
      PUBLIC_ACCESS_URL: `http://127.0.0.1:${port}`,
      CLOUD_DRIVE_USER: "admin",
      CLOUD_DRIVE_PASSWORD: "DemoPass_123456",
      YUNPAN_DEEPSEEK_KEY: "sk-demo-soft-copyright",
      DEEPSEEK_BASE_URL: deepSeekBaseUrl,
      DEEPSEEK_ANTHROPIC_BASE_URL: deepSeekBaseUrl,
      DEEPSEEK_MODEL: "deepseek-v4-flash",
      DEEPSEEK_WEB_MODEL: "deepseek-v4-pro",
      AI_TIMEOUT_MS: "10000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    wait(5000).then(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }),
  ]);
}

async function waitForServer(baseUrl) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/me`);
      if (response.ok) return;
    } catch {}
    await wait(250);
  }
  throw new Error("Demo server did not start in time.");
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage: false,
  });
}

async function main() {
  await fsp.mkdir(outputDir, { recursive: true });
  const storageRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "pcd-soft-copyright-"));
  const port = randomPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const mockDeepSeek = await startMockDeepSeek();
  const server = startServer(storageRoot, port, mockDeepSeek.baseUrl);

  let browser;
  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch({
      headless: true,
      executablePath: fs.existsSync(edgePath) ? edgePath : undefined,
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 980 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#loginForm", { timeout: 10000 });
    await page.waitForTimeout(1200);
    await screenshot(page, "01-login");

    const register = await context.request.post(`${baseUrl}/api/register`, {
      data: { username: "demo_user", password: "DemoPass_123456" },
    });
    if (!register.ok()) throw new Error(`Register failed: ${register.status()} ${await register.text()}`);
    const token = (await register.json()).token;
    const auth = { Authorization: `Bearer ${token}` };

    await context.request.post(`${baseUrl}/api/folder`, {
      headers: auth,
      data: { path: "", name: "示例资料", password: "", adminPassword: "" },
    });
    await context.request.post(`${baseUrl}/api/folder`, {
      headers: auth,
      data: { path: "", name: "AI问答演示", password: "", adminPassword: "" },
    });
    await context.request.post(`${baseUrl}/api/upload?path=示例资料`, {
      headers: auth,
      multipart: {
        files: {
          name: "项目说明.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("DPSir 智云盘示例资料。用于演示文件预览、搜索和 AI 单文件对话。", "utf8"),
        },
      },
    });
    await context.request.post(`${baseUrl}/api/upload?path=示例资料`, {
      headers: auth,
      multipart: {
        files: {
          name: "资料清单.csv",
          mimeType: "text/csv",
          buffer: Buffer.from("名称,类型,说明\n项目说明,文档,演示资料管理\n资料清单,表格,演示表格预览\n", "utf8"),
        },
      },
    });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#fileRows tr", { timeout: 10000 });
    await screenshot(page, "02-main");

    await page.click("#uploadBtn");
    await page.waitForSelector("#uploadModal:not(.hidden)", { timeout: 5000 });
    await page.waitForTimeout(800);
    await screenshot(page, "03-upload-modal");
    await page.keyboard.press("Escape");

    await page.fill("#searchInput", "项目说明");
    await page.click("#searchBtn");
    await page.waitForSelector(".search-summary:not(:empty), #fileRows tr", { timeout: 10000 });
    await screenshot(page, "04-search");

    await page.click("#clearSearchBtn");
    await page.waitForTimeout(500);
    await page.getByText("示例资料").first().click();
    await page.waitForTimeout(800);
    await page.locator("#fileRows tr", { hasText: "项目说明.txt" }).locator(".name-cell button").first().click();
    await page.waitForSelector("#previewModal:not(.hidden)", { timeout: 10000 });
    await page.waitForTimeout(600);
    await screenshot(page, "05-preview");
    await page.keyboard.press("Escape");

    await page.click("#aiModeToggleBtn");
    await page.click("#aiGlobalSearchBtn");
    await page.waitForSelector(".ai-drawer:not(.hidden)", { timeout: 5000 });
    await page.waitForTimeout(800);
    await screenshot(page, "06-ai-global");

    await page.fill("#aiPromptInput", "帮我整理当前资料");
    await page.click("#aiPromptSendBtn");
    await page.waitForTimeout(1500);
    await screenshot(page, "07-ai-answer");

    await page.click("#aiDrawerCloseBtn");
    await page.waitForTimeout(400);
    await page.getByText("AI对话").first().click();
    await page.waitForSelector(".ai-drawer:not(.hidden)", { timeout: 5000 });
    await page.waitForTimeout(800);
    await screenshot(page, "08-ai-file");

    await page.click("#aiDrawerCloseBtn");
    await page.waitForTimeout(400);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#fileRows tr", { timeout: 10000 });
    const folderRow = page.locator("#fileRows tr", { hasText: "示例资料" }).first();
    const encryptButton = folderRow.locator("button", { hasText: "加密" }).first();
    if (await encryptButton.count()) {
      await encryptButton.click({ timeout: 5000 });
      await page.waitForSelector("#folderPasswordModal:not(.hidden)", { timeout: 5000 });
      await page.waitForTimeout(800);
      await screenshot(page, "09-folder-password");
    }
  } finally {
    if (browser) await browser.close();
    await stopProcess(server);
    await mockDeepSeek.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
