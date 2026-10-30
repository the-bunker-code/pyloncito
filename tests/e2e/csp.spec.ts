import { expect, test, type Page } from '@playwright/test';

interface CspWindow extends Window {
  __cspViolations?: Array<{ directive: string; blocked: string }>;
}

async function trackViolations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as CspWindow;
    target.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      target.__cspViolations?.push({
        directive: event.violatedDirective,
        blocked: event.blockedURI,
      });
    });
  });
}

async function violations(page: Page): Promise<unknown[]> {
  return page.evaluate(() => (window as CspWindow).__cspViolations ?? []);
}

test('el hub y el juego cargan sin violaciones de CSP', async ({ page }) => {
  await trackViolations(page);
  await page.addInitScript(() => {
    localStorage.setItem(
      'pyloncito:consent:v1',
      JSON.stringify({
        version: 1,
        analytics: false,
        improvement: false,
        marketing: false,
        updatedAt: new Date().toISOString(),
      }),
    );
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pyloncito' })).toBeVisible();

  await page.goto('/juegos/mira-y-dime/');
  await page.locator('#mira-screen-home [data-mode="syllables"]').click();
  await expect(page.locator('#mira-screen-game')).toBeVisible();

  await page.goto('/juegos/miradas/');
  await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  await expect(page.locator('#miradas-screen-round')).toBeVisible();

  expect(await violations(page)).toEqual([]);
});

test('aceptar analítica carga GTM sin violaciones de CSP', async ({ page }) => {
  await trackViolations(page);
  await page.route('**/gtm.js**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: "gtm_loaded" });',
    }),
  );

  await page.goto('/?gtm_debug=1');
  await page.getByRole('button', { name: 'Aceptar todo' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as { dataLayer?: unknown[] }).dataLayer?.length ?? 0))
    .toBeGreaterThan(0);

  expect(await violations(page)).toEqual([]);
});
