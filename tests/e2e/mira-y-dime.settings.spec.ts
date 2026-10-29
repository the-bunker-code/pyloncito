import { expect, openMira, runUntil, test } from './mira-y-dime.fixtures';

const SETTINGS_KEY = 'juegos:mira-y-dime:settings:v1';

test('guardar cambia las rondas, persiste y empieza la sesión', async ({ page }) => {
  await openMira(page, { rounds: 3, voice: false, sound: false });
  await page.locator('#mira-screen-home .mira-gear').click();
  await expect(page.getByRole('dialog', { name: 'Ajustes para adultos' })).toBeVisible();

  await page.locator('label[for="mira-setting-rounds-8"]').click();
  await page.getByRole('button', { name: 'Guardar y empezar' }).click();
  await runUntil(page, (state) => state.screen === 'game' && state.total === 8);

  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SETTINGS_KEY,
  );
  expect(saved).toMatchObject({ rounds: 8, voice: false, sound: false });
});

test('cancelar no guarda nada', async ({ page }) => {
  await openMira(page, { rounds: 3, voice: false, sound: false });
  await page.locator('#mira-screen-home .mira-gear').click();
  await page.locator('label[for="mira-setting-rounds-8"]').click();
  await page.getByRole('button', { name: 'Cancelar' }).click();

  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SETTINGS_KEY,
  );
  expect(saved.rounds).toBe(3);
  await expect(page.locator('#mira-screen-home')).toBeVisible();
});

test('Escape cierra el panel y devuelve el foco al engranaje', async ({ page }) => {
  await openMira(page);
  const gear = page.locator('#mira-screen-home .mira-gear');
  await gear.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Ajustes para adultos' })).toBeVisible();
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
    localStorage.setItem('juegos:mira-y-dime:settings:v1', '{"mode":"__proto__","rounds":"cien"');
  });
  await page.clock.install();
  await page.goto('/juegos/mira-y-dime/');
  await expect(page.locator('#mira-screen-home .mode-card')).toHaveCount(4);
  await expect(page.locator('#mira-screen-home .level.is-selected')).toHaveText(/Principiante/);
});
