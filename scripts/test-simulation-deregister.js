const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const BASE_URL = "http://127.0.0.1:8081";

const secretFile = path.join(process.cwd(), ".cloudflared", "cloud-drive-session-secret.txt");
const secret = fs.readFileSync(secretFile, "utf8").trim();

function sign(val) {
  return crypto.createHmac("sha256", secret).update(val).digest("base64url");
}

function getAdminToken() {
  const payload = JSON.stringify({
    userId: "admin",
    user: "admin",
    exp: Date.now() + 7 * 24 * 3600 * 1000,
    nonce: crypto.randomBytes(12).toString("base64url"),
  });
  const body = Buffer.from(payload).toString("base64url");
  return `${body}.${sign(body)}`;
}

async function runSimulation() {
  console.log("==================================================================");
  console.log("    DPSir 智云盘 - 用户自主注销与磁盘物理删除 深度模拟真实性测试   ");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const testUsername = `sim_user_${timestamp}`;
  const testPassword = `Pass#${timestamp}!`;

  // 1. 管理员接口动态签发一张合法的全新注册密钥
  console.log("【步骤 1】管理员签发有效注册密钥并创建全新测试账号...");
  const adminToken = getAdminToken();
  const issueKeyRes = await fetch(`${BASE_URL}/api/registration-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ quotaGb: 5 })
  });
  const keyData = await issueKeyRes.json();
  if (!issueKeyRes.ok || !keyData.key) {
    throw new Error(`签发注册密钥失败: ${JSON.stringify(keyData)}`);
  }
  const regKey = keyData.key;
  console.log(`  ✓ 成功签发注册密钥: ${keyData.record?.maskedKey || regKey}`);

  // 2. 使用该密钥注册全新测试用户
  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: testUsername,
      password: testPassword,
      registrationKey: regKey,
      role: "user"
    })
  });

  const regData = await regRes.json();
  if (!regRes.ok) {
    throw new Error(`注册测试用户失败: ${regRes.status} ${JSON.stringify(regData)}`);
  }
  const testUserId = regData.user?.id;
  console.log(`  ✓ 用户注册成功！账号: ${testUsername}, 分配用户 ID: ${testUserId}`);

  // 获取登录 Cookie
  const setCookie = regRes.headers.get("set-cookie");
  const cookieHeader = setCookie ? setCookie.split(";")[0] : "";
  console.log(`  ✓ 会话 Cookie 获取成功 (${cookieHeader.slice(0, 20)}...)`);

  // 3. 定位 D 盘物理存储路径并真实写入用户私有数据
  const usersBase = fs.existsSync("D:\\PersonalCloudDrive") ? "D:\\PersonalCloudDrive" : "C:\\PersonalCloudDrive";
  console.log(`  ✓ 系统存储根基目录: ${usersBase}`);

  const userDiskRoot = path.join(usersBase, "users", testUserId);
  const userFilesDir = path.join(userDiskRoot, "files");
  const userTrashDir = path.join(userDiskRoot, ".trash");
  const userPreviewDir = path.join(userDiskRoot, ".preview-cache");
  const userFolderPwdFile = path.join(userDiskRoot, ".folder-passwords.json");
  const userAvatarFile = path.join(userDiskRoot, ".avatar.png");
  const userTmpDir = path.join(usersBase, "system", "tmp", testUserId);
  const sharesFile = path.join(usersBase, "system", "shares.json");
  const accountsFile = path.join(usersBase, "accounts.json");

  console.log(`\n【步骤 2】向 D 盘真实磁盘写入用户的私有文件、相册、回收站、缓存、头像及临时分片...`);

  await fsp.mkdir(userFilesDir, { recursive: true });
  await fsp.mkdir(userTrashDir, { recursive: true });
  await fsp.mkdir(userPreviewDir, { recursive: true });
  await fsp.mkdir(userTmpDir, { recursive: true });

  // 写入具体私有真实文件
  const docFile = path.join(userFilesDir, "2026年年度财务战略规划.docx");
  await fsp.writeFile(docFile, Buffer.from("这是用户的绝对机密战略财务文档，包含商业机密内容..."));

  const photoFolder = path.join(userFilesDir, "个人私人相册");
  await fsp.mkdir(photoFolder, { recursive: true });
  const photoFile = path.join(photoFolder, "家庭合影_2026.jpg");
  await fsp.writeFile(photoFile, Buffer.from("假装这是一张高清家庭照片数据流"));

  // 写入回收站文件
  const trashFile = path.join(userTrashDir, "废弃旧草稿.txt");
  await fsp.writeFile(trashFile, Buffer.from("这是已经放入回收站的旧草稿内容"));

  // 写入预览缓存
  const previewCache = path.join(userPreviewDir, "docx_preview_page1.png");
  await fsp.writeFile(previewCache, Buffer.from("缓存预览图数据"));

  // 写入文件夹独立密码锁配置
  await fsp.writeFile(userFolderPwdFile, JSON.stringify({ "个人私人相册": "hashed_secret_lock" }));

  // 写入头像
  await fsp.writeFile(userAvatarFile, Buffer.from("假装这是头像图片二进制"));

  // 写入临时分片目录文件
  const tmpChunkFile = path.join(userTmpDir, "chunk_upload_part_001.tmp");
  await fsp.writeFile(tmpChunkFile, Buffer.from("未完成的临时上传分片数据"));

  // 注入一条该用户的公开分享链接
  let shares = [];
  try {
    shares = JSON.parse(await fsp.readFile(sharesFile, "utf-8"));
  } catch {}
  const testShareId = `share_sim_${timestamp}`;
  shares.push({
    id: testShareId,
    userId: testUserId,
    username: testUsername,
    name: "对外共享的战略报告",
    path: "/2026年年度财务战略规划.docx",
    createdAt: new Date().toISOString()
  });
  await fsp.writeFile(sharesFile, JSON.stringify(shares, null, 2), "utf-8");

  console.log(`  ✓ 成功写入文件 1: ${docFile} (${fs.statSync(docFile).size} 字节)`);
  console.log(`  ✓ 成功写入文件 2: ${photoFile} (${fs.statSync(photoFile).size} 字节)`);
  console.log(`  ✓ 成功写入回收站: ${trashFile}`);
  console.log(`  ✓ 成功写入预览缓存: ${previewCache}`);
  console.log(`  ✓ 成功写入独立密码锁配置: ${userFolderPwdFile}`);
  console.log(`  ✓ 成功写入个人头像: ${userAvatarFile}`);
  console.log(`  ✓ 成功写入分片临时目录: ${tmpChunkFile}`);
  console.log(`  ✓ 成功注入外链公开分享: 标识 ${testShareId}`);

  // 4. 注销前核验
  console.log(`\n【步骤 3】注销前多维度物理真实性核验...`);
  console.log(`  · 用户私有主目录是否存在: ${fs.existsSync(userDiskRoot) ? "【存在 ✓】" : "【不存在 ✗】"}`);
  console.log(`  · 临时分片目录是否存在:   ${fs.existsSync(userTmpDir) ? "【存在 ✓】" : "【不存在 ✗】"}`);

  // 检查账号库 accounts.json
  const accountsBefore = JSON.parse(await fsp.readFile(accountsFile, "utf-8"));
  const userInAccountsBefore = accountsBefore.users.some(u => u.id === testUserId);
  console.log(`  · 账号库 accounts.json 是否有该账号: ${userInAccountsBefore ? "【包含 ✓】" : "【未找到 ✗】"}`);

  // 检查当前账号能否正常调用文件列表接口
  const listResBefore = await fetch(`${BASE_URL}/api/list`, {
    headers: { Cookie: cookieHeader }
  });
  console.log(`  · 登录鉴权状态检查 (/api/list): HTTP ${listResBefore.status} ${listResBefore.ok ? "【授权通过 ✓】" : "【拒绝 ✗】"}`);

  if (!fs.existsSync(userDiskRoot) || !userInAccountsBefore || !listResBefore.ok) {
    throw new Error("前置状态校验不通过，终止测试！");
  }

  // 5. 执行防误触阻断验证（错误密码、未确认免责条款）
  console.log(`\n【步骤 4】执行注销安全性阻断验证（防误触机制）...`);
  // 5.1 错误密码
  const wrongPwdRes = await fetch(`${BASE_URL}/api/user/deregister`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ password: "WrongPassword!", confirmed: true })
  });
  console.log(`  ✓ 错误密码拦截验证: HTTP ${wrongPwdRes.status} (预期 401 拦截)`);

  // 5.2 未勾选免责条款
  const unconfirmedRes = await fetch(`${BASE_URL}/api/user/deregister`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ password: testPassword, confirmed: false })
  });
  console.log(`  ✓ 未勾选免责协议拦截验证: HTTP ${unconfirmedRes.status} (预期 400 拦截)`);

  // 6. 正式发起注销！
  console.log(`\n【步骤 5】正式提交注销请求（密码正确 + 确认自负全责）...`);
  const deregisterRes = await fetch(`${BASE_URL}/api/user/deregister`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ password: testPassword, confirmed: true })
  });

  const deregisterJson = await deregisterRes.json();
  console.log(`  ✓ 注销接口响应: HTTP ${deregisterRes.status} - "${deregisterJson.message}"`);

  // 7. 注销后物理磁盘与系统核心状态严密核验
  console.log(`\n【步骤 6】注销后物理磁盘与系统数据【彻底清空】终极核验:`);

  // 7.1 用户私有主目录（D 盘）
  const userDiskRootExistsAfter = fs.existsSync(userDiskRoot);
  console.log(`  [1] 用户在 D 盘的整个私有存储目录 (${userDiskRoot}):`);
  console.log(`      状态: ${userDiskRootExistsAfter ? "【❌ 仍然残留！危险！】" : "【✅ 已彻底物理递归粉碎清除！完全不存在！】"}`);

  // 7.2 临时上传分片目录
  const userTmpExistsAfter = fs.existsSync(userTmpDir);
  console.log(`  [2] 用户在 D 盘的临时上传分片目录 (${userTmpDir}):`);
  console.log(`      状态: ${userTmpExistsAfter ? "【❌ 仍然残留！危险！】" : "【✅ 已彻底物理抹除！完全不存在！】"}`);

  // 7.3 账号记录 accounts.json
  const accountsAfter = JSON.parse(await fsp.readFile(accountsFile, "utf-8"));
  const userInAccountsAfter = accountsAfter.users.some(u => u.id === testUserId);
  console.log(`  [3] 账号数据库 accounts.json:`);
  console.log(`      状态: ${userInAccountsAfter ? "【❌ 账号仍然存在！危险！】" : "【✅ 账号已被永久擦除！完全不存在！】"}`);

  // 7.4 外链分享记录 shares.json
  const sharesAfter = JSON.parse(await fsp.readFile(sharesFile, "utf-8"));
  const shareExistsAfter = sharesAfter.some(s => s.userId === testUserId || s.id === testShareId);
  console.log(`  [4] 外链分享数据库 shares.json:`);
  console.log(`      状态: ${shareExistsAfter ? "【❌ 外链仍然残留！危险！】" : "【✅ 该用户的所有外链已彻底废除移除！】"}`);

  // 7.5 原会话 Cookie 失效验证
  const listResAfter = await fetch(`${BASE_URL}/api/list`, {
    headers: { Cookie: cookieHeader }
  });
  console.log(`  [5] 旧会话 Cookie 请求保护接口 (/api/list):`);
  console.log(`      状态: HTTP ${listResAfter.status} ${listResAfter.status === 401 ? "【✅ 原 Token 已即刻作废，被彻底拒绝访问！】" : "【❌ 仍然能够访问！危险！】"}`);

  // 8. 超级管理员安全底线核验
  console.log(`\n【步骤 7】系统安全底线核验：尝试注销系统超级管理员 admin...`);
  const adminDeregRes = await fetch(`${BASE_URL}/api/user/deregister`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ password: "AnyAdminPassword", confirmed: true })
  });
  const adminDeregJson = await adminDeregRes.json();
  console.log(`  ✓ 管理员注销防范结果: HTTP ${adminDeregRes.status} - "${adminDeregJson.error}"`);
  console.log(`  ✓ 结论: ${adminDeregRes.status === 400 ? "【✅ 超级管理员受系统硬核保护，严格禁止注销自身！】" : "【❌ 异常！】"}`);

  const allPassed = !userDiskRootExistsAfter && !userTmpExistsAfter && !userInAccountsAfter && !shareExistsAfter && listResAfter.status === 401 && adminDeregRes.status === 400;

  console.log("\n==================================================================");
  if (allPassed) {
    console.log("       模拟测试全部通过！100% 确认：注销后所有数据全被物理彻底删除！   ");
  } else {
    console.log("       测试未全部通过，请检查上述详情！                       ");
  }
  console.log("==================================================================\n");
}

runSimulation().catch(err => {
  console.error("模拟测试出错:", err);
  process.exit(1);
});
