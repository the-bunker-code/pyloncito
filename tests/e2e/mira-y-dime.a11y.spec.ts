import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import {
  expect,
  openMira,
  playRound,
  runUntil,
  startMode,
  test,
  unitsOfCurrentRound,
} from './mira-y-dime.fixtures';
import { TIMING } from '../../src/games/mira-y-dime/config';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  );
}

test('el documento declara idioma y tiene un solo h1', async ({ page }) => {
  await openMira(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('h1')).toHaveCount(1);
});

test('axe: inicio sin violaciones', async ({ page }) => {
  await openMira(page);
  expect(await violations(page)).toEqual([]);
});

for (const mode of ['syllables', 'letters', 'shortPhrase', 'longPhrase'] as const) {
  test(`axe: juego (${mode}) sin violaciones`, async ({ page }) => {
    await openMira(page, { level: 'hard' });
    await startMode(page, mode);
    expect(await violations(page)).toEqual([]);
  });
}

test('axe: momento “Ahora dilo tú” sin violaciones', async ({ page }) => {
  await openMira(page);
  await startMode(page, 'syllables');
  const units = await unitsOfCurrentRound(page);
  for (const unit of units) {
    await page.getByRole('button', { name: unit, exact: true }).click();
    await page.clock.runFor(TIMING.tapLock + 10);
  }
  await runUntil(page, (state) => state.phase === 'saying');
  await expect(page.locator('#mira-screen-game .tray')).toHaveCSS('opacity', '1');
  expect(await violations(page)).toEqual([]);
});

test('axe: final y ajustes sin violaciones', async ({ page }) => {
  await openMira(page, { rounds: 3 });
  await startMode(page, 'syllables');
  for (let round = 1; round <= 3; round++) await playRound(page);
  await runUntil(page, (state) => state.endButtonsVisible);
  await page.clock.runFor(700);
  await expect(page.locator('#mira-screen-end .end__buttons')).toHaveCSS('opacity', '1');
  expect(await violations(page)).toEqual([]);

  await page.getByRole('button', { name: 'Inicio', exact: true }).click();
  await page.locator('#mira-screen-home .mira-gear').click();
  expect(await violations(page)).toEqual([]);
});

test('el lector recibe una frase corta por fase', async ({ page }) => {
  await openMira(page);
  await startMode(page, 'syllables');
  const status = page.locator('#mira-screen-game .sr-only[role="status"]');
  await expect(status).toHaveText(/^Armemos .+\. Van 0 de \d\.$/);
  await expect(page.locator('#mira-screen-game .table')).not.toHaveAttribute('aria-live', /.+/);
});

test('lo que se toca mide 44 px o más; las piezas 52 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openMira(page, { level: 'hard' });
  const small: string[] = [];

  async function measure(selector: string, min: number): Promise<void> {
    const boxes = await page.locator(selector).evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label:
            element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 20) ?? '',
          width: rect.width,
          height: rect.height,
        };
      }),
    );
    for (const box of boxes) {
      if (box.width < min || box.height < min) {
        small.push(`${selector} "${box.label}" ${box.width}×${box.height}`);
      }
    }
  }

  await measure('#mira-screen-home button:visible', 44);
  for (const mode of ['letters', 'longPhrase'] as const) {
    await page.goto('/juegos/mira-y-dime/');
    await startMode(page, mode);
    await measure('#mira-screen-game button:visible', 44);
    await measure('#mira-screen-game .piece', 52);
  }
  expect(small).toEqual([]);
});

test('con movimiento reducido no queda ninguna animación en bucle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openMira(page);
  const animated = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === 'running' && animation.effect?.getTiming().iterations !== 1,
        ).length,
  );
  expect(animated).toBe(0);
});
