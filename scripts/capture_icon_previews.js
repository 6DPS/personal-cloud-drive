const fs = require('fs');
const path = require('path');

const nodeModulesPath = 'C:\\Users\\17480\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules';
process.env.NODE_PATH = [nodeModulesPath, process.env.NODE_PATH || ''].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1100, height: 1350 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Navigating to preview showcase...');
  await page.goto('http://127.0.0.1:8081/preview_options_showcase.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const workspaceDir = path.resolve(__dirname, '..');
  const artifactDir = 'C:\\Users\\17480\\.gemini\\antigravity\\brain\\d3dae5a0-eeb2-4246-87e1-31021a1a6029';

  // 1. Capture full container
  const container = await page.$('.container');
  if (container) {
    const fullImgBuffer = await container.screenshot();
    const wsFull = path.join(workspaceDir, 'preview_three_ai_icon_options.png');
    const artFull = path.join(artifactDir, 'preview_three_ai_icon_options.png');
    fs.writeFileSync(wsFull, fullImgBuffer);
    fs.writeFileSync(artFull, fullImgBuffer);
    console.log('Saved full comparison image:', wsFull);
  }

  // 2. Capture individual cards
  const cards = await page.$$('.option-card');
  if (cards[0]) {
    const bufA = await cards[0].screenshot();
    fs.writeFileSync(path.join(workspaceDir, 'preview_option_a_bubble.png'), bufA);
    fs.writeFileSync(path.join(artifactDir, 'preview_option_a_bubble.png'), bufA);
    console.log('Saved Option A card image');
  }
  if (cards[1]) {
    const bufB = await cards[1].screenshot();
    fs.writeFileSync(path.join(workspaceDir, 'preview_option_b_bubble_star.png'), bufB);
    fs.writeFileSync(path.join(artifactDir, 'preview_option_b_bubble_star.png'), bufB);
    console.log('Saved Option B card image');
  }
  if (cards[2]) {
    const bufC = await cards[2].screenshot();
    fs.writeFileSync(path.join(workspaceDir, 'preview_option_c_sparkle.png'), bufC);
    fs.writeFileSync(path.join(artifactDir, 'preview_option_c_sparkle.png'), bufC);
    console.log('Saved Option C card image');
  }

  await browser.close();
  console.log('All preview images successfully generated!');
}

main().catch(err => {
  console.error('Error generating previews:', err);
  process.exit(1);
});
