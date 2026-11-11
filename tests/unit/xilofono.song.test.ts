import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SONG, keyId } from '../../src/games/xilofono/config';
import {
  SongError,
  parseSong,
  type NoteEvent,
  type SongEvent,
} from '../../src/games/xilofono/song';

function note(event: SongEvent | undefined): NoteEvent {
  if (!event || event.rest) throw new Error('Expected a note');
  return event;
}

function first(raw: unknown): NoteEvent {
  return note(parseSong({ notes: [raw] }).notes[0]);
}

function errorOf(run: () => unknown): SongError {
  try {
    run();
  } catch (error) {
    if (error instanceof SongError) return error;
    throw error;
  }
  throw new Error('Expected a SongError');
}

describe('parseSong: notes', () => {
  it('accepts Spanish and English names in octave 1 by default', () => {
    expect(first('Do')).toMatchObject({ degree: 0, octave: 1, sharp: false, beats: 1 });
    expect(first('sol')).toMatchObject({ degree: 4, octave: 1 });
    expect(first('G')).toMatchObject({ degree: 4, octave: 1 });
    expect(first('B2')).toMatchObject({ degree: 6, octave: 2, key: keyId(6, 2, false) });
  });

  it('ignores accents and spacing', () => {
    expect(first(' Sól2 ')).toMatchObject({ degree: 4, octave: 2 });
  });

  it('reads beats after a colon', () => {
    expect(first('Mi:2').beats).toBe(2);
    expect(first('Re2:0.5')).toMatchObject({ degree: 1, octave: 2, beats: 0.5 });
    expect(first('La:.5').beats).toBe(0.5);
  });

  it('clamps beats to 0.25–8', () => {
    expect(first('Do:0.1').beats).toBe(0.25);
    expect(first('Do:20').beats).toBe(8);
  });

  it('rejects zero or invalid beats', () => {
    expect(errorOf(() => first('Do:0'))).toMatchObject({ code: 'invalid-beats', index: 0 });
    expect(errorOf(() => first({ note: 'Do', beats: 'x' }))).toMatchObject({
      code: 'invalid-beats',
    });
  });

  it('accepts the long object form in English and Spanish', () => {
    expect(first({ note: 'La', octave: 2, beats: 2, lyric: 'es-tás' })).toMatchObject({
      degree: 5,
      octave: 2,
      beats: 2,
      lyric: 'es-tás',
    });
    expect(first({ nota: 'Fa', octava: 2, tiempos: 3, letra: 'sol' })).toMatchObject({
      degree: 3,
      octave: 2,
      beats: 3,
      lyric: 'sol',
    });
  });

  it('limits lyrics to 20 characters', () => {
    expect(first({ note: 'Do', lyric: 'a'.repeat(30) }).lyric).toHaveLength(20);
  });

  it('parses rests with optional beats', () => {
    const { notes } = parseSong({ notes: ['-', 'silencio:2', '_', 'rest:0.5'] });
    expect(notes).toEqual([
      { rest: true, beats: 1, lyric: '' },
      { rest: true, beats: 2, lyric: '' },
      { rest: true, beats: 1, lyric: '' },
      { rest: true, beats: 0.5, lyric: '' },
    ]);
  });

  it('rejects unknown tokens and note names', () => {
    expect(errorOf(() => first('Do3'))).toMatchObject({ code: 'unknown-token', detail: 'Do3' });
    expect(errorOf(() => first('Ut'))).toMatchObject({ code: 'unknown-note', detail: 'ut' });
    expect(errorOf(() => first(42))).toMatchObject({ code: 'invalid-note' });
  });

  it('reports the position of the failing note', () => {
    expect(errorOf(() => parseSong({ notes: ['Do', 'Re', 'Xx'] }))).toMatchObject({
      code: 'unknown-note',
      index: 2,
    });
  });
});

describe('parseSong: sharps and flats', () => {
  it('maps sharps to the sharp keys', () => {
    expect(first('Do#')).toMatchObject({ degree: 0, sharp: true, key: keyId(0, 1, true) });
    expect(first('La#2')).toMatchObject({ degree: 5, octave: 2, sharp: true });
    expect(first('Fa♯')).toMatchObject({ degree: 3, sharp: true });
  });

  it('maps flats to the sharp of the note below', () => {
    expect(first('Reb')).toMatchObject({ degree: 0, sharp: true });
    expect(first('Mib')).toMatchObject({ degree: 1, sharp: true });
    expect(first('Solb')).toMatchObject({ degree: 3, sharp: true });
    expect(first('Lab')).toMatchObject({ degree: 4, sharp: true });
    expect(first('Sib')).toMatchObject({ degree: 5, sharp: true });
    expect(first('Bb')).toMatchObject({ degree: 5, sharp: true });
    expect(first('Si♭2')).toMatchObject({ degree: 5, octave: 2, sharp: true });
  });

  it('turns Mi# into Fa and Fab into Mi', () => {
    expect(first('Mi#')).toMatchObject({ degree: 3, sharp: false, octave: 1 });
    expect(first('Fab2')).toMatchObject({ degree: 2, sharp: false, octave: 2 });
  });

  it('turns Si# into Do of the next octave', () => {
    expect(first('Si#')).toMatchObject({ degree: 0, sharp: false, octave: 2 });
  });

  it('turns Dob into Si of the previous octave', () => {
    expect(first('Dob2')).toMatchObject({ degree: 6, sharp: false, octave: 1 });
  });

  it('rejects notes that fall outside the two octaves', () => {
    expect(errorOf(() => first('Si#2'))).toMatchObject({ code: 'out-of-range', index: 0 });
    expect(errorOf(() => first('Dob'))).toMatchObject({ code: 'out-of-range' });
  });

  it('flags songs that need sharp keys', () => {
    expect(parseSong({ notes: ['Do', 'Re'] }).hasSharps).toBe(false);
    expect(parseSong({ notes: ['Do', 'Sib'] }).hasSharps).toBe(true);
    expect(parseSong({ notes: ['Mi#', 'Si#'] }).hasSharps).toBe(false);
  });
});

