const { test, expect } = require('@playwright/test');

async function resetApp(page) {
  await page.goto('/');
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    await new Promise(resolve => {
      const req = indexedDB.deleteDatabase('kucharzyna-db');
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  });
  await page.reload();
  await expect(page.locator('body')).toContainText('Kucharzyna');
}

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test('startup is clean and has no horizontal overflow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await expect(page.locator('#main')).toBeVisible();

  const metrics = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasViewportFit: document.querySelector('meta[name="viewport"]')?.content.includes('viewport-fit=cover') === true,
    hasAppleCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.content === 'yes'
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.width + 1);
  expect(metrics.hasViewportFit).toBeTruthy();
  expect(metrics.hasAppleCapable).toBeTruthy();
  expect(errors).toEqual([]);
});

test('main navigation works on iPhone-sized viewport', async ({ page }) => {
  for (const route of ['start', 'recipes', 'traditional', 'calculators', 'shopping', 'settings']) {
    await page.locator('[data-route="' + route + '"]').click();
    await expect(page.locator('[data-route="' + route + '"]')).toHaveClass(/active/);
    await expect(page.locator('#main')).toBeVisible();
  }
});

test('recipe creation workflow saves a local recipe', async ({ page }) => {
  await page.locator('[data-route="recipes"]').click();
  await page.locator('[data-action="new"]').click();

  await page.locator('#f-name').fill('E2E Kucharzyna');
  await page.locator('#f-cat').selectOption({ label: 'Inne' }).catch(() => {});
  await page.locator('#saveRecipe, #saveRecipe2').first().click();

  await expect(page.locator('#main')).toContainText('E2E Kucharzyna');
  const count = await page.evaluate(async () => (await getAll('recipes')).filter(r => r.name === 'E2E Kucharzyna').length);
  expect(count).toBe(1);
});

test('shopping list can add and complete an item', async ({ page }) => {
  await page.locator('[data-route="shopping"]').click();
  await page.locator('#add-shopping').click();

  await page.locator('#shop-name').fill('E2E Pomidor');
  await page.locator('#shop-qty').fill('3');
  await page.locator('#shop-unit').fill('szt.');
  await page.locator('#shop-ok').click();

  await expect(page.locator('#main')).toContainText('E2E Pomidor');
  const row = page.locator('.k33-shopping-row').filter({ hasText: 'E2E Pomidor' }).first();
  const toggle = row.locator('[data-shop-check]').first();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', /kupione/i);
});

test('online recipe browser stays inside Kucharzyna', async ({ page }) => {
  await page.locator('[data-route="start"]').click();
  const onlineEntry = page.locator('[data-route2="online"]').first();
  await expect(onlineEntry).toBeVisible();
  await onlineEntry.click();

  await expect(page.locator('#onlineRecipeSearch')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Szukaj w Google');
  expect(page.url()).not.toContain('google.com');
});

test('settings theme switch keeps the app shell intact', async ({ page }) => {
  await page.locator('[data-route="settings"]').click();
  const theme = page.locator('#theme');
  await expect(theme).toBeVisible();

  await theme.selectOption('dark');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('.bottom-nav')).toBeVisible();

  await theme.selectOption('light');
  await expect(page.locator('html')).toHaveClass(/light/);
});

test('PWA assets and safe-area CSS are present', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const css = await (await fetch('./styles.css')).text();
    const manifest = await (await fetch('./manifest.webmanifest')).json();
    const sw = await (await fetch('./service-worker.js')).text();
    return {
      safeTop: css.includes('env(safe-area-inset-top)'),
      safeBottom: css.includes('env(safe-area-inset-bottom)'),
      safeLeft: css.includes('env(safe-area-inset-left)'),
      safeRight: css.includes('env(safe-area-inset-right)'),
      standalone: manifest.display === 'standalone',
      hasIcons: Array.isArray(manifest.icons) && manifest.icons.length >= 3,
      swRegisters: sw.includes('self.addEventListener("fetch"')
    };
  });

  expect(result.safeTop).toBeTruthy();
  expect(result.safeBottom).toBeTruthy();
  expect(result.safeLeft).toBeTruthy();
  expect(result.safeRight).toBeTruthy();
  expect(result.standalone).toBeTruthy();
  expect(result.hasIcons).toBeTruthy();
  expect(result.swRegisters).toBeTruthy();
});
