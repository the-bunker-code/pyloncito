import type { Degree, Octave } from './config';
import type { Song, SongEvent } from './song';

/** Drawing units. One staff space is `S`; one beat is `U` wide. */
const S = 16;

export const SCORE = {
  S,
  U: 4.2 * S,
  /** From the start of a note to the centre of its head. */
  HEAD_DX: 1.3 * S,
  /** Top edge of the drawing (above the staff). */
  TOP: -2.2 * S,
  LABEL_Y: 6.95 * S,
  LYRIC_Y: 8.1 * S,
  CLEF_W: 5.6 * S,
  /** Beats of empty staff before the first note. */
  LEAD_BEATS: 2,
  /** Reading line, as a share of the visible staff width. */
  PLAYHEAD: 0.22,
} as const;

/** Treble clef outline from the Noto Music font (SIL Open Font License 1.1). */
export const CLEF_PATH =
  'M314 801Q300 854 291 906Q282 958 282 1012Q282 1059 288 1100Q295 1142 307 1177Q320 1217 341 1252Q362 1288 386 1311Q409 1334 427 1334Q451 1334 493 1249Q514 1206 524 1156Q534 1106 534 1049Q534 978 515 908Q496 837 460 775Q423 713 372 666L407 498Q422 500 432 501Q442 502 447 502Q508 502 556 468Q604 433 632 377Q661 321 661 254Q661 177 622 116Q582 54 503 25Q508 8 532 -117Q538 -147 541 -164Q544 -182 545 -195Q546 -208 546 -225Q546 -275 522 -314Q497 -354 456 -376Q414 -398 363 -398Q311 -398 271 -378Q231 -359 208 -324Q185 -290 185 -245Q185 -197 212 -165Q238 -133 287 -133Q329 -133 356 -164Q382 -194 382 -236Q382 -272 357 -299Q332 -326 292 -326H282Q308 -365 364 -365Q433 -365 472 -320Q511 -275 511 -205Q511 -188 507 -160Q503 -131 493 -91Q483 -51 478 -25Q472 1 470 12Q436 2 390 2Q304 2 222 52Q142 102 96 184Q50 266 50 361Q50 451 91 530Q132 609 192 675Q253 741 314 801ZM341 826Q364 838 390 870Q416 903 440 945Q464 987 479 1030Q494 1072 494 1106Q494 1142 483 1163Q472 1184 445 1184Q421 1184 398 1162Q376 1140 358 1104Q341 1067 331 1022Q321 977 321 930Q321 898 328 872Q334 846 341 826ZM398 379Q371 373 347 354Q323 334 308 306Q294 279 294 248Q294 223 307 196Q320 170 339 154Q352 142 365 136Q380 129 380 123Q380 120 370 117Q332 126 302 151Q271 176 254 212Q236 247 236 287Q236 330 254 370Q271 410 302 442Q334 474 374 490L345 641Q229 547 174 456Q120 366 120 277Q120 212 154 156Q188 100 247 66Q306 31 380 31Q400 31 420 35Q441 39 464 45ZM495 55Q593 97 593 227Q593 270 571 306Q549 341 512 362Q475 383 429 383Z';

/** Glyph bounds: xMin, yMin, xMax, yMax. */
const CLEF_BOX = [50, -398, 661, 1334] as const;

/** SVG transform that fits the clef glyph on the staff. */
export function clefTransform(): string {
  const k = (7.02 * S) / (CLEF_BOX[3] - CLEF_BOX[1]);
  return `translate(${0.5 * S - CLEF_BOX[0] * k} ${-1.39 * S + CLEF_BOX[3] * k}) scale(${k} ${-k})`;
}

export type FigureKind = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

export interface Figure {
  kind: FigureKind;
  dots: 0 | 1;
}

/** Note value for a duration in beats (the beat is a quarter note). */
export function figure(beats: number): Figure {
  if (beats >= 4) return { kind: 'whole', dots: 0 };
  if (beats >= 3) return { kind: 'half', dots: 1 };
  if (beats >= 2) return { kind: 'half', dots: 0 };
  if (beats >= 1.5) return { kind: 'quarter', dots: 1 };
  if (beats >= 1) return { kind: 'quarter', dots: 0 };
  if (beats >= 0.75) return { kind: 'eighth', dots: 1 };
  if (beats >= 0.5) return { kind: 'eighth', dots: 0 };
  return { kind: 'sixteenth', dots: 0 };
}

