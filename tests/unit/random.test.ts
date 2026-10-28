import { describe, expect, it } from 'vitest';
import { createRandom, pick, shuffle } from '../../src/lib/random';

describe('random', () => {
  it('is deterministic for the same seed', () => {
    const first = createRandom(123);
    const second = createRandom(123);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('returns values between 0 and 1', () => {
    const random = createRandom(7);
    for (let index = 0; index < 100; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('picks an item and rejects an empty list', () => {
    const random = createRandom(42);
    expect(pick(random, ['rojo', 'verde', 'azul'])).toMatch(/^(rojo|verde|azul)$/);
    expect(() => pick(random, [])).toThrow('Cannot pick from an empty list');
  });

  it('shuffles without losing items', () => {
    const random = createRandom(99);
    const source = ['a', 'b', 'c', 'd'];
    const result = shuffle(random, source);
    expect(result).toHaveLength(source.length);
    expect([...result].sort()).toEqual([...source].sort());
    expect(source).toEqual(['a', 'b', 'c', 'd']);
  });
});
