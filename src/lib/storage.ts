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