describe('parseSong: octaves', () => {
  it('rejects octaves other than 1 or 2', () => {
    expect(errorOf(() => first({ note: 'Do', octave: 3 }))).toMatchObject({
      code: 'invalid-octave',
    });
    expect(errorOf(() => first({ note: 'Do', octave: 0 }))).toMatchObject({
      code: 'invalid-octave',
    });
  });

  it('uses the song default octave for notes without one', () => {
    const song = parseSong({ octave: 2, notes: ['Do', 'Re1'] });
    expect(song.notes.map((event) => note(event).octave)).toEqual([2, 1]);
    expect(parseSong({ octava: 2, notas: ['Mi'] }).notes[0]).toMatchObject({ octave: 2 });
  });

  it('rejects an invalid default octave', () => {
    expect(errorOf(() => parseSong({ octave: 3, notes: ['Do'] }))).toMatchObject({
      code: 'invalid-default-octave',
    });
  });

  it('picks the closest octave with auto_octave', () => {
    const song = parseSong({ auto_octave: true, notes: ['La', 'Do', 'Si2', 'Do', 'Sol', 'Re'] });
    expect(song.notes.map((event) => note(event).octave)).toEqual([1, 2, 2, 2, 1, 1]);
  });

  it('keeps explicit octaves with auto_octave', () => {
    const song = parseSong({ octava_auto: true, notes: ['Si2', 'Do1'] });
    expect(song.notes.map((event) => note(event).octave)).toEqual([2, 1]);
  });

  it('only picks octaves that keep shifted notes in range', () => {
    const song = parseSong({ auto_octave: true, notes: ['Do', 'Si#'] });
    expect(note(song.notes[1])).toMatchObject({ degree: 0, octave: 2 });
  });
});

describe('parseSong: song fields', () => {
  it('accepts a bare list of notes', () => {
    const song = parseSong(['Do', 'Re']);
    expect(song.notes).toHaveLength(2);
    expect(song.title).toBe('');
    expect(song.tempo).toBe(90);
    expect(song.beatsPerBar).toBe(4);
  });

  it('reads title and tempo with Spanish aliases', () => {
    const song = parseSong({ titulo: 'Mi canción', tempo: 120, compas: 3, notas: ['Do'] });
    expect(song).toMatchObject({ title: 'Mi canción', tempo: 120, beatsPerBar: 3 });
  });

  it('clamps tempo to 30–240 and falls back to 90', () => {
    expect(parseSong({ tempo: 10, notes: ['Do'] }).tempo).toBe(30);
    expect(parseSong({ tempo: 900, notes: ['Do'] }).tempo).toBe(240);
    expect(parseSong({ tempo: 'rápido', notes: ['Do'] }).tempo).toBe(90);
    expect(parseSong({ tempo: -5, notes: ['Do'] }).tempo).toBe(90);
  });

  it('clamps beats per bar to 1–12', () => {
    expect(parseSong({ beats_per_bar: 0, notes: ['Do'] }).beatsPerBar).toBe(4);
    expect(parseSong({ beats_per_bar: 30, notes: ['Do'] }).beatsPerBar).toBe(12);
    expect(parseSong({ beats_per_bar: 2.6, notes: ['Do'] }).beatsPerBar).toBe(3);
  });

  it('limits the title to 80 characters', () => {
    expect(parseSong({ title: 'x'.repeat(100), notes: ['Do'] }).title).toHaveLength(80);
  });

  it('keeps the raw data for sharing', () => {
    const raw = { title: 'A', notes: ['Do'] };
    expect(parseSong(raw).raw).toBe(raw);
  });

  it('rejects data that is not a song', () => {
    expect(errorOf(() => parseSong(null))).toMatchObject({ code: 'invalid-song' });
    expect(errorOf(() => parseSong('Do Re Mi'))).toMatchObject({ code: 'invalid-song' });
    expect(errorOf(() => parseSong({ title: 'Vacía' }))).toMatchObject({
      code: 'missing-notes',
    });
    expect(errorOf(() => parseSong({ notes: [] }))).toMatchObject({ code: 'missing-notes' });
  });

  it('accepts 500 notes and rejects more', () => {
    expect(parseSong({ notes: Array.from({ length: 500 }, () => 'Do') }).notes).toHaveLength(500);
    expect(
      errorOf(() => parseSong({ notes: Array.from({ length: 501 }, () => 'Do') })),
    ).toMatchObject({ code: 'too-many-notes' });
  });
});

describe('parseSong: sample songs', () => {
  const files = [
    'estrellita.json',
    'himno-alegria.json',
    'melodia-principal.json',
    'mi-corazon-encantado.json',
  ];

  it.each(files)('parses public/canciones/%s', (file) => {
    const raw: unknown = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/canciones', file), 'utf8'),
    );
    const song = parseSong(raw);
    expect(song.title).not.toBe('');
    expect(song.notes.length).toBeGreaterThan(0);
  });

  it('parses the built-in default song', () => {
    expect(parseSong(DEFAULT_SONG).notes).toHaveLength(42);
  });
});
