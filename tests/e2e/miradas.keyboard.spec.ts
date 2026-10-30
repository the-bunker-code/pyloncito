import {
  countAndWait,
  expect,
  openMiradas,
  runUntil,
  startSession,
  test,
} from './miradas.fixtures';

test('empezar con teclado mueve el foco a la ronda', async ({ page }) => {
  await openMiradas(page);
  const start = page.getByRole('button', { name: 'Empezar', exact: true });
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#miradas-screen-round')).toBeFocused();
});

test('contar y mirar se puede hacer solo con teclado', async ({ page }) => {
  await openMiradas(page);
  await startSession(page);
  const count = page.getByRole('button', { name: 'Contar', exact: true });
  await count.focus();
  await page.keyboard.press('Enter');
  await runUntil(page, (state) => state.phase === 'waiting');
  await expect(page.locator('#miradas-screen-round .miradas-adult-card:focus')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await runUntil(page, (state) => state.phase === 'looked');
  const next = page.getByRole('button', { name: 'Siguiente', exact: true });
  await next.focus();
  await page.keyboard.press('Enter');
  await runUntil(page, (state) => state.round === 2);
});

test('nivel 3 se elige con teclado', async ({ page }) => {
  await openMiradas(page, { level: 3 });
  await startSession(page);
  await countAndWait(page);
  await page.locator('#miradas-screen-round .miradas-adult-card').first().focus();
  await page.keyboard.press('Enter');
  const ready = page.getByRole('button', { name: 'Listo', exact: true });
  await ready.focus();
  await page.keyboard.press('Enter');
  await runUntil(page, (state) => state.phase === 'choose');
  const option = page.locator('#miradas-screen-round .miradas-option').first();
  await option.focus();
  await page.keyboard.press('Enter');
  await runUntil(page, (state) => state.phase === 'modeled');
});
