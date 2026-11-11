import { describe, expect, it } from 'vitest';
import {
  SCORE,
  figure,
  layoutScore,
  noteShapes,
  scrollForTime,
  staffY,
  viewport,
  xAt,
  type Shape,
} from '../../src/games/xilofono/score';
import { parseSong } from '../../src/games/xilofono/song';

const { S, U } = SCORE;

function shapes(raw: unknown, index = 0): Shape[] {
  const layout = layoutScore(parseSong({ notes: [raw] }));
  const note = layout.notes[index];
  if (!note) throw new Error('Missing note');
  return noteShapes(note);
}

function ofClass(list: Shape[], className: string): Shape[] {
  return list.filter((shape) => shape.className === className);
}

describe('figure', () => {
  it.each([
    [8, 'whole', 0],
    [4, 'whole', 0],
    [3, 'half', 1],
    [2, 'half', 0],
    [1.5, 'quarter', 1],
    [1, 'quarter', 0],
    [0.75, 'eighth', 1],
    [0.5, 'eighth', 0],
    [0.25, 'sixteenth', 0],
  ])('%s beats → %s with %s dots', (beats, kind, dots) => {
    expect(figure(beats)).toEqual({ kind, dots });
  });
});

describe('layoutScore', () => {
  const song = parseSong({ beats_per_bar: 2, notes: ['Do', 'Re:2', '-', 'Mi:0.25', 'Fa'] });
  const layout = layoutScore(song);

  it('places notes by start time with a minimum width', () => {
    expect(layout.notes.map((note) => note.start)).toEqual([0, 1, 3, 4, 4.25]);
    expect(layout.notes[0]).toMatchObject({ x: 0.7 * S, adv: U, cx: 0.7 * S + SCORE.HEAD_DX });
    expect(layout.notes[1]?.adv).toBe(2 * U);
    expect(layout.notes[3]?.adv).toBe(2.9 * S);
    expect(layout.total).toBe(5.25);
  });

  it('draws bar lines on whole bars and a final double bar', () => {
    expect(layout.barLines).toEqual([(layout.notes[3]?.x ?? 0) - 0.45 * S]);
    expect(layout.endX).toBeCloseTo(layout.notes.reduce((x, note) => x + note.adv, 0.7 * S));
    expect(layout.width).toBeCloseTo(layout.endX + 1.2 * S);
  });

  it('makes room for lyrics only when the song has them', () => {
    const plain = layoutScore(parseSong(['Do']));
    const sung = layoutScore(parseSong({ notes: [{ note: 'Do', lyric: 'la' }] }));
    expect(plain.hasLyrics).toBe(false);
    expect(sung.hasLyrics).toBe(true);
    expect(sung.height).toBeGreaterThan(plain.height);
    expect(plain.height).toBeCloseTo(SCORE.LABEL_Y + 0.45 * S - SCORE.TOP);
  });
});

describe('xAt', () => {
  const layout = layoutScore(parseSong(['Do', 'Re:2']));
  const [first, second] = layout.notes;

  it('interpolates inside each note', () => {
    expect(xAt(layout, 0)).toBe(first?.cx);
    expect(xAt(layout, 0.5)).toBeCloseTo((first?.cx ?? 0) + U / 2);
    expect(xAt(layout, 2)).toBeCloseTo((second?.cx ?? 0) + U);
  });

  it('extends before the start and after the end at one beat per U', () => {
    expect(xAt(layout, -2)).toBeCloseTo((first?.cx ?? 0) - 2 * U);
    expect(xAt(layout, 4)).toBeCloseTo((second?.cx ?? 0) + (second?.adv ?? 0) + U);
  });
});

describe('noteShapes', () => {
  it('puts Mi of octave 1 on the bottom line and Fa of octave 2 on the top one', () => {
    expect(staffY(2, 1)).toBe(4 * S);
    expect(staffY(3, 2)).toBe(0);
  });

  it('adds ledger lines for Do 1, La 2 and Si 2 only', () => {
    expect(ofClass(shapes('Do'), 'ledger')).toHaveLength(1);
    expect(ofClass(shapes('Re'), 'ledger')).toHaveLength(0);
    expect(ofClass(shapes('Sol2'), 'ledger')).toHaveLength(0);
    expect(ofClass(shapes('La2'), 'ledger')).toHaveLength(1);
    expect(ofClass(shapes('Si2'), 'ledger')).toHaveLength(1);
  });

  it('turns stems down from Si of octave 1', () => {
    const [low] = ofClass(shapes('La'), 'stem');
    const [high] = ofClass(shapes('Si'), 'stem');
    expect(Number(low?.attrs.y2)).toBeLessThan(Number(low?.attrs.y1));
    expect(Number(high?.attrs.y2)).toBeGreaterThan(Number(high?.attrs.y1));
  });

  it('draws hollow heads without stems for whole notes', () => {
    const list = shapes('Do:4');
    expect(ofClass(list, 'head hollow')).toHaveLength(1);
    expect(ofClass(list, 'stem')).toHaveLength(0);
    expect(ofClass(list, 'tail')).toHaveLength(1);
  });

  it('draws flags, dots and sharps', () => {
    expect(ofClass(shapes('Do:0.5'), 'flag')).toHaveLength(1);
    expect(ofClass(shapes('Do:0.25'), 'flag')).toHaveLength(2);
    expect(ofClass(shapes('Do:1.5'), 'dot')).toHaveLength(1);
    expect(ofClass(shapes('Do#'), 'sharp-v')).toHaveLength(1);
    expect(ofClass(shapes('Do'), 'sharp-v')).toHaveLength(0);
    expect(ofClass(shapes('Do'), 'tail')).toHaveLength(0);
  });

  it('draws each rest figure', () => {
    expect(ofClass(shapes('-:4'), 'rest-fill')).toHaveLength(1);
    expect(ofClass(shapes('-:2'), 'rest-fill')).toHaveLength(1);
    expect(ofClass(shapes('-'), 'rest')).toHaveLength(1);
    expect(ofClass(shapes('-:0.5'), 'rest-fill')).toHaveLength(1);
    expect(ofClass(shapes('-:0.25'), 'rest-fill')).toHaveLength(2);
    expect(ofClass(shapes('-:3'), 'rest-fill')).toHaveLength(2);
  });
});

describe('viewport and scrolling', () => {
  const layout = layoutScore(parseSong(['Do', 'Re']));

  it('scales the drawing to the available height', () => {
    const view = viewport(layout, 1000, layout.height * 2);
    expect(view.scale).toBe(2);
    expect(view.clefPx).toBe(SCORE.CLEF_W * 2);
    expect(view.playheadPx).toBeCloseTo(view.clefPx + (1000 - view.clefPx) * SCORE.PLAYHEAD);
    expect(view.padU).toBeCloseTo(view.playheadPx / 2 + SCORE.LEAD_BEATS * U);
    expect(view.totalU).toBeCloseTo(view.padU + layout.width + 1000 / 2);
  });

  it('puts the note under the playhead at its start time', () => {
    const view = viewport(layout, 1000, layout.height);
    const left = scrollForTime(layout, view, 1);
    const second = layout.notes[1];
    expect(view.clefPx + (view.padU + (second?.cx ?? 0)) * view.scale - left).toBeCloseTo(
      view.playheadPx,
    );
  });

  it('never scrolls before the beginning', () => {
    const view = viewport(layout, 1000, layout.height);
    expect(scrollForTime(layout, view, -SCORE.LEAD_BEATS)).toBeGreaterThanOrEqual(0);
    expect(scrollForTime(layout, view, -50)).toBe(0);
  });
});
