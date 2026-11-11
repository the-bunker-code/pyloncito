import { describe, expect, it, vi } from 'vitest';
import { UNLOCK_EVENTS, createMarimba } from '../../src/games/xilofono/audio';

function fakeContext(initial: AudioContextState = 'running') {
  const oscillators: number[] = [];
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const node = () => ({ connect: vi.fn((next: unknown) => next) });
  const context = {
    state: initial,
    currentTime: 0,
    destination: {},
    resume: vi.fn(async () => {
      context.state = 'running';
    }),
    createGain: () => ({ ...node(), gain: param() }),
    createOscillator: () => {
      const oscillator = {
        ...node(),
        type: '',
        frequency: param(),
        start: vi.fn(() => oscillators.push(oscillator.frequency.value)),
        stop: vi.fn(),
      };
      return oscillator;
    },
    createBuffer: vi.fn(() => ({})),
    createBufferSource: () => ({ ...node(), buffer: null, start: vi.fn() }),
  };
  return { context, oscillators, asAudio: () => context as unknown as AudioContext };
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createMarimba', () => {
  it('plays three partials for each note when audio runs', () => {
    const fake = fakeContext();
    const marimba = createMarimba({ getContext: fake.asAudio, isMuted: () => false });
    marimba.play(440);
    expect(fake.oscillators).toEqual([440, 1760, 4400]);
  });

  it('stays silent when muted or without audio support', () => {
    const fake = fakeContext();
    createMarimba({ getContext: fake.asAudio, isMuted: () => true }).play(440);
    createMarimba({ getContext: () => null, isMuted: () => false }).play(440);
    expect(fake.oscillators).toEqual([]);
  });

  it('plays the first tap once audio unlocks', async () => {
    const fake = fakeContext('suspended');
    const marimba = createMarimba({ getContext: fake.asAudio, isMuted: () => false, now: () => 0 });
    marimba.play(261.63);
    expect(fake.oscillators).toEqual([]);
    await flushPromises();
    expect(fake.oscillators[0]).toBeCloseTo(261.63);
  });

  it('drops queued notes that would sound too late', async () => {
    const fake = fakeContext('suspended');
    let time = 0;
    fake.context.resume.mockImplementation(async () => {
      time = 1000;
      fake.context.state = 'running';
    });
    const marimba = createMarimba({
      getContext: fake.asAudio,
      isMuted: () => false,
      now: () => time,
    });
    marimba.play(440);
    await flushPromises();
    expect(fake.oscillators).toEqual([]);
  });

  it('unlocks with a silent buffer and reports failures', async () => {
    const fake = fakeContext('suspended');
    const marimba = createMarimba({ getContext: fake.asAudio, isMuted: () => false });
    await expect(marimba.unlock()).resolves.toBe(true);
    expect(fake.context.createBuffer).toHaveBeenCalledWith(1, 1, 22050);

    fake.context.resume.mockRejectedValueOnce(new Error('blocked'));
    await expect(marimba.unlock()).resolves.toBe(false);
    await expect(createMarimba({ getContext: () => null }).unlock()).resolves.toBe(false);
  });

  it('listens for the first gesture and then stops listening', async () => {
    const fake = fakeContext('suspended');
    const target = new EventTarget();
    const add = vi.spyOn(target, 'addEventListener');
    const remove = vi.spyOn(target, 'removeEventListener');
    const marimba = createMarimba({ getContext: fake.asAudio, isMuted: () => false });
    marimba.listen(target);
    expect(add).toHaveBeenCalledTimes(UNLOCK_EVENTS.length);
    target.dispatchEvent(new Event('pointerup'));
    await flushPromises();
    expect(fake.context.resume).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledTimes(UNLOCK_EVENTS.length);
  });
});
