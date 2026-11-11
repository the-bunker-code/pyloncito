import { createStorage, type GameStorage } from '../../lib/storage';

const LAST_URL_KEY = 'last-url';
const MAX_URL_LENGTH = 2000;

function isUrlText(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_URL_LENGTH;
}

export interface SongStorage {
  readLastUrl(): string;
  writeLastUrl(url: string): void;
}

/** Remembers the last song address on this device only. */
export function createSongStorage(storage: GameStorage = createStorage('xilofono')): SongStorage {
  return {
    readLastUrl: () => storage.read(LAST_URL_KEY, isUrlText) ?? '',
    writeLastUrl: (url) => {
      if (isUrlText(url)) storage.write(LAST_URL_KEY, url);
    },
  };
}
