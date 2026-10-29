import { shuffle as shuffleWith, type Random } from '../../lib/random';
import { LEVEL_RULES, MAX_PHRASE_WORDS, type LevelId, type ModeId } from './config';
import type { GameObject } from './objects';
import { splitLetters, splitWords, syllabify } from './spanish';

export interface Round {
  readonly mode: ModeId;
  readonly level: LevelId;
  readonly object: GameObject;
  readonly units: readonly string[];
  readonly target: string;
  readonly guide: boolean;
  readonly bankSize: number;
  readonly question: string;
}

export interface SessionSettings {
  mode: ModeId;
  level: LevelId;
  rounds: number;
}

export interface PlanContext {
  firstId?: string | null;
  random?: Random;
}

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  return shuffleWith(random, items);
}

export function targetOf(object: GameObject, mode: ModeId): string {
  if (mode === 'shortPhrase') return object.shortPhrase;
  if (mode === 'longPhrase') return object.longPhrase;
  return object.word;
}

export function unitsOf(object: GameObject, mode: ModeId): string[] {
  if (mode === 'syllables') return syllabify(object.word);
  if (mode === 'letters') return splitLetters(object.word);
  const words = splitWords(targetOf(object, mode));
  return words.length <= MAX_PHRASE_WORDS ? words : [];
}

export function fitsLevel(object: GameObject, mode: ModeId, level: LevelId): boolean {
  const { min, max } = LEVEL_RULES[mode][level];
  const count = unitsOf(object, mode).length;
  return count >= min && count <= max;
}

export function planSession(
  objects: readonly GameObject[],
  settings: SessionSettings,
  context: PlanContext = {},
): GameObject[] {
  const { mode, level, rounds } = settings;
  const { firstId = null, random = Math.random } = context;
  const usable = objects.filter((object) => unitsOf(object, mode).length > 0);
  if (usable.length === 0) return [];

  let pool = usable.filter((object) => fitsLevel(object, mode, level));
  if (pool.length === 0) {
    const { min, max } = LEVEL_RULES[mode][level];
    const distance = (object: GameObject): number => {
      const count = unitsOf(object, mode).length;
      return count < min ? min - count : count - max;
    };
    const best = Math.min(...usable.map(distance));
    pool = usable.filter((object) => distance(object) === best);
  }

  const first = pool.find((object) => object.id === firstId);
  const plan: GameObject[] = first ? [first] : [];
  while (plan.length < rounds) {
    const used = new Set(plan.map((object) => object.id));
    const fresh = pool.filter((object) => !used.has(object.id));
    const previous = plan[plan.length - 1];
    const candidates = fresh.length > 0 ? fresh : pool.filter((object) => object !== previous);
    const choices = candidates.length > 0 ? candidates : pool;
    plan.push(shuffle(choices, random)[0]!);
  }
  return plan;
}

export function createRound(
  object: GameObject,
  settings: Pick<SessionSettings, 'mode' | 'level'>,
  questionFor: (mode: ModeId, target: string) => string,
): Round {
  const { mode, level } = settings;
  const rules = LEVEL_RULES[mode][level];
  const target = targetOf(object, mode);
  return Object.freeze({
    mode,
    level,
    object,
    units: unitsOf(object, mode),
    target,
    guide: rules.guide,
    bankSize: rules.bank,
    question: questionFor(mode, target),
  });
}

function distinct(items: readonly string[]): string[] {
  return [...new Set(items)];
}

export function initialBank(
  remaining: readonly string[],
  bankSize: number,
  random: Random,
): string[] {
  if (remaining.length === 0) return [];
  const [next] = remaining;
  const others = shuffle(
    distinct(remaining).filter((text) => text !== next),
    random,
  ).slice(0, bankSize - 1);
  return shuffle([next!, ...others], random);
}

export function nextBank(
  bank: readonly string[],
  tapped: number,
  remaining: readonly string[],
  bankSize: number,
  random: Random,
): string[] {
  if (remaining.length === 0) return [];
  const [next] = remaining;
  const left = new Set(remaining);
  const result: Array<string | null> = bank.map((text) => (left.has(text) ? text : null));

  if (!result.includes(next!)) {
    const free = result.indexOf(null);
    result[free === -1 ? tapped : free] = next!;
  }
  for (let i = 0; i < result.length; i++) {
    if (result[i] !== null) continue;
    const options = distinct(remaining).filter((text) => !result.includes(text));
    result[i] = options.length > 0 ? shuffle(options, random)[0]! : null;
  }
  return result.filter((text): text is string => text !== null).slice(0, bankSize);
}

export function unitPhrase(unit: string): string {
  return unit.toLowerCase();
}
