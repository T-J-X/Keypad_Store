import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/configurator', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('a[href*="/configurator/"]', { timeout: 30000 });

  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/configurator/"]'));
    return anchors.map((anchor) => ({
      text: (anchor.textContent || '').trim(),
      href: anchor.getAttribute('href') || '',
    }));
  });

  const unique = Array.from(new Map(links.map((entry) => [entry.href, entry])).values());
  console.log(JSON.stringify(unique, null, 2));
} finally {
  await browser.close();
}
