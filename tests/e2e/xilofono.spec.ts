import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { buildShareUrl } from '../../src/games/xilofono/share';
import { parseSong } from '../../src/games/xilofono/song';

const PATH = '/juegos/xilofono/';
const SONGS = [
  ['estrellita', 'Estrellita'],
  ['himno-alegria', 'Himno a la alegría'],
  ['melodia-principal', 'Melodía principal'],
  ['mi-corazon-encantado', 'Mi Corazón Encantado'],
] as const;

function readSong(file: string): unknown {
  return JSON.parse(readFileSync(resolve(process.cwd(), `public/canciones/${file}.json`), 'utf8'));
}

async function openXilofono(page: Page, hash = ''): Promise<string[]> {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      'pyloncito:consent:v1',
      JSON.stringify({
        version: 1,
        analytics: false,
        improvement: false,
        marketing: false,
        updatedAt: new Date().toISOString(),
      }),
    );
  });
  await page.goto(PATH + hash);
  await expect(page.locator('.xilo-key').first()).toBeVisible();
  return problems;
}

async function loadSample(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'Cargar canción' }).click();
  await page.getByRole('dialog').getByRole('button', { name: title, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.xilofono__status')).toHaveText(`Canción cargada: ${title}`);
}

const status = (page: Page) => page.locator('.xilofono__status');

test.use({ viewport: { width: 1024, height: 768 } });

test('la página carga sin errores, sin scroll horizontal y el hub la enlaza', async ({ page }) => {
  const problems = await openXilofono(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Xilófono' })).toHaveCount(1);
  await expect(page.locator('.xilo-key')).toHaveCount(14);
  await expect(status(page)).toHaveText('Toca las teclas, o carga una canción.');

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
  expect(problems).toEqual([]);

  await page.goto('/');
  await expect(page.locator('.game-card--xilofono')).toHaveAttribute('href', PATH);
});

for (const [file, title] of SONGS) {
  test(`${title}: carga, se escucha y se completa en Guía`, async ({ page }) => {
    const song = parseSong(readSong(file));
    const problems = await openXilofono(page);
    await loadSample(page, title);
    await expect(page.locator('.xilo-key')).toHaveCount(song.hasSharps ? 24 : 14);

    await page.getByRole('button', { name: 'Escuchar' }).click();
    await expect(status(page)).toHaveText('Escuchando la canción…');
    const scroller = page.locator('.xilo-score__scroller');
    await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Detener' }).click();
    await expect(status(page)).toHaveText('Detenido.');

    await page.getByRole('button', { name: 'Guía' }).click();
    const target = page.locator('.xilo-key.is-target');
    const notes = song.notes.filter((note) => !note.rest).length;
    for (let played = 0; played < notes; played += 1) {
      await expect(target).toHaveCount(1);
      await target.dispatchEvent('pointerdown', { button: 0 });
    }
    await expect(status(page)).toHaveText('Terminó la canción. Toca Guía para repetir.');
    await expect(target).toHaveCount(0);
    expect(problems).toEqual([]);
  });
}

test('en Guía solo avanza la tecla correcta y la incorrecta se mueve', async ({ page }) => {
  await openXilofono(page);
  await loadSample(page, 'Estrellita');
  await page.getByRole('button', { name: 'Guía' }).click();
  await expect(status(page)).toHaveText('Toca: Do (1)');
  await expect(page.getByRole('button', { name: 'Salir de la guía' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.keyboard.press('j');
  await expect(page.getByRole('button', { name: 'Si 1' })).toHaveClass(/is-miss-/);
  await expect(status(page)).toHaveText('Toca: Do (1)');

  await page.keyboard.press('a');
  await page.keyboard.press('a');
  await expect(status(page)).toHaveText('Toca: Sol (1)');

  await page.getByRole('button', { name: 'Salir de la guía' }).click();
  await expect(status(page)).toHaveText('Guía terminada.');
});

test('el diálogo se cierra con Escape y explica los errores', async ({ page }) => {
  await openXilofono(page);
  await page.getByRole('button', { name: 'Cargar canción' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Dirección (URL) del JSON de la canción').fill('ftp://ejemplo');
  await dialog.getByRole('button', { name: 'Cargar', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText(
    'Esa dirección no es válida. Usa una que empiece con https://.',
  );

  await dialog.locator('summary').click();
  await dialog
    .getByRole('textbox', { name: 'O pega el JSON aquí' })
    .fill('{"notes": ["Do", "Ut"]}');
  await dialog.getByRole('button', { name: 'Usar este JSON' }).click();
  await expect(dialog.getByRole('status')).toContainText('Nota 2');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('un enlace #s= abre la canción compartida', async ({ page }) => {
  const url = new URL(
    buildShareUrl('http://localhost/juegos/xilofono/', readSong('himno-alegria')),
  );
  await openXilofono(page, url.hash);
  await expect(status(page)).toHaveText('Canción compartida cargada: Himno a la alegría');
});

test('sin violaciones de accesibilidad WCAG AA', async ({ page }) => {
  await openXilofono(page);
  await loadSample(page, 'Mi Corazón Encantado');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map(
      (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
  ).toEqual([]);
});

test.describe('teléfono', () => {
  test('en vertical pide girar el dispositivo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openXilofono(page);
    await expect(page.getByText('Gira el dispositivo')).toBeVisible();
  });

  test('en horizontal cabe sin aviso y sin scroll horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await openXilofono(page);
    await expect(page.getByText('Gira el dispositivo')).toBeHidden();
    const lastKey = await page.locator('.xilo-key').last().boundingBox();
    expect(lastKey && lastKey.y + lastKey.height).toBeLessThanOrEqual(390);
  });
});
