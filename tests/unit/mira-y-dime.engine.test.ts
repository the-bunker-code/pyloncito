import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRandom } from '../../src/lib/random';
import { TIMING } from '../../src/games/mira-y-dime/config';
import { copy } from '../../src/games/mira-y-dime/copy';
import { createMiraEngine, type MiraEngine } from '../../src/games/mira-y-dime/engine';
import { DEFAULT_SETTINGS } from '../../src/games/mira-y-dime/storage';

const spoken: string[] = [];

async function flush(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

async function advance(milliseconds: number): Promise<void> {
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 50) {
    vi.advanceTimersByTime(50);
    await flush();
  }
}

async function until(engine: MiraEngine, phase: string): Promise<void> {
  for (let i = 0; i < 400 && engine.state.phase !== phase; i++) await advance(50);
  expect(engine.state.phase).toBe(phase);
}

function currentRound(engine: MiraEngine) {
  if (!engine.state.round) throw new Error('no round');
  return engine.state.round;
}

function nextPiece(engine: MiraEngine): string {
  return currentRound(engine).units[engine.state.placed]!;
}

function wrongPiece(engine: MiraEngine): string {
  const wrong = engine.state.bank.find((piece) => piece !== nextPiece(engine));
  if (wrong === undefined) throw new Error('no wrong piece');
  return wrong;
}

function placeAll(engine: MiraEngine): void {
  const total = currentRound(engine).units.length;
  for (let i = 0; i < total; i++) {
    expect(engine.state.bank).toContain(nextPiece(engine));
    engine.choosePiece(nextPiece(engine));
  }
}

function fresh(overrides: Partial<typeof DEFAULT_SETTINGS> = {}): MiraEngine {
  const engine = createMiraEngine({
    initialSettings: { ...DEFAULT_SETTINGS, ...overrides },
    speak: async (text) => {
      spoken.push(text);
    },
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    random: createRandom(7),
    playCount: () => undefined,
    playSuccess: () => undefined,
    playError: () => undefined,
    unlock: () => undefined,
    persistSettings: () => undefined,
    track: () => undefined,
  });
  engine.updateSettings({ ...engine.state.settings, rounds: 3, level: 'easy', ...overrides });
  spoken.length = 0;
  return engine;
}

let engine: MiraEngine;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  engine.dispose();
  vi.useRealTimers();
});

