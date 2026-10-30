import { describe, expect, it } from 'vitest';
import {
  ADULT_COUNTS,
  ADULTS,
  CARDS_BY_LEVEL,
  CHOICE_COUNT,
  DEFAULT_LOOK_WINDOW,
  LEVEL_IDS,
  LOOK_WINDOW_OPTIONS,
  MAX_SAVED_SESSIONS,
  ROUND,
  SESSION,
  imageOf,
} from '../../src/games/miradas/config';
import {
  averageLook,
  drawCard,
  formatClock,
  pickOptions,
  remainingMs,
  secondsBetween,
  shuffle,
  teamStars,
} from '../../src/games/miradas/rules';
import { createRandom } from '../../src/lib/random';

describe('miradas rules', () => {
  it('shuffle returns a copy with the same items', () => {
    const list = [1, 2, 3, 4, 5];
    const result = shuffle(list, createRandom(7));
    expect([...result].sort()).toEqual(list);
    expect(list).toEqual([1, 2, 3, 4, 5]);
  });

  it('drawCard uses every card before repeating', () => {
    const ids = CARDS_BY_LEVEL[1].map((card) => card.id);
    const random = createRandom(3);
    const seen: string[] = [];
    let deck: string[] = [];
    for (let index = 0; index < ids.length; index += 1) {
      const next = drawCard(deck, ids, random, seen.at(-1) ?? null);
      seen.push(next.id);
      deck = next.deck;
    }
    expect([...seen].sort()).toEqual([...ids].sort());
    expect(deck).toEqual([]);
  });

  it('drawCard reshuffles without repeating the previous card', () => {
    const ids = ['a', 'b', 'c'];
    for (let seed = 1; seed <= 50; seed += 1) {
      expect(drawCard([], ids, createRandom(seed), 'a').id).not.toBe('a');
    }
  });

  it('drawCard works with a single card', () => {
    expect(drawCard([], ['solo'], createRandom(1), 'solo').id).toBe('solo');
  });

  it('drawCard rejects an empty level', () => {
    expect(() => drawCard([], [], createRandom(1))).toThrow('A deck needs at least one card');
  });

  it('pickOptions returns the correct emotion plus a different one', () => {
    const ids = CARDS_BY_LEVEL[3].map((card) => card.id);
    const positions = new Set<number>();
    for (let seed = 1; seed <= 60; seed += 1) {
      const options = pickOptions('happy', ids, createRandom(seed));
      expect(options).toHaveLength(CHOICE_COUNT);
      expect(options).toContain('happy');
      expect(options[0]).not.toBe(options[1]);
      positions.add(options.indexOf('happy'));
    }
    expect(positions.size).toBe(2);
  });

  it('pickOptions degrades safely when there is only one emotion', () => {
    expect(pickOptions('happy', ['happy'], createRandom(1))).toEqual(['happy']);
  });

  it('remainingMs never goes below zero and formatClock rounds up', () => {
    expect(remainingMs(10, 100)).toBe(90);
    expect(remainingMs(500, 100)).toBe(0);
    expect(formatClock(300_000)).toBe('5:00');
    expect(formatClock(270_000)).toBe('4:30');
    expect(formatClock(269_001)).toBe('4:30');
    expect(formatClock(1)).toBe('0:01');
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(-5)).toBe('0:00');
  });

  it('averageLook averages one decimal and keeps null without looks', () => {
    expect(averageLook([])).toBeNull();
    expect(averageLook([2, 3, 4.1])).toBe(3);
    expect(averageLook([1.2])).toBe(1.2);
    expect(averageLook([0])).toBe(0);
  });

  it('teamStars adds every adult and secondsBetween uses one decimal', () => {
    expect(teamStars([2, 1, 0])).toBe(3);
    expect(secondsBetween(1000, 3460)).toBe(2.5);
    expect(secondsBetween(5000, 1000)).toBe(0);
  });
});

describe('miradas config', () => {
  it('keeps the session timing and offers adjustable look windows', () => {
    expect(SESSION.durationMs).toBe(5 * 60 * 1000);
    expect(SESSION.warnAtMs).toBe(4.5 * 60 * 1000);
    expect(ROUND.countGapMs).toBe(1_000);
    expect(ROUND.waitTickMs).toBe(250);
    expect(LOOK_WINDOW_OPTIONS).toEqual([3, 5, 10, 15, 20, 30]);
    expect(DEFAULT_LOOK_WINDOW).toBe(10);
    expect(ADULTS.max).toBe(3);
    expect(ADULTS.nameMaxLength).toBe(20);
    expect(MAX_SAVED_SESSIONS).toBe(60);
    expect(LEVEL_IDS).toEqual([1, 2, 3]);
    expect(ADULT_COUNTS).toEqual([1, 2, 3]);
  });

  it('keeps 6 rewards, 5 faces and 4 emotions', () => {
    expect(CARDS_BY_LEVEL[1]).toHaveLength(6);
    expect(CARDS_BY_LEVEL[2]).toHaveLength(5);
    expect(CARDS_BY_LEVEL[3]).toHaveLength(4);
  });

  it('never reuses an image or an id across cards', () => {
    const cards = Object.values(CARDS_BY_LEVEL).flat();
    expect(new Set(cards.map((card) => card.image)).size).toBe(cards.length);
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
  });

  it('finds the image of a card and rejects unknown ones', () => {
    expect(imageOf('bubbles')).toBe('/miradas/burbujas.svg');
    expect(imageOf('happy')).toBe('/miradas/feliz.svg');
    expect(() => imageOf('nope')).toThrow('Tarjeta desconocida: nope');
  });
});
