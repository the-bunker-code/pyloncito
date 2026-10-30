import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import {
  countAndWait,
  expect,
  look,
  openMiradas,
  openSettings,
  runUntil,
  startSession,
  test,
} from './miradas.fixtures';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  );
}

test('el documento declara idioma y tiene un solo h1', async ({ page }) => {
  await openMiradas(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('h1')).toHaveCount(1);
});

test('axe: inicio sin violaciones', async ({ page }) => {
  await openMiradas(page, { adults: 3, names: ['Papá', 'Mamá', 'Ana'] });
  expect(await violations(page)).toEqual([]);
});

test('axe: ronda, espera, mirada y siguiente sin violaciones', async ({ page }) => {
  await openMiradas(page);
  await startSession(page);
  expect(await violations(page)).toEqual([]);

  await countAndWait(page);
  expect(await violations(page)).toEqual([]);

  await look(page);
  expect(await violations(page)).toEqual([]);

  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await runUntil(page, (state) => state.round === 2);
  expect(await violations(page)).toEqual([]);
});

test('axe: nivel 3, elección y modelo sin violaciones', async ({ page }) => {
  await openMiradas(page, { level: 3 });
  await startSession(page);
  await countAndWait(page);
  await look(page);
  expect(await violations(page)).toEqual([]);

  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await runUntil(page, (state) => state.phase === 'choose');
  expect(await violations(page)).toEqual([]);

  await page.locator('#miradas-screen-round .miradas-option').first().click();
  await runUntil(page, (state) => state.phase === 'modeled');
  expect(await violations(page)).toEqual([]);
});

test('axe: final, progreso y ajustes sin violaciones', async ({ page }) => {
  await openMiradas(
    page,
    { voice: false },
    {
      sessions: [{ date: '2026-10-24T10:00:00.000Z', level: 1, stars: 2, avgLook: 1.5 }],
    },
  );

  await openSettings(page);
  expect(await violations(page)).toEqual([]);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Ver progreso', exact: true }).click();
  await expect(page.locator('#miradas-screen-progress')).toBeVisible();
  expect(await violations(page)).toEqual([]);

  await page.getByRole('button', { name: 'Volver al inicio del juego' }).click();
  await startSession(page);
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await runUntil(page, (state) => state.screen === 'end');
  expect(await violations(page)).toEqual([]);
});

test('lo que se toca mide 44 px o más', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openMiradas(page, { adults: 3 });
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

  await measure('#miradas-screen-home button:visible', 44);
  await startSession(page);
  await measure('#miradas-screen-round button:visible', 44);
  await countAndWait(page);
  await measure('#miradas-screen-round button:visible', 44);
  expect(small).toEqual([]);
});

test('con movimiento reducido no queda ninguna animación en bucle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openMiradas(page);
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

test('el lector recibe el estado de la ronda y las estrellas', async ({ page }) => {
  await openMiradas(page);
  await startSession(page);
  await expect(page.locator('#miradas-screen-round .sr-only[role="status"]')).toContainText(/\./);
  await expect(page.locator('#miradas-screen-round .star-pill')).toHaveAttribute(
    'aria-label',
    'Estrellas del equipo: 0',
  );
});
