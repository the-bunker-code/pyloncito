import { expect, openMira, playRound, snapshot, startMode, test } from './mira-y-dime.fixtures';

test('el inicio carga con 4 modos y 3 niveles, sin terceros', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:') && !request.url().startsWith('data:')) {
      external.push(request.url());
    }
  });

  await openMira(page);
  await expect(page.locator('#mira-screen-home .mode-card')).toHaveCount(4);
  await expect(page.locator('#mira-screen-home .level')).toHaveCount(3);
  await expect(page.locator('[data-action="open-objects"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Mira y Dime' })).toBeVisible();

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
  expect(external).toEqual([]);
});

test('precarga el dibujo de la ronda siguiente', async ({ page }) => {
  const drawings: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/objects/')) drawings.push(url.pathname);
  });

  await openMira(page);
  await startMode(page, 'syllables');
  await expect.poll(() => drawings.length).toBeGreaterThanOrEqual(2);
});

test('el primer modo dibuja casillas, guía y banco', async ({ page }) => {
  await openMira(page);
  await expect(page.locator('#mira-screen-home .mode-card').first()).toHaveAttribute(
    'data-mode',
    'letters',
  );
  await startMode(page, 'letters');
  const state = await snapshot(page);
  expect(state.pieces.length).toBeGreaterThanOrEqual(2);
  expect(state.pieces.length).toBeLessThanOrEqual(4);
  const slots = await page.locator('#mira-screen-game .slot').count();
  expect(slots).toBeGreaterThanOrEqual(3);
  expect(slots).toBeLessThanOrEqual(4);
  await expect(page.locator('#mira-screen-game .slot__guide')).toHaveCount(slots);
  await expect(page.locator('#mira-screen-game .piece').first()).toHaveAttribute(
    'aria-disabled',
    'false',
  );
});

test('el contador de rondas muestra la ronda actual y avanza', async ({ page }) => {
  await openMira(page, { rounds: 3, voice: false, sound: false });
  await startMode(page, 'syllables');

  const progress = page.getByRole('progressbar', { name: 'Rondas' });
  const counter = page.locator('#mira-screen-game .progress-bar__value');
  const fill = page.locator('#mira-screen-game .progress-bar__fill');
  const track = page.locator('#mira-screen-game .progress-bar__track');

  async function fillRatio(): Promise<number> {
    const [fillBox, trackBox] = await Promise.all([fill.boundingBox(), track.boundingBox()]);
    if (!fillBox || !trackBox || trackBox.width === 0) throw new Error('Barra no visible');
    return fillBox.width / trackBox.width;
  }

  await page.clock.runFor(300);
  await expect(counter).toHaveText('Ronda 1 de 3');
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
  await expect.poll(fillRatio, { timeout: 2000 }).toBeGreaterThan(0.3);
  const first = await fillRatio();
  expect(first).toBeLessThan(0.37);

  await playRound(page);
  await page.clock.runFor(300);
  await expect(counter).toHaveText('Ronda 2 de 3');
  await expect(progress).toHaveAttribute('aria-valuenow', '2');
  await expect.poll(fillRatio, { timeout: 2000 }).toBeGreaterThan(0.63);
  const second = await fillRatio();
  expect(second).toBeGreaterThan(first);
  expect(second).toBeLessThan(0.7);

  await playRound(page);
  await page.clock.runFor(300);
  await expect(counter).toHaveText('Ronda 3 de 3');
  await expect(progress).toHaveAttribute('aria-valuenow', '3');
  await expect.poll(fillRatio, { timeout: 2000 }).toBeGreaterThan(0.99);
});

test('la página no genera scroll horizontal en 390 px', async ({ page }) => {
  await openMira(page);
  await startMode(page, 'longPhrase');
  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
});
