import { expect, test } from '@playwright/test';

const GTM_URL = 'https://www.googletagmanager.com/gtm.js?id=GTM-5947XBGG';

test.beforeEach(async ({ page }) => {
  await page.route('**/gtm.js**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: "gtm_loaded" });',
    }),
  );
});

test('no carga GTM hasta aceptar y lo carga al aceptar', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('googletagmanager.com/gtm.js')) requests.push(request.url());
  });

  await page.goto('/?gtm_debug=1');
  await expect(page.locator('[data-consent-banner]')).toBeVisible();
  expect(requests).toHaveLength(0);

  await page.getByRole('button', { name: 'Aceptar todo' }).click();

  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toBe(GTM_URL);
  await expect(page.locator('[data-consent-banner]')).toBeHidden();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('pyloncito:consent:v1') ?? 'null'),
  );
  expect(stored).toMatchObject({ analytics: true, improvement: true, marketing: false });
});

test('rechazar no genera requests ni cookies de analítica', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('googletagmanager.com/gtm.js')) requests.push(request.url());
  });

  await page.goto('/?gtm_debug=1');
  await page.getByRole('button', { name: 'Rechazar' }).click();
  await page.waitForTimeout(300);

  expect(requests).toHaveLength(0);
  await expect(page.locator('[data-consent-banner]')).toBeHidden();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('pyloncito:consent:v1') ?? 'null'),
  );
  expect(stored).toMatchObject({ analytics: false, improvement: false, marketing: false });
  const cookies = await page.evaluate(() => document.cookie);
  expect(cookies).not.toMatch(/(^|;\s*)_ga/);
});

test('preferencias permite aceptar solo Mejora', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('googletagmanager.com/gtm.js')) requests.push(request.url());
  });

  await page.goto('/?gtm_debug=1');
  await page.getByRole('button', { name: 'Preferencias' }).click();
  await expect(page.getByRole('dialog', { name: 'Preferencias de cookies' })).toBeVisible();

  await page.locator('[data-consent-category="improvement"]').check();
  await page.getByRole('button', { name: 'Guardar preferencias' }).click();

  await expect.poll(() => requests.length).toBe(1);
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('pyloncito:consent:v1') ?? 'null'),
  );
  expect(stored).toMatchObject({ analytics: false, improvement: true, marketing: false });
});

test('sin gtm_debug no carga GTM en localhost', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('googletagmanager.com/gtm.js')) requests.push(request.url());
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Aceptar todo' }).click();
  await page.waitForTimeout(300);

  expect(requests).toHaveLength(0);
});
