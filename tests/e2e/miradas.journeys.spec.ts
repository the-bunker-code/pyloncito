import {
  countAndWait,
  expect,
  look,
  openMiradas,
  runUntil,
  snapshot,
  spoken,
  startSession,
  test,
} from './miradas.fixtures';

const SETTINGS_KEY = 'juegos:miradas:settings:v1';
const SESSIONS_KEY = 'juegos:miradas:sessions:v1';

test('nivel 1: contar, mirar, premio y siguiente tarjeta', async ({ page }) => {
  await openMiradas(page, { voice: true });
  await startSession(page);
  await countAndWait(page);
  await page.clock.runFor(2500);
  await look(page);

  expect((await snapshot(page)).stars).toBe(1);
  await expect(page.getByRole('heading', { name: 'Papá' })).toBeVisible();
  await expect(page.getByText('Dale el premio', { exact: true })).toBeVisible();
  await expect(page.locator('#miradas-screen-round .closing-notice')).toHaveCount(0);
  expect(await spoken(page)).toEqual(['Tres…', 'dos…', 'uno…', '¡Papá!']);

  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await runUntil(page, (state) => state.phase === 'card' && state.round === 2);
  expect((await spoken(page)).at(-1)).toBe('¡Papá!');
});

test('la espera elegida detiene el aro y espera el toque', async ({ page }) => {
  await openMiradas(page, { voice: true, lookWindow: 3 });
  await startSession(page);
  await countAndWait(page);
  await page.clock.runFor(3200);
  expect(await snapshot(page)).toMatchObject({ phase: 'waiting', round: 1, stars: 0 });
  await look(page);
  expect((await snapshot(page)).stars).toBe(1);
});

test('el control de espera ajusta la ronda y se guarda', async ({ page }) => {
  await openMiradas(page);
  await startSession(page);
  await expect(page.locator('#miradas-screen-round .miradas-wait-control__value')).toHaveText(
    '10 s',
  );
  await page.getByRole('button', { name: 'Más espera' }).click();
  await expect(page.locator('#miradas-screen-round .miradas-wait-control__value')).toHaveText(
    '15 s',
  );
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SETTINGS_KEY,
  );
  expect(saved.lookWindow).toBe(15);
});

test('al terminar la espera se detiene y espera el toque sin fallo', async ({ page }) => {
  await openMiradas(page, { voice: true });
  await startSession(page);
  const first = (await snapshot(page)).cardTitle;
  await countAndWait(page);
  await page.clock.runFor(10_200);

  const stopped = await snapshot(page);
  expect(stopped).toMatchObject({ phase: 'waiting', round: 1, stars: 0 });
  expect(stopped.cardTitle).toBe(first);
  await expect(page.locator('#miradas-screen-round .sr-only[role="status"]')).toHaveText(
    'Tiempo cumplido. ¿Quién te miró?',
  );
  const phrases = await spoken(page);
  expect(phrases.at(-1)).toBe('uno…');
  expect(phrases.every((phrase) => !/error|inténtalo|mal/i.test(phrase))).toBe(true);

  await look(page);
  expect((await snapshot(page)).stars).toBe(1);
});

test('nivel 3: girar, elegir emoción y seguir', async ({ page }) => {
  await openMiradas(page, { level: 3 });
  await startSession(page);
  await countAndWait(page);
  await look(page);

  await expect(page.getByText('Gira la pantalla hacia ella', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await runUntil(page, (state) => state.phase === 'choose');
  expect((await snapshot(page)).options).toHaveLength(2);

  await page.locator('#miradas-screen-round .miradas-option').first().click();
  await runUntil(page, (state) => state.phase === 'modeled');
  expect((await snapshot(page)).stars).toBe(1);
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await runUntil(page, (state) => state.round === 2);
});

test('tres adultos: cada botón suma a su casilla y el final muestra el equipo', async ({
  page,
}) => {
  await openMiradas(page, { adults: 3, names: ['Ana', 'Luis', 'Marta'] });
  await startSession(page);
  await countAndWait(page);
  await expect(page.locator('#miradas-screen-round .miradas-adult-card')).toHaveCount(3);

  await look(page, 1);
  expect((await snapshot(page)).stars).toBe(1);
  await expect(page.getByRole('heading', { name: 'Luis' })).toBeVisible();
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await runUntil(page, (state) => state.screen === 'end');
  await expect(page.locator('#miradas-screen-end .miradas-end__total')).toHaveText('1');
  await expect(page.locator('#miradas-screen-end .miradas-end__adults li')).toHaveCount(3);
  await expect(page.locator('#miradas-screen-end .miradas-end__adults li').nth(1)).toContainText(
    'Luis',
  );
});

test('el aviso de las 4:30 aparece una vez y la sesión termina a los 5:00', async ({ page }) => {
  await openMiradas(page, { voice: true });
  await startSession(page);

  await page.clock.runFor(271_000);
  await expect(page.locator('#miradas-screen-round .closing-notice')).toHaveText(
    'Una más y terminamos',
  );
  const phrases = await spoken(page);
  expect(phrases.filter((phrase) => phrase === 'Una más y terminamos')).toHaveLength(1);

  await page.clock.runFor(30_000);
  await runUntil(page, (state) => state.screen === 'end');
  expect((await snapshot(page)).endTotal).toBe(0);
  await expect(page.getByRole('heading', { name: '¡Terminamos!' })).toBeVisible();
});

test('una mirada se guarda en el progreso y se puede borrar', async ({ page }) => {
  await openMiradas(page);
  await startSession(page);
  await countAndWait(page);
  await page.clock.runFor(1500);
  await look(page);
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await runUntil(page, (state) => state.screen === 'end');

  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '[]'),
    SESSIONS_KEY,
  );
  expect(saved).toHaveLength(1);
  expect(saved[0].stars).toBe(1);
  expect(saved[0].avgLook).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await page.getByRole('button', { name: 'Ver progreso', exact: true }).click();
  await expect(page.locator('#miradas-screen-progress')).toBeVisible();
  await expect(page.locator('#miradas-screen-progress .miradas-sessions li')).toHaveCount(1);
  await expect(page.locator('#miradas-screen-progress .miradas-chart')).toBeVisible();

  await page.getByRole('button', { name: 'Borrar datos', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '¿Borrar todo el progreso?' })).toBeVisible();
  await page.getByRole('button', { name: 'Borrar', exact: true }).click();
  await expect(page.locator('#miradas-screen-progress .miradas-empty')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSIONS_KEY)).toBeNull();
});

test('el progreso guardado se lee con fechas y promedios válidos', async ({ page }) => {
  await openMiradas(
    page,
    {},
    {
      sessions: [
        { date: '2026-10-24T10:00:00.000Z', level: 1, stars: 2, avgLook: 1.5 },
        { date: '2026-10-25T10:00:00.000Z', level: 2, stars: 4, avgLook: null },
      ],
    },
  );
  await page.getByRole('button', { name: 'Ver progreso', exact: true }).click();
  await expect(page.locator('#miradas-screen-progress .miradas-sessions li')).toHaveCount(2);
  await expect(page.locator('#miradas-screen-progress .miradas-sessions')).toContainText(
    'sin miradas',
  );
  await expect(page.getByRole('button', { name: 'Volver al inicio del juego' })).toBeVisible();

  const persisted = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    SETTINGS_KEY,
  );
  expect(persisted.level).toBe(1);
});
