import {
  expect,
  openMira,
  runUntil,
  startMode,
  test,
  unitsOfCurrentRound,
} from './mira-y-dime.fixtures';

test('al empezar, el foco pasa a la pantalla del juego', async ({ page }) => {
  await openMira(page);
  const mode = page.locator('#mira-screen-home [data-mode="letters"]');
  await mode.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mira-screen-game')).toBeFocused();
});

test('el foco no se pierde al tocar una pieza con el teclado', async ({ page }) => {
  await openMira(page);
  await startMode(page, 'letters');
  const first = page.locator('#mira-screen-game .piece').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mira-screen-game .piece:focus')).toHaveCount(1);
});

test('una ronda completa solo con teclado, hasta “Lo dijo”', async ({ page }) => {
  await openMira(page);
  await startMode(page, 'syllables');
  const units = await unitsOfCurrentRound(page);
  for (const unit of units) {
    await page.getByRole('button', { name: unit, exact: true }).focus();
    await page.keyboard.press('Enter');
  }
  await runUntil(page, (state) => state.phase === 'saying');
  await page.getByRole('button', { name: 'Lo dijo', exact: true }).focus();
  await page.keyboard.press('Enter');
  await runUntil(page, (state) => state.round === 2);
});
