import { expect, openMira, playRound, startMode, test } from './mira-y-dime.fixtures';

test('los eventos de juego llegan sin datos personales', async ({ page }) => {
  await page.route('**/gtm.js**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.dataLayer = window.dataLayer || [];',
    }),
  );

  await openMira(page, { voice: false }, { analytics: true, debug: true });
  await startMode(page, 'syllables');

  const meta = await page.evaluate(() =>
    (window.dataLayer ?? []).find(
      (entry): entry is Record<string, unknown> =>
        typeof entry === 'object' &&
        entry !== null &&
        !Array.isArray(entry) &&
        'app_version' in entry,
    ),
  );
  expect(meta).toMatchObject({ app_version: '0.1.0', traffic_type: 'internal' });

  const events = await page.evaluate(() =>
    (window.dataLayer ?? []).filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === 'object' && entry !== null && !Array.isArray(entry) && 'event' in entry,
    ),
  );

  expect(events).toContainEqual(
    expect.objectContaining({
      event: 'game_start',
      game: 'mira-y-dime',
      mode: 'syllables',
      level: 'easy',
      rounds: 3,
    }),
  );

  await playRound(page);
  const afterRound = await page.evaluate(() =>
    (window.dataLayer ?? []).filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === 'object' && entry !== null && !Array.isArray(entry) && 'event' in entry,
    ),
  );

  expect(afterRound).toContainEqual(
    expect.objectContaining({
      event: 'round_complete',
      game: 'mira-y-dime',
      round: 1,
      total: 3,
    }),
  );
  expect(afterRound).toContainEqual(expect.objectContaining({ event: 'round_said', said: 'yes' }));
  expect(afterRound).toContainEqual(
    expect.objectContaining({ event: 'answer', result: 'correct', attempt: 1 }),
  );

  for (const event of afterRound) {
    for (const key of ['name', 'email', 'question', 'word', 'object']) {
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

  await openMira(page, { voice: false }, { analytics: false, debug: true });
  await startMode(page, 'syllables');

  const eventNames = await page.evaluate(() =>
    (window.dataLayer ?? [])
      .filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === 'object' && entry !== null && !Array.isArray(entry) && 'event' in entry,
      )
      .map((entry) => entry.event),
  );

  expect(eventNames).not.toContain('game_start');
});

test('nivel y ajustes emiten sus eventos y la salida de partida', async ({ page }) => {
  await page.route('**/gtm.js**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.dataLayer = window.dataLayer || [];',
    }),
  );

  await openMira(page, { voice: false }, { analytics: true, debug: true });
  await page.locator('#mira-screen-home .level').nth(1).click();
  await startMode(page, 'syllables');
  await page.locator('#mira-screen-game [aria-label="Ajustes para adultos"]').click();
  await expect(page.getByRole('dialog', { name: 'Ajustes para adultos' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();

  const events = await page.evaluate(() =>
    (window.dataLayer ?? []).filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === 'object' && entry !== null && !Array.isArray(entry) && 'event' in entry,
    ),
  );

  expect(events).toContainEqual(
    expect.objectContaining({
      event: 'level_select',
      game: 'mira-y-dime',
      level: 'medium',
      previous_level: 'easy',
    }),
  );
  expect(events).toContainEqual(
    expect.objectContaining({ event: 'settings_open', source: 'game' }),
  );
  expect(events).toContainEqual(
    expect.objectContaining({ event: 'settings_cancel', source: 'game', reason: 'dismiss' }),
  );
  expect(events).toContainEqual(
    expect.objectContaining({ event: 'game_exit', reason: 'settings_cancel' }),
  );
});
