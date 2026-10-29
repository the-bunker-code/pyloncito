import { test as base, expect, type Page } from '@playwright/test';
import { splitLetters, splitWords, syllabify } from '../../src/games/mira-y-dime/spanish';

const CONSENT_KEY = 'pyloncito:consent:v1';
const SETTINGS_KEY = 'juegos:mira-y-dime:settings:v1';

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

export interface OpenMiraOptions {
  analytics?: boolean;
  debug?: boolean;
}

export interface MiraSettingsInput {
  mode?: 'letters' | 'syllables' | 'shortPhrase' | 'longPhrase';
  level?: 'easy' | 'medium' | 'hard';
  rounds?: 3 | 5 | 8;
  voice?: boolean;
  sound?: boolean;
}

export async function openMira(
  page: Page,
  settings: MiraSettingsInput = {},
  options: OpenMiraOptions = {},
): Promise<void> {
  const stored = JSON.stringify({
    mode: 'syllables',
    level: 'easy',
    rounds: 3,
    voice: false,
    sound: false,
    ...settings,
  });
  await page.addInitScript(
    ([consentKey, settingsKey, value, analytics]) => {
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
    [CONSENT_KEY, SETTINGS_KEY, stored, options.analytics ?? false] as const,
  );
  await page.clock.install();
  await page.goto(`/juegos/mira-y-dime/${options.debug ? '?gtm_debug=1' : ''}`);
  await expect(page.locator('#mira-screen-home .mode-card')).toHaveCount(4);
}

export interface MiraSnapshot {
  screen: 'home' | 'game' | 'end';
  phase: string | null;
  round: number;
  total: number;
  mode: string | null;
  level: string | null;
  question: string;
  pieces: string[];
  placed: number;
  said: number;
  saidVisible: boolean;
  endButtonsVisible: boolean;
}

export async function snapshot(page: Page): Promise<MiraSnapshot> {
  const game = page.locator('#mira-screen-game');
  const end = page.locator('#mira-screen-end');
  const home = page.locator('#mira-screen-home');
  const screen = (await end.isVisible()) ? 'end' : (await home.isVisible()) ? 'home' : 'game';
  return {
    screen,
    phase: await game.getAttribute('data-phase'),
    round: Number((await game.getAttribute('data-round')) ?? 0),
    total: Number((await game.getAttribute('data-total')) ?? 0),
    mode: await game.getAttribute('data-mode'),
    level: await game.getAttribute('data-level'),
    question: (await page.locator('#mira-screen-game .question__text').allTextContents())[0] ?? '',
    pieces: await page.locator('#mira-screen-game .piece').allTextContents(),
    placed: await page.locator('#mira-screen-game .slot.is-filled').count(),
    said: Number((await game.getAttribute('data-said')) ?? 0),
    saidVisible: await page.getByRole('button', { name: 'Lo dijo', exact: true }).isVisible(),
    endButtonsVisible: await page
      .getByRole('button', { name: 'Otra vez', exact: true })
      .isVisible(),
  };
}

export async function runUntil(
  page: Page,
  done: (state: MiraSnapshot) => boolean,
  maxMs = 60_000,
  stepMs = 100,
): Promise<void> {
  for (let elapsed = 0; elapsed < maxMs; elapsed += stepMs) {
    if (done(await snapshot(page))) return;
    await page.clock.runFor(stepMs);
  }
  throw new Error(`No se cumplió la condición: ${JSON.stringify(await snapshot(page))}`);
}

export async function startMode(
  page: Page,
  mode: MiraSettingsInput['mode'] = 'syllables',
): Promise<void> {
  await page.locator(`#mira-screen-home [data-mode="${mode}"]`).click();
  await runUntil(page, (state) => state.screen === 'game' && state.phase === 'answering');
}

export function targetFromQuestion(question: string, mode: string): string {
  const clean = question.trim().replace(/\.$/, '');
  if (mode === 'letters' || mode === 'syllables') {
    return clean.replace(/^Armemos\s+/, '');
  }
  return clean;
}

export async function unitsOfCurrentRound(page: Page): Promise<string[]> {
  const state = await snapshot(page);
  if (!state.mode) throw new Error('No hay modo');
  const target = targetFromQuestion(state.question, state.mode);
  if (state.mode === 'letters') return splitLetters(target);
  if (state.mode === 'syllables') return syllabify(target);
  return splitWords(target);
}

export async function playRound(page: Page): Promise<void> {
  const round = (await snapshot(page)).round;
  const units = await unitsOfCurrentRound(page);
  for (const unit of units) {
    await page.getByRole('button', { name: unit, exact: true }).click();
  }
  await runUntil(page, (state) => state.phase === 'saying');
  await page.getByRole('button', { name: 'Lo dijo', exact: true }).click();
  await runUntil(page, (state) => state.round > round || state.screen === 'end');
}
