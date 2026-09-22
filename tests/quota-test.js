const assert = require("assert");
const fs = require("fs");
const fsp = require("fs/promises");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const serverEntry = path.join(repoRoot, "server.js");
const adminPassword = "test-admin-password";

function randomPort() {
  return 21000 + Math.floor(Math.random() * 2000);
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url, options = {}) {
  const method = options.method || "GET";
  const headers = { ...(options.headers || {}) };
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof Buffer)) {
    body = JSON.stringify(body);
    headers["content-type"] = "application/json";
  }
  const response = await fetch(url, { method, headers, body });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  return { status: response.status, headers: response.headers, data: json, text };
}

async function run() {
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "pcd-quota-test-"));
  const tempStorageRoot = path.join(tempDir, "storage");
  const port = randomPort();

  const serverProc = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      CLOUD_DRIVE_USER: "admin",
      CLOUD_DRIVE_PASSWORD: adminPassword,
      STORAGE_BASE_ROOT: tempStorageRoot,
      STORAGE_ROOT: path.join(tempStorageRoot, "users", "admin", "files"),
      DEFAULT_USER_QUOTA_GB: "20",
    },
    stdio: "pipe",
  });

  serverProc.stderr.on("data", (data) => console.error(`[Server stderr]: ${data}`));

  try {
    // Wait for server to start
    let ready = false;
    for (let i = 0; i < 30; i++) {
      await wait(300);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (res.status === 401 || res.status === 200) {
          ready = true;
          break;
        }
      } catch {}
    }
    assert(ready, "Server did not become ready in time");

    console.log("1. Testing Admin Login...");
    const adminLoginRes = await requestJson(`http://127.0.0.1:${port}/api/login`, {
      method: "POST",
      body: { username: "admin", password: adminPassword },
    });
    assert.strictEqual(adminLoginRes.status, 200, "Admin login failed");
    const adminToken = adminLoginRes.data.token;
    assert(adminToken, "Admin token missing");
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    console.log("2. Testing Admin User List API (GET /api/admin/users)...");
    const usersRes = await requestJson(`http://127.0.0.1:${port}/api/admin/users`, {
      headers: adminHeaders,
    });
    assert.strictEqual(usersRes.status, 200);
    assert(Array.isArray(usersRes.data.users));
    const adminUser = usersRes.data.users.find((u) => u.username === "admin");
    assert(adminUser);
    assert.strictEqual(adminUser.role, "admin");
    assert.strictEqual(adminUser.quotaBytes, null, "Admin must have unlimited quota (null)");

    console.log("3. Testing Key Generation with Quota (50GB)...");
    const keyRes = await requestJson(`http://127.0.0.1:${port}/api/registration-keys`, {
      method: "POST",
      headers: adminHeaders,
      body: { quotaGb: 50 },
    });
    assert.strictEqual(keyRes.status, 200);
    const regKey50 = keyRes.data.key;
    assert.strictEqual(keyRes.data.record.quotaBytes, 50 * 1024 * 1024 * 1024);

    console.log("4. Testing User Registration with 50GB Key...");
    const subUserReg = await requestJson(`http://127.0.0.1:${port}/api/register`, {
      method: "POST",
      body: { username: "tester50", password: "pwd123456", registrationKey: regKey50 },
    });
    assert.strictEqual(subUserReg.status, 200);
    const user50Token = subUserReg.data.token;
    const user50Headers = { Authorization: `Bearer ${user50Token}` };
    assert.strictEqual(subUserReg.data.user.quotaBytes, 50 * 1024 * 1024 * 1024);

    console.log("5. Testing Non-Admin Permission Restriction (Normal user cannot access admin APIs)...");
    const unauthorizedUsersRes = await requestJson(`http://127.0.0.1:${port}/api/admin/users`, {
      headers: user50Headers,
    });
    assert.strictEqual(unauthorizedUsersRes.status, 403, "Normal user must be forbidden from /api/admin/users");

    const unauthorizedQuotaPost = await requestJson(`http://127.0.0.1:${port}/api/admin/users/tester50/quota`, {
      method: "POST",
      headers: user50Headers,
      body: { quotaGb: 100 },
    });
    assert.strictEqual(unauthorizedQuotaPost.status, 403, "Normal user must be forbidden from /api/admin/users/:id/quota");

    console.log("6. Testing Admin Modifying User Quota (adjust tester50 to 10GB)...");
    const modifyQuotaRes = await requestJson(`http://127.0.0.1:${port}/api/admin/users/tester50/quota`, {
      method: "POST",
      headers: adminHeaders,
      body: { quotaGb: 10 },
    });
    assert.strictEqual(modifyQuotaRes.status, 200);
    assert.strictEqual(modifyQuotaRes.data.user.quotaBytes, 10 * 1024 * 1024 * 1024);

    console.log("7. Testing User Storage Usage API (/api/storage-usage)...");
    const storageRes = await requestJson(`http://127.0.0.1:${port}/api/storage-usage`, {
      headers: user50Headers,
    });
    assert.strictEqual(storageRes.status, 200);
    assert.strictEqual(storageRes.data.quotaBytes, 10 * 1024 * 1024 * 1024);

    console.log("8. Testing Upload Interception when Quota Exceeded...");
    // Adjust user quota to tiny 500 bytes via admin API
    const setTinyQuotaRes = await requestJson(`http://127.0.0.1:${port}/api/admin/users/tester50/quota`, {
      method: "POST",
      headers: adminHeaders,
      body: { quotaBytes: 500 },
    });
    assert.strictEqual(setTinyQuotaRes.status, 200);
    assert.strictEqual(setTinyQuotaRes.data.user.quotaBytes, 500);

    // Try chunk upload init with 1000 bytes (exceeds 500 bytes quota)
    const exceedChunkRes = await requestJson(`http://127.0.0.1:${port}/api/upload-chunk/init`, {
      method: "POST",
      headers: user50Headers,
      body: { name: "bigfile.dat", size: 1000, path: "" },
    });
    assert.strictEqual(exceedChunkRes.status, 403, "Must be rejected with 403 when quota exceeded");
    assert(exceedChunkRes.data.error.includes("存储空间配额不足"), "Error message should mention quota exceeded");
    console.log("   -> Successfully intercepted with friendly message:", exceedChunkRes.data.error);

    // Admin uploading the same 1000 bytes must succeed (admin is unlimited)
    const adminUploadRes = await requestJson(`http://127.0.0.1:${port}/api/upload-chunk/init`, {
      method: "POST",
      headers: adminHeaders,
      body: { name: "admin-file.dat", size: 1000, path: "" },
    });
    assert.strictEqual(adminUploadRes.status, 200, "Admin must not be restricted by quota");
    assert(adminUploadRes.data.uploadId);

    console.log("\nALL STORAGE QUOTA TESTS PASSED PERFECTLY!");
  } finally {
    serverProc.kill();
    await wait(300);
    await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
