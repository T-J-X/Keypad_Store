import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs/promises';

const BASE_URL = 'http://localhost:3001';
const OUTPUT_DIR = '/Users/terry/keypad-store/apps/storefront/.tmp/visual-pass/overlay-pass';
const MODEL_ROUTES = [
  'pkp-2200-si-pkp-2200-si',
  'pkp-2300-si-pkp-2300-si',
  'pkp-2400-si-pkp-2400-si',
  'pkp-2500-si-pkp-2500-si',
  'pkp-2600-si-pkp-2600-si',
  'pkp-3500-si-pkp-3500-si',
];

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1512, height: 1000, deviceScaleFactor: 1 });

    for (const slug of MODEL_ROUTES) {
      const url = `${BASE_URL}/configurator/${slug}?debugSlots=1`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForSelector('svg[aria-label$="shell preview"]', { timeout: 30000 });
      await wait(700);

      const previewCard = await page.$('div.card.glow-isolate');
      const outPath = path.join(OUTPUT_DIR, `${slug}-debug-preview.png`);
      if (previewCard) {
        await previewCard.screenshot({ path: outPath });
      }

      // eslint-disable-next-line no-console
      console.log(`Captured ${slug}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
