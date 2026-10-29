let context: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export function unlockAudio(): void {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }
  } catch {
    context = null;
  }
}

function tone(frequency: number, duration: number, volume = 0.12, delay = 0): void {
  if (muted || !context) return;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playCountTone(count: number): void {
  tone(330 + count * 20, 0.08);
}

export function playSuccessTone(): void {
  [523, 659, 784].forEach((frequency, index) => tone(frequency, 0.12, 0.12, index * 0.11));
}

export function playSoftErrorTone(): void {
  tone(240, 0.14, 0.08);
}

export async function playTone(frequency = 440, duration = 0.12): Promise<boolean> {
  if (muted) return false;

  try {
    context ??= new AudioContext();
    await context.resume();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    return true;
  } catch {
    return false;
  }
}