export interface ScoreNote {
  index: number;
  event: SongEvent;
  /** Start time in beats. */
  start: number;
  x: number;
  /** Horizontal space taken by the note. */
  adv: number;
  /** Centre of the note head. */
  cx: number;
}

export interface ScoreLayout {
  notes: ScoreNote[];
  total: number;
  endX: number;
  width: number;
  height: number;
  hasLyrics: boolean;
  beatsPerBar: number;
  barLines: number[];
}

export function layoutScore(song: Song): ScoreLayout {
  let start = 0;
  let x = 0.7 * S;
  const notes = song.notes.map((event, index): ScoreNote => {
    const adv = Math.max(event.beats * SCORE.U, event.rest ? 2.2 * S : 2.9 * S);
    const note = { index, event, start, x, adv, cx: x + SCORE.HEAD_DX };
    start += event.beats;
    x += adv;
    return note;
  });
  const hasLyrics = song.notes.some((event) => event.lyric !== '');
  const barLines = notes
    .filter((note) => {
      const bars = note.start / song.beatsPerBar;
      return note.start > 0 && Math.abs(bars - Math.round(bars)) < 1e-6;
    })
    .map((note) => note.x - 0.45 * S);

  return {
    notes,
    total: start,
    endX: x,
    width: x + 1.2 * S,
    height: (hasLyrics ? SCORE.LYRIC_Y : SCORE.LABEL_Y) + 0.45 * S - SCORE.TOP,
    hasLyrics,
    beatsPerBar: song.beatsPerBar,
    barLines,
  };
}

/** Horizontal position (drawing units) for a time in beats. */
export function xAt(layout: ScoreLayout, time: number): number {
  const { notes } = layout;
  const first = notes[0];
  const last = notes.at(-1);
  if (!first || !last) return 0;
  if (time < 0) return first.cx + time * SCORE.U;
  if (time >= layout.total) return last.cx + last.adv + (time - layout.total) * SCORE.U;
  const current = notes.findLast((note) => note.start <= time) ?? first;
  return current.cx + ((time - current.start) / current.event.beats) * current.adv;
}

export interface ScoreViewport {
  scale: number;
  clefPx: number;
  playheadPx: number;
  /** Empty staff before the first note, in drawing units. */
  padU: number;
  /** Total staff width, in drawing units. */
  totalU: number;
}

/** Fits the drawing to the score box (pixels). */
export function viewport(layout: ScoreLayout, width: number, height: number): ScoreViewport {
  const scale = height / layout.height;
  const clefPx = SCORE.CLEF_W * scale;
  const playheadPx = clefPx + (width - clefPx) * SCORE.PLAYHEAD;
  const padU = playheadPx / scale + SCORE.LEAD_BEATS * SCORE.U;
  return { scale, clefPx, playheadPx, padU, totalU: padU + layout.width + width / scale };
}

/** Scroll offset (pixels) that puts the given time under the playhead. */
export function scrollForTime(layout: ScoreLayout, view: ScoreViewport, time: number): number {
  return Math.max(0, view.clefPx + (view.padU + xAt(layout, time)) * view.scale - view.playheadPx);
}

/** Vertical position of a note head. Mi of octave 1 sits on the bottom line. */
export function staffY(degree: Degree, octave: Octave): number {
  return 4 * S - (staffStep(degree, octave) * S) / 2;
}

function staffStep(degree: Degree, octave: Octave): number {
  return (octave - 1) * 7 + degree - 2;
}

export interface Shape {
  tag: 'line' | 'path' | 'rect' | 'circle' | 'ellipse';
  className: string;
  attrs: Record<string, number | string>;
}

function line(className: string, x1: number, y1: number, x2: number, y2: number): Shape {
  return { tag: 'line', className, attrs: { x1, y1, x2, y2 } };
}

function circle(className: string, cx: number, cy: number, r: number): Shape {
  return { tag: 'circle', className, attrs: { cx, cy, r } };
}

