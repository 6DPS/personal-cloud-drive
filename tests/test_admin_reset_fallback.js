const assert = require('assert');
const http = require('http');

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8081,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8081,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function del(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8081,
        path,
        method: 'DELETE',
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log('=== 开始管理员重置用户凭证兜底机制测试 ===\n');

  // 1. 管理员登录
  console.log('[Test 1] 管理员账号登录...');
  const adminLogin = await post('/api/login', { username: 'admin', password: '20020406wdp..' });
  assert.strictEqual(adminLogin.status, 200, '管理员登录失败');
  const adminToken = adminLogin.body.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log('  ✓ 管理员登录成功');

  let testUsername = null;
  try {
    // 2. 生成邀请码并注册一个测试账号
    console.log('\n[Test 2] 生成邀请码并创建普通测试账号...');
    const keyGen = await post('/api/registration-keys', { note: 'test_fallback' }, adminHeaders);
    assert.ok(keyGen.status === 200 || keyGen.status === 201, '创建邀请码失败');
    const regKey = keyGen.body.key;

    testUsername = `user_fallback_${Math.floor(Math.random() * 9000 + 1000)}`;
    const initialPassword = 'InitialPwd123!';
    const regRes = await post('/api/register', {
      username: testUsername,
      password: initialPassword,
      registrationKey: regKey,
    });
    assert.strictEqual(regRes.status, 200, '用户注册失败: ' + JSON.stringify(regRes.body));
    const initialRecoveryKey = regRes.body.recoveryKey;
    console.log(`  ✓ 测试账号注册成功: ${testUsername}, 初始密钥: ${initialRecoveryKey}`);

    // 3. 非管理员鉴权拦截测试
    console.log('\n[Test 3] 验证权限拦截：非管理员无法调用重置与重发密钥接口...');
    const userToken = regRes.body.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    const fakeReset = await post(`/api/admin/users/${testUsername}/reset-password`, { newPassword: 'HackerPassword123' }, userHeaders);
    assert.strictEqual(fakeReset.status, 403, '越权拦截失败：非管理员居然调用成功');

    const fakeKey = await post(`/api/admin/users/${testUsername}/recovery-key`, {}, userHeaders);
    assert.strictEqual(fakeKey.status, 403, '越权拦截失败：非管理员居然调用成功');
    console.log('  ✓ 403 权限拦截生效，普通用户绝无法越权重置他人密码或密钥');

    // 4. 管理员直接重置该用户密码
    console.log('\n[Test 4] 场景一测试：管理员在后台为该用户重置临时密码...');
    const tempPassword = 'TempPassword666!';
    const resetRes = await post(`/api/admin/users/${testUsername}/reset-password`, { newPassword: tempPassword }, adminHeaders);
    assert.strictEqual(resetRes.status, 200, '管理员重置密码失败: ' + JSON.stringify(resetRes.body));
    console.log('  ✓ 管理员后台重置接口返回成功: ' + resetRes.body.message);

    // 验证旧密码失效，临时新密码成功登录
    const oldLogin = await post('/api/login', { username: testUsername, password: initialPassword });
    assert.strictEqual(oldLogin.status, 401, '旧密码应该已失效');

    const newLogin = await post('/api/login', { username: testUsername, password: tempPassword });
    assert.strictEqual(newLogin.status, 200, '临时新密码登录失败');
    console.log('  ✓ 用户使用管理员发放的临时新密码成功登录！');

    // 5. 管理员为该用户重新生成专属恢复密钥
    console.log('\n[Test 5] 场景二测试：管理员在后台为该用户重新生成恢复密钥...');
    const regenRes = await post(`/api/admin/users/${testUsername}/recovery-key`, {}, adminHeaders);
    assert.strictEqual(regenRes.status, 200, '重新生成恢复密钥失败: ' + JSON.stringify(regenRes.body));
    const newRecoveryKey = regenRes.body.recoveryKey;
    assert.notStrictEqual(newRecoveryKey, initialRecoveryKey, '新恢复密钥应该与旧密钥不同');
    assert.match(newRecoveryKey, /^DPSIR-RCV-[A-Z0-9]{4}-[A-Z0-9]{4}$/, '密钥格式不符合规范');
    console.log(`  ✓ 成功派发新专属恢复密钥: ${newRecoveryKey}`);

    // 验证旧密钥无法重置密码
    const finalPassword = 'FinalUserSecret999!';
    const failReset = await post('/api/password-reset', {
      username: testUsername,
      recoveryKey: initialRecoveryKey,
      newPassword: finalPassword,
    });
    assert.strictEqual(failReset.status, 401, '旧恢复密钥应当已彻底失效');
    console.log('  ✓ 已作废的旧密钥被正确拒绝 (401)');

    // 验证新密钥可自主在登录界面重置密码
    const successReset = await post('/api/password-reset', {
      username: testUsername,
      recoveryKey: newRecoveryKey,
      newPassword: finalPassword,
    });
    assert.strictEqual(successReset.status, 200, '新恢复密钥自主重置失败: ' + JSON.stringify(successReset.body));
    console.log('  ✓ 用户凭管理员重发的新密钥在登录页自助找回并更新密码成功！');

    // 验证最终密码登录
    const finalLogin = await post('/api/login', { username: testUsername, password: finalPassword });
    assert.strictEqual(finalLogin.status, 200, '最终密码登录验证失败');
    console.log('  ✓ 用户使用最新密码顺利登录系统');

    // 6. 防呆测试：禁止重置管理员自身
    console.log('\n[Test 6] 防呆安全测试：禁止通过该管理接口重置管理员自身...');
    const adminSelfReset = await post('/api/admin/users/admin/reset-password', { newPassword: 'ShouldFailPassword' }, adminHeaders);
    assert.strictEqual(adminSelfReset.status, 400, '未能阻止重置管理员自身');
    console.log('  ✓ 正确拦截：禁止通过管理接口重置管理员自身');

    console.log('\n🎉 所有管理员兜底重置与重发密钥测试 100% 全部通过！');
  } finally {
    if (testUsername) {
      console.log(`\n[Cleanup] 彻底清理测试账号: ${testUsername}...`);
      const delRes = await del(`/api/admin/users/${testUsername}`, adminHeaders);
      console.log(`  ✓ 测试账号清理结果: status=${delRes.status}, ok=${delRes.body?.ok}`);
    }
  }
})().catch((err) => {
  console.error('\n❌ 测试失败：', err);
  process.exit(1);
});
