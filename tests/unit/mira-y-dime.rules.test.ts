import { describe, expect, it } from 'vitest';
import { createRandom } from '../../src/lib/random';
import { copy } from '../../src/content/es/mira-y-dime';
import { LEVELS, LEVEL_RULES, MAX_PHRASE_WORDS, MODES } from '../../src/games/mira-y-dime/config';
import { BUILTIN_OBJECTS, type GameObject } from '../../src/games/mira-y-dime/objects';
import {
  createRound,
  fitsLevel,
  initialBank,
  nextBank,
  planSession,
  shuffle,
  targetOf,
  unitPhrase,
  unitsOf,
} from '../../src/games/mira-y-dime/rules';

const PELOTA: GameObject = {
  id: 'casa-pelota',
  word: 'pelota',
  shortPhrase: 'la pelota',
  longPhrase: 'la pelota es roja',
  drawing: '/objects/pelota.svg',
};

describe('banco y piezas', () => {
  it('shuffle no pierde elementos ni toca el original', () => {
    const items = [1, 2, 3, 4, 5];
    const mixed = shuffle(items, createRandom(1));
    expect([...mixed].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it('parte cada modo en piezas', () => {
    expect(unitsOf(PELOTA, 'syllables')).toEqual(['pe', 'lo', 'ta']);
    expect(unitsOf(PELOTA, 'letters')).toEqual(['p', 'e', 'l', 'o', 't', 'a']);
    expect(unitsOf(PELOTA, 'shortPhrase')).toEqual(['la', 'pelota']);
    expect(unitsOf(PELOTA, 'longPhrase')).toEqual(['la', 'pelota', 'es', 'roja']);
    expect(targetOf(PELOTA, 'letters')).toBe('pelota');
    expect(targetOf(PELOTA, 'longPhrase')).toBe('la pelota es roja');
  });

  it('no usa frases de más de 4 palabras', () => {
    const long = { ...PELOTA, longPhrase: 'la pelota es muy roja' };
    expect(unitsOf(long, 'longPhrase')).toEqual([]);
    expect(MAX_PHRASE_WORDS).toBe(4);
  });

  it('cada modo y nivel tiene al menos 2 objetos', () => {
    for (const mode of MODES) {
      for (const level of LEVELS) {
        const fitting = BUILTIN_OBJECTS.filter((object) => fitsLevel(object, mode.id, level.id));
        expect(fitting.length, `${mode.id}/${level.id}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('el banco está entre 2 y 4 piezas', () => {
    for (const mode of MODES) {
      for (const level of LEVELS) {
        const { bank } = LEVEL_RULES[mode.id][level.id];
        expect(bank).toBeGreaterThanOrEqual(2);
        expect(bank).toBeLessThanOrEqual(4);
      }
    }
  });

  it('la sesión usa objetos que sirven y no repite seguido', () => {
    const plan = planSession(
      BUILTIN_OBJECTS,
      { mode: 'syllables', level: 'easy', rounds: 5 },
      { random: createRandom(3) },
    );
    expect(plan).toHaveLength(5);
    expect(new Set(plan.map((object) => object.id)).size).toBe(5);
    for (const object of plan) expect(fitsLevel(object, 'syllables', 'easy')).toBe(true);
  });

  it('con pocos objetos repite, nunca dos rondas seguidas', () => {
    const two = BUILTIN_OBJECTS.filter((object) => ['casa', 'gato'].includes(object.id));
    const plan = planSession(
      two,
      { mode: 'syllables', level: 'easy', rounds: 8 },
      { random: createRandom(5) },
    );
    expect(plan).toHaveLength(8);
    for (let i = 1; i < plan.length; i++) expect(plan[i]!.id).not.toBe(plan[i - 1]!.id);
  });

  it('300 sesiones por modo y nivel mantienen las invariantes', () => {
    for (const mode of MODES) {
      for (const level of LEVELS) {
        for (let seed = 1; seed <= 300; seed++) {
          const plan = planSession(
            BUILTIN_OBJECTS,
            { mode: mode.id, level: level.id, rounds: 8 },
            { random: createRandom(seed) },
          );
          expect(plan, `${mode.id}/${level.id}/${seed}`).toHaveLength(8);
          for (let index = 0; index < plan.length; index++) {
            const object = plan[index]!;
            const units = unitsOf(object, mode.id);
            expect(units.length, `${object.id}/${mode.id}`).toBeGreaterThan(0);
            if (index > 0) expect(object.id).not.toBe(plan[index - 1]!.id);
            const bank = initialBank(
              units,
              LEVEL_RULES[mode.id][level.id].bank,
              createRandom(seed),
            );
            expect(bank).toContain(units[0]);
            expect(bank.length).toBeLessThanOrEqual(LEVEL_RULES[mode.id][level.id].bank);
          }
        }
      }
    }
  });

  it('la ronda incluye consigna, guía y banco', () => {
    const word = createRound(PELOTA, { mode: 'syllables', level: 'medium' }, copy.question);
    expect(word.question).toBe('Armemos pelota.');
    expect(word.guide).toBe(true);
    expect(word.bankSize).toBe(3);
    expect(Object.isFrozen(word)).toBe(true);
    const phrase = createRound(PELOTA, { mode: 'longPhrase', level: 'hard' }, copy.question);
    expect(phrase.question).toBe('La pelota es roja.');
    expect(phrase.guide).toBe(false);
    expect(copy.result(phrase.target)).toBe('¡La pelota es roja!');
    expect(copy.result(word.target)).toBe('¡Pelota!');
    expect(unitPhrase('PE')).toBe('pe');
  });

  it('el banco empieza con la pieza que sigue y sin repetidas', () => {
    for (let seed = 1; seed < 30; seed++) {
      const bank = initialBank(['p', 'a', 'p', 'a'], 4, createRandom(seed));
      expect(bank).toContain('p');
      expect(new Set(bank).size).toBe(bank.length);
      expect([...bank].sort()).toEqual(['a', 'p']);
    }
    expect(initialBank(['pe', 'lo', 'ta'], 2, createRandom(4))).toHaveLength(2);
    expect(initialBank([], 3, createRandom(4))).toEqual([]);
  });

  it('tras acertar no mueve las demás piezas', () => {
    const units = ['bi', 'ci', 'cle', 'ta'];
    const random = createRandom(9);
    let bank = initialBank(units, 3, random);
    for (let placed = 0; placed < units.length; placed++) {
      expect(bank).toContain(units[placed]);
      const tapped = bank.indexOf(units[placed]!);
      const before = [...bank];
      bank = nextBank(bank, tapped, units.slice(placed + 1), 3, random);
      before.forEach((text, index) => {
        if (index !== tapped && index < bank.length && units.slice(placed + 1).includes(text)) {
          expect(bank[index]).toBe(text);
        }
      });
      expect(bank.length).toBeLessThanOrEqual(3);
    }
    expect(bank).toEqual([]);
  });

  it('maneja piezas repetidas y piezas que no estaban', () => {
    expect(nextBank(['p', 'a'], 0, ['a', 'p', 'a'], 2, createRandom(1))).toEqual(['p', 'a']);
    expect(nextBank(['a', 'b'], 0, ['x', 'a', 'b'], 2, createRandom(1))).toEqual(['x', 'b']);
  });
});
