import type { IconName } from '../../components/ui/icons';

export type LevelId = 1 | 2 | 3;
export type AdultCount = 1 | 2 | 3;

export interface Card {
  id: string;
  image: string;
}

export const LOOK_WINDOW_OPTIONS = [3, 5, 10, 15, 20, 30] as const;
export type LookWindow = (typeof LOOK_WINDOW_OPTIONS)[number];
export const DEFAULT_LOOK_WINDOW: LookWindow = 10;

export const SESSION = {
  durationMs: 5 * 60 * 1000,
  warnAtMs: 4.5 * 60 * 1000,
} as const;

export const ROUND = {
  countGapMs: 1000,
  waitTickMs: 250,
} as const;

export const ADULTS = {
  max: 3,
  nameMaxLength: 20,
} as const;

export const MAX_SAVED_SESSIONS = 60;
export const CHOICE_COUNT = 2;

export const ADULT_FACES = [
  '/miradas/adulto-1.svg',
  '/miradas/adulto-2.svg',
  '/miradas/adulto-3.svg',
] as const;

export const REWARDS = [
  { id: 'bubbles', image: '/miradas/burbujas.svg' },
  { id: 'song', image: '/miradas/cancion.svg' },
  { id: 'plane', image: '/miradas/avion.svg' },
  { id: 'block', image: '/miradas/bloque.svg' },
  { id: 'applause', image: '/miradas/aplausos.svg' },
  { id: 'tickles', image: '/miradas/cosquillas.svg' },
] as const satisfies readonly Card[];

export const FACES = [
  { id: 'tongue', image: '/miradas/lengua.svg' },
  { id: 'kiss', image: '/miradas/beso.svg' },
  { id: 'wide', image: '/miradas/ojos-grandes.svg' },
  { id: 'blink', image: '/miradas/ojos-cerrados.svg' },
  { id: 'teeth', image: '/miradas/dientes.svg' },
] as const satisfies readonly Card[];

export const EMOTIONS = [
  { id: 'happy', image: '/miradas/feliz.svg' },
  { id: 'sad', image: '/miradas/triste.svg' },
  { id: 'surprised', image: '/miradas/sorprendido.svg' },
  { id: 'angry', image: '/miradas/enojado.svg' },
] as const satisfies readonly Card[];

export const CARDS_BY_LEVEL: Record<LevelId, readonly Card[]> = {
  1: REWARDS,
  2: FACES,
  3: EMOTIONS,
};

export const LEVEL_ICONS: Record<LevelId, IconName> = {
  1: 'signal-low',
  2: 'signal-medium',
  3: 'signal-high',
};

export const LEVEL_IDS = [1, 2, 3] as const satisfies readonly LevelId[];
export const ADULT_COUNTS = [1, 2, 3] as const satisfies readonly AdultCount[];

export function imageOf(cardId: string): string {
  const card = Object.values(CARDS_BY_LEVEL)
    .flat()
    .find((entry) => entry.id === cardId);
  if (!card) throw new Error(`Tarjeta desconocida: ${cardId}`);
  return card.image;
}
