import { expect, test, type Page } from '@playwright/test';

const ANALYTICS_URL_PATTERN = /_vercel|vercel-insights|speed-insights/i;

async function expectNoAnalyticsScripts(page: Page) {
  const hasAnalyticsScript = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[src]')).some((script) => {
      const src = script.getAttribute('src') || '';
      return /_vercel|vercel-insights|speed-insights/i.test(src);
    });
  });

  expect(hasAnalyticsScript).toBe(false);
}

test('desktop navbar shop menu opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about');

  const header = page.locator('header').first();
  const shopLink = header.getByRole('link', { name: /^Shop$/ }).first();
  const shopMenu = page.getByRole('menu', { name: 'Shop collections' });

  await expect(shopMenu).toHaveClass(/pointer-events-none/);
  await shopLink.hover();
  await expect(shopMenu).toHaveClass(/pointer-events-auto/);

  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  await expect(shopMenu).toHaveClass(/pointer-events-none/);
});

test('mobile navbar drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/about');

  await page.getByRole('button', { name: /open navigation menu/i }).click();

  const mobileMenuDialog = page.locator('[role="dialog"][aria-modal="true"]').first();
  await expect(mobileMenuDialog).toBeVisible();

  await mobileMenuDialog.getByRole('button', { name: /close menu/i }).nth(1).click();
  await expect(mobileMenuDialog).toBeHidden();
});

test('search modal opens and closes on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about');

  const header = page.locator('header').first();
  await header.getByRole('button', { name: /^Search$/ }).click();

  const searchDialog = page.locator('[role="dialog"][aria-modal="true"]').first();
  await expect(searchDialog).toBeVisible();
  await expect(searchDialog.getByPlaceholder('Search products, IDs, or categories...')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(searchDialog).toBeHidden();
});

test('mini-cart opens from desktop navbar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about');

  const header = page.locator('header').first();
  await header.getByRole('button', { name: /^View Cart$/ }).click();

  const emptyCartMessage = page.getByText('Your cart is empty.');
  await expect(emptyCartMessage).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(emptyCartMessage).toBeHidden();
});

test('cookie reject keeps analytics unloaded before and after consent decision', async ({ page }) => {
  const analyticsRequests: string[] = [];

  page.on('request', (request) => {
    const url = request.url();
    if (ANALYTICS_URL_PATTERN.test(url)) {
      analyticsRequests.push(url);
    }
  });

  await page.addInitScript(() => {
    window.localStorage.removeItem('cookie-consent');
  });

  await page.goto('/about');

  const bannerHeading = page.getByText('We value your privacy');
  await expect(bannerHeading).toBeVisible();

  await page.waitForTimeout(1000);
  await expectNoAnalyticsScripts(page);
  expect(analyticsRequests).toEqual([]);

  await page.getByRole('button', { name: /^Reject$/ }).click();
  await expect(bannerHeading).toBeHidden();

  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('cookie-consent')))
    .toBe('rejected');

  await page.waitForTimeout(1000);
  await expectNoAnalyticsScripts(page);
  expect(analyticsRequests).toEqual([]);
});
