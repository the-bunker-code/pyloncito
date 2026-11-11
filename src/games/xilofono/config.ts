export type Degree = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Octave = 1 | 2;

export const DEGREES: readonly Degree[] = [0, 1, 2, 3, 4, 5, 6];
export const OCTAVES: readonly Octave[] = [1, 2];

export const NOTE_NAMES: Readonly<Record<Degree, string>> = {
  0: 'Do',
  1: 'Re',
  2: 'Mi',
  3: 'Fa',
  4: 'Sol',
  5: 'La',
  6: 'Si',
};

/** Frequencies of the first octave (Hz). The second octave doubles them. */
export const BASE_FREQUENCIES: Readonly<Record<Degree, number>> = {
  0: 261.63,
  1: 293.66,
  2: 329.63,
  3: 349.23,
  4: 392,
  5: 440,
  6: 493.88,
};

/** Semitones from Do to each natural note. */
export const SEMITONES: Readonly<Record<Degree, number>> = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 11,
};

/** Natural notes that have a sharp key: Do# Re# Fa# Sol# La#. */
export const SHARP_DEGREES: readonly Degree[] = [0, 1, 3, 4, 5];

export const NATURAL_KEY_COUNT = DEGREES.length * OCTAVES.length;

export interface KeyDefinition {
  id: number;
  degree: Degree;
  octave: Octave;
  sharp: boolean;
}

/** Ids 0–13 are natural keys; ids 14–23 are sharps, five per octave. */
export function keyId(degree: Degree, octave: Octave, sharp: boolean): number {
  if (!sharp) return (octave - 1) * DEGREES.length + degree;
  const index = SHARP_DEGREES.indexOf(degree);
  if (index < 0) throw new RangeError(`Degree ${degree} has no sharp key`);
  return NATURAL_KEY_COUNT + (octave - 1) * SHARP_DEGREES.length + index;
}

export const KEYS: readonly KeyDefinition[] = [
  ...OCTAVES.flatMap((octave) =>
    DEGREES.map((degree) => ({ id: keyId(degree, octave, false), degree, octave, sharp: false })),
  ),
  ...OCTAVES.flatMap((octave) =>
    SHARP_DEGREES.map((degree) => ({
      id: keyId(degree, octave, true),
      degree,
      octave,
      sharp: true,
    })),
  ),
];

export function keyFrequency(id: number): number {
  const key = KEYS[id];
  if (!key) throw new RangeError(`Unknown key ${id}`);
  const octaveFactor = key.octave === 1 ? 1 : 2;
  const sharpFactor = key.sharp ? 2 ** (1 / 12) : 1;
  return BASE_FREQUENCIES[key.degree] * octaveFactor * sharpFactor;
}

/** Physical keyboard: "asdfghj" plays octave 1, "qwertyu" plays octave 2. */
export const KEYBOARD_MAP: Readonly<Record<string, number>> = Object.fromEntries([
  ...[...'asdfghj'].map((letter, index) => [letter, index] as const),
  ...[...'qwertyu'].map((letter, index) => [letter, index + DEGREES.length] as const),
]);

export const SONG_LIMITS = {
  minTempo: 30,
  maxTempo: 240,
  defaultTempo: 90,
  maxNotes: 500,
  minBeats: 0.25,
  maxBeats: 8,
  minBeatsPerBar: 1,
  maxBeatsPerBar: 12,
  defaultBeatsPerBar: 4,
  titleMaxLength: 80,
  lyricMaxLength: 20,
} as const;

export const TIMING = {
  /** Beats of lead-in before the first note when listening. */
  leadBeats: 2,
  /** Key light when the player taps a key. */
  tapLightMs: 220,
  /** Longest key light while listening. */
  maxPlayLightMs: 400,
  /** Share of the note duration a key stays lit while listening. */
  playLightRatio: 0.8,
  /** Highlight of a note correctly played in the guide. */
  guideHitMs: 300,
  /** Shake of a wrong key in the guide. */
  missMs: 300,
} as const;

export const SHARE_MAX_LENGTH = 100_000;

export const DEFAULT_SONG = {
  title: 'Estrellita',
  tempo: 100,
  notes: [
    'Do',
    'Do',
    'Sol',
    'Sol',
    'La',
    'La',
    'Sol:2',
    'Fa',
    'Fa',
    'Mi',
    'Mi',
    'Re',
    'Re',
    'Do:2',
    'Sol',
    'Sol',
    'Fa',
    'Fa',
    'Mi',
    'Mi',
    'Re:2',
    'Sol',
    'Sol',
    'Fa',
    'Fa',
    'Mi',
    'Mi',
    'Re:2',
    'Do',
    'Do',
    'Sol',
    'Sol',
    'La',
    'La',
    'Sol:2',
    'Fa',
    'Fa',
    'Mi',
    'Mi',
    'Re',
    'Re',
    'Do:2',
  ],
} as const;