describe('sesión completa', () => {
  it('arma, dice “Lo dijo”, anuncia el cierre y retrasa los botones', async () => {
    engine = fresh();
    engine.startGame('syllables');

    for (let round = 1; round <= 3; round++) {
      await until(engine, 'answering');
      expect(engine.state.roundNumber).toBe(round);
      expect(spoken).toContain(currentRound(engine).question);
      placeAll(engine);
      expect(engine.state.phase).toBe('solved');
      await until(engine, 'saying');
      expect(spoken.at(-1)).toBe('Ahora dilo tú.');
      engine.confirmSaid(round !== 2);
      await advance(TIMING.saidPause + 100);
    }

    expect(engine.state.screen).toBe('end');
    expect(engine.state.saidCount).toBe(2);
    expect(engine.state.endButtonsVisible).toBe(false);
    await advance(TIMING.endButtons);
    expect(engine.state.endButtonsVisible).toBe(true);
    expect(spoken).toContain(copy.session.two);
    expect(spoken).toContain(copy.session.one);
    expect(spoken).toContain('¡Lo hicimos juntos!');
    expect(spoken).toContain('¡Muy bien dicho!');
  });

  it('emite eventos de juego sin datos personales', async () => {
    const events: { name: string; params: Record<string, unknown> }[] = [];
    engine = createMiraEngine({
      initialSettings: { ...DEFAULT_SETTINGS, voice: false },
      speak: async () => undefined,
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      random: createRandom(7),
      playCount: () => undefined,
      playSuccess: () => undefined,
      playError: () => undefined,
      unlock: () => undefined,
      persistSettings: () => undefined,
      track: (name, params) => events.push({ name, params }),
    });
    engine.updateSettings({ ...engine.state.settings, rounds: 3, level: 'easy' });
    engine.startGame('syllables');

    expect(events).toContainEqual({
      name: 'game_start',
      params: { game: 'mira-y-dime', mode: 'syllables', level: 'easy', rounds: 3 },
    });

    await until(engine, 'answering');
    engine.choosePiece(wrongPiece(engine));
    expect(
      events.some((event) => event.name === 'answer' && event.params.result === 'incorrect'),
    ).toBe(true);

    placeAll(engine);
    expect(events.some((event) => event.name === 'round_complete')).toBe(true);
    expect(
      events.some(
        (event) =>
          event.name === 'answer' &&
          event.params.result === 'correct' &&
          typeof event.params.attempt === 'number' &&
          typeof event.params.error_count === 'number',
      ),
    ).toBe(true);

    await until(engine, 'saying');
    engine.confirmSaid(true);
    await advance(TIMING.saidPause + 100);
    expect(events.some((event) => event.name === 'round_said' && event.params.said === 'yes')).toBe(
      true,
    );

    engine.goHome('user');
    expect(
      events.some((event) => event.name === 'game_exit' && event.params.reason === 'user'),
    ).toBe(true);

    const allowed = new Set([
      'game',
      'mode',
      'level',
      'rounds',
      'round',
      'total',
      'said',
      'said_count',
      'duration_seconds',
      'result',
      'attempt',
      'errors',
      'help_count',
      'error_count',
      'reason',
      'previous_level',
      'source',
    ]);
    for (const event of events) {
      expect(Object.keys(event.params).every((key) => allowed.has(key))).toBe(true);
    }
  });

  it('una voz que no termina no frena la ronda', async () => {
    const hanging = new Promise<void>(() => undefined);
    engine = createMiraEngine({
      initialSettings: { ...DEFAULT_SETTINGS, voice: true },
      speak: () => hanging,
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      random: createRandom(7),
      playCount: () => undefined,
      playSuccess: () => undefined,
      playError: () => undefined,
      unlock: () => undefined,
      persistSettings: () => undefined,
      track: () => undefined,
    });
    engine.updateSettings({ ...engine.state.settings, rounds: 3, level: 'easy' });
    engine.startGame('syllables');
    await until(engine, 'answering');
    placeAll(engine);

    await advance(2100);
    expect(engine.state.phase).toBe('saying');
  });

  it('cada pieza correcta se nombra y las rondas no se repiten', async () => {
    engine = fresh({ mode: 'syllables', level: 'medium' });
    engine.startGame('syllables');
    await until(engine, 'answering');
    const round = currentRound(engine);
    engine.choosePiece(nextPiece(engine));
    expect(engine.state.placed).toBe(1);
    expect(spoken.at(-1)).toBe(round.units[0]);
    expect(new Set(engine.state.plan.map((object) => object.id)).size).toBe(3);
  });
});

describe('errores y ayuda', () => {
  it('dos fallos seguidos muestran la pieza y no dicen “no”', async () => {
    engine = fresh({ mode: 'syllables', level: 'medium' });
    engine.startGame('syllables');
    await until(engine, 'answering');
    const next = nextPiece(engine);

    engine.choosePiece(wrongPiece(engine));
    expect(engine.state.phase).toBe('answering');
    expect(engine.state.misses).toBe(1);
    expect(engine.state.shake).not.toBeNull();
    expect(spoken.at(-1)).toBe('¡Casi! Otra vez.');

    engine.choosePiece(wrongPiece(engine));
    expect(engine.state.phase).toBe('helping');
    expect(engine.state.mood).toBe('think');
    engine.choosePiece(next);
    expect(engine.state.placed).toBe(0);

    await until(engine, 'answering');
    expect(engine.state.pulseValue).toBe(next);
    expect(spoken).toContain('Esta sigue.');
    expect(engine.state.misses).toBe(0);

    engine.choosePiece(next);
    expect(engine.state.placed).toBe(1);
    expect(engine.state.pulseValue).toBeNull();
    expect(spoken.some((phrase) => /^no\b/i.test(phrase))).toBe(false);
  });

  it('acertar reinicia los fallos seguidos', async () => {
    engine = fresh({ mode: 'letters', level: 'hard' });
    engine.startGame('letters');
    await until(engine, 'answering');
    engine.choosePiece(wrongPiece(engine));
    engine.choosePiece(nextPiece(engine));
    expect(engine.state.misses).toBe(0);
    engine.choosePiece(wrongPiece(engine));
    expect(engine.state.phase).toBe('answering');
  });
});

