export type ClosingNotice = 'two' | 'one' | 'finished' | null;

export interface SessionState {
  completed: number;
  total: number;
}

export function createSession(total: number): SessionState {
  if (!Number.isInteger(total) || total < 1) {
    throw new Error('A session needs at least one round');
  }
  return { completed: 0, total };
}

export function remainingRounds(state: SessionState): number {
  return Math.max(0, state.total - state.completed);
}

export function advanceSession(state: SessionState): SessionState {
  return { ...state, completed: Math.min(state.total, state.completed + 1) };
}

export function closingNotice(state: SessionState): ClosingNotice {
  const remaining = remainingRounds(state);
  if (remaining === 0) return 'finished';
  if (remaining === 1) return 'one';
  if (remaining === 2) return 'two';
  return null;
}
