import { createStorage, type GameStorage } from '../../lib/storage';
import {
  LEVELS,
  MODES,
  ROUND_OPTIONS,
  type LevelId,
  type ModeId,
  type RoundOption,
} from './config';

export interface MiraSettings {
  mode: ModeId;
  level: LevelId;
  rounds: RoundOption;
  voice: boolean;
  sound: boolean;
}

export const SETTINGS_KEY = 'settings:v1';

export const DEFAULT_SETTINGS: MiraSettings = Object.freeze({
  mode: 'letters',
  level: 'easy',
  rounds: 5,
  voice: true,
  sound: true,
});

const gameStorage = createStorage('mira-y-dime');

export function normalizeSettings(raw: unknown): MiraSettings {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;

  return {
    mode: pick(
      input.mode,
      MODES.map((mode) => mode.id),
      DEFAULT_SETTINGS.mode,
    ),
    level: pick(
      input.level,
      LEVELS.map((level) => level.id),
      DEFAULT_SETTINGS.level,
    ),
    rounds: pick(Number(input.rounds), ROUND_OPTIONS, DEFAULT_SETTINGS.rounds),
    voice: typeof input.voice === 'boolean' ? input.voice : DEFAULT_SETTINGS.voice,
    sound: typeof input.sound === 'boolean' ? input.sound : DEFAULT_SETTINGS.sound,
  };
}

export function loadSettings(storage: GameStorage = gameStorage): MiraSettings {
  const saved = storage.read<MiraSettings>(SETTINGS_KEY, isMiraSettings);
  return saved ?? normalizeSettings(null);
}

export function saveSettings(settings: MiraSettings, storage: GameStorage = gameStorage): boolean {
  return storage.write(SETTINGS_KEY, normalizeSettings(settings));
}

function isMiraSettings(value: unknown): value is MiraSettings {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<MiraSettings>;
  return (
    MODES.some((mode) => mode.id === candidate.mode) &&
    LEVELS.some((level) => level.id === candidate.level) &&
    ROUND_OPTIONS.includes(candidate.rounds as RoundOption) &&
    typeof candidate.voice === 'boolean' &&
    typeof candidate.sound === 'boolean'
  );
}
