import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs/promises';

const BASE_URL = 'http://localhost:3001';
const OUTPUT_DIR = '/Users/terry/keypad-store/apps/storefront/.tmp/visual-pass';
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
    const closeButton = document.querySelector('[aria-label="Close icon selector"]');
    if (!closeButton) return false;

    const popupRoot = closeButton.closest('div.flex')?.parentElement || document;
    const candidates = Array.from(popupRoot.querySelectorAll('button')).filter((button) => {
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
  await wait(350);
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

  if (slotCount === 0) return false;

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

  await wait(450);
  return true;
}

async function captureVariant(page, routeSlug, viewport, suffix) {
  await page.setViewport(viewport);
  const url = `${BASE_URL}/configurator/${routeSlug}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  await page.waitForSelector('h1', { timeout: 30000 });

  const hasConfigurator = await page.evaluate(() => {
    const text = document.body?.innerText || '';
    return /slot configuration/i.test(text) && /preview/i.test(text);
  });

  if (!hasConfigurator) {
    const failedPath = path.join(OUTPUT_DIR, `${routeSlug}-${suffix}-not-configurator.png`);
    await page.screenshot({ path: failedPath, fullPage: true });
    return { ok: false, reason: 'not-configurator' };
  }

  await page.waitForFunction(() => {
    const bodyText = document.body?.innerText || '';
    return !/loading icon catalog/i.test(bodyText);
  }, { timeout: 30000 });

  await setTwoSampleIcons(page);

  const pagePath = path.join(OUTPUT_DIR, `${routeSlug}-${suffix}-full.png`);
  await page.screenshot({ path: pagePath, fullPage: true });

  const previewCard = await page.$('div.card.glow-isolate');
  if (previewCard) {
    const previewPath = path.join(OUTPUT_DIR, `${routeSlug}-${suffix}-preview.png`);
    await previewCard.screenshot({ path: previewPath });
  }

  return { ok: true };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const page = await browser.newPage();

    for (const routeSlug of MODEL_ROUTES) {
      const desktop = await captureVariant(page, routeSlug, { width: 1512, height: 1000, deviceScaleFactor: 1 }, 'desktop');
      const mobile = await captureVariant(page, routeSlug, { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'mobile');
      console.log(`${routeSlug}: desktop=${desktop.ok ? 'ok' : desktop.reason} mobile=${mobile.ok ? 'ok' : mobile.reason}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
