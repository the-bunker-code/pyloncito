export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function safeStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export interface GameStorage {
  read<T>(key: string, validate: (value: unknown) => value is T): T | null;
  write(key: string, value: unknown): boolean;
  remove(key: string): void;
}

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function isSafeStoredValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.every(isSafeStoredValue);
  if (typeof value !== 'object' || value === null) return true;
  if (!isPlainRecord(value)) return false;

  return Object.entries(value).every(
    ([key, child]) => !UNSAFE_KEYS.has(key) && isSafeStoredValue(child),
  );
}

export function createStorage(
  slug: string,
  storage: StorageLike | null = safeStorage(),
): GameStorage {
  const prefix = `juegos:${slug}:`;

  return {
    read<T>(key: string, validate: (value: unknown) => value is T): T | null {
      if (!storage) return null;
      try {
        const raw = storage.getItem(`${prefix}${key}`);
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isSafeStoredValue(parsed)) return null;
        return validate(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    write(key: string, value: unknown): boolean {
      if (!storage) return false;
      try {
        storage.setItem(`${prefix}${key}`, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key: string): void {
      if (!storage) return;
      try {
        storage.removeItem(`${prefix}${key}`);
      } catch {
        return;
      }
    },
  };
}
