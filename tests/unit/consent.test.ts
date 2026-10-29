import { describe, expect, it } from 'vitest';
import {
  createConsent,
  parseConsent,
  readConsent,
  shouldLoadGtm,
  writeConsent,
} from '../../src/lib/consent';
import type { StorageLike } from '../../src/lib/storage';

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

describe('consent', () => {
  it('creates a versioned consent', () => {
    const consent = createConsent({ analytics: true, improvement: false });
    expect(consent.version).toBe(1);
    expect(consent.analytics).toBe(true);
    expect(consent.improvement).toBe(false);
    expect(consent.marketing).toBe(false);
    expect(consent.updatedAt).not.toBe('');
  });

  it('parses valid values and rejects invalid ones', () => {
    const valid = createConsent({ analytics: false, improvement: true });
    expect(parseConsent(valid)).toEqual(valid);
    expect(parseConsent({ ...valid, version: 2 })).toBeNull();
    expect(parseConsent({ ...valid, analytics: 'si' })).toBeNull();
    expect(parseConsent({ ...valid, updatedAt: '' })).toBeNull();
  });

  it('rejects prototype-polluting keys', () => {
    const evil = JSON.parse(
      '{"version":1,"analytics":true,"improvement":false,"marketing":false,"updatedAt":"2026-01-01","__proto__":{"polluted":true}}',
    );
    expect(parseConsent(evil)).toBeNull();
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it('reads and writes namespaced consent', () => {
    const storage = memoryStorage();
    const consent = createConsent({ analytics: true, improvement: true });
    expect(writeConsent(consent, storage)).toBe(true);
    expect(readConsent(storage)).toEqual(consent);
  });

  it('does not throw when storage fails', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {},
    };
    expect(readConsent(broken)).toBeNull();
    expect(writeConsent(createConsent({ analytics: true, improvement: false }), broken)).toBe(
      false,
    );
  });

  it('loads GTM only when analytics is accepted', () => {
    expect(shouldLoadGtm(createConsent({ analytics: false, improvement: false }))).toBe(false);
    expect(shouldLoadGtm(createConsent({ analytics: true, improvement: false }))).toBe(true);
    expect(shouldLoadGtm(createConsent({ analytics: false, improvement: true }))).toBe(false);
  });
});
