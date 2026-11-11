import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SHARE_MAX_LENGTH } from '../../src/games/xilofono/config';
import {
  buildShareUrl,
  decodeSong,
  encodeSong,
  readShareHash,
} from '../../src/games/xilofono/share';
import { parseSong } from '../../src/games/xilofono/song';

const corazon: unknown = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/canciones/mi-corazon-encantado.json'), 'utf8'),
);

describe('encodeSong / decodeSong', () => {
  it('round-trips a song with accents and ñ', () => {
    const raw = { title: 'Canción del niño ♪', notes: [{ note: 'Sól', lyric: 'ñu' }] };
    expect(decodeSong(encodeSong(raw))).toEqual(raw);
  });

  it('uses URL-safe base64 without padding', () => {
    const encoded = encodeSong({ title: '¿?¿?>>>', notes: ['Do'] });
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('round-trips "Mi Corazón Encantado" and keeps it playable', () => {
    const decoded = decodeSong(encodeSong(corazon));
    expect(decoded).toEqual(corazon);
    const song = parseSong(decoded);
    expect(song.title).toBe(parseSong(corazon).title);
    expect(song.title).toContain('Corazón');
    expect(song.notes).toEqual(parseSong(corazon).notes);
  });

  it('handles songs larger than the call-stack limit of spread arguments', () => {
    const raw = {
      notes: Array.from({ length: 500 }, (_, index) => ({ note: 'Do', lyric: `sí${index}` })),
    };
    expect(decodeSong(encodeSong(raw))).toEqual(raw);
  });

  it('returns undefined for invalid payloads', () => {
    expect(decodeSong('')).toBeUndefined();
    expect(decodeSong('***')).toBeUndefined();
    expect(decodeSong(encodeSong('x').slice(0, -1) + '!')).toBeUndefined();
    expect(decodeSong(btoaUrl('{not json'))).toBeUndefined();
    expect(decodeSong(btoaUrl('�'.repeat(2)).slice(1))).toBeUndefined();
    expect(decodeSong('A'.repeat(SHARE_MAX_LENGTH + 1))).toBeUndefined();
  });
});

describe('share URLs', () => {
  it('builds a link that replaces any existing fragment', () => {
    const url = buildShareUrl('https://pyloncito.app/juegos/xilofono/?json=x#old', {
      notes: ['Do'],
    });
    expect(url).toMatch(/^https:\/\/pyloncito\.app\/juegos\/xilofono\/\?json=x#s=[\w-]+$/);
  });

  it('reads the payload back from the hash', () => {
    const raw = { title: 'Mí', notes: ['Do'] };
    const url = new URL(buildShareUrl('https://pyloncito.app/juegos/xilofono/', raw));
    const payload = readShareHash(url.hash);
    expect(payload).toBeDefined();
    expect(decodeSong(payload ?? '')).toEqual(raw);
  });

  it('ignores hashes that are not song links', () => {
    expect(readShareHash('')).toBeUndefined();
    expect(readShareHash('#')).toBeUndefined();
    expect(readShareHash('#main')).toBeUndefined();
    expect(readShareHash('#s=')).toBeUndefined();
  });
});

function btoaUrl(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64url');
}
