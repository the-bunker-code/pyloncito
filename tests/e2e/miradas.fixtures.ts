import { test as base, expect, type Page } from '@playwright/test';

const CONSENT_KEY = 'pyloncito:consent:v1';
const SETTINGS_KEY = 'juegos:miradas:settings:v1';
const SESSIONS_KEY = 'juegos:miradas:sessions:v1';

export const test = base.extend<{ consoleProblems: string[] }>({
  consoleProblems: async ({ browserName }, use) => {
    void browserName;
    await use([]);
  },
  page: async ({ page, consoleProblems }, use) => {
    page.on('console', (message) => {
      if (message.text() === 'Service Worker registration blocked by Playwright') return;
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleProblems.push(message.text());
      }
    });
    page.on('pageerror', (error) => consoleProblems.push(error.message));
    await use(page);
    expect(consoleProblems, 'consola sin errores ni advertencias').toEqual([]);
  },
});

export { expect };

export interface OpenMiradasOptions {
  analytics?: boolean;
  debug?: boolean;
  sessions?: unknown[];
}

export interface MiradasSettingsInput {
  level?: 1 | 2 | 3;
  adults?: 1 | 2 | 3;
  names?: string[];
  voice?: boolean;
  sound?: boolean;
  lookWindow?: 3 | 5 | 10 | 15 | 20 | 30;
}

export async function openMiradas(
  page: Page,
  settings: MiradasSettingsInput = {},
  options: OpenMiradasOptions = {},
): Promise<void> {
  const stored = JSON.stringify({
    level: 1,
    adults: 1,
    names: ['Papá', 'Mamá', 'Niñera'],
    voice: false,
    sound: false,
    lookWindow: 10,
    ...settings,
  });

  await page.addInitScript(
    ([consentKey, settingsKey, sessionsKey, value, sessions, analytics]) => {
      localStorage.setItem(
        consentKey,
        JSON.stringify({
          version: 1,
          analytics,
          improvement: false,
          marketing: false,
          updatedAt: new Date().toISOString(),
        }),
      );
      localStorage.setItem(settingsKey, value);
      if (sessions) localStorage.setItem(sessionsKey, JSON.stringify(sessions));

      const spoken: string[] = [];
      Object.defineProperty(window, '__spoken', { value: spoken });
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          getVoices: () => [],
          addEventListener: () => undefined,
          cancel: () => undefined,
          speak(utterance: SpeechSynthesisUtterance) {
            spoken.push(utterance.text);
            setTimeout(() => utterance.onend?.(new Event('end') as SpeechSynthesisEvent), 30);
          },
        },
      });
    },
    [
      CONSENT_KEY,
      SETTINGS_KEY,
      SESSIONS_KEY,
      stored,
      options.sessions ?? null,
      options.analytics ?? false,
    ] as const,
  );

  await page.clock.install();
  await page.goto(`/juegos/miradas/${options.debug ? '?gtm_debug=1' : ''}`);
  await expect(page.locator('#miradas-screen-home')).toBeVisible();
}

export interface MiradasSnapshot {
  screen: 'home' | 'round' | 'end' | 'progress';
  phase: string | null;
  level: number;
  round: number;
  stars: number;
  clock: string;
  cardTitle: string;
  options: string[];
  endTotal: number;
}

export async function snapshot(page: Page): Promise<MiradasSnapshot> {
  const home = page.locator('#miradas-screen-home');
  const round = page.locator('#miradas-screen-round');
  const end = page.locator('#miradas-screen-end');
  const progress = page.locator('#miradas-screen-progress');
  const screen = (await end.isVisible())
    ? 'end'
    : (await progress.isVisible())
      ? 'progress'
      : (await round.isVisible())
        ? 'round'
        : (await home.isVisible())
          ? 'home'
          : 'home';

  const title = page.locator('#miradas-screen-round .miradas-stage__title');
  const options = page.locator('#miradas-screen-round .miradas-option');
  const endTotal = page.locator('#miradas-screen-end .miradas-end__total span');

  return {
    screen,
    phase: await round.getAttribute('data-phase'),
    level: Number((await round.getAttribute('data-level')) ?? 0),
    round: Number((await round.getAttribute('data-round')) ?? 0),
    stars: Number((await round.getAttribute('data-stars')) ?? 0),
    clock: (await page.locator('#miradas-screen-round .session-clock span').textContent()) ?? '',
    cardTitle: (await title.count()) > 0 ? ((await title.first().textContent()) ?? '') : '',
    options: (await options.count()) > 0 ? await options.allTextContents() : [],
    endTotal: (await endTotal.count()) > 0 ? Number((await endTotal.textContent()) ?? 0) : 0,
  };
}

export async function runUntil(
  page: Page,
  done: (state: MiradasSnapshot) => boolean,
  maxMs = 60_000,
  stepMs = 100,
): Promise<void> {
  for (let elapsed = 0; elapsed < maxMs; elapsed += stepMs) {
    if (done(await snapshot(page))) return;
    await page.clock.runFor(stepMs);
  }
  throw new Error(`No se cumplió la condición: ${JSON.stringify(await snapshot(page))}`);
}

export async function startSession(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  await runUntil(page, (state) => state.screen === 'round' && state.phase === 'card');
}

export async function countAndWait(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Contar', exact: true }).click();
  await runUntil(page, (state) => state.phase === 'waiting');
}

export async function look(page: Page, index = 0): Promise<void> {
  await page.locator('#miradas-screen-round .miradas-adult-card').nth(index).click();
}

export async function openSettings(page: Page): Promise<void> {
  await page.locator('#miradas-screen-home .miradas-gear').click();
}

export function spoken(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
}
