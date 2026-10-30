import { countAndWait, expect, openMiradas, startSession, test } from './miradas.fixtures';

test('el inicio carga con tres niveles y el registro del hub lo enlaza', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:') && !request.url().startsWith('data:')) {
      external.push(request.url());
    }
  });

  await openMiradas(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Miradas' })).toBeVisible();
  await expect(page.locator('#miradas-screen-home .miradas-level')).toHaveCount(3);
  await expect(page.locator('#miradas-screen-home .miradas-choice')).toHaveCount(3);
  await expect(page.locator('#miradas-screen-home .miradas-gear')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Empezar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver progreso', exact: true })).toBeVisible();

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
  expect(external).toEqual([]);

  await page.goto('/');
  const card = page.locator('.game-card--miradas');
  await expect(card).toHaveAttribute('href', '/juegos/miradas/');
  await expect(card).not.toContainText('Próximamente');
});

test('el inicio no genera scroll horizontal a 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openMiradas(page, { adults: 3, names: ['Papá', 'Mamá', 'Ana'] });
  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
});

test('la ronda muestra estrellas, reloj y la tarjeta del nivel', async ({ page }) => {
  await openMiradas(page);
  await startSession(page);

  await expect(page.locator('#miradas-screen-round .star-pill')).toHaveText('0');
  await expect(page.locator('#miradas-screen-round .session-clock')).toHaveText('5:00');
  await expect(page.locator('#miradas-screen-round .miradas-stage__title')).not.toHaveText('');
  await expect(page.locator('#miradas-screen-round .miradas-card-button')).toBeVisible();

  const image = page.locator('#miradas-screen-round .miradas-stage__image');
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('alt', '');
  await expect
    .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);

  const box = await page.locator('.miradas-card-button--count').boundingBox();
  if (!box) throw new Error('El botón Contar no tiene caja');
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Sin viewport');
  expect(box.width).toBeLessThan(viewport.width);
  expect(Math.abs(box.x - (viewport.width - box.x - box.width))).toBeLessThan(3);
});

test('el conteo 3-2-1 muestra el aro y las caras de los adultos', async ({ page }) => {
  await openMiradas(page, { adults: 3, names: ['Papá', 'Mamá', 'Ana'] });
  await startSession(page);
  await countAndWait(page);

  await expect(page.locator('#miradas-screen-round .miradas-ring')).toBeVisible();
  await expect(page.locator('#miradas-screen-round .miradas-adult-card')).toHaveCount(3);
  await expect(page.getByText('¿Quién me miró?', { exact: true })).toBeVisible();

  const faces = page.locator('#miradas-screen-round .miradas-adult-card__face');
  await expect(faces).toHaveCount(3);
  for (const face of await faces.all()) {
    await expect
      .poll(() => face.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
});
