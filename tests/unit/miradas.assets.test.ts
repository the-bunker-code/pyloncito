import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADULT_FACES, CARDS_BY_LEVEL } from '../../src/games/miradas/config';

const cards = Object.values(CARDS_BY_LEVEL).flat();

describe('miradas assets', () => {
  it('uses a local Fluent Emoji file for every card', () => {
    for (const card of cards) {
      expect(card.image.startsWith('/miradas/')).toBe(true);
      const path = join('public', card.image);
      expect(existsSync(path), `falta ${card.image}`).toBe(true);
    }
  });

  it('keeps every image small and self-contained', () => {
    for (const card of cards) {
      const path = join('public', card.image);
      const svg = readFileSync(path, 'utf8');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toContain('<script');
      expect(svg).not.toContain('foreignObject');
      expect(svg).not.toContain('href="http');
      expect(statSync(path).size).toBeLessThan(25_000);
    }
  });

  it('includes three distinct Fluent faces for the adults', () => {
    expect(new Set(ADULT_FACES).size).toBe(3);
    for (const image of ADULT_FACES) {
      const path = join('public', image);
      expect(existsSync(path), `falta ${image}`).toBe(true);
      expect(readFileSync(path, 'utf8')).toContain('<svg');
    }
  });

  it('includes the Fluent Emoji license', () => {
    const license = readFileSync('public/miradas/LICENSE', 'utf8');
    expect(license).toContain('Microsoft Corporation');
    expect(license).toContain('MIT License');
  });
});
