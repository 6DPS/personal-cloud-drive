const assert = require("assert");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://127.0.0.1:8081";
const ADMIN_PASSWORD = fs.readFileSync(".cloudflared/cloud-drive-password.txt", "utf8").trim();

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
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, data };
}

async function run() {
  console.log("=== 开始账号修改密码与专属安全恢复密钥完整性测试 ===");

  // 1. 管理员登录
  console.log("\n[Test 1] 管理员登录与专属恢复密钥检查...");
  let adminToken;
  {
    const loginRes = await apiRequest("/api/login", {
      method: "POST",
      body: { username: "admin", password: ADMIN_PASSWORD },
    });
    assert.strictEqual(loginRes.status, 200, "管理员登录应成功");
    adminToken = loginRes.data.token;

    const meRes = await apiRequest("/api/me", { token: adminToken });
    assert.strictEqual(meRes.status, 200);
    assert.ok(meRes.data.user.maskedRecoveryKey, "应该返回脱敏的恢复密钥");
    console.log(`  ✓ 管理员脱敏密钥: ${meRes.data.user.maskedRecoveryKey}`);

    const keyRes = await apiRequest("/api/user/recovery-key", { token: adminToken });
    assert.strictEqual(keyRes.status, 200);
    assert.ok(keyRes.data.recoveryKey.startsWith("DPSIR-RCV-"), "恢复密钥格式应为 DPSIR-RCV-XXXX-XXXX");
    console.log(`  ✓ 管理员专属安全恢复密钥获取成功: ${keyRes.data.recoveryKey}`);
  }

  // 2. 创建普通测试用户并获取注册时返回的专属恢复密钥
  console.log("\n[Test 2] 生成邀请码并注册独立测试账号...");
  const testUsername = `test_pwd_${Math.floor(1000 + Math.random() * 9000)}`;
  const initialPassword = "Initial_Pass_123456";
  let subToken;
  let subRecoveryKey;
  {
    const keyGenRes = await apiRequest("/api/registration-keys", {
      method: "POST",
      token: adminToken,
      body: { quotaGb: 5 },
    });
    assert.strictEqual(keyGenRes.status, 200);
    const regKey = keyGenRes.data.key;

    const regRes = await apiRequest("/api/register", {
      method: "POST",
      body: {
        username: testUsername,
        password: initialPassword,
        registrationKey: regKey,
      },
    });
    assert.strictEqual(regRes.status, 200, "子账号注册应成功");
    subToken = regRes.data.token;
    subRecoveryKey = regRes.data.recoveryKey;
    assert.ok(subRecoveryKey && subRecoveryKey.startsWith("DPSIR-RCV-"), "注册成功应返回专属安全恢复密钥");
    console.log(`  ✓ 测试账号 ${testUsername} 注册成功，专属恢复密钥: ${subRecoveryKey}`);
  }

  // 3. 测试场景一：记得原密码自主修改密码 (POST /api/user/change-password)
  console.log("\n[Test 3] 验证场景一：记得原密码自主修改登录密码...");
  const newPassword1 = "New_Pass_One_123456";
  {
    // 3.1 输错原密码应被拦截
    const wrongRes = await apiRequest("/api/user/change-password", {
      method: "POST",
      token: subToken,
      body: { oldPassword: "WrongPassword!", newPassword: newPassword1 },
    });
    assert.strictEqual(wrongRes.status, 401, "原密码错误必须返回 401");
    console.log("  ✓ 错误原密码被正确拒绝 (401)");

    // 3.2 输对原密码应成功修改
    const correctRes = await apiRequest("/api/user/change-password", {
      method: "POST",
      token: subToken,
      body: { oldPassword: initialPassword, newPassword: newPassword1 },
    });
    assert.strictEqual(correctRes.status, 200, "原密码正确修改应成功");
    console.log("  ✓ 原密码正确，修改密码成功 (200)");

    // 3.3 验证使用新密码可以成功登录
    const reloginRes = await apiRequest("/api/login", {
      method: "POST",
      body: { username: testUsername, password: newPassword1 },
    });
    assert.strictEqual(reloginRes.status, 200, "新密码登录成功");
    subToken = reloginRes.data.token;
    console.log("  ✓ 使用新修改的密码重新登录成功");
  }

  // 4. 测试关键安全隔离：普通用户绝不能用管理员密码重置自己的密码（防越权/防泄露）
  console.log("\n[Test 4] 核心安全校验：普通用户严禁用管理员密码重置密码...");
  {
    const attackRes = await apiRequest("/api/password-reset", {
      method: "POST",
      body: {
        username: testUsername,
        recoveryKey: ADMIN_PASSWORD, // 试图用管理员密码重置普通用户
        newPassword: "Attacker_Password_123",
      },
    });
    assert.strictEqual(attackRes.status, 401, "普通用户试图使用管理员密码重置必须被严厉拒绝 (401)");
    console.log("  ✓ 越权拦截生效：普通用户无法使用管理员密码，彻底杜绝泄露与提权风险");
  }

  // 5. 测试场景二：忘记原密码，凭专属恢复密钥找回重置 (POST /api/password-reset)
  console.log("\n[Test 5] 验证场景二：忘记原密码，凭用户专属恢复密钥找回重置...");
  const newPassword2 = "Recovered_Pass_Two_123456";
  {
    // 5.1 输错专属恢复密钥被拒绝
    const wrongKeyRes = await apiRequest("/api/password-reset", {
      method: "POST",
      body: {
        username: testUsername,
        recoveryKey: "DPSIR-RCV-9999-9999", // 错误的密钥
        newPassword: newPassword2,
      },
    });
    assert.strictEqual(wrongKeyRes.status, 401, "错误专属恢复密钥必须被拒绝 (401)");
    console.log("  ✓ 错误恢复密钥被正确拒绝 (401)");

    // 5.2 凭正确的专属恢复密钥重设密码成功
    const correctResetRes = await apiRequest("/api/password-reset", {
      method: "POST",
      body: {
        username: testUsername,
        recoveryKey: subRecoveryKey,
        newPassword: newPassword2,
      },
    });
    assert.strictEqual(correctResetRes.status, 200, "凭专属恢复密钥重设密码成功");
    console.log("  ✓ 凭专属恢复密钥重设密码成功 (200)");

    // 5.3 验证使用重置后的新密码可以登录
    const relogin2 = await apiRequest("/api/login", {
      method: "POST",
      body: { username: testUsername, password: newPassword2 },
    });
    assert.strictEqual(relogin2.status, 200);
    subToken = relogin2.data.token;
    console.log("  ✓ 凭重设后的密码再次登录成功");
  }

  // 6. 验证「重新生成恢复密钥」：旧密钥立即作废，只认最新一把
  console.log("\n[Test 6] 验证重新生成恢复密钥：旧密钥立即作废，只认最新一把...");
  let newSubRecoveryKey;
  {
    const regenRes = await apiRequest("/api/user/recovery-key/regenerate", {
      method: "POST",
      token: subToken,
    });
    assert.strictEqual(regenRes.status, 200);
    newSubRecoveryKey = regenRes.data.recoveryKey;
    assert.notStrictEqual(newSubRecoveryKey, subRecoveryKey, "新生成的密钥必须不同于旧密钥");
    console.log(`  ✓ 成功重新生成新专属密钥: ${newSubRecoveryKey}`);

    // 尝试用旧密钥重设密码，必须失败！
    const useOldKeyRes = await apiRequest("/api/password-reset", {
      method: "POST",
      body: {
        username: testUsername,
        recoveryKey: subRecoveryKey, // 旧密钥
        newPassword: "Should_Fail_Password_123",
      },
    });
    assert.strictEqual(useOldKeyRes.status, 401, "已作废的旧恢复密钥必须被拒绝 (401)");
    console.log("  ✓ 已作废的旧密钥无法使用 (401)，只认最新一把！");

    // 尝试用新密钥重设密码，成功！
    const newPassword3 = "Final_Secure_Password_123";
    const useNewKeyRes = await apiRequest("/api/password-reset", {
      method: "POST",
      body: {
        username: testUsername,
        recoveryKey: newSubRecoveryKey, // 新密钥
        newPassword: newPassword3,
      },
    });
    assert.strictEqual(useNewKeyRes.status, 200, "新恢复密钥重置密码成功");
    console.log("  ✓ 最新密钥重置密码成功 (200)");
  }

  // 7. 测试环境还原与清理
  console.log("\n[Test 7] 测试环境还原与清理...");
  {
    // 从 accountsStore 中清理测试账号
    const accountsPath = path.resolve("D:/PersonalCloudDrive/system/accounts.json");
    if (fs.existsSync(accountsPath)) {
      const data = JSON.parse(fs.readFileSync(accountsPath, "utf8"));
      data.users = data.users.filter((u) => u.username !== testUsername);
      fs.writeFileSync(accountsPath, JSON.stringify(data, null, 2), "utf8");
    }
    // 清理测试用户目录
    const testUserDir = path.resolve(`D:/PersonalCloudDrive/users/${testUsername}`);
    if (fs.existsSync(testUserDir)) {
      fs.rmSync(testUserDir, { recursive: true, force: true });
    }
    console.log(`  ✓ 测试账号 ${testUsername} 数据已完全清理还原`);
  }

  console.log("\n🎉 所有密码修改、找回重置、专属恢复密钥与越权防范测试 100% 全部通过！");
}

run().catch((err) => {
  console.error("测试未通过:", err);
  process.exit(1);
});
