const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const nodeModulesPath = 'C:\\Users\\17480\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules';
process.env.NODE_PATH = [nodeModulesPath, process.env.NODE_PATH || ''].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();
const { chromium } = require('playwright');

async function run() {
  const secret = fs.readFileSync('.cloudflared/cloud-drive-session-secret.txt', 'utf8').trim();
  const password = fs.readFileSync('.cloudflared/cloud-drive-password.txt', 'utf8').trim();

  function getToken(userId, username, role) {
    const payload = JSON.stringify({
      userId,
      user: username,
      exp: Date.now() + 86400000,
      nonce: 'nonce_' + Date.now(),
    });
    const body = Buffer.from(payload).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    return body + '.' + sig;
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Screenshot 01: Login view
  console.log('1. Capturing 01_login_view.png...');
  await page.goto('http://127.0.0.1:8081');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/screenshots/01_login_view.png' });

  // 2. Screenshot 02: Admin Main view with new Logo
  console.log('2. Capturing 02_desktop_client_main.png...');
  await page.fill('#username', 'admin');
  await page.fill('#password', password);
  await page.click('#loginSubmitBtn');
  await page.waitForSelector('#driveView:not(.hidden)', { timeout: 10000 });
  await page.waitForSelector('#fileRows tr', { timeout: 8000 });
  await page.waitForSelector('.storage-dash-logo', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/screenshots/02_desktop_client_main.png' });

  // 3. Screenshot 03: AI Drawer Chat with new Logo in sidebar
  console.log('3. Capturing 03_ai_drawer_chat.png...');
  const isAiOn = await page.evaluate(() => window.state?.aiModeEnabled);
  if (!isAiOn) {
    const toggle = page.locator('#aiModeToggleBtn');
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(400);
    }
  }
  const aiSearchBtn = page.locator('#aiGlobalSearchBtn');
  if (await aiSearchBtn.isVisible()) {
    await aiSearchBtn.click();
    await page.waitForSelector('#aiDrawer:not(.hidden)', { timeout: 5000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'docs/screenshots/03_ai_drawer_chat.png' });
    const closeBtn = page.locator('#aiDrawerCloseBtn');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 4. Screenshot 04: User Quota Management Modal
  console.log('4. Capturing 04_user_quota_management.png...');
  const userQuotasBtn = page.locator('#userQuotasBtn');
  if (await userQuotasBtn.isVisible()) {
    await userQuotasBtn.click();
    await page.waitForSelector('#userQuotasModal:not(.hidden)', { timeout: 5000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'docs/screenshots/04_user_quota_management.png' });
    const closeQuotasBtn = page.locator('#closeUserQuotasModalBtn');
    if (await closeQuotasBtn.isVisible()) {
      await closeQuotasBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // 5. Screenshot 05: Normal User wdp with isolated quota AND new Logo
  console.log('5. Capturing 05_user_quota_isolated_view.png...');
  const wdpToken = getToken('wdp', 'WDP', 'user');
  await page.evaluate(async (token) => {
    window.setSessionToken(token);
    await window.enterDrive({ id: 'wdp', username: 'WDP', role: 'user' });
  }, wdpToken);
  await page.waitForSelector('.storage-dash-logo', { timeout: 5000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/screenshots/05_user_quota_isolated_view.png' });

  await browser.close();
  console.log('ALL SCREENSHOTS RECAPTURED SUCCESSFULLY!');
}

run().catch(console.error);
