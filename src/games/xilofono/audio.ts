import { getAudioContext, isMuted } from '../../lib/audio';

/** Fundamental plus two fast-decaying overtones: a marimba-like bar. [ratio, volume, seconds] */
const PARTIALS = [
  [1, 1, 1.1],
  [4, 0.3, 0.3],
  [10, 0.08, 0.1],
] as const;
const MASTER_GAIN = 0.5;
const ATTACK_SECONDS = 0.004;

/** Notes tapped while audio was still locked are played late only if they are this recent. */
const PENDING_MAX_AGE_MS = 600;

/** A full gesture (press and release, click or key) is what browsers accept to start audio. */
export const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;

export interface MarimbaDependencies {
  getContext?: () => AudioContext | null;
  isMuted?: () => boolean;
  now?: () => number;
}

export interface Marimba {
  /** Plays a note now, or as soon as audio unlocks. */
  play(frequency: number): void;
  /** Resumes audio inside a user gesture. Resolves true when audio runs. */
  unlock(): Promise<boolean>;
  /** Unlocks audio on the first gesture on `target`; returns a function that stops listening. */
  listen(target: EventTarget): () => void;
}

export function createMarimba(dependencies: MarimbaDependencies = {}): Marimba {
  const getContext = dependencies.getContext ?? getAudioContext;
  const muted = dependencies.isMuted ?? isMuted;
  const now = dependencies.now ?? (() => performance.now());
  const pending: { frequency: number; at: number }[] = [];

  function voice(context: AudioContext, frequency: number): void {
    const start = context.currentTime;
    const master = context.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(context.destination);
    for (const [ratio, volume, seconds] of PARTIALS) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency * ratio;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + ATTACK_SECONDS);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      oscillator.connect(gain).connect(master);
      oscillator.start(start);
      oscillator.stop(start + seconds + 0.05);
    }
  }

  function flush(context: AudioContext): void {
    if (context.state !== 'running') return;
    const time = now();
    for (const note of pending.splice(0)) {
      if (time - note.at < PENDING_MAX_AGE_MS && !muted()) voice(context, note.frequency);
    }
  }

  function play(frequency: number): void {
    if (muted()) return;
    const context = getContext();
    if (!context) return;
    if (context.state === 'running') {
      voice(context, frequency);
      return;
    }
    // The first touch only counts as a gesture once released: keep the note until audio runs.
    pending.push({ frequency, at: now() });
    context
      .resume()
      .then(() => flush(context))
      .catch(() => undefined);
  }

  async function unlock(): Promise<boolean> {
    const context = getContext();
    if (!context) return false;
    try {
      await context.resume();
      // A silent buffer also unlocks iOS Safari.
      const source = context.createBufferSource();
      source.buffer = context.createBuffer(1, 1, 22050);
      source.connect(context.destination);
      source.start(0);
      flush(context);
      return true;
    } catch {
      return false;
    }
  }

  function listen(target: EventTarget): () => void {
    const stop = () => {
      for (const name of UNLOCK_EVENTS) target.removeEventListener(name, handler, true);
    };
    const handler = () => {
      void unlock().then((unlocked) => {
        if (unlocked) stop();
      });
    };
    for (const name of UNLOCK_EVENTS) {
      target.addEventListener(name, handler, { capture: true, passive: true });
    }
    return stop;
  }

  return { play, unlock, listen };
}
