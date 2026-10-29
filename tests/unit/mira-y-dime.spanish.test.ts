import { describe, expect, it } from 'vitest';
import { BUILTIN_OBJECTS } from '../../src/games/mira-y-dime/objects';
import {
  capitalize,
  isSpanishWord,
  normalizeWord,
  splitLetters,
  splitWords,
  syllabify,
} from '../../src/games/mira-y-dime/spanish';

const CASES: Record<string, string> = {
  casa: 'ca-sa',
  pelota: 'pe-lo-ta',
  mesa: 'me-sa',
  oso: 'o-so',
  perro: 'pe-rro',
  silla: 'si-lla',
  caballo: 'ca-ba-llo',
  chocolate: 'cho-co-la-te',
  cuchara: 'cu-cha-ra',
  queso: 'que-so',
  guitarra: 'gui-ta-rra',
  manzana: 'man-za-na',
  ventana: 'ven-ta-na',
  árbol: 'ár-bol',
  libro: 'li-bro',
  plátano: 'plá-ta-no',
  hombre: 'hom-bre',
  estrella: 'es-tre-lla',
  bicicleta: 'bi-ci-cle-ta',
  instante: 'ins-tan-te',
  transporte: 'trans-por-te',
  aeropuerto: 'a-e-ro-puer-to',
  agua: 'a-gua',
  paraguas: 'pa-ra-guas',
  hielo: 'hie-lo',
  zanahoria: 'za-na-ho-ria',
  televisión: 'te-le-vi-sión',
  avión: 'a-vión',
  día: 'dí-a',
  búho: 'bú-ho',
  leer: 'le-er',
  pingüino: 'pin-güi-no',
  cigüeña: 'ci-güe-ña',
  ahora: 'a-ho-ra',
  cohete: 'co-he-te',
  examen: 'e-xa-men',
  rey: 'rey',
  muy: 'muy',
  yoyo: 'yo-yo',
  playa: 'pla-ya',
  sol: 'sol',
  tren: 'tren',
  flor: 'flor',
  reloj: 're-loj',
  pájaro: 'pá-ja-ro',
};

describe('sílabas', () => {
  for (const [word, expected] of Object.entries(CASES)) {
    it(`${word} → ${expected}`, () => {
      expect(syllabify(word).join('-')).toBe(expected);
    });
  }

  it('siempre vuelve a formar la palabra', () => {
    for (const word of [...Object.keys(CASES), ...BUILTIN_OBJECTS.map((object) => object.word)]) {
      expect(syllabify(word).join('')).toBe(normalizeWord(word));
    }
  });

  it('ignora mayúsculas, signos y espacios', () => {
    expect(syllabify('¡PELOTA!')).toEqual(['pe', 'lo', 'ta']);
    expect(syllabify('  Casa ')).toEqual(['ca', 'sa']);
  });

  it('una palabra sin vocales vuelve entera; vacía no tiene piezas', () => {
    expect(syllabify('psst')).toEqual(['psst']);
    expect(syllabify('')).toEqual([]);
  });
});

describe('letras y palabras', () => {
  it('separa letras sin unir dígrafos', () => {
    expect(splitLetters('Llave')).toEqual(['l', 'l', 'a', 'v', 'e']);
    expect(splitLetters('niño')).toEqual(['n', 'i', 'ñ', 'o']);
  });

  it('separa palabras sin signos', () => {
    expect(splitWords('¡El gato  duerme!')).toEqual(['el', 'gato', 'duerme']);
    expect(splitWords('   ')).toEqual([]);
  });

  it('todas las frases respetan 2 y 3-4 palabras', () => {
    for (const object of BUILTIN_OBJECTS) {
      expect(splitWords(object.shortPhrase), object.id).toHaveLength(2);
      const long = splitWords(object.longPhrase);
      expect(long.length, object.id).toBeGreaterThanOrEqual(3);
      expect(long.length, object.id).toBeLessThanOrEqual(4);
    }
  });

  it('capitaliza y respeta el vacío', () => {
    expect(capitalize('pelota')).toBe('Pelota');
    expect(capitalize('árbol')).toBe('Árbol');
    expect(capitalize('')).toBe('');
  });

  it('isSpanishWord solo acepta letras del español', () => {
    expect(isSpanishWord('pingüino')).toBe(true);
    expect(isSpanishWord('ñandú')).toBe(true);
    expect(isSpanishWord('pelota roja')).toBe(false);
    expect(isSpanishWord('<img>')).toBe(false);
    expect(isSpanishWord('casa1')).toBe(false);
    expect(isSpanishWord('')).toBe(false);
  });
});
