import {
  OCTAVES,
  SEMITONES,
  SHARP_DEGREES,
  SONG_LIMITS,
  keyId,
  type Degree,
  type Octave,
} from './config';

export type SongErrorCode =
  | 'invalid-song'
  | 'missing-notes'
  | 'too-many-notes'
  | 'invalid-default-octave'
  | 'invalid-note'
  | 'unknown-token'
  | 'unknown-note'
  | 'invalid-beats'
  | 'invalid-octave'
  | 'out-of-range';

/** Parse failure. Carries a code (mapped to copy by the UI), the note index and the input. */
export class SongError extends Error {
  readonly code: SongErrorCode;
  readonly index: number | undefined;
  readonly detail: string | undefined;

  constructor(code: SongErrorCode, index?: number, detail?: string) {
    super(index === undefined ? code : `${code} at note ${index + 1}`);
    this.name = 'SongError';
    this.code = code;
    this.index = index;
    this.detail = detail;
  }
}

export interface RestEvent {
  rest: true;
  beats: number;
  lyric: string;
}

export interface NoteEvent {
  rest: false;
  degree: Degree;
  sharp: boolean;
  octave: Octave;
  key: number;
  beats: number;
  lyric: string;
}

export type SongEvent = RestEvent | NoteEvent;

export interface Song {
  raw: unknown;
  /** Empty when the song has no title; the UI shows its own fallback. */
  title: string;
  tempo: number;
  beatsPerBar: number;
  hasSharps: boolean;
  notes: SongEvent[];
}

const NAME_TO_DEGREE: Readonly<Record<string, Degree>> = {
  do: 0,
  re: 1,
  mi: 2,
  fa: 3,
  sol: 4,
  la: 5,
  si: 6,
  c: 0,
  d: 1,
  e: 2,
  f: 3,
  g: 4,
  a: 5,
  b: 6,
};

const REST_NAMES = new Set(['-', '_', 'silencio', 'rest']);

