import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUND, SESSION } from '../../src/games/miradas/config';
import { createMiradasEngine, type MiradasEngine } from '../../src/games/miradas/engine';
import { DEFAULT_SETTINGS, type SavedSession } from '../../src/games/miradas/storage';
import { createRandom } from '../../src/lib/random';

const spoken: string[] = [];
let clock = 1_000_000;
let sessions: SavedSession[] = [];
const tracked: { name: string; params: Record<string, unknown> }[] = [];
const persisted: unknown[] = [];

async function flush(): Promise<void> {
  for (let index = 0; index < 30; index += 1) await Promise.resolve();
}

async function advance(milliseconds: number): Promise<void> {
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 50) {
    clock += 50;
    vi.advanceTimersByTime(50);
    await flush();
  }
}

function fresh(overrides: Partial<typeof DEFAULT_SETTINGS> = {}): MiradasEngine {
  return createMiradasEngine({
    initialSettings: { ...DEFAULT_SETTINGS, ...overrides },
    initialSessions: [...sessions],
    speak: async (text) => {
      spoken.push(text);
    },
    wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    random: createRandom(7),
    now: () => clock,
    playCount: () => undefined,
    playCheer: () => undefined,
    unlock: () => undefined,
    persistSettings: (settings) => {
      persisted.push(settings);
    },
    persistSession: (session) => {
      sessions = [...sessions, session];
      return sessions;
    },
    clearSavedSessions: () => {
      sessions = [];
    },
    loadSavedSessions: () => [...sessions],
    track: (name, params) => {
      tracked.push({ name, params });
    },
  });
}

async function startAndCount(): Promise<MiradasEngine> {
  const engine = fresh();
  engine.startSession();
  void engine.countAndWait();
  await advance(ROUND.countGapMs * 2 + 100);
  expect(engine.state.phase).toBe('waiting');
  return engine;
}

let engine: MiradasEngine;

beforeEach(() => {
  vi.useFakeTimers();
  clock = 1_000_000;
  spoken.length = 0;
  sessions = [];
  tracked.length = 0;
  persisted.length = 0;
});

afterEach(() => {
  engine.dispose();
  vi.useRealTimers();
});

