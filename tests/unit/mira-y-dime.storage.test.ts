import { describe, expect, it } from 'vitest';
import { createStorage } from '../../src/lib/storage';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  normalizeSettings,
  saveSettings,
} from '../../src/games/mira-y-dime/storage';

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

  it('carga los valores por defecto y guarda ajustes válidos', () => {
    const storage = createStorage('mira-y-dime', window.localStorage);
    window.localStorage.clear();
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);

    const settings = { ...DEFAULT_SETTINGS, mode: 'longPhrase' as const, rounds: 8 as const };
    expect(saveSettings(settings, storage)).toBe(true);
    expect(loadSettings(storage)).toEqual(settings);
  });

  it('ignora ajustes corruptos guardados', () => {
    const storage = createStorage('mira-y-dime', window.localStorage);
    window.localStorage.setItem('juegos:mira-y-dime:settings:v1', '{"mode":"volar"}');
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
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
