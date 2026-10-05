const assert = require("assert");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const BASE_URL = "http://127.0.0.1:8081";
const ADMIN_PASSWORD = fs.readFileSync(".cloudflared/cloud-drive-password.txt", "utf8").trim();

const BLUE_PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzc1pQegAAAABJRU5ErkJggg==";
const GREEN_PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const BLUE_PNG_BUFFER = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzc1pQegAAAABJRU5ErkJggg==", "base64");
const GREEN_PNG_BUFFER = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

async function apiRequest(endpoint, { method = "GET", token = null, body = null } = {}) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const arrayBuf = await res.arrayBuffer();
    data = Buffer.from(arrayBuf);
  }

  return { status: res.status, headers: res.headers, data };
}

async function run() {
  console.log("=== 开始严格的用户身份与头像数据隔离性稳定性检查 ===");

  // 1. 未登录鉴权边界检查
  console.log("\n[Test 1] 验证未登录状态下的严格鉴权拦截...");
  {
    const getRes = await apiRequest("/api/user/avatar");
    assert.strictEqual(getRes.status, 401, "未登录 GET /api/user/avatar 必须返回 401");

    const postRes = await apiRequest("/api/user/avatar", { method: "POST", body: { dataUrl: BLUE_PNG_DATA_URL } });
    assert.strictEqual(postRes.status, 401, "未登录 POST /api/user/avatar 必须返回 401");

    const delRes = await apiRequest("/api/user/avatar", { method: "DELETE" });
    assert.strictEqual(delRes.status, 401, "未登录 DELETE /api/user/avatar 必须返回 401");
    console.log("  ✓ 未登录请求 100% 拦截，无越权风险");
  }

  // 2. 管理员登录
  console.log("\n[Test 2] 管理员身份登录与基础信息校验...");
  let adminToken;
  {
    const loginRes = await apiRequest("/api/login", {
      method: "POST",
      body: { username: "admin", password: ADMIN_PASSWORD },
    });
    assert.strictEqual(loginRes.status, 200, "管理员登录应成功");
    adminToken = loginRes.data.token;
    assert.ok(adminToken, "应返回有效 token");

    const meRes = await apiRequest("/api/me", { token: adminToken });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.user.id, "admin");
    assert.strictEqual(meRes.data.user.username, "admin");
    assert.strictEqual(meRes.data.user.role, "admin");
    console.log(`  ✓ 管理员身份验证正常: id=${meRes.data.user.id}, role=${meRes.data.user.role}`);
  }

  // 备份管理员原头像（若存在）
  const adminAvatarDiskPath = path.resolve("D:/PersonalCloudDrive/users/admin/.avatar.png");
  let adminBackupAvatar = null;
  if (fs.existsSync(adminAvatarDiskPath)) {
    adminBackupAvatar = fs.readFileSync(adminAvatarDiskPath);
  }

  let testUsername = null;
  try {
    // 3. 管理员上传专属头像 (Blue)
    console.log("\n[Test 3] 管理员上传专属头像 (蓝色)...");
    {
      const uploadRes = await apiRequest("/api/user/avatar", {
        method: "POST",
        token: adminToken,
        body: { dataUrl: BLUE_PNG_DATA_URL },
      });
      assert.strictEqual(uploadRes.status, 200, "管理员上传头像应成功");

      const meRes = await apiRequest("/api/me", { token: adminToken });
      assert.strictEqual(meRes.data.user.hasCustomAvatar, true, "管理员 hasCustomAvatar 应为 true");

      const avatarRes = await apiRequest("/api/user/avatar", { token: adminToken });
      assert.strictEqual(avatarRes.status, 200);
      assert.strictEqual(avatarRes.headers.get("content-type"), "image/png");
      assert.ok(avatarRes.headers.get("cache-control")?.includes("no-store"));
      assert.strictEqual(Buffer.compare(avatarRes.data, BLUE_PNG_BUFFER), 0, "管理员头像二进制数据应为蓝色图");
      assert.ok(fs.existsSync(adminAvatarDiskPath), "磁盘上必须存在 admin/.avatar.png");
      console.log("  ✓ 管理员头像上传与持久化存储成功");
    }

    // 4. 管理员生成注册密钥，创建测试独立子账号
    console.log("\n[Test 4] 创建全新普通测试账号 (test_isolate_sub)...");
    testUsername = `test_iso_${Date.now().toString().slice(-4)}`;
    const testPassword = "SubUserP@ss123!";
    let subUserToken;
  {
    const regKeyRes = await apiRequest("/api/registration-keys", {
      method: "POST",
      token: adminToken,
      body: { role: "user", note: "隔离性自动化测试密钥" },
    });
    assert.strictEqual(regKeyRes.status, 200, "生成注册密钥应成功");
    const registrationKey = regKeyRes.data.key;
    assert.ok(registrationKey, "应返回明文密钥");

    const regRes = await apiRequest("/api/register", {
      method: "POST",
      body: { username: testUsername, password: testPassword, registrationKey },
    });
    assert.strictEqual(regRes.status, 200, "子账号注册应成功");
    subUserToken = regRes.data.token;
    assert.ok(subUserToken, "应返回子账号有效 token");
    console.log(`  ✓ 独立普通账号注册成功: username=${testUsername}`);
  }

  // 5. 核心隔离验证：普通子账号绝对不应看到或继承管理员头像
  console.log("\n[Test 5] 严格隔离验证：新子账号是否与管理员数据完全隔离...");
  {
    const subMeRes = await apiRequest("/api/me", { token: subUserToken });
    assert.strictEqual(subMeRes.status, 200);
    assert.strictEqual(subMeRes.data.user.id, testUsername.toLowerCase());
    assert.strictEqual(subMeRes.data.user.username, testUsername);
    assert.strictEqual(subMeRes.data.user.role, "user", "子账号身份必须是普通 user");
    assert.strictEqual(subMeRes.data.user.hasCustomAvatar, false, "新子账号默认绝对不能拥有自定义头像！");

    const subAvatarRes = await apiRequest("/api/user/avatar", { token: subUserToken });
    assert.strictEqual(subAvatarRes.status, 404, "子账号未上传头像时请求 /api/user/avatar 必须返回 404，绝不能泄露管理员头像！");
    console.log("  ✓ 身份标识与头像状态 100% 隔离：子账号未受管理员头像任何污染");
  }

  // 6. 子账号上传独立头像 (Green)，验证磁盘与各用户数据完全分开
  console.log("\n[Test 6] 子账号上传独立头像 (绿色)，验证多租户互相独立...");
  const subAvatarDiskPath = path.resolve(`D:/PersonalCloudDrive/users/${testUsername.toLowerCase()}/.avatar.png`);
  {
    const subUploadRes = await apiRequest("/api/user/avatar", {
      method: "POST",
      token: subUserToken,
      body: { dataUrl: GREEN_PNG_DATA_URL },
    });
    assert.strictEqual(subUploadRes.status, 200, "子账号上传头像应成功");

    const subMeRes = await apiRequest("/api/me", { token: subUserToken });
    assert.strictEqual(subMeRes.data.user.hasCustomAvatar, true, "子账号 hasCustomAvatar 应为 true");

    const subAvatarRes = await apiRequest("/api/user/avatar", { token: subUserToken });
    assert.strictEqual(subAvatarRes.status, 200);
    assert.strictEqual(Buffer.compare(subAvatarRes.data, GREEN_PNG_BUFFER), 0, "子账号头像数据必须是绿色图");

    // 关键校验：管理员头像必须依然是蓝色，绝不能被子账号覆盖或混淆
    const adminAvatarRes = await apiRequest("/api/user/avatar", { token: adminToken });
    assert.strictEqual(adminAvatarRes.status, 200);
    assert.strictEqual(Buffer.compare(adminAvatarRes.data, BLUE_PNG_BUFFER), 0, "管理员头像必须依然是蓝色图，不可被影响！");

    // 磁盘路径检查
    assert.ok(fs.existsSync(adminAvatarDiskPath), "管理员文件必须存在");
    assert.ok(fs.existsSync(subAvatarDiskPath), "子账号文件必须独立存在");
    assert.notStrictEqual(adminAvatarDiskPath, subAvatarDiskPath, "存储路径必须完全不同");
    console.log("  ✓ 磁盘与数据完全独立存储：\n    Admin -> " + adminAvatarDiskPath + "\n    SubUser -> " + subAvatarDiskPath);
  }

  // 7. 子账号重置/删除头像，验证管理员头像不受任何影响
  console.log("\n[Test 7] 子账号恢复默认头像，验证不会误删或影响管理员头像...");
  {
    const subDelRes = await apiRequest("/api/user/avatar", {
      method: "DELETE",
      token: subUserToken,
    });
    assert.strictEqual(subDelRes.status, 200, "子账号删除头像应成功");

    const subMeRes = await apiRequest("/api/me", { token: subUserToken });
    assert.strictEqual(subMeRes.data.user.hasCustomAvatar, false, "子账号 hasCustomAvatar 应恢复为 false");

    const subAvatarRes = await apiRequest("/api/user/avatar", { token: subUserToken });
    assert.strictEqual(subAvatarRes.status, 404, "子账号头像应已删除");
    assert.strictEqual(fs.existsSync(subAvatarDiskPath), false, "子账号磁盘头像文件已被移除");

    // 管理员检查
    const adminAvatarRes = await apiRequest("/api/user/avatar", { token: adminToken });
    assert.strictEqual(adminAvatarRes.status, 200, "管理员头像依然存在");
    assert.strictEqual(Buffer.compare(adminAvatarRes.data, BLUE_PNG_BUFFER), 0, "管理员头像数据依然完整无损");
    assert.ok(fs.existsSync(adminAvatarDiskPath), "管理员头像文件安然无恙");
    console.log("  ✓ 单向删除隔离生效：子账号删除头像对管理员零影响");
  }

    console.log("\n🎉 所有严格隔离性与稳定性检查全部通过！100% 隔离无混淆！");
  } finally {
    // 还原管理员原头像
    if (adminBackupAvatar) {
      fs.writeFileSync(adminAvatarDiskPath, adminBackupAvatar);
      console.log("  ✓ 管理员原有自定义头像已完美还原");
    } else {
      if (fs.existsSync(adminAvatarDiskPath)) fs.unlinkSync(adminAvatarDiskPath);
      console.log("  ✓ 管理员头像已恢复默认");
    }

    if (testUsername) {
      console.log(`\n[Cleanup] 彻底清理测试账号: ${testUsername}...`);
      await apiRequest(`/api/admin/users/${testUsername.toLowerCase()}`, {
        method: "DELETE",
        token: adminToken,
      });
      console.log("  ✓ 测试子账号数据已彻底删除，零残留！");
    }
  }
}

run().catch((err) => {
  console.error("\n❌ 隔离性检查失败:", err);
  process.exit(1);
});