describe('miradas engine: sesión', () => {
  it('starts a five minute session with the first card and no stars', () => {
    engine = fresh();
    engine.startSession();

    expect(engine.state.screen).toBe('round');
    expect(engine.state.phase).toBe('card');
    expect(engine.state.cardId).not.toBe('');
    expect(engine.state.roundNumber).toBe(1);
    expect(engine.state.stars).toEqual([0, 0, 0]);
    expect(tracked).toContainEqual({ name: 'game_start', params: { game: 'miradas', level: 1 } });
  });

  it('counts three, two and one, then waits in silence', async () => {
    engine = await startAndCount();
    expect(spoken).toEqual(['Tres…', 'dos…', 'uno…']);
    expect(engine.state.waitRemainingMs).toBeGreaterThan(0);
  });

  it('registers a look, adds one star and stores the seconds it took', async () => {
    engine = await startAndCount();
    await advance(2500);
    engine.looked(0);

    expect(engine.state.phase).toBe('looked');
    expect(engine.state.stars).toEqual([1, 0, 0]);
    expect(engine.state.looks[0]).toBeGreaterThanOrEqual(2.5);
    expect(engine.state.looks[0]).toBeLessThanOrEqual(2.7);
    expect(engine.state.lookedBy).toBe(0);
    expect(engine.state.waitRemainingMs).toBe(0);
    expect(spoken.at(-1)).toBe('¡Papá!');
  });

  it('speaks the name of the adult the child touched', async () => {
    engine = fresh();
    engine.setName(0, 'Ana');
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    engine.looked(0);
    expect(spoken.at(-1)).toBe('¡Ana!');
  });

  it('ignores a second look while the round is closed', async () => {
    engine = await startAndCount();
    engine.looked(0);
    engine.looked(0);
    expect(engine.state.stars).toEqual([1, 0, 0]);
    expect(engine.state.looks).toHaveLength(1);
  });

  it('stops the ring at zero and waits for the touch', async () => {
    engine = await startAndCount();
    const first = engine.state.cardId;
    await advance(engine.state.settings.lookWindow * 1000 + 200);

    expect(engine.state.phase).toBe('waiting');
    expect(engine.state.cardId).toBe(first);
    expect(engine.state.roundNumber).toBe(1);
    expect(engine.state.stars).toEqual([0, 0, 0]);
    expect(engine.state.looks).toEqual([]);
    expect(engine.state.lookedBy).toBeNull();
    expect(engine.state.waitRemainingMs).toBe(0);
    expect(spoken).toEqual(['Tres…', 'dos…', 'uno…']);
    expect(spoken.every((phrase) => !/error|inténtalo|mal/i.test(phrase))).toBe(true);
  });

  it('accepts a touch after the ring has stopped', async () => {
    engine = await startAndCount();
    await advance(engine.state.settings.lookWindow * 1000 + 200);
    engine.looked(0);
    expect(engine.state.stars).toEqual([1, 0, 0]);
    expect(engine.state.phase).toBe('looked');
    expect(spoken.at(-1)).toBe('¡Papá!');
  });

  it('updates the ring while the wait runs and clears it after a touch', async () => {
    engine = await startAndCount();
    const initial = engine.state.waitRemainingMs;
    await advance(1500);
    expect(engine.state.waitRemainingMs).toBeLessThan(initial);
    engine.looked(0);
    expect(engine.state.waitRemainingMs).toBe(0);
  });

  it('clears lookedBy when the next card appears', async () => {
    engine = await startAndCount();
    engine.looked(0);
    expect(engine.state.lookedBy).toBe(0);
    engine.next();
    expect(engine.state.lookedBy).toBeNull();
  });

  it('respects the chosen look window', async () => {
    engine = fresh({ lookWindow: 3 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    await advance(2700);
    expect(engine.state.phase).toBe('waiting');
    expect(engine.state.waitRemainingMs).toBeGreaterThan(0);
    await advance(400);
    expect(engine.state.phase).toBe('waiting');
    expect(engine.state.waitRemainingMs).toBe(0);
  });

  it('extends the current wait when the adult asks for more time', async () => {
    engine = fresh({ lookWindow: 5 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    await advance(4000);
    engine.setLookWindow(10);
    await advance(1500);
    expect(engine.state.phase).toBe('waiting');
    expect(engine.state.waitRemainingMs).toBeGreaterThan(0);
    await advance(5000);
    expect(engine.state.phase).toBe('waiting');
    expect(engine.state.waitRemainingMs).toBe(0);
  });

  it('shortens the current wait when the adult asks for less time', async () => {
    engine = fresh({ lookWindow: 20 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    await advance(2000);
    engine.setLookWindow(5);
    await advance(3200);
    expect(engine.state.phase).toBe('waiting');
    expect(engine.state.waitRemainingMs).toBe(0);
  });

  it('does not restart the current round when the wait changes after zero', async () => {
    engine = fresh({ lookWindow: 5 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    await advance(5200);
    expect(engine.state.waitRemainingMs).toBe(0);
    engine.setLookWindow(30);
    expect(engine.state.waitRemainingMs).toBe(0);
    await advance(3000);
    expect(engine.state.phase).toBe('waiting');
    expect(engine.state.waitRemainingMs).toBe(0);
  });

  it('ignores a look window that is not offered', () => {
    engine = fresh({ lookWindow: 10 });
    engine.setLookWindow(7 as never);
    expect(engine.state.settings.lookWindow).toBe(10);
  });

  it('adds each adult star to their own slot', async () => {
    engine = fresh({ adults: 3 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    engine.looked(2);
    expect(engine.state.stars).toEqual([0, 0, 1]);

    engine.next();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    engine.looked(1);
    expect(engine.state.stars).toEqual([0, 1, 1]);
  });

  it('lets an adult outside the session count try nothing', async () => {
    engine = fresh({ adults: 2 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    engine.looked(2);
    expect(engine.state.stars).toEqual([0, 0, 0]);
    expect(engine.state.phase).toBe('waiting');
  });

  it('does not repeat a card before exhausting the level', () => {
    engine = fresh();
    engine.startSession();
    const seen = [engine.state.cardId];
    for (let index = 1; index < 6; index += 1) {
      engine.state.phase = 'looked';
      engine.next();
      seen.push(engine.state.cardId);
    }
    expect(new Set(seen).size).toBe(6);
  });
});

describe('miradas engine: nivel 3', () => {
  it('asks to turn the screen, shows two emotions and asks how it is', async () => {
    engine = fresh({ level: 3 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    engine.looked(0);

    expect(engine.state.phase).toBe('turn');
    engine.ready();
    expect(engine.state.phase).toBe('choose');
    expect(engine.state.options).toHaveLength(2);
    expect(engine.state.options).toContain(engine.state.cardId);
    expect(spoken.at(-1)).toBe('¿Cómo está?');
  });

  it('celebrates the correct emotion', async () => {
    engine = fresh({ level: 3 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    engine.looked(0);
    engine.ready();
    const correct = engine.state.cardId;
    engine.chooseEmotion(correct);

    expect(engine.state.phase).toBe('modeled');
    expect(engine.state.stars).toEqual([1, 0, 0]);
    expect(spoken.at(-1)).toMatch(/^¡\p{L}+!$/u);
  });

  it('models the correct word after another choice, with the star already given', async () => {
    engine = fresh({ level: 3 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    engine.looked(0);
    engine.ready();
    const wrong = engine.state.options.find((option) => option !== engine.state.cardId)!;
    engine.chooseEmotion(wrong);

    expect(engine.state.phase).toBe('modeled');
    expect(engine.state.stars).toEqual([1, 0, 0]);
    expect(spoken.at(-1)).toMatch(/^Está /);
  });

  it('ignores an emotion that is not on screen', async () => {
    engine = fresh({ level: 3 });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    engine.looked(0);
    engine.ready();
    const absent = ['happy', 'sad', 'surprised', 'angry'].find(
      (id) => !engine.state.options.includes(id),
    )!;
    engine.chooseEmotion(absent);
    expect(engine.state.phase).toBe('choose');
  });
});

describe('miradas engine: tiempo y cierre', () => {
  it('says the last-round warning once at 4:30', async () => {
    engine = fresh();
    engine.startSession();
    await advance(SESSION.warnAtMs + 1000);
    expect(spoken.filter((phrase) => phrase === 'Una más y terminamos')).toHaveLength(1);
    expect(engine.state.closing).toBe('one');

    await advance(5000);
    expect(spoken.filter((phrase) => phrase === 'Una más y terminamos')).toHaveLength(1);
  });

  it('does not cut the count with the warning and says it after the look', async () => {
    engine = fresh();
    engine.startSession();
    await advance(SESSION.warnAtMs - 5000);
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 6000);
    expect(engine.state.phase).toBe('waiting');
    expect(spoken).not.toContain('Una más y terminamos');

    engine.looked(0);
    await flush();
    expect(spoken).toContain('Una más y terminamos');
  });

  it('ends between cards at five minutes and speaks the team total', async () => {
    engine = fresh();
    engine.startSession();
    await advance(SESSION.durationMs + 1000);

    expect(engine.state.screen).toBe('end');
    expect(spoken.at(-1)).toBe('Hicimos 0 estrellas');
    expect(sessions.at(-1)).toMatchObject({ level: 1, stars: 0, avgLook: null });
  });

  it('lets the current round finish after five minutes', async () => {
    engine = fresh();
    engine.startSession();
    await advance(SESSION.durationMs - 4000);
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    expect(engine.state.phase).toBe('waiting');

    await advance(4000);
    expect(engine.state.screen).toBe('round');
    engine.looked(0);
    engine.next();
    expect(engine.state.screen).toBe('end');
    expect(spoken.at(-1)).toBe('Hicimos 1 estrella');
  });

  it('stores the average only from rounds with a look', async () => {
    engine = await startAndCount();
    await advance(2000);
    engine.looked(0);
    engine.finishSession();

    const saved = sessions.at(-1);
    expect(saved?.stars).toBe(1);
    expect(saved?.level).toBe(1);
    expect(saved?.avgLook).toBeGreaterThanOrEqual(2);
  });

  it('stores null when no round had a look', () => {
    engine = fresh();
    engine.startSession();
    engine.finishSession();
    expect(sessions.at(-1)?.avgLook).toBeNull();
  });

  it('going home cancels pending waits and the clock', async () => {
    engine = fresh();
    engine.startSession();
    void engine.countAndWait();
    await advance(300);
    engine.goHome();
    await advance(engine.state.settings.lookWindow * 1000 + 3000);

    expect(engine.state.screen).toBe('home');
    expect(engine.state.stars).toEqual([0, 0, 0]);
  });

  it('starting twice leaves one active session', async () => {
    engine = fresh();
    engine.startSession();
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    expect(engine.state.roundNumber).toBe(1);
    expect(spoken.filter((phrase) => phrase === 'Tres…')).toHaveLength(1);
  });
});

describe('miradas engine: ajustes y progreso', () => {
  it('saves level, adults, names and switches without starting a session', () => {
    engine = fresh();
    engine.chooseLevel(2);
    engine.chooseAdults(3);
    engine.setName(0, 'Ana');
    engine.updateSettings({ ...engine.state.settings, voice: false, sound: false });

    expect(engine.state.screen).toBe('home');
    expect(engine.state.settings).toMatchObject({
      level: 2,
      adults: 3,
      names: ['Ana', 'Mamá', 'Niñera'],
      voice: false,
      sound: false,
    });
    expect(persisted.length).toBeGreaterThan(0);
  });

  it('cleans an empty or dangerous adult name', () => {
    engine = fresh();
    engine.setName(0, '   ');
    expect(engine.state.settings.names[0]).toBe('Papá');
    engine.setName(1, '<img src=x onerror=alert(1)>');
    expect(engine.state.settings.names[1]).toBe('<img src=x onerror=a');
  });

  it('loads saved progress and clears it without touching settings', () => {
    sessions = [{ date: '2026-10-24T10:00:00.000Z', level: 1, stars: 2, avgLook: 1.5 }];
    engine = fresh();
    engine.showProgress();
    expect(engine.state.screen).toBe('progress');
    expect(engine.state.sessions).toHaveLength(1);

    engine.clearProgress();
    expect(engine.state.sessions).toEqual([]);
    expect(engine.state.settings.level).toBe(1);
  });

  it('works without voice or sound', async () => {
    engine = fresh({ voice: false, sound: false });
    engine.startSession();
    void engine.countAndWait();
    await advance(ROUND.countGapMs * 2 + 100);
    engine.looked(0);
    engine.next();
    expect(spoken).toEqual([]);
  });

  it('emits only allowed analytics keys and never names', async () => {
    engine = await startAndCount();
    engine.setName(0, 'Ana');
    engine.looked(0);
    engine.next();
    engine.goHome('user');

    const allowed = new Set([
      'game',
      'level',
      'round',
      'rounds',
      'duration_seconds',
      'reason',
      'previous_level',
    ]);
    expect(tracked.some((event) => event.name === 'round_complete')).toBe(true);
    for (const event of tracked) {
      expect(Object.keys(event.params).every((key) => allowed.has(key))).toBe(true);
      expect(Object.values(event.params)).not.toContain('Ana');
    }
  });
});
