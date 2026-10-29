import {
  expect,
  openAdultSettings,
  openMira,
  playRound,
  runUntil,
  snapshot,
  startMode,
  test,
  unitsOfCurrentRound,
} from './mira-y-dime.fixtures';
import { TIMING } from '../../src/games/mira-y-dime/config';

const MODES = ['letters', 'syllables', 'shortPhrase', 'longPhrase'] as const;
const LEVELS = ['easy', 'medium', 'hard'] as const;

for (const mode of MODES) {
  for (const level of LEVELS) {
    test(`${mode}/${level}: una sesión completa llega al final`, async ({ page }) => {
      await openMira(page, { level, rounds: 3, voice: false, sound: false });
      await startMode(page, mode);

      for (let round = 1; round <= 3; round++) {
        await runUntil(page, (state) => state.phase === 'answering' && state.round === round);
        const state = await snapshot(page);
        expect(state.pieces.length).toBeGreaterThanOrEqual(1);
        expect(state.pieces.length).toBeLessThanOrEqual(4);
        await playRound(page);
      }

      await runUntil(page, (state) => state.screen === 'end');
      await expect(page.getByRole('heading', { name: '¡Lo hicimos juntos!' })).toBeVisible();
      await expect(page.locator('#mira-screen-end .end__stars .icon')).toHaveCount(3);
      await expect(page.locator('#mira-screen-end .end__line')).toHaveText(
        'Lo dijo en 3 de 3 rondas.',
      );
      expect((await snapshot(page)).endButtonsVisible).toBe(false);
      await runUntil(page, (state) => state.endButtonsVisible);
      await expect(page.getByRole('button', { name: 'Otra vez' })).toBeVisible();
    });
  }
}

test('dos errores seguidos muestran la ayuda y la pieza que sigue', async ({ page }) => {
  await openMira(page, { level: 'medium', voice: true, sound: false });
  await startMode(page, 'syllables');

  const units = await unitsOfCurrentRound(page);
  const values = await page
    .locator('#mira-screen-game .piece')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-value') ?? ''));
  const wrong = values.find((value) => value !== units[0]);
  if (wrong === undefined) throw new Error('No hay pieza equivocada');

  await page.getByRole('button', { name: wrong, exact: true }).click();
  await page.clock.runFor(200);
  expect((await snapshot(page)).phase).toBe('answering');
  const afterFirst = await page.evaluate(
    () => (window as unknown as { __spoken: string[] }).__spoken,
  );
  expect(afterFirst).toContain('¡Casi! Otra vez.');

  await page.getByRole('button', { name: wrong, exact: true }).click();
  await runUntil(page, (state) => state.phase === 'helping');
  await expect(page.locator('#mira-screen-game .tray')).toHaveClass(/tray--waiting/);
  await runUntil(page, (state) => state.phase === 'answering');
  await expect(page.getByRole('button', { name: units[0], exact: true })).toHaveClass(/is-pulsing/);

  const spoken = await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
  expect(spoken.some((phrase) => /^no\b/i.test(phrase))).toBe(false);
  expect(spoken).toContain('Esta sigue.');

  await page.getByRole('button', { name: units[0], exact: true }).click();
  await expect(page.locator('#mira-screen-game .slot.is-filled')).toHaveCount(1);
});

test('una ráfaga sobre una pieza incorrecta no adelanta la ayuda', async ({ page }) => {
  await openMira(page, { level: 'medium', voice: false, sound: false });
  await startMode(page, 'syllables');

  const units = await unitsOfCurrentRound(page);
  const values = await page
    .locator('#mira-screen-game .piece')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-value') ?? ''));
  const wrong = values.find((value) => value !== units[0]);
  if (wrong === undefined) throw new Error('No hay pieza equivocada');

  await page.getByRole('button', { name: wrong, exact: true }).evaluate((button) => {
    for (let i = 0; i < 4; i++) button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.clock.runFor(50);
  expect((await snapshot(page)).phase).toBe('answering');

  await page.clock.runFor(200);
  await page.getByRole('button', { name: wrong, exact: true }).click();
  await runUntil(page, (state) => state.phase === 'helping');
});

test('toques en ráfaga sobre la última pieza avanzan una sola ronda', async ({ page }) => {
  await openMira(page, { voice: false, sound: false });
  await startMode(page, 'shortPhrase');
  const units = await unitsOfCurrentRound(page);
  await page.getByRole('button', { name: units[0], exact: true }).click();
  await page.clock.runFor(TIMING.tapLock + 10);

  await page.getByRole('button', { name: units[1], exact: true }).evaluate((button) => {
    for (let i = 0; i < 6; i++) button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await runUntil(page, (state) => state.phase === 'saying');
  await page.getByRole('button', { name: 'Lo dijo', exact: true }).evaluate((button) => {
    for (let i = 0; i < 4; i++) button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  await runUntil(page, (state) => state.round === 2);
  await page.clock.runFor(500);
  const state = await snapshot(page);
  expect(state.round).toBe(2);
  expect(state.said).toBe(1);
});

test('“Seguir” avanza sin contar “Lo dijo”', async ({ page }) => {
  await openMira(page, { voice: false, sound: false });
  await startMode(page, 'syllables');
  const units = await unitsOfCurrentRound(page);
  for (const unit of units) {
    await page.getByRole('button', { name: unit, exact: true }).click();
    await page.clock.runFor(TIMING.tapLock + 10);
  }
  await runUntil(page, (state) => state.phase === 'saying');
  await page.getByRole('button', { name: 'Seguir', exact: true }).click();
  await runUntil(page, (state) => state.round === 2);
  expect((await snapshot(page)).said).toBe(0);
});

test('volver al inicio a mitad de ronda no deja nada colgado', async ({ page }) => {
  await openMira(page, { voice: false, sound: false });
  await startMode(page, 'letters');
  await openAdultSettings(page, '#mira-screen-game');
  await expect(page.getByRole('dialog', { name: 'Ajustes para adultos' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.locator('#mira-screen-home')).toBeVisible();
  await page.clock.runFor(30_000);
  await expect(page.locator('#mira-screen-home')).toBeVisible();
  expect((await snapshot(page)).screen).toBe('home');
});