const TOKEN = /^([a-z_-]+?)([#b])?([12])?(?::(\d*\.?\d+))?$/;

type Accidental = '#' | 'b' | undefined;

/** A note before its final octave is known. */
interface PendingNote {
  degree: Degree;
  sharp: boolean;
  /** Octave shift caused by Si# (+1) or Dob (−1). */
  shift: -1 | 0 | 1;
  octave: Octave | undefined;
  beats: number;
  lyric: string;
}

type PendingEvent = RestEvent | (PendingNote & { rest: false });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pick(record: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    if (record[name] !== undefined) return record[name];
  }
  return undefined;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll('♯', '#')
    .replaceAll('♭', 'b')
    .toLowerCase()
    .replace(/\s+/g, '');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toOctave(value: unknown): Octave | undefined {
  const number = typeof value === 'string' ? Number(value) : value;
  return OCTAVES.find((octave) => octave === number);
}

function toBeats(value: unknown, index: number): number {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof number !== 'number' || !Number.isFinite(number) || number <= 0) {
    throw new SongError('invalid-beats', index, String(value));
  }
  return clamp(number, SONG_LIMITS.minBeats, SONG_LIMITS.maxBeats);
}

function applyAccidental(
  degree: Degree,
  accidental: Accidental,
): { degree: Degree; sharp: boolean; shift: -1 | 0 | 1 } {
  if (accidental === '#') {
    if (SHARP_DEGREES.includes(degree)) return { degree, sharp: true, shift: 0 };
    if (degree === 6) return { degree: 0, sharp: false, shift: 1 };
    return { degree: 3, sharp: false, shift: 0 };
  }
  if (accidental === 'b') {
    if (degree === 0) return { degree: 6, sharp: false, shift: -1 };
    if (degree === 3) return { degree: 2, sharp: false, shift: 0 };
    return { degree: (degree - 1) as Degree, sharp: true, shift: 0 };
  }
  return { degree, sharp: false, shift: 0 };
}

function parseEvent(raw: unknown, index: number): PendingEvent {
  let text: unknown = raw;
  let octaveValue: unknown;
  let beatsValue: unknown;
  let lyric = '';

  if (isRecord(raw)) {
    text = pick(raw, 'note', 'nota');
    octaveValue = pick(raw, 'octave', 'octava');
    beatsValue = pick(raw, 'beats', 'tiempos');
    const lyricValue = pick(raw, 'lyric', 'letra');
    if (typeof lyricValue === 'string') lyric = lyricValue.slice(0, SONG_LIMITS.lyricMaxLength);
  }
  if (typeof text !== 'string') throw new SongError('invalid-note', index);

  const match = TOKEN.exec(normalize(text));
  if (!match) throw new SongError('unknown-token', index, text.trim());
  const [, name = '', accidental, tokenOctave, tokenBeats] = match;

  let beats = 1;
  if (beatsValue !== undefined) beats = toBeats(beatsValue, index);
  else if (tokenBeats !== undefined) beats = toBeats(tokenBeats, index);

  if (REST_NAMES.has(name)) return { rest: true, beats, lyric };

  const baseDegree = NAME_TO_DEGREE[name];
  if (baseDegree === undefined) throw new SongError('unknown-note', index, name);

  let octave: Octave | undefined;
  if (octaveValue !== undefined) {
    octave = toOctave(octaveValue);
    if (octave === undefined) throw new SongError('invalid-octave', index, String(octaveValue));
  } else if (tokenOctave !== undefined) {
    octave = toOctave(tokenOctave);
  }

  const { degree, sharp, shift } = applyAccidental(baseDegree, accidental as Accidental);
  return { rest: false, degree, sharp, shift, octave, beats, lyric };
}

function pitchOf(degree: Degree, octave: Octave, sharp: boolean): number {
  return (octave - 1) * 12 + SEMITONES[degree] + (sharp ? 1 : 0);
}

function finalOctave(note: PendingNote, octave: Octave): Octave | undefined {
  return toOctave(octave + note.shift);
}

/** Picks the written octave whose sounding note is closest to the previous pitch. */
function closestOctave(note: PendingNote, previous: number, fallback: Octave): Octave | undefined {
  let best: Octave | undefined;
  let bestDistance = Infinity;
  for (const octave of [fallback, ...OCTAVES.filter((value) => value !== fallback)]) {
    const sounding = finalOctave(note, octave);
    if (sounding === undefined) continue;
    const distance = Math.abs(pitchOf(note.degree, sounding, note.sharp) - previous);
    if (distance < bestDistance) {
      best = octave;
      bestDistance = distance;
    }
  }
  return best;
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Validates and normalizes a song. Accepts a list of notes or an object with
 * `notes`/`notas`. Throws `SongError` with a code; never returns partial data.
 */
export function parseSong(raw: unknown): Song {
  const record = isRecord(raw) ? raw : undefined;
  if (!record && !Array.isArray(raw)) throw new SongError('invalid-song');

  const list = record ? pick(record, 'notes', 'notas') : raw;
  if (!Array.isArray(list) || list.length === 0) throw new SongError('missing-notes');
  if (list.length > SONG_LIMITS.maxNotes) {
    throw new SongError('too-many-notes', undefined, String(list.length));
  }

  let defaultOctave: Octave = 1;
  const octaveValue = record ? pick(record, 'octave', 'octava') : undefined;
  if (octaveValue !== undefined) {
    const octave = toOctave(octaveValue);
    if (octave === undefined) {
      throw new SongError('invalid-default-octave', undefined, String(octaveValue));
    }
    defaultOctave = octave;
  }
  const autoOctave = record ? pick(record, 'auto_octave', 'octava_auto') === true : false;

  let previousPitch: number | undefined;
  const notes = list.map((item: unknown, index): SongEvent => {
    const event = parseEvent(item, index);
    if (event.rest) return event;

    let written = event.octave ?? defaultOctave;
    if (event.octave === undefined && autoOctave && previousPitch !== undefined) {
      written = closestOctave(event, previousPitch, defaultOctave) ?? written;
    }

    const octave = finalOctave(event, written);
    if (octave === undefined) throw new SongError('out-of-range', index, String(item));
    previousPitch = pitchOf(event.degree, octave, event.sharp);
    return {
      rest: false,
      degree: event.degree,
      sharp: event.sharp,
      octave,
      key: keyId(event.degree, octave, event.sharp),
      beats: event.beats,
      lyric: event.lyric,
    };
  });

  const titleValue = record ? pick(record, 'title', 'titulo') : undefined;
  const title =
    typeof titleValue === 'string' ? titleValue.trim().slice(0, SONG_LIMITS.titleMaxLength) : '';

  const tempoValue = positiveNumber(record?.tempo);
  const tempo =
    tempoValue === undefined
      ? SONG_LIMITS.defaultTempo
      : clamp(tempoValue, SONG_LIMITS.minTempo, SONG_LIMITS.maxTempo);

  const barValue = positiveNumber(record ? pick(record, 'beats_per_bar', 'compas') : undefined);
  const beatsPerBar =
    barValue === undefined || Math.round(barValue) < 1
      ? SONG_LIMITS.defaultBeatsPerBar
      : clamp(Math.round(barValue), SONG_LIMITS.minBeatsPerBar, SONG_LIMITS.maxBeatsPerBar);

  return {
    raw,
    title,
    tempo,
    beatsPerBar,
    hasSharps: notes.some((event) => !event.rest && event.sharp),
    notes,
  };
}
