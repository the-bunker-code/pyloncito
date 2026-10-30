import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SESSIONS_KEY,
  SETTINGS_KEY,
  appendSession,
  cleanName,
  clearSessions,
  loadSessions,
  loadSettings,
  normalizeSessions,
  normalizeSettings,
  saveSettings,
} from '../../src/games/miradas/storage';
import { MAX_SAVED_SESSIONS } from '../../src/games/miradas/config';
import { createStorage } from '../../src/lib/storage';

const storage = createStorage('miradas', window.localStorage);

beforeEach(() => {
  window.localStorage.clear();
});

describe('miradas storage', () => {
  it('uses defaults for missing or invalid settings', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('texto')).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid settings and repairs each invalid value', () => {
    const valid = {
      level: 3,
      adults: 2,
      names: ['Luis', 'Marta', 'Niñera'],
      voice: false,
      sound: true,
      lookWindow: 20,
    };
    expect(normalizeSettings(valid)).toEqual(valid);

    expect(
      normalizeSettings({ level: 9, adults: '2', names: ['Ana'], voice: 'sí', sound: false }),
    ).toEqual({ ...DEFAULT_SETTINGS, names: ['Ana', 'Mamá', 'Niñera'], sound: false });
  });

  it('ignores dangerous keys and inherited prototypes', () => {
    const raw = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"x":1},"level":2}');
    const fixed = normalizeSettings(raw);
    expect(fixed.level).toBe(2);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    expect(Object.keys(fixed).sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());

    expect(normalizeSettings(Object.create({ level: 3 }))).toEqual(DEFAULT_SETTINGS);
  });

  it('cleanName trims, limits length and removes control characters', () => {
    expect(cleanName('  Ana  ', 'x')).toBe('Ana');
    expect(cleanName('', 'Papá')).toBe('Papá');
    expect(cleanName('   ', 'Papá')).toBe('Papá');
    expect(cleanName(42, 'Papá')).toBe('Papá');
    expect(cleanName('a\u0000b\nc', 'x')).toBe('abc');
    expect(cleanName('x'.repeat(50), 'y').length).toBe(20);
  });

  it('keeps old settings when lookWindow is missing', () => {
    window.localStorage.setItem(
      `juegos:miradas:${SETTINGS_KEY}`,
      JSON.stringify({
        level: 3,
        adults: 2,
        names: ['Luis', 'Marta', 'Niñera'],
        voice: false,
        sound: true,
      }),
    );
    expect(loadSettings(storage)).toEqual({
      level: 3,
      adults: 2,
      names: ['Luis', 'Marta', 'Niñera'],
      voice: false,
      sound: true,
      lookWindow: 10,
    });
  });

  it('loads defaults and saves settings under the miradas namespace', () => {
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    const settings = { ...DEFAULT_SETTINGS, level: 2 as const, adults: 3 as const };
    expect(saveSettings(settings, storage)).toBe(true);
    expect(loadSettings(storage)).toEqual(settings);
    expect(window.localStorage.getItem(`juegos:miradas:${SETTINGS_KEY}`)).not.toBeNull();
  });

  it('ignores corrupt JSON and keeps running when localStorage fails', () => {
    window.localStorage.setItem(`juegos:miradas:${SETTINGS_KEY}`, '{no es json');
    window.localStorage.setItem(`juegos:miradas:${SESSIONS_KEY}`, '[[[');
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    expect(loadSessions(storage)).toEqual([]);

    const failing = createStorage('miradas', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    });
    expect(loadSettings(failing)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(DEFAULT_SETTINGS, failing)).toBe(false);
    expect(
      appendSession(
        { date: '2026-10-24T10:00:00.000Z', level: 1, stars: 1, avgLook: null },
        failing,
      ),
    ).toHaveLength(1);
    expect(() => clearSessions(failing)).not.toThrow();
  });

  it('normalizes saved sessions and discards broken ones', () => {
    const good = { date: '2026-10-24T10:00:00.000Z', level: 2, stars: 4, avgLook: 2.3 };
    const result = normalizeSessions([
      good,
      null,
      'texto',
      { ...good, date: 'ayer' },
      { ...good, level: 7 },
      { ...good, stars: -1 },
      { ...good, stars: 1.5 },
      { ...good, avgLook: 'rápido' },
      { ...good, avgLook: 99 },
    ]);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(good);
    expect(result[1]).toEqual({ ...good, avgLook: null });
    expect(result[2]).toEqual({ ...good, avgLook: null });
    expect(normalizeSessions({ no: 'lista' })).toEqual([]);
  });

  it('keeps only the most recent sessions', () => {
    for (let index = 0; index < MAX_SAVED_SESSIONS + 10; index += 1) {
      appendSession(
        { date: '2026-10-24T10:00:00.000Z', level: 1, stars: index, avgLook: null },
        storage,
      );
    }
    const sessions = loadSessions(storage);
    expect(sessions).toHaveLength(MAX_SAVED_SESSIONS);
    expect(sessions.at(-1)?.stars).toBe(MAX_SAVED_SESSIONS + 9);
  });

  it('clearSessions removes progress but keeps settings', () => {
    saveSettings({ ...DEFAULT_SETTINGS, level: 3 }, storage);
    appendSession({ date: '2026-10-24T10:00:00.000Z', level: 1, stars: 1, avgLook: null }, storage);
    clearSessions(storage);
    expect(loadSessions(storage)).toEqual([]);
    expect(loadSettings(storage).level).toBe(3);
  });
});
