import { describe, expect, it } from 'vitest';
import {
  advanceSession,
  closingNotice,
  createSession,
  remainingRounds,
} from '../../src/games/shared/session';

describe('session', () => {
  it('creates a round session', () => {
    const session = createSession(3);
    expect(session.completed).toBe(0);
    expect(remainingRounds(session)).toBe(3);
    expect(closingNotice(session)).toBeNull();
  });

  it('rejects invalid totals', () => {
    expect(() => createSession(0)).toThrow('A session needs at least one round');
    expect(() => createSession(1.5)).toThrow('A session needs at least one round');
  });

  it('announces the last two rounds and the end', () => {
    let session = createSession(3);
    session = advanceSession(session);
    expect(closingNotice(session)).toBe('two');
    session = advanceSession(session);
    expect(closingNotice(session)).toBe('one');
    session = advanceSession(session);
    expect(closingNotice(session)).toBe('finished');
    expect(remainingRounds(session)).toBe(0);
  });

  it('never advances past the total', () => {
    const session = advanceSession(advanceSession(createSession(1)));
    expect(session.completed).toBe(1);
    expect(advanceSession(session).completed).toBe(1);
  });
});
