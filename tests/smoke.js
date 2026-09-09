const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const serverEntry = path.join(repoRoot, "server.js");
const adminPasswordFile = path.join(repoRoot, ".cloudflared", "cloud-drive-password.txt");
const smokeSessionSecret = "pcd-smoke-session-secret";

function randomPort() {
  return 19000 + Math.floor(Math.random() * 2000);
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function smokeRegistrationKeyHash(value = "") {
  return crypto.createHmac("sha256", smokeSessionSecret).update(value).digest("base64url");
}

async function seedRegistrationKeyRetentionFixtures(storageRoot) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const iso = (offsetMs) => new Date(now + offsetMs).toISOString();
  const keys = [
    {
      id: "old-expired-key",
      hash: smokeRegistrationKeyHash("OLD-EXPIRED"),
      maskedKey: "DPSIR-OLD-****-EXPR",
      status: "unused",
      createdAt: iso(-10 * dayMs),
      expiresAt: iso(-8 * dayMs),
    },
    {
      id: "recent-expired-key",
      hash: smokeRegistrationKeyHash("RECENT-EXPIRED"),
      maskedKey: "DPSIR-REC-****-EXPR",
      status: "unused",
      createdAt: iso(-2 * dayMs),
      expiresAt: iso(-1 * dayMs),
    },
    {
      id: "old-disabled-key",
      hash: smokeRegistrationKeyHash("OLD-DISABLED"),
      maskedKey: "DPSIR-OLD-****-DISA",
      status: "disabled",
      createdAt: iso(-10 * dayMs),
      expiresAt: iso(-9 * dayMs),
      disabledAt: iso(-8 * dayMs),
    },
    {
      id: "recent-disabled-key",
      hash: smokeRegistrationKeyHash("RECENT-DISABLED"),
      maskedKey: "DPSIR-REC-****-DISA",
      status: "disabled",
      createdAt: iso(-2 * dayMs),
      expiresAt: iso(-1 * dayMs),
      disabledAt: iso(-1 * dayMs),
    },
    {
      id: "old-used-key",
      hash: smokeRegistrationKeyHash("OLD-USED"),
      maskedKey: "DPSIR-OLD-****-USED",
      status: "used",
      createdAt: iso(-32 * dayMs),
      expiresAt: iso(-31 * dayMs),
      usedAt: iso(-31 * dayMs),
      usedBy: "old_user",
    },
    {
      id: "recent-used-key",
      hash: smokeRegistrationKeyHash("RECENT-USED"),
      maskedKey: "DPSIR-REC-****-USED",
      status: "used",
      createdAt: iso(-2 * dayMs),
      expiresAt: iso(-1 * dayMs),
      usedAt: iso(-1 * dayMs),
      usedBy: "recent_user",
    },
  ];
  const systemRoot = path.join(storageRoot, "system");
  await fsp.mkdir(systemRoot, { recursive: true });
  await fsp.writeFile(path.join(systemRoot, "registration-keys.json"), JSON.stringify({ keys }, null, 2), "utf8");
}

async function waitForServer(baseUrl, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/me`);
      if (response.ok) return;
    } catch {}
    await wait(250);
  }
  throw new Error("Test server did not become ready in time.");
}

async function startMockDeepSeek() {
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      let body = {};
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      } catch {}
      requests.push({ method: req.method, url: req.url, body });
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({
        choices: [{ message: { content: "AI smoke response" } }],
      }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function startServer(storageRoot, port, deepSeekBaseUrl) {
  const child = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      STORAGE_BASE_ROOT: storageRoot,
      PUBLIC_ACCESS_URL: `http://127.0.0.1:${port}`,
      CLOUD_DRIVE_USER: "admin",
      CLOUD_DRIVE_SESSION_SECRET: smokeSessionSecret,
      YUNPAN_DEEPSEEK_KEY: "sk-smoke-test",
      DEEPSEEK_BASE_URL: deepSeekBaseUrl,
      DEEPSEEK_MODEL: "deepseek-v4-flash",
      AI_TIMEOUT_MS: "10000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  return { child, getLogs: () => ({ stdout, stderr }) };
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    wait(5000).then(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }),
  ]);
}

