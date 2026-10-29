import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
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
});

const pages = [
  ['/guia/', 'Guía para adultos'],
  ['/privacidad/', 'Privacidad'],
  ['/creditos/', 'Créditos'],
  ['/cookies/', 'Cookies y analítica'],
] as const;

for (const [path, heading] of pages) {
  test(`${path} carga con su contenido`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible();
  });
}

test('la guía hidrata el probador de voz', async ({ page }) => {
  await page.goto('/guia/');
  await expect(page.locator('.voice-test')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Probar la voz' }).click();
  await expect(page.locator('.voice-test__status')).not.toHaveText('');
});

test('los enlaces del párrafo de terceros conservan los espacios', async ({ page }) => {
  await page.goto('/cookies/');
  const parrafo = page.locator('.prose p').filter({ hasText: 'Google Tag Manager' });
  await expect(parrafo).toContainText('consultar la política');
  await expect(parrafo).toContainText('Google y usar el');
});

test('el footer separa cruz y enlaces con espacios', async ({ page }) => {
  await page.goto('/cookies/');
  await expect(page.locator('.site-footer')).toContainText('Créditos · Cookies · Pyloncito · MIT');
});

test('cookies no genera scroll horizontal y la tabla queda legible', async ({ page }) => {
  await page.goto('/cookies/');
  await expect(page.getByRole('heading', { name: 'Qué guardamos', level: 2 })).toBeVisible();
  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
});

test('una ruta desconocida muestra la página 404', async ({ page }) => {
  await page.goto('/no-existe/');
  await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible();
});
