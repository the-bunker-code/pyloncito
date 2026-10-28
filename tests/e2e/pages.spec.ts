import { expect, test } from '@playwright/test';

const pages = [
  ['/guia/', 'Guía para adultos'],
  ['/privacidad/', 'Privacidad'],
  ['/creditos/', 'Créditos'],
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
  await page.getByRole('button', { name: 'Probar la voz' }).click();
  await expect(page.locator('.voice-test__status')).not.toHaveText('');
});

test('una ruta desconocida muestra la página 404', async ({ page }) => {
  await page.goto('/no-existe/');
  await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible();
});
