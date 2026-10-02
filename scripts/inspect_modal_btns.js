const fs = require('fs');
const path = require('path');
const nodeModulesPath = 'C:\\Users\\17480\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules';
process.env.NODE_PATH = [nodeModulesPath, process.env.NODE_PATH || ''].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();
const { chromium } = require('playwright');

async function check() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8081');
  await page.waitForLoadState('networkidle');

  const u = await page.$('#username');
  if (u && await u.isVisible()) {
    await page.fill('#username', 'admin');
    await page.fill('#password', '20020406wdp..');
    await page.click('#loginSubmitBtn');
    await page.waitForSelector('#driveView:not(.hidden)', { timeout: 10000 });
  }

  await page.evaluate(() => {
    const aiBtn = document.getElementById('previewAiSummarizeBtn');
    if (aiBtn) aiBtn.classList.remove('hidden');
    const modal = document.getElementById('previewModal');
    if (modal) modal.classList.remove('hidden');
    const title = document.getElementById('previewTitle');
    if (title) title.textContent = 'PPP-AR代码.pdf';
  });
  await page.waitForTimeout(400);

  const workspaceDir = path.resolve(__dirname, '..');
  const artifactDir = 'C:\\Users\\17480\\.gemini\\antigravity\\brain\\d3dae5a0-eeb2-4246-87e1-31021a1a6029';

  // 1. Screenshot of the whole preview card header
  const header = await page.$('.preview-card .modal-header');
  if (header) {
    const buf = await header.screenshot();
    fs.writeFileSync(path.join(workspaceDir, 'preview_modal_header_unified.png'), buf);
    fs.writeFileSync(path.join(artifactDir, 'preview_modal_header_unified.png'), buf);
    console.log('Saved preview_modal_header_unified.png');
  }

  // 2. Screenshot of the 3 buttons closely
  const headerActions = await page.$('.preview-header-actions');
  if (headerActions) {
    const buf = await headerActions.screenshot();
    fs.writeFileSync(path.join(workspaceDir, 'preview_modal_actions_unified.png'), buf);
    fs.writeFileSync(path.join(artifactDir, 'preview_modal_actions_unified.png'), buf);
    console.log('Saved preview_modal_actions_unified.png');
  }

  await browser.close();
}
check().catch(console.error);
