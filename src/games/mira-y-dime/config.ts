import type { IconName } from '../../components/ui/icons';

export type ModeId = 'letters' | 'syllables' | 'shortPhrase' | 'longPhrase';
export type LevelId = 'easy' | 'medium' | 'hard';
export type ThemeName = 'home' | ModeId;

export interface ModeDefinition {
  id: ModeId;
  icon: IconName;
  theme: ThemeName;
}

export interface LevelDefinition {
  id: LevelId;
  icon: IconName;
}

export interface LevelRule {
  min: number;
  max: number;
  bank: number;
  guide: boolean;
}

export const MODES: readonly ModeDefinition[] = [
  { id: 'letters', icon: 'pencil', theme: 'letters' },
  { id: 'syllables', icon: 'message-circle-heart', theme: 'syllables' },
  { id: 'shortPhrase', icon: 'book', theme: 'shortPhrase' },
  { id: 'longPhrase', icon: 'star', theme: 'longPhrase' },
];

export const LEVELS: readonly LevelDefinition[] = [
  { id: 'easy', icon: 'signal-low' },
  { id: 'medium', icon: 'signal-medium' },
  { id: 'hard', icon: 'signal-high' },
];

export const LEVEL_RULES: Record<ModeId, Record<LevelId, LevelRule>> = {
  syllables: {
    easy: { min: 2, max: 2, bank: 2, guide: true },
    medium: { min: 3, max: 3, bank: 3, guide: true },
    hard: { min: 4, max: 5, bank: 4, guide: false },
  },
  letters: {
    easy: { min: 3, max: 4, bank: 2, guide: true },
    medium: { min: 3, max: 6, bank: 3, guide: true },
    hard: { min: 3, max: 6, bank: 4, guide: false },
  },
  shortPhrase: {
    easy: { min: 2, max: 2, bank: 2, guide: true },
    medium: { min: 2, max: 2, bank: 2, guide: true },
    hard: { min: 2, max: 2, bank: 2, guide: false },
  },
  longPhrase: {
    easy: { min: 3, max: 3, bank: 3, guide: true },
    medium: { min: 3, max: 4, bank: 3, guide: true },
    hard: { min: 4, max: 4, bank: 4, guide: false },
  },
};

export const MAX_PHRASE_WORDS = 4;
export const MISSES_BEFORE_HELP = 2;
export const ROUND_OPTIONS = [3, 5, 8] as const;
export type RoundOption = (typeof ROUND_OPTIONS)[number];

export const TIMING = {
  beforeShow: 300,
  nextRound: 900,
  saidPause: 700,
  helpStep: 350,
  helpSettle: 75,
  speechCap: 2000,
  endButtons: 2000,
  shake: 175,
  hop: 300,
} as const;

export function modeById(id: ModeId): ModeDefinition {
  return MODES.find((mode) => mode.id === id) ?? MODES[0]!;
}

export function levelById(id: LevelId): LevelDefinition {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0]!;
}
