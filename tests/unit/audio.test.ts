import { beforeEach, describe, expect, it, vi } from 'vitest';

class FakeParam {
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class FakeOscillator {
  type = 'sine';
  frequency = new FakeParam();
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeGain {
  gain = new FakeParam();
  connect = vi.fn();
}

class FakeAudioContext {
  static last: FakeAudioContext | null = null;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  createOscillator = vi.fn(() => new FakeOscillator());
  createGain = vi.fn(() => new FakeGain());

  constructor() {
    FakeAudioContext.last = this;
  }
}

describe('audio', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  it('creates and resumes the context once', async () => {
    const { unlockAudio } = await import('../../src/lib/audio');
    unlockAudio();
    unlockAudio();
    expect(FakeAudioContext.last?.resume).toHaveBeenCalled();
  });

  it('does not resume a running context', async () => {
    const { unlockAudio } = await import('../../src/lib/audio');
    const context = new FakeAudioContext();
    context.state = 'running';
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => context),
    );
    unlockAudio();
    expect(context.resume).not.toHaveBeenCalled();
  });

  it('plays the count, success and error tones when unmuted', async () => {
    const { playCountTone, playSoftErrorTone, playSuccessTone, setMuted, unlockAudio } =
      await import('../../src/lib/audio');
    setMuted(false);
    unlockAudio();
    playCountTone(2);
    playSuccessTone();
    playSoftErrorTone();
    expect(FakeAudioContext.last?.createOscillator).toHaveBeenCalled();
    expect(FakeAudioContext.last?.state).toBe('running');
  });

  it('playTone returns false when muted or when AudioContext fails', async () => {
    const { playTone, setMuted, unlockAudio } = await import('../../src/lib/audio');
    setMuted(true);
    expect(await playTone()).toBe(false);
    setMuted(false);
    unlockAudio();
    expect(await playTone(440, 0.1)).toBe(true);

    vi.resetModules();
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('blocked');
        }
      },
    );
    const broken = await import('../../src/lib/audio');
    broken.unlockAudio();
    expect(await broken.playTone()).toBe(false);
  });
});