async function api(baseUrl, route, { method = "GET", token = "", json, expect = 200, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  assert.strictEqual(
    response.status,
    expect,
    `Expected ${method} ${route} to return ${expect}, got ${response.status}: ${text}`
  );
  return { response, data };
}

async function uploadTextFile(baseUrl, token, route, fieldName, filename, content, expect = 200) {
  const boundary = `----pcd-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n`),
    Buffer.from("Content-Type: text/plain\r\n\r\n"),
    Buffer.from(content, "utf8"),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const response = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  assert.strictEqual(response.status, expect, `Expected upload to return ${expect}, got ${response.status}: ${text}`);
  return { response, data };
}

async function assertAiTypeCards(baseUrl, token, { prompt, expected, rejected, message, path = "" }) {
  const result = await api(baseUrl, "/api/ai/chat", {
    method: "POST",
    token,
    json: {
      mode: "global",
      model: "reasoner",
      path,
      prompt,
      messages: [{ role: "user", text: prompt }],
    },
    expect: 200,
  });
  const paths = (result.data?.results || []).map((item) => item.path);
  assert.ok(paths.length > 0, `${message} should return at least one card.`);
  for (const item of expected) {
    assert.ok(paths.includes(item), `${message} should include ${item}. Actual: ${JSON.stringify(paths)}`);
  }
  for (const item of rejected) {
    assert.ok(!paths.includes(item), `${message} should not include ${item}. Actual: ${JSON.stringify(paths)}`);
  }
  return paths;
}

