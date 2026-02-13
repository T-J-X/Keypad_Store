import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs/promises';

const BASE_URL = 'http://localhost:3001';
const OUTPUT_DIR = '/Users/terry/keypad-store/.tmp/visual-pass';
const MODELS = [
  'pkp-2200-si',
  'pkp-2300-si',
  'pkp-2400-si',
  'pkp-2500-si',
  'pkp-2600-si',
  'pkp-3500-si',
];

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openPopupForSlot(page, index = 0) {
  const clicked = await page.evaluate((slotIndex) => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const slotButtons = allButtons.filter((button) => /choose insert|edit insert/i.test(button.textContent || ''));
    const target = slotButtons[slotIndex] || slotButtons[0] || null;
    if (!target) return false;
    target.click();
    return true;
  }, index);

  if (!clicked) return false;
  await page.waitForSelector('[aria-label="Close icon selector"]', { timeout: 15000 });
  return true;
}

async function pickFirstIconInPopup(page) {
  const selected = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const candidates = allButtons.filter((button) => {
      const text = (button.textContent || '').trim();
      const hasImage = !!button.querySelector('img');
      if (!hasImage) return false;
      if (/close icon selector/i.test(text)) return false;
      if (/ring glow/i.test(text)) return false;
      return true;
    });

    const target = candidates[0] || null;
    if (!target) return false;
    target.click();
    return true;
  });

  if (!selected) return false;
  await wait(300);
  return true;
}

async function closePopup(page) {
  const closeButton = await page.$('[aria-label="Close icon selector"]');
  if (!closeButton) return;
  await closeButton.click();
  await page.waitForFunction(() => !document.querySelector('[aria-label="Close icon selector"]'), { timeout: 10000 });
}

async function setTwoSampleIcons(page) {
  const slotCount = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    return allButtons.filter((button) => /choose insert|edit insert/i.test(button.textContent || '')).length;
  });

  if (slotCount === 0) return;

  const firstOpened = await openPopupForSlot(page, 0);
  if (firstOpened) {
    await pickFirstIconInPopup(page);
    await closePopup(page);
  }

  if (slotCount > 1) {
    const lastOpened = await openPopupForSlot(page, slotCount - 1);
    if (lastOpened) {
      await pickFirstIconInPopup(page);
      await closePopup(page);
    }
  }

  await wait(400);
}

async function captureVariant(page, modelSlug, viewport, suffix) {
  await page.setViewport(viewport);
  const url = `${BASE_URL}/configurator/${modelSlug}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  await page.waitForSelector('h1', { timeout: 30000 });
  await page.waitForFunction(() => {
    const bodyText = document.body?.innerText || '';
    return !/loading icon catalog/i.test(bodyText);
  }, { timeout: 30000 });

  await setTwoSampleIcons(page);

  const pagePath = path.join(OUTPUT_DIR, `${modelSlug}-${suffix}-full.png`);
  await page.screenshot({ path: pagePath, fullPage: true });

  const previewSelector = 'div.card.glow-isolate';
  const previewCard = await page.$(previewSelector);
  if (previewCard) {
    const previewPath = path.join(OUTPUT_DIR, `${modelSlug}-${suffix}-preview.png`);
    await previewCard.screenshot({ path: previewPath });
  }
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const page = await browser.newPage();

    for (const model of MODELS) {
      await captureVariant(page, model, { width: 1512, height: 1000, deviceScaleFactor: 1 }, 'desktop');
      await captureVariant(page, model, { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'mobile');
      // eslint-disable-next-line no-console
      console.log(`Captured ${model}`);
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
