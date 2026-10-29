import { describe, expect, it } from 'vitest';
import { levelById, modeById, MODES, LEVELS } from '../../src/games/mira-y-dime/config';

describe('config', () => {
  it('returns the first mode and level as fallback', () => {
    expect(modeById('nope' as never)).toBe(MODES[0]);
    expect(levelById('nope' as never)).toBe(LEVELS[0]);
  });

  it('returns the requested mode and level', () => {
    expect(modeById('syllables').id).toBe('syllables');
    expect(levelById('hard').id).toBe('hard');
  });
});
