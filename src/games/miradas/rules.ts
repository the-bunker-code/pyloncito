import { shuffle as shuffleWith, type Random } from '../../lib/random';

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  return shuffleWith(random, items);
}

export interface DrawResult {
  id: string;
  deck: string[];
}

export function drawCard(
  deck: readonly string[],
  allIds: readonly string[],
  random: Random,
  lastId: string | null = null,
): DrawResult {
  if (allIds.length === 0) throw new Error('A deck needs at least one card');

  let pool = [...deck];
  if (pool.length === 0) {
    pool = shuffle(allIds, random);
    if (allIds.length > 1 && pool[0] === lastId) {
      pool.push(pool.shift()!);
    }
  }

  const id = pool.shift()!;
  return { id, deck: pool };
}

export function pickOptions(
  correctId: string,
  emotionIds: readonly string[],
  random: Random,
): string[] {
  const others = emotionIds.filter((id) => id !== correctId);
  if (others.length === 0) return [correctId];

  const other = others[Math.floor(random() * others.length)]!;
  return shuffle([correctId, other], random);
}

export function remainingMs(elapsedMs: number, durationMs: number): number {
  return Math.max(0, durationMs - elapsedMs);
}

export function formatClock(milliseconds: number): string {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function averageLook(looks: readonly number[]): number | null {
  if (looks.length === 0) return null;
  const sum = looks.reduce((total, value) => total + value, 0);
  return Math.round((sum / looks.length) * 10) / 10;
}

export function teamStars(starsByAdult: readonly number[]): number {
  return starsByAdult.reduce((total, value) => total + value, 0);
}

export function secondsBetween(fromMs: number, toMs: number): number {
  return Math.round(Math.max(0, toMs - fromMs) / 100) / 10;
}
