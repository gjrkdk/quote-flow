import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const SCREENSHOT_DIR = '.planning/app-store/screenshots';
const VIEWPORT = { width: 1600, height: 900 };
const BASE_URL = process.env.BASE_URL || 'http://localhost:9292';

async function generateScreenshots() {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  console.log('Starting screenshot capture...');
  console.log(`Viewport: ${VIEWPORT.width}x${VIEWPORT.height}px (Shopify App Store requirement)`);
  console.log('');

  // Screenshot 1: Dashboard overview
  console.log('Capturing Screenshot 1: Dashboard overview...');
  await page.goto(`${BASE_URL}/app`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/01-dashboard.png`,
    fullPage: false
  });
  console.log('  ✓ Saved: 01-dashboard.png');

  // Screenshot 2: Matrix editor with price grid
  console.log('Capturing Screenshot 2: Matrix editor with price grid...');
  await page.goto(`${BASE_URL}/app/matrices`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/02-matrices.png`,
    fullPage: false
  });
  console.log('  ✓ Saved: 02-matrices.png');

  // Screenshot 3: Option groups management
  console.log('Capturing Screenshot 3: Option groups management...');
  await page.goto(`${BASE_URL}/app/option-groups`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/03-option-groups.png`,
    fullPage: false
  });
  console.log('  ✓ Saved: 03-option-groups.png');

  await browser.close();

  console.log('');
  console.log(`All screenshots saved to ${SCREENSHOT_DIR}/`);
  console.log('Dimensions: 1600x900px (Shopify App Store requirement)');
  console.log('');
  console.log('Next steps:');
  console.log('1. Review screenshots for clarity and professional appearance');
  console.log('2. Ensure no sensitive data (API keys, store URLs) are visible');
  console.log('3. Upload to Shopify Partner Dashboard during submission');
}

generateScreenshots().catch((error) => {
  console.error('Error generating screenshots:', error);
  process.exit(1);
});
