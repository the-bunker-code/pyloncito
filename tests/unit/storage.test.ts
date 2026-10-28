import { beforeEach, describe, expect, it } from 'vitest';
import { createStorage } from '../../src/lib/storage';

interface Settings {
  rounds: number;
}

const isSettings = (value: unknown): value is Settings => {
  if (typeof value !== 'object' || value === null) return false;
  return typeof (value as { rounds?: unknown }).rounds === 'number';
};

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes and reads namespaced values', () => {
    const storage = createStorage('memoria', window.localStorage);
    expect(storage.write('settings', { rounds: 5 })).toBe(true);
    expect(storage.read('settings', isSettings)).toEqual({ rounds: 5 });
    expect(window.localStorage.getItem('juegos:memoria:settings')).toBe('{"rounds":5}');
  });

  it('returns null for invalid or missing values', () => {
    const storage = createStorage('memoria', window.localStorage);
    expect(storage.read('missing', isSettings)).toBeNull();
    window.localStorage.setItem('juegos:memoria:settings', '{"rounds":"cinco"}');
    expect(storage.read('settings', isSettings)).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    const storage = createStorage('memoria', null);
    expect(storage.write('settings', { rounds: 3 })).toBe(false);
    expect(storage.read('settings', isSettings)).toBeNull();
    expect(() => storage.remove('settings')).not.toThrow();
  });

  it('removes only its own key', () => {
    const first = createStorage('memoria', window.localStorage);
    const second = createStorage('dados', window.localStorage);
    first.write('settings', { rounds: 3 });
    second.write('settings', { rounds: 5 });
    first.remove('settings');
    expect(first.read('settings', isSettings)).toBeNull();
    expect(second.read('settings', isSettings)).toEqual({ rounds: 5 });
  });
});
