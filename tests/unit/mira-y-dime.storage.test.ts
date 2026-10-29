import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../../src/games/mira-y-dime/storage';

describe('ajustes de Mira y Dime', () => {
  it('usa los valores por defecto con datos inválidos', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('texto')).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings([1, 2])).toEqual(DEFAULT_SETTINGS);
  });

  it('respeta valores válidos', () => {
    const settings = { mode: 'letters', level: 'hard', rounds: 8, voice: false, sound: false };
    expect(normalizeSettings(settings)).toEqual(settings);
  });

  it('corrige cada valor inválido sin tocar el resto', () => {
    expect(
      normalizeSettings({
        mode: 'volar',
        level: 'hard',
        rounds: 4,
        voice: 'sí',
        sound: false,
      }),
    ).toEqual({ ...DEFAULT_SETTINGS, level: 'hard', sound: false });
  });

  it('acepta rondas guardadas como texto', () => {
    expect(normalizeSettings({ rounds: '3' }).rounds).toBe(3);
    expect(normalizeSettings({ rounds: 'tres' }).rounds).toBe(DEFAULT_SETTINGS.rounds);
    expect(normalizeSettings({ rounds: Infinity }).rounds).toBe(DEFAULT_SETTINGS.rounds);
  });

  it('rechaza objetos con prototipo heredado', () => {
    const inherited = Object.create({ mode: 'letters' });
    expect(normalizeSettings(inherited)).toEqual(DEFAULT_SETTINGS);
  });

  it('no se contamina con __proto__ ni constructor', () => {
    const evil = JSON.parse(
      '{"__proto__":{"polluted":true},"constructor":{"x":1},"mode":"shortPhrase"}',
    );
    const fixed = normalizeSettings(evil);
    expect(fixed.mode).toBe('shortPhrase');
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    expect(Object.keys(fixed).sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
  });
});
