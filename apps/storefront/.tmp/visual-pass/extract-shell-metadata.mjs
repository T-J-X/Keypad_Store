import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3001';
const ROUTES = [
  'pkp-2200-si-pkp-2200-si',
  'pkp-2300-si-pkp-2300-si',
  'pkp-2400-si-pkp-2400-si',
  'pkp-2500-si-pkp-2500-si',
  'pkp-2600-si-pkp-2600-si',
  'pkp-3500-si-pkp-3500-si',
];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const page = await browser.newPage();

  for (const slug of ROUTES) {
    await page.goto(`${BASE_URL}/configurator/${slug}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('svg[aria-label$="shell preview"]', { timeout: 30000 });

    const data = await page.evaluate(() => {
      const previewSvg = document.querySelector('svg[aria-label$="shell preview"]');
      const shellImage = previewSvg?.querySelector('image');
      if (!previewSvg || !shellImage) return null;

      const viewBox = previewSvg.getAttribute('viewBox') || '';
      const h1 = document.querySelector('h1')?.textContent?.trim() || '';
      const shellHref = shellImage.getAttribute('href') || '';
      return { viewBox, h1, shellHref };
    });

    console.log(JSON.stringify({ slug, ...data }, null, 2));
  }
} finally {
  await browser.close();
}
