import { expect, openMiradas, openSettings, test } from './miradas.fixtures';

const SETTINGS_KEY = 'juegos:miradas:settings:v1';

test('el engranaje abre los ajustes con un clic', async ({ page }) => {
  await openMiradas(page);
  await openSettings(page);
  await expect(page.getByRole('dialog', { name: 'Ajustes para adultos' })).toBeVisible();
  await expect(page.getByText('Voz', { exact: true })).toBeVisible();
  await expect(page.getByText('Sonidos', { exact: true })).toBeVisible();
});

test('guardar la voz, el sonido y la espera persiste en este dispositivo', async ({ page }) => {
  await openMiradas(page, { voice: false, sound: false, lookWindow: 10 });
  await openSettings(page);
  await page.locator('label[for="miradas-setting-voice-true"]').click();
  await page.locator('label[for="miradas-setting-sound-true"]').click();
  await page.locator('label[for="miradas-setting-wait-3"]').click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Ajustes para adultos' })).toBeHidden();

  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SETTINGS_KEY,
  );
  expect(saved).toMatchObject({ voice: true, sound: true, lookWindow: 3 });
});

test('cancelar no guarda cambios', async ({ page }) => {
  await openMiradas(page, { voice: false, sound: false });
  await openSettings(page);
  await page.locator('label[for="miradas-setting-voice-true"]').click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();

  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SETTINGS_KEY,
  );
  expect(saved.voice).toBe(false);
  await expect(page.locator('#miradas-screen-home')).toBeVisible();
});

test('Escape cierra los ajustes y devuelve el foco al engranaje', async ({ page }) => {
  await openMiradas(page);
  const gear = page.locator('#miradas-screen-home .miradas-gear');
  await openSettings(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Ajustes para adultos' })).toBeHidden();
  await expect(gear).toBeFocused();
});

test('los ajustes guardados corruptos no rompen el arranque', async ({ page }) => {
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
    localStorage.setItem('juegos:miradas:settings:v1', '{"level":"__proto__","names":"Ana"');
  });
  await page.clock.install();
  await page.goto('/juegos/miradas/');
  await expect(page.locator('#miradas-screen-home')).toBeVisible();
  await expect(page.locator('#miradas-screen-home .miradas-level.is-selected')).toHaveText(
    /Nivel 1/,
  );
  await expect(
    page.locator('#miradas-screen-home .miradas-choice[aria-pressed="true"]'),
  ).toHaveText('1');
});
