import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancels a pending timeout', async () => {
    const { cancelableTimeout } = await import('../../src/lib/timers');
    const callback = vi.fn();
    const cancel = cancelableTimeout(callback, 100);
    cancel();
    await vi.advanceTimersByTimeAsync(200);
    expect(callback).not.toHaveBeenCalled();
  });

  it('resolves after the requested time', async () => {
    const { wait } = await import('../../src/lib/timers');
    let done = false;
    void wait(100).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(99);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });

  it('rejects when the signal is already aborted', async () => {
    const { wait } = await import('../../src/lib/timers');
    const controller = new AbortController();
    controller.abort();
    await expect(wait(100, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects and clears the timeout when aborted later', async () => {
    const { wait } = await import('../../src/lib/timers');
    const controller = new AbortController();
    const promise = wait(1000, controller.signal);
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(2000);
  });
});
