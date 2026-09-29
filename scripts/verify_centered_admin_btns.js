const fs = require('fs');
const path = require('path');

const nodeModulesPath = 'C:\\Users\\17480\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules';
process.env.NODE_PATH = [nodeModulesPath, process.env.NODE_PATH || ''].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();
const { chromium } = require('playwright');

async function run() {
  const password = fs.readFileSync('.cloudflared/cloud-drive-password.txt', 'utf8').trim();

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:8081');
  await page.waitForLoadState('networkidle');
  await page.fill('#username', 'admin');
  await page.fill('#password', password);
  await page.click('#loginSubmitBtn');
  await page.waitForSelector('#driveView:not(.hidden)', { timeout: 10000 });
  await page.waitForSelector('#userQuotasBtn:not(.hidden)', { timeout: 10000 });
  await page.waitForTimeout(800);

  // Capture sidebar card
  const adminCard = page.locator('#adminPanelCard');
  await adminCard.screenshot({ path: 'live_centered_admin_card.png' });

  // Capture whole sidebar
  const sidebar = page.locator('.sidebar');
  await sidebar.screenshot({ path: 'live_centered_sidebar.png' });

  // Capture full page
  await page.screenshot({ path: 'docs/screenshots/02_desktop_client_main.png' });

  await browser.close();
  console.log('CAPTURED_CENTERED_BUTTONS_SUCCESSFULLY');
}

run().catch(console.error);
