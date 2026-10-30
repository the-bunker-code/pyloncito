import { createStorage, isPlainRecord, type GameStorage } from '../../lib/storage';
import {
  ADULTS,
  ADULT_COUNTS,
  DEFAULT_LOOK_WINDOW,
  LEVEL_IDS,
  LOOK_WINDOW_OPTIONS,
  MAX_SAVED_SESSIONS,
  type AdultCount,
  type LevelId,
  type LookWindow,
} from './config';

export interface MiradasSettings {
  level: LevelId;
  adults: AdultCount;
  names: string[];
  voice: boolean;
  sound: boolean;
  lookWindow: LookWindow;
}

export interface SavedSession {
  date: string;
  level: LevelId;
  stars: number;
  avgLook: number | null;
}

export const SETTINGS_KEY = 'settings:v1';
export const SESSIONS_KEY = 'sessions:v1';

export const DEFAULT_SETTINGS: MiradasSettings = Object.freeze({
  level: 1,
  adults: 1,
  names: ['Papá', 'Mamá', 'Niñera'],
  voice: true,
  sound: true,
  lookWindow: DEFAULT_LOOK_WINDOW,
});

const gameStorage = createStorage('miradas');

export function cleanName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const printable = Array.from(value).filter((character) => {
    const code = character.charCodeAt(0);
    return code > 31 && code !== 127;
  });
  const text = printable.join('').trim().slice(0, ADULTS.nameMaxLength);
  return text || fallback;
}

export function normalizeSettings(raw: unknown): MiradasSettings {
  const input = isPlainRecord(raw) ? raw : {};
  const names = Array.isArray(input.names) ? input.names : [];

  return {
    level: LEVEL_IDS.includes(input.level as LevelId)
      ? (input.level as LevelId)
      : DEFAULT_SETTINGS.level,
    adults: ADULT_COUNTS.includes(input.adults as AdultCount)
      ? (input.adults as AdultCount)
      : DEFAULT_SETTINGS.adults,
    names: DEFAULT_SETTINGS.names.map((fallback, index) => cleanName(names[index], fallback)),
    voice: typeof input.voice === 'boolean' ? input.voice : DEFAULT_SETTINGS.voice,
    sound: typeof input.sound === 'boolean' ? input.sound : DEFAULT_SETTINGS.sound,
    lookWindow: LOOK_WINDOW_OPTIONS.includes(input.lookWindow as LookWindow)
      ? (input.lookWindow as LookWindow)
      : DEFAULT_SETTINGS.lookWindow,
  };
}

export function normalizeSessions(raw: unknown): SavedSession[] {
  if (!Array.isArray(raw)) return [];

  const sessions: SavedSession[] = [];
  for (const item of raw) {
    if (!isPlainRecord(item)) continue;
    const { date, level, stars, avgLook } = item;
    if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) continue;
    if (!LEVEL_IDS.includes(level as LevelId)) continue;
    if (!Number.isInteger(stars) || (stars as number) < 0 || (stars as number) > 999) continue;

    const look =
      typeof avgLook === 'number' && Number.isFinite(avgLook) && avgLook >= 0 && avgLook <= 60
        ? avgLook
        : null;

    sessions.push({
      date,
      level: level as LevelId,
      stars: stars as number,
      avgLook: look,
    });
  }

  return sessions.slice(-MAX_SAVED_SESSIONS);
}

function isSessionList(value: unknown): value is SavedSession[] {
  return Array.isArray(value);
}

export function loadSettings(storage: GameStorage = gameStorage): MiradasSettings {
  const saved = storage.read<Record<string, unknown>>(SETTINGS_KEY, isPlainRecord);
  return normalizeSettings(saved ?? null);
}

export function saveSettings(
  settings: MiradasSettings,
  storage: GameStorage = gameStorage,
): boolean {
  return storage.write(SETTINGS_KEY, normalizeSettings(settings));
}

export function loadSessions(storage: GameStorage = gameStorage): SavedSession[] {
  const saved = storage.read<SavedSession[]>(SESSIONS_KEY, isSessionList);
  return normalizeSessions(saved ?? []);
}

export function appendSession(
  session: SavedSession,
  storage: GameStorage = gameStorage,
): SavedSession[] {
  const sessions = normalizeSessions([...loadSessions(storage), session]);
  storage.write(SESSIONS_KEY, sessions);
  return sessions;
}

export function clearSessions(storage: GameStorage = gameStorage): void {
  storage.remove(SESSIONS_KEY);
}
