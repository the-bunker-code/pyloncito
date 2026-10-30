import {
  countAndWait,
  expect,
  look,
  openMiradas,
  runUntil,
  startSession,
  test,
} from './miradas.fixtures';

async function events(page: import('@playwright/test').Page): Promise<Record<string, unknown>[]> {
  return page.evaluate(() =>
    (window.dataLayer ?? []).filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === 'object' && entry !== null && !Array.isArray(entry) && 'event' in entry,
    ),
  );
}

test('los eventos de Miradas no llevan nombres ni datos personales', async ({ page }) => {
  await page.route('**/gtm.js**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.dataLayer = window.dataLayer || [];',
    }),
  );

  await openMiradas(
    page,
    { voice: false, adults: 2, names: ['Ana', 'Luis'] },
    { analytics: true, debug: true },
  );

  await page.locator('#miradas-screen-home .miradas-level').nth(1).click();
  await page.locator('#miradas-screen-home .miradas-gear').click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();

  await startSession(page);
  await countAndWait(page);
  await look(page, 1);
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await runUntil(page, (state) => state.round === 2);
  await page.getByRole('button', { name: 'Volver al inicio del juego' }).click();
  await expect(page.locator('#miradas-screen-home')).toBeVisible();

  const collected = await events(page);
  expect(collected).toContainEqual(
    expect.objectContaining({ event: 'game_start', game: 'miradas', level: 2 }),
  );
  expect(collected).toContainEqual(
    expect.objectContaining({ event: 'level_select', level: 2, previous_level: 1 }),
  );
  expect(collected).toContainEqual(
    expect.objectContaining({ event: 'settings_open', source: 'home' }),
  );
  expect(collected).toContainEqual(
    expect.objectContaining({ event: 'settings_cancel', reason: 'dismiss' }),
  );
  expect(collected).toContainEqual(expect.objectContaining({ event: 'round_complete', round: 1 }));
  expect(collected).toContainEqual(expect.objectContaining({ event: 'game_exit', reason: 'user' }));

  for (const event of collected) {
    for (const key of ['name', 'email', 'question', 'word', 'object', 'names']) {
      expect(event).not.toHaveProperty(key);
    }
  }
});

test('sin consentimiento no envía eventos de juego', async ({ page }) => {
  await page.route('**/gtm.js**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.dataLayer = window.dataLayer || [];',
    }),
  );

  await openMiradas(page, { voice: false }, { analytics: false, debug: true });
  await startSession(page);

  const names = (await events(page)).map((event) => event.event);
  expect(names).not.toContain('game_start');
});

test('la sesión completa emite su resumen agregado', async ({ page }) => {
  await page.route('**/gtm.js**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.dataLayer = window.dataLayer || [];',
    }),
  );

  await openMiradas(page, { voice: false }, { analytics: true, debug: true });
  await startSession(page);
  await countAndWait(page);
  await look(page);
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await runUntil(page, (state) => state.screen === 'end');

  expect(await events(page)).toContainEqual(
    expect.objectContaining({
      event: 'session_complete',
      game: 'miradas',
      level: 1,
      rounds: 1,
    }),
  );
});