function restShapes(note: ScoreNote): Shape[] {
  const { kind, dots } = figure(note.event.beats);
  const { cx } = note;
  const shapes: Shape[] = [];
  if (kind === 'whole' || kind === 'half') {
    const y = kind === 'whole' ? S : 1.5 * S;
    shapes.push({
      tag: 'rect',
      className: 'rest-fill',
      attrs: { x: cx - 0.65 * S, y, width: 1.3 * S, height: 0.5 * S, rx: 2 },
    });
  } else if (kind === 'quarter') {
    shapes.push({
      tag: 'path',
      className: 'rest',
      attrs: {
        d: `M${cx - 0.25 * S} ${S}L${cx + 0.3 * S} ${1.6 * S}L${cx - 0.3 * S} ${2.25 * S}L${cx + 0.25 * S} ${2.85 * S}q${-0.55 * S} ${0.05 * S} ${-0.2 * S} ${0.6 * S}`,
      },
    });
  } else {
    const flags = kind === 'eighth' ? 1 : 2;
    shapes.push({
      tag: 'path',
      className: 'rest',
      attrs: { d: `M${cx + 0.35 * S} ${1.15 * S}L${cx - 0.25 * S} ${1.5 * S + flags * 0.8 * S}` },
    });
    for (let flag = 0; flag < flags; flag += 1) {
      shapes.push(
        circle('rest-fill', cx - 0.15 * S - flag * 0.1 * S, 1.35 * S + flag * 0.8 * S, 0.24 * S),
      );
    }
  }
  for (let dot = 0; dot < dots; dot += 1) {
    shapes.push(circle('rest-fill', cx + (0.95 + 0.4 * dot) * S, 1.6 * S, 0.16 * S));
  }
  return shapes;
}

/** SVG shapes of one note or rest (label, lyric and halo are drawn by the component). */
export function noteShapes(note: ScoreNote): Shape[] {
  const { event, cx } = note;
  if (event.rest) return restShapes(note);

  const { kind, dots } = figure(event.beats);
  const step = staffStep(event.degree, event.octave);
  const y = staffY(event.degree, event.octave);
  const shapes: Shape[] = [];

  for (let ledgerY = 5 * S; ledgerY <= y + 0.01; ledgerY += S) {
    shapes.push(line('ledger', cx - 1.05 * S, ledgerY, cx + 1.05 * S, ledgerY));
  }
  for (let ledgerY = -S; ledgerY >= y - 0.01; ledgerY -= S) {
    shapes.push(line('ledger', cx - 1.05 * S, ledgerY, cx + 1.05 * S, ledgerY));
  }

  if (event.sharp) {
    const x = cx - S;
    shapes.push(
      {
        tag: 'path',
        className: 'sharp-v',
        attrs: {
          d: `M${x - 0.17 * S} ${y - 0.85 * S}V${y + S}M${x + 0.17 * S} ${y - S}V${y + 0.85 * S}`,
        },
      },
      {
        tag: 'path',
        className: 'sharp-h',
        attrs: {
          d: `M${x - 0.38 * S} ${y + 0.12 * S}L${x + 0.38 * S} ${y - 0.28 * S}M${x - 0.38 * S} ${y + 0.62 * S}L${x + 0.38 * S} ${y + 0.22 * S}`,
        },
      },
    );
  }

  const hollow = kind === 'whole' || kind === 'half';
  shapes.push({
    tag: 'ellipse',
    className: hollow ? 'head hollow' : 'head',
    attrs: {
      cx,
      cy: y,
      rx: (kind === 'whole' ? 0.78 : 0.68) * S,
      ry: 0.5 * S,
      transform: `rotate(-18 ${cx} ${y})`,
    },
  });

  if (kind !== 'whole') {
    const up = step < 4;
    const direction = up ? 1 : -1;
    const stemX = up ? cx + 0.62 * S : cx - 0.62 * S;
    const stemEnd = y - direction * 3.4 * S;
    shapes.push(line('stem', stemX, y, stemX, stemEnd));
    const flags = kind === 'eighth' ? 1 : kind === 'sixteenth' ? 2 : 0;
    for (let flag = 0; flag < flags; flag += 1) {
      const flagY = stemEnd + flag * 0.8 * S * direction;
      shapes.push({
        tag: 'path',
        className: 'flag',
        attrs: {
          d: `M${stemX} ${flagY}c${0.25 * S} ${0.55 * S * direction} ${0.95 * S} ${0.9 * S * direction} ${0.8 * S} ${2 * S * direction}`,
        },
      });
    }
  }

  for (let dot = 0; dot < dots; dot += 1) {
    // A dot on a line moves up to the space above.
    shapes.push(
      circle('dot', cx + (1.05 + 0.4 * dot) * S, step % 2 === 0 ? y - S / 2 : y, 0.16 * S),
    );
  }

  if (event.beats >= 2) {
    // Long notes stretch towards the next one.
    shapes.push(line('tail', cx + (dots ? 1.7 : 1.15) * S, y, note.x + note.adv - 0.7 * S, y));
  }
  return shapes;
}