describe('candados y cancelación', () => {
  it('toques en ráfaga sobre la última pieza cuentan una vez', async () => {
    engine = fresh({ mode: 'shortPhrase' });
    engine.startGame('shortPhrase');
    await until(engine, 'answering');
    engine.choosePiece(nextPiece(engine));
    const last = nextPiece(engine);
    for (let i = 0; i < 6; i++) engine.choosePiece(last);
    expect(engine.state.phase).toBe('solved');
    expect(engine.state.placed).toBe(2);

    await until(engine, 'saying');
    for (let i = 0; i < 4; i++) engine.confirmSaid(true);
    expect(engine.state.saidCount).toBe(1);
    await advance(TIMING.saidPause + 100);
    expect(engine.state.roundNumber).toBe(2);
  });

  it('una pieza que no está en el banco se ignora', async () => {
    engine = fresh({ mode: 'syllables' });
    engine.startGame('syllables');
    await until(engine, 'answering');
    engine.choosePiece('zzz');
    expect(engine.state.misses).toBe(0);
    expect(engine.state.placed).toBe(0);
  });

  it('volver al inicio cancela todo lo pendiente', async () => {
    engine = fresh({ mode: 'syllables' });
    engine.startGame('syllables');
    await until(engine, 'answering');
    placeAll(engine);
    engine.goHome();
    const spokenAtHome = spoken.length;
    await advance(30_000);
    expect(engine.state.screen).toBe('home');
    expect(engine.state.round).toBeNull();
    expect(spoken.length).toBe(spokenAtHome);
  });

  it('pausar durante la ayuda la detiene y una sesión nueva arranca limpia', async () => {
    engine = fresh({ mode: 'syllables', level: 'medium' });
    engine.startGame('syllables');
    await until(engine, 'answering');
    engine.choosePiece(wrongPiece(engine));
    engine.choosePiece(wrongPiece(engine));
    expect(engine.state.phase).toBe('helping');

    engine.pause();
    await advance(30_000);
    expect(engine.state.phase).toBe('helping');

    engine.goHome();
    engine.startGame('syllables');
    await until(engine, 'answering');
    expect(engine.state.roundNumber).toBe(1);
    expect(engine.state.misses).toBe(0);
    expect(engine.state.placed).toBe(0);
  });

  it('empezar dos veces deja una sola ronda activa', async () => {
    engine = fresh({ mode: 'syllables' });
    engine.startGame('syllables');
    engine.startGame('syllables');
    await until(engine, 'answering');
    expect(engine.state.roundNumber).toBe(1);
    expect(spoken.filter((phrase) => phrase === currentRound(engine).question)).toHaveLength(1);
  });
});

describe('consigna, voz y ajustes', () => {
  it('repetir la consigna solo funciona cuando le toca elegir', async () => {
    engine = fresh({ mode: 'syllables' });
    engine.startGame('syllables');
    const before = spoken.length;
    engine.repeatQuestion();
    expect(spoken.length).toBe(before);

    await until(engine, 'answering');
    const afterAuto = spoken.length;
    engine.repeatQuestion();
    expect(spoken.length).toBe(afterAuto + 1);
    expect(spoken.at(-1)).toBe(currentRound(engine).question);
  });

  it('sin voz el juego funciona igual', async () => {
    engine = fresh({ mode: 'syllables', voice: false });
    engine.startGame('syllables');
    await until(engine, 'answering');
    placeAll(engine);
    await until(engine, 'saying');
    expect(spoken.length).toBe(0);
  });

  it('chooseLevel guarda el nivel y no inicia sesión', () => {
    engine = fresh();
    engine.chooseLevel('hard');
    expect(engine.state.settings.level).toBe('hard');
    expect(engine.state.screen).toBe('home');
  });
});