async function main() {
  const storageRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "pcd-smoke-"));
  const port = randomPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const mockDeepSeek = await startMockDeepSeek();
  await seedRegistrationKeyRetentionFixtures(storageRoot);
  const { child, getLogs } = startServer(storageRoot, port, mockDeepSeek.baseUrl);

  try {
    await waitForServer(baseUrl);

    const username = `tester_${Date.now()}`;
    const password = "SmokePass_123";
    const adminPassword = fs.existsSync(adminPasswordFile)
      ? fs.readFileSync(adminPasswordFile, "utf8").trim()
      : "admin123456";

    const adminLogin = await api(baseUrl, "/api/login", {
      method: "POST",
      json: { username: "admin", password: adminPassword },
      expect: 200,
    });
    const adminToken = adminLogin.data.token;
    assert.strictEqual(adminLogin.data?.user?.role, "admin", "Default admin should be able to manage registration keys.");

    await api(baseUrl, "/api/register", {
      method: "POST",
      json: { username, password },
      expect: 400,
    });

    const registrationKey = await api(baseUrl, "/api/registration-keys", {
      method: "POST",
      token: adminToken,
      json: {},
      expect: 200,
    });
    assert.ok(registrationKey.data?.key, "Admin should receive the full one-time registration key.");
    const registrationKeys = await api(baseUrl, "/api/registration-keys", {
      token: adminToken,
      expect: 200,
    });
    const registrationKeyIds = new Set((registrationKeys.data?.keys || []).map((item) => item.id));
    assert.ok(!registrationKeyIds.has("old-expired-key"), "Expired registration keys older than 7 days should be pruned.");
    assert.ok(registrationKeyIds.has("recent-expired-key"), "Expired registration keys within 7 days should be retained.");
    assert.ok(!registrationKeyIds.has("old-disabled-key"), "Disabled registration keys older than 7 days should be pruned.");
    assert.ok(registrationKeyIds.has("recent-disabled-key"), "Disabled registration keys within 7 days should be retained.");
    assert.ok(!registrationKeyIds.has("old-used-key"), "Used registration keys older than 30 days should be pruned.");
    assert.ok(registrationKeyIds.has("recent-used-key"), "Used registration keys within 30 days should be retained.");
    assert.ok(
      registrationKeys.data?.keys?.some((item) => item.status === "unused"),
      "Generated registration key should be listed as unused before registration."
    );

    const register = await api(baseUrl, "/api/register", {
      method: "POST",
      json: { username, password, registrationKey: registrationKey.data.key },
      expect: 200,
    });
    const token = register.data.token;
    assert.ok(token, "Register response should include a session token.");

    const usedRegistrationKeys = await api(baseUrl, "/api/registration-keys", {
      token: adminToken,
      expect: 200,
    });
    assert.ok(
      usedRegistrationKeys.data?.keys?.some((item) => item.usedBy === username && item.status === "used"),
      "Registration key should become used after successful registration."
    );

    const userFilesRoot = path.join(storageRoot, "users", username, "files");
    const externalDir = path.join(storageRoot, "external-secret");
    const linkPath = path.join(userFilesRoot, "outside-link");
    let createdOutsideLink = false;
    await fsp.mkdir(externalDir, { recursive: true });
    await fsp.writeFile(path.join(externalDir, "secret.txt"), "outside-secret-content", "utf8");
    try {
      await fsp.symlink(externalDir, linkPath, process.platform === "win32" ? "junction" : "dir");
      createdOutsideLink = true;
    } catch {
      createdOutsideLink = false;
    }
    if (createdOutsideLink) {
      const rootList = await api(baseUrl, "/api/list?path=", { token, expect: 200 });
      assert.ok(
        !rootList.data?.items?.some((item) => item.name === "outside-link"),
        "Directory links should not be listed as cloud drive items."
      );
      await api(baseUrl, "/api/download-link", {
        method: "POST",
        token,
        json: { path: "outside-link/secret.txt", folderPasswords: {} },
        expect: 400,
      });
    }

    await api(baseUrl, "/api/folder", {
      method: "POST",
      token,
      json: { path: "", name: "folderA", password: "", adminPassword: "" },
      expect: 200,
    });

    await api(baseUrl, "/api/list?path=", { token, expect: 200 });

    await uploadTextFile(
      baseUrl,
      token,
      "/api/upload?path=folderA",
      "files",
      "notes.txt",
      "alpha beta searchable smoke content"
    );

    const search = await api(baseUrl, "/api/search?path=folderA&q=notes", { token, expect: 200 });
    assert.ok(search.data?.results?.some((item) => item.name === "notes.txt"), "Search should find uploaded file by name.");

    const downloadLink = await api(baseUrl, "/api/download-link", {
      method: "POST",
      token,
      json: { path: "folderA/notes.txt", folderPasswords: {} },
      expect: 200,
    });
    const download = await fetch(`${baseUrl}${downloadLink.data.url}`);
    assert.strictEqual(download.status, 200, "Single file download should succeed.");
    assert.strictEqual(await download.text(), "alpha beta searchable smoke content", "Downloaded file content should match upload.");

    await api(baseUrl, "/api/rename", {
      method: "POST",
      token,
      json: { path: "folderA/notes.txt", name: "renamed.txt" },
      expect: 200,
    });

    await api(baseUrl, "/api/folder", {
      method: "POST",
      token,
      json: { path: "", name: "folderB", password: "", adminPassword: "" },
      expect: 200,
    });

    await api(baseUrl, "/api/copy", {
      method: "POST",
      token,
      json: { source: "folderA/renamed.txt", targetDir: "folderB" },
      expect: 200,
    });

    await api(baseUrl, "/api/move", {
      method: "POST",
      token,
      json: { source: "folderB/renamed.txt", targetDir: "" },
      expect: 200,
    });

    await api(baseUrl, "/api/item", {
      method: "DELETE",
      token,
      json: { path: "renamed.txt", folderPasswords: {} },
      expect: 200,
    });

    const aiChat = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "chat",
        path: "",
        prompt: "folderA 里面有什么文件",
        messages: [{ role: "user", text: "folderA 里面有什么文件" }],
      },
      expect: 200,
    });
    assert.strictEqual(aiChat.data?.model, "deepseek-v4-flash", "AI response should report deepseek-v4-flash.");
    assert.strictEqual(aiChat.data?.thinking, true, "AI should always report thinking mode.");
    const aiContext = (mockDeepSeek.requests.at(-1)?.body?.messages || [])
      .map((message) => message.content || "")
      .join("\n");
    assert.ok(
      aiContext.includes("匹配文件夹") && aiContext.includes("renamed.txt"),
      "AI global context should include matched folder children."
    );

    await api(baseUrl, "/api/folder", {
      method: "POST",
      token,
      json: { path: "", name: "live_ai_folder", password: "", adminPassword: "" },
      expect: 200,
    });

    const liveCreateAi = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "",
        prompt: "List current root items",
        messages: [{ role: "user", text: "List current root items" }],
      },
      expect: 200,
    });
    const liveCreateContext = (mockDeepSeek.requests.at(-1)?.body?.messages || [])
      .map((message) => message.content || "")
      .join("\n");
    assert.ok(
      liveCreateContext.includes("live_ai_folder"),
      "AI global context should include a folder created immediately before the AI request."
    );
    assert.ok(
      liveCreateAi.data?.results?.some((item) => item.path === "live_ai_folder"),
      "AI global results should include a clickable card for a newly created current-directory item."
    );

    await api(baseUrl, "/api/item", {
      method: "DELETE",
      token,
      json: { path: "live_ai_folder", folderPasswords: {} },
      expect: 200,
    });

    const liveDeleteAi = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "",
        prompt: "List current root items",
        messages: [{ role: "user", text: "List current root items" }],
      },
      expect: 200,
    });
    const liveDeleteContext = (mockDeepSeek.requests.at(-1)?.body?.messages || [])
      .map((message) => message.content || "")
      .join("\n");
    assert.ok(
      !liveDeleteContext.includes("live_ai_folder"),
      "AI global context should not include a folder deleted immediately before the AI request."
    );
    assert.ok(
      !liveDeleteAi.data?.results?.some((item) => item.path === "live_ai_folder"),
      "AI global results should remove the clickable card after the item is deleted."
    );

    await uploadTextFile(
      baseUrl,
      token,
      "/api/upload?path=",
      "files",
      "matrix_theory_notes.txt",
      "matrix related notes"
    );
    await uploadTextFile(
      baseUrl,
      token,
      "/api/upload?path=",
      "files",
      "unrelated_budget.txt",
      "unrelated budget notes"
    );
    const specificAiCards = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "",
        prompt: "\u6211\u60f3\u8981\u67e5\u627ematrix\u76f8\u5173\u6587\u4ef6",
        messages: [{ role: "user", text: "\u6211\u60f3\u8981\u67e5\u627ematrix\u76f8\u5173\u6587\u4ef6" }],
      },
      expect: 200,
    });
    const specificCardPaths = (specificAiCards.data?.results || []).map((item) => item.path);
    assert.ok(
      specificCardPaths.includes("matrix_theory_notes.txt"),
      "AI global results should include cards that match the user's specific query."
    );
    assert.ok(
      !specificCardPaths.includes("unrelated_budget.txt"),
      "AI global results should not fall back to every current-directory item when specific matches exist."
    );

    const chineseMatrixFolder = "\u77e9\u9635\u8bba\u8d44\u6599";
    await api(baseUrl, "/api/folder", {
      method: "POST",
      token,
      json: { path: "", name: chineseMatrixFolder, password: "", adminPassword: "" },
      expect: 200,
    });
    const chineseSpecificAiCards = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "",
        prompt: "\u6211\u60f3\u8981\u67e5\u627e\u77e9\u9635\u8bba\u76f8\u5173\u6587\u4ef6",
        messages: [{ role: "user", text: "\u6211\u60f3\u8981\u67e5\u627e\u77e9\u9635\u8bba\u76f8\u5173\u6587\u4ef6" }],
      },
      expect: 200,
    });
    const chineseSpecificCardPaths = (chineseSpecificAiCards.data?.results || []).map((item) => item.path);
    assert.ok(
      chineseSpecificCardPaths.includes(chineseMatrixFolder),
      "AI global results should match Chinese keywords inside a continuous Chinese prompt."
    );
    assert.ok(
      !chineseSpecificCardPaths.includes("folderA"),
      "AI global results should not fall back to every folder for a specific Chinese keyword query."
    );

    const thesisFolder = "\u6bd5\u4e1a\u8bbe\u8ba1\u8d44\u6599";
    await api(baseUrl, "/api/folder", {
      method: "POST",
      token,
      json: { path: "", name: thesisFolder, password: "", adminPassword: "" },
      expect: 200,
    });
    const thesisAiCards = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "",
        prompt: "\u5e2e\u6211\u627e\u6bd5\u4e1a\u8bbe\u8ba1\u76f8\u5173\u8d44\u6599",
        messages: [{ role: "user", text: "\u5e2e\u6211\u627e\u6bd5\u4e1a\u8bbe\u8ba1\u76f8\u5173\u8d44\u6599" }],
      },
      expect: 200,
    });
    const thesisCardPaths = (thesisAiCards.data?.results || []).map((item) => item.path);
    assert.ok(
      thesisCardPaths.includes(thesisFolder),
      "AI global results should match other Chinese keywords, not only matrix-related terms."
    );
    assert.ok(
      !thesisCardPaths.includes("unrelated_budget.txt"),
      "AI global results should keep unrelated files out for other Chinese keyword queries."
    );

    await uploadTextFile(baseUrl, token, "/api/upload?path=", "files", "word_report.docx", "word report");
    await uploadTextFile(baseUrl, token, "/api/upload?path=", "files", "pdf_report.pdf", "pdf report");
    await uploadTextFile(baseUrl, token, "/api/upload?path=", "files", "sheet_data.xlsx", "sheet data");
    await uploadTextFile(baseUrl, token, "/api/upload?path=", "files", "text_notes.txt", "text notes");
    await uploadTextFile(baseUrl, token, "/api/upload?path=", "files", "slides_deck.pptx", "slides deck");
    await uploadTextFile(baseUrl, token, "/api/upload?path=", "files", "image_photo.png", "image bytes");
    await uploadTextFile(baseUrl, token, "/api/upload?path=", "files", "video_clip.mp4", "video bytes");
    await uploadTextFile(baseUrl, token, "/api/upload?path=", "files", "audio_note.mp3", "audio bytes");
    await uploadTextFile(baseUrl, token, "/api/upload?path=", "files", "archive_pack.zip", "archive bytes");

    const nonWordTypeFiles = [
      "pdf_report.pdf",
      "sheet_data.xlsx",
      "text_notes.txt",
      "slides_deck.pptx",
      "image_photo.png",
      "video_clip.mp4",
      "audio_note.mp3",
      "archive_pack.zip",
    ];
    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9bword\u6587\u6863",
      expected: ["word_report.docx"],
      rejected: nonWordTypeFiles,
      message: "Chinese Word document query",
    });
    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9bdocx\u6587\u4ef6",
      expected: ["word_report.docx"],
      rejected: nonWordTypeFiles,
      message: "DOCX extension query",
    });

    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9bpdf\u6587\u6863",
      expected: ["pdf_report.pdf"],
      rejected: ["word_report.docx", "sheet_data.xlsx", "text_notes.txt", "slides_deck.pptx", "image_photo.png"],
      message: "PDF document query",
    });

    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9b\u8868\u683c",
      expected: ["sheet_data.xlsx"],
      rejected: ["word_report.docx", "pdf_report.pdf", "text_notes.txt", "slides_deck.pptx", "image_photo.png"],
      message: "Chinese spreadsheet query",
    });
    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u627e\u4e00\u4e0bxlsx\u6587\u4ef6",
      expected: ["sheet_data.xlsx"],
      rejected: ["word_report.docx", "pdf_report.pdf", "text_notes.txt", "slides_deck.pptx", "image_photo.png"],
      message: "XLSX extension query",
    });

    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9btxt\u6587\u672c",
      expected: ["text_notes.txt", "matrix_theory_notes.txt", "unrelated_budget.txt"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "slides_deck.pptx", "image_photo.png"],
      message: "TXT text query",
    });

    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9bppt\u6f14\u793a\u6587\u7a3f",
      expected: ["slides_deck.pptx"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "image_photo.png"],
      message: "PPT presentation query",
    });
    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u627e\u4e00\u4e0bpptx\u6587\u4ef6",
      expected: ["slides_deck.pptx"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "image_photo.png"],
      message: "PPTX extension query",
    });

    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9b\u56fe\u7247",
      expected: ["image_photo.png"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "slides_deck.pptx"],
      message: "Chinese image query",
    });
    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u627e\u4e00\u4e0bpng\u6587\u4ef6",
      expected: ["image_photo.png"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "slides_deck.pptx"],
      message: "PNG extension query",
    });

    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9b\u89c6\u9891",
      expected: ["video_clip.mp4"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "image_photo.png"],
      message: "Chinese video query",
    });
    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u627e\u4e00\u4e0bmp4\u6587\u4ef6",
      expected: ["video_clip.mp4"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "image_photo.png"],
      message: "MP4 extension query",
    });

    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9b\u97f3\u9891",
      expected: ["audio_note.mp3"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "image_photo.png"],
      message: "Chinese audio query",
    });
    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u627e\u4e00\u4e0bmp3\u6587\u4ef6",
      expected: ["audio_note.mp3"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "image_photo.png"],
      message: "MP3 extension query",
    });

    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9b\u538b\u7f29\u5305",
      expected: ["archive_pack.zip"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "image_photo.png"],
      message: "Chinese archive query",
    });
    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u627e\u4e00\u4e0bzip\u6587\u4ef6",
      expected: ["archive_pack.zip"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "image_photo.png"],
      message: "ZIP extension query",
    });

    await assertAiTypeCards(baseUrl, token, {
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u591a\u5c11\u4e2a\u6587\u4ef6\u5939",
      expected: ["folderA", "folderB"],
      rejected: ["word_report.docx", "pdf_report.pdf", "sheet_data.xlsx", "text_notes.txt", "image_photo.png"],
      message: "Chinese folder-count query",
    });

    await uploadTextFile(baseUrl, token, "/api/upload?path=folderA", "files", "folder_word.docx", "folder word");
    await uploadTextFile(baseUrl, token, "/api/upload?path=folderA", "files", "folder_pdf.pdf", "folder pdf");
    await uploadTextFile(baseUrl, token, "/api/upload?path=folderA", "files", "folder_image.jpg", "folder image");
    await uploadTextFile(baseUrl, token, "/api/upload?path=folderA", "files", "folder_text.txt", "folder text");
    await assertAiTypeCards(baseUrl, token, {
      path: "folderA",
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9bword\u6587\u6863",
      expected: ["folderA/folder_word.docx"],
      rejected: ["word_report.docx", "folderA/folder_pdf.pdf", "folderA/folder_image.jpg", "folderA/folder_text.txt"],
      message: "Subfolder Word document query",
    });
    await assertAiTypeCards(baseUrl, token, {
      path: "folderA",
      prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9b\u56fe\u7247",
      expected: ["folderA/folder_image.jpg"],
      rejected: ["image_photo.png", "folderA/folder_word.docx", "folderA/folder_pdf.pdf", "folderA/folder_text.txt"],
      message: "Subfolder image query",
    });

    const smallTalk = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "folderA",
        prompt: "\u4f60\u597d\uff0c\u4f60\u80fd\u505a\u4ec0\u4e48",
        messages: [{ role: "user", text: "\u4f60\u597d\uff0c\u4f60\u80fd\u505a\u4ec0\u4e48" }],
      },
      expect: 200,
    });
    assert.strictEqual(
      (smallTalk.data?.results || []).length,
      0,
      "Normal chat should not push AI result cards."
    );

    const wordCards = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "",
        prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9bword\u6587\u6863",
        messages: [{ role: "user", text: "\u5f53\u524d\u76ee\u5f55\u6709\u54ea\u4e9bword\u6587\u6863" }],
      },
      expect: 200,
    });
    const wordCardPaths = (wordCards.data?.results || []).map((item) => item.path);
    assert.ok(wordCardPaths.includes("word_report.docx"), "AI global results should include Word document cards.");
    assert.ok(!wordCardPaths.includes("pdf_report.pdf"), "AI global Word results should not include PDF cards.");
    assert.ok(!wordCardPaths.includes("sheet_data.xlsx"), "AI global Word results should not include spreadsheet cards.");

    const folderCards = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "",
        prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u591a\u5c11\u4e2a\u6587\u4ef6\u5939",
        messages: [{ role: "user", text: "\u5f53\u524d\u76ee\u5f55\u6709\u591a\u5c11\u4e2a\u6587\u4ef6\u5939" }],
      },
      expect: 200,
    });
    assert.ok(
      (folderCards.data?.results || []).length > 0,
      "AI global folder-count queries should return folder cards."
    );
    assert.ok(
      (folderCards.data?.results || []).every((item) => item.type === "folder"),
      "AI global folder-count queries should not return file cards."
    );

    const lockedFolderName = "locked_ai_folder";
    await api(baseUrl, "/api/folder", {
      method: "POST",
      token,
      json: { path: "", name: lockedFolderName, password: "LockPass_123", adminPassword: password },
      expect: 200,
    });
    const lockedFolderCards = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "",
        prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u591a\u5c11\u4e2a\u6587\u4ef6\u5939",
        messages: [{ role: "user", text: "\u5f53\u524d\u76ee\u5f55\u6709\u591a\u5c11\u4e2a\u6587\u4ef6\u5939" }],
      },
      expect: 200,
    });
    const lockedFolderCard = (lockedFolderCards.data?.results || []).find((item) => item.path === lockedFolderName);
    assert.ok(lockedFolderCard, "AI global folder queries should include locked folders in the current directory.");
    assert.strictEqual(lockedFolderCard.type, "folder", "Locked folder AI card should still be a folder card.");
    assert.strictEqual(lockedFolderCard.requiresUnlock, true, "Locked folder AI card should require unlock before entering.");
    assert.strictEqual(lockedFolderCard.lockedFolderPath, lockedFolderName, "Locked folder AI card should identify the locked folder path.");
    assert.strictEqual(lockedFolderCard.locked, true, "Locked folder AI card should report encrypted state.");
    assert.notStrictEqual(lockedFolderCard.unlocked, true, "Locked folder AI card should not report unlocked before unlock.");
    const lockedFolderPromptContext = JSON.stringify(mockDeepSeek.requests.at(-1)?.body?.messages || []);
    assert.ok(
      lockedFolderPromptContext.includes("已加密，未解锁，需要先解锁后才能查看内部内容"),
      "AI context should explicitly mark encrypted folders that still require unlock."
    );

    const unlockResponse = await api(baseUrl, "/api/folder-unlock", {
      method: "POST",
      token,
      json: { path: lockedFolderName, password: "LockPass_123" },
      expect: 200,
    });
    const unlockCookie = unlockResponse.response.headers.get("set-cookie") || "";
    assert.ok(unlockCookie, "Folder unlock should return an unlock cookie.");
    const unlockedList = await api(baseUrl, "/api/list?path=", {
      token,
      headers: { Cookie: unlockCookie },
      expect: 200,
    });
    const unlockedListItem = (unlockedList.data?.items || []).find((item) => item.path === lockedFolderName);
    assert.strictEqual(unlockedListItem?.locked, true, "List response should keep encrypted state after unlock.");
    assert.strictEqual(unlockedListItem?.unlocked, true, "List response should report current-session unlock state.");
    const unlockedFolderCards = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      headers: { Cookie: unlockCookie },
      json: {
        mode: "global",
        model: "reasoner",
        path: "",
        prompt: "\u5f53\u524d\u76ee\u5f55\u6709\u591a\u5c11\u4e2a\u6587\u4ef6\u5939",
        messages: [{ role: "user", text: "\u5f53\u524d\u76ee\u5f55\u6709\u591a\u5c11\u4e2a\u6587\u4ef6\u5939" }],
      },
      expect: 200,
    });
    const unlockedFolderCard = (unlockedFolderCards.data?.results || []).find((item) => item.path === lockedFolderName);
    assert.ok(unlockedFolderCard, "AI global folder queries should still include the folder after unlock.");
    assert.notStrictEqual(unlockedFolderCard.requiresUnlock, true, "Unlocked folder AI card should no longer require unlock.");
    assert.strictEqual(unlockedFolderCard.locked, true, "Unlocked folder AI card should still report encrypted state.");
    assert.strictEqual(unlockedFolderCard.unlocked, true, "Unlocked folder AI card should report current-session unlock state.");
    const unlockedFolderPromptContext = JSON.stringify(mockDeepSeek.requests.at(-1)?.body?.messages || []);
    assert.ok(
      unlockedFolderPromptContext.includes("已加密，当前会话已解锁"),
      "AI context should keep encrypted-folder status visible after the current session unlocks it."
    );

    const resetUnlockResponse = await api(baseUrl, "/api/folder-unlock-session/reset", {
      method: "POST",
      token,
      headers: { Cookie: unlockCookie },
      expect: 200,
    });
    assert.match(
      resetUnlockResponse.response.headers.get("set-cookie") || "",
      /pcd_unlock=.*Max-Age=0/i,
      "Refresh reset should clear the folder unlock cookie."
    );
    const relockedList = await api(baseUrl, "/api/list?path=", {
      token,
      expect: 200,
    });
    const relockedListItem = (relockedList.data?.items || []).find((item) => item.path === lockedFolderName);
    assert.strictEqual(relockedListItem?.locked, true, "Refresh reset should keep encrypted state.");
    assert.notStrictEqual(relockedListItem?.unlocked, true, "Refresh reset should make encrypted folders locked again.");

    const aiReasoner = await api(baseUrl, "/api/ai/chat", {
      method: "POST",
      token,
      json: {
        mode: "global",
        model: "reasoner",
        path: "folderA",
        prompt: "再分析一下",
        messages: [{ role: "user", text: "再分析一下" }],
      },
      expect: 200,
    });
    assert.strictEqual(aiReasoner.data?.thinking, true, "Reasoner mode should report thinking.");
    assert.strictEqual(mockDeepSeek.requests.at(-2)?.body?.model, "deepseek-v4-flash", "DeepSeek request should use v4 flash.");
    assert.deepStrictEqual(mockDeepSeek.requests.at(-2)?.body?.thinking, { type: "enabled" });
    assert.deepStrictEqual(mockDeepSeek.requests.at(-1)?.body?.thinking, { type: "enabled" });

    await api(baseUrl, "/api/copy", {
      method: "POST",
      token,
      json: { source: "folderA", targetDir: "folderA" },
      expect: 400,
    });

    const bulkLink = await api(baseUrl, "/api/bulk-download-link", {
      method: "POST",
      token,
      json: { paths: ["folderA"], folderPasswords: {} },
      expect: 200,
    });
    assert.ok(bulkLink.data?.url, "Bulk download should return a URL.");

    const firstDownload = await fetch(`${baseUrl}${bulkLink.data.url}`);
    assert.strictEqual(firstDownload.status, 200, "First bulk download should succeed.");
    await firstDownload.arrayBuffer();

    const secondDownload = await fetch(`${baseUrl}${bulkLink.data.url}`);
    assert.strictEqual(secondDownload.status, 401, "Bulk download token should be one-time use.");

    for (let index = 0; index < 12; index += 1) {
      const attempt = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: "wrong-password" }),
      });
      assert.strictEqual(attempt.status, 401, `Login attempt ${index + 1} should fail with 401.`);
    }

    const blocked = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: "wrong-password" }),
    });
    assert.strictEqual(blocked.status, 429, "Further failed login attempts should be rate-limited.");

    console.log("Smoke tests passed.");
  } catch (error) {
    const logs = getLogs();
    console.error("Smoke tests failed.");
    if (logs.stdout) console.error("\n[server stdout]\n" + logs.stdout);
    if (logs.stderr) console.error("\n[server stderr]\n" + logs.stderr);
    throw error;
  } finally {
    await stopServer(child);
    await mockDeepSeek.close();
    await fsp.rm(storageRoot, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
