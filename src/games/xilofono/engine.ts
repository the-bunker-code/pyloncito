import { reactive } from 'vue';
import { createMarimba } from './audio';
import { DEFAULT_SONG, KEYS, TIMING, keyFrequency } from './config';
import { SCORE, layoutScore, type ScoreLayout } from './score';
import { decodeSong, readShareHash } from './share';
import { SongError, parseSong, type NoteEvent, type Song, type SongErrorCode } from './song';
import { createSongStorage, type SongStorage } from './storage';

export type Mode = 'idle' | 'play' | 'guide';

export type LoadErrorCode =
  SongErrorCode | 'empty-url' | 'bad-url' | 'http' | 'network' | 'bad-json' | 'bad-share';

export type Status =
  | { kind: 'ready' }
  | { kind: 'loading' }
  | { kind: 'loaded'; title: string; shared: boolean }
  | { kind: 'playing' }
  | { kind: 'stopped' }
  | { kind: 'finished' }
  | { kind: 'guide'; note: NoteEvent }
  | { kind: 'guide-done' }
  | { kind: 'guide-exit' }
  | { kind: 'copied' }
  | { kind: 'share-fallback' }
  | { kind: 'error'; code: LoadErrorCode; index?: number; detail?: string };

export type ShareResult = 'shared' | 'copied' | 'fallback' | 'cancelled';

export interface XilofonoState {
  song: Song;
  layout: ScoreLayout;
  mode: Mode;
  /** Time under the playhead, in beats (negative during the lead-in). */
  time: number;
  /** Whether the score should glide to `time` instead of jumping. */
  smoothScroll: boolean;
  /** Lit keys, by key id. */
  lit: boolean[];
  /** Highlighted notes, by note index. */
  hit: boolean[];
  /** Note the guide waits for, or -1. */
  target: number;
  /** Key that just got a wrong tap; `missCount` changes on every miss to restart the wobble. */
  missKey: number;
  missCount: number;
  status: Status;
  busy: boolean;
  lastUrl: string;
}

class HttpError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

async function fetchJson(url: URL): Promise<unknown> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new HttpError(response.status);
  return (await response.json()) as unknown;
}

function nativeShare(): ((data: ShareData) => Promise<void>) | undefined {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return undefined;
  return (data) => navigator.share(data);
}

function errorStatus(error: unknown): Status {
  if (error instanceof SongError) {
    return { kind: 'error', code: error.code, index: error.index, detail: error.detail };
  }
  if (error instanceof HttpError)
    return { kind: 'error', code: 'http', detail: String(error.status) };
  if (error instanceof SyntaxError) return { kind: 'error', code: 'bad-json' };
  return { kind: 'error', code: 'network' };
}

export interface EngineDependencies {
  play?: (frequency: number) => void;
  now?: () => number;
  requestFrame?: (callback: (time: number) => void) => number;
  cancelFrame?: (handle: number) => void;
  /** Runs `callback` after `milliseconds`; returns a function that cancels it. */
  schedule?: (milliseconds: number, callback: () => void) => () => void;
  fetchJson?: (url: URL) => Promise<unknown>;
  storage?: SongStorage;
  share?: (data: ShareData) => Promise<void>;
  copyText?: (text: string) => Promise<void>;
}

export function createXilofonoEngine(dependencies: EngineDependencies = {}) {
  const play = dependencies.play ?? createMarimba().play;
  const now = dependencies.now ?? (() => performance.now());
  const requestFrame = dependencies.requestFrame ?? ((callback) => requestAnimationFrame(callback));
  const cancelFrame = dependencies.cancelFrame ?? ((handle) => cancelAnimationFrame(handle));
  const schedule =
    dependencies.schedule ??
    ((milliseconds, callback) => {
      const handle = window.setTimeout(callback, milliseconds);
      return () => window.clearTimeout(handle);
    });
  const loadJson = dependencies.fetchJson ?? fetchJson;
  const storage = dependencies.storage ?? createSongStorage();
  const share = 'share' in dependencies ? dependencies.share : nativeShare();
  const copyText = dependencies.copyText ?? ((text) => navigator.clipboard.writeText(text));

  const initial = parseSong(DEFAULT_SONG);
  const state = reactive<XilofonoState>({
    song: initial,
    layout: layoutScore(initial),
    mode: 'idle',
    time: -SCORE.LEAD_BEATS,
    smoothScroll: false,
    lit: KEYS.map(() => false),
    hit: initial.notes.map(() => false),
    target: -1,
    missKey: -1,
    missCount: 0,
    status: { kind: 'ready' },
    busy: false,
    lastUrl: '',
  });

  /** Bumped on every stop; async work started under an older run is ignored. */
  let run = 0;
  let loadRun = 0;
  let frame = 0;
  const keyTimers = new Map<number, () => void>();
  const noteTimers = new Map<number, () => void>();
  let cancelMiss: (() => void) | undefined;

  function light(timers: Map<number, () => void>, flags: boolean[], index: number, ms: number) {
    timers.get(index)?.();
    flags[index] = true;
    timers.set(
      index,
      schedule(ms, () => {
        flags[index] = false;
        timers.delete(index);
      }),
    );
  }

  function clearLights(timers: Map<number, () => void>, flags: boolean[]) {
    for (const [index, cancel] of timers) {
      cancel();
      flags[index] = false;
    }
    timers.clear();
  }

  function sound(key: number, litMs: number = TIMING.tapLightMs) {
    play(keyFrequency(key));
    light(keyTimers, state.lit, key, litMs);
  }

  function stop(status?: Status) {
    run += 1;
    cancelFrame(frame);
    clearLights(keyTimers, state.lit);
    clearLights(noteTimers, state.hit);
    cancelMiss?.();
    state.missKey = -1;
    state.target = -1;
    state.mode = 'idle';
    state.time = -SCORE.LEAD_BEATS;
    state.smoothScroll = true;
    if (status) state.status = status;
  }

  function setSong(song: Song, status: Status) {
    stop();
    state.song = song;
    state.layout = layoutScore(song);
    state.hit = song.notes.map(() => false);
    state.smoothScroll = false;
    state.status = status;
  }

  function startPlay() {
    stop();
    const id = run;
    state.mode = 'play';
    state.smoothScroll = false;
    state.status = { kind: 'playing' };
    const beatMs = 60_000 / state.song.tempo;
    const startedAt = now();
    const { notes } = state.layout;
    let next = 0;

    const step = (frameTime: number) => {
      if (id !== run) return;
      const time = (frameTime - startedAt) / beatMs - SCORE.LEAD_BEATS;
      state.time = time;
      while (next < notes.length && (notes[next]?.start ?? Infinity) <= time) {
        const event = notes[next]?.event;
        if (event && !event.rest) {
          const ms = Math.min(beatMs * event.beats * TIMING.playLightRatio, TIMING.maxPlayLightMs);
          sound(event.key, ms);
          light(noteTimers, state.hit, next, ms);
        }
        next += 1;
      }
      if (time >= state.layout.total) {
        stop({ kind: 'finished' });
        return;
      }
      frame = requestFrame(step);
    };
    frame = requestFrame(step);
  }

  function nextNote(from: number): number {
    return state.song.notes.findIndex((event, index) => index >= from && !event.rest);
  }

  function goTarget(index: number) {
    const note = state.song.notes[index];
    if (!note || note.rest) return;
    state.target = index;
    state.time = state.layout.notes[index]?.start ?? 0;
    state.smoothScroll = true;
    state.status = { kind: 'guide', note };
  }

  function startGuide() {
    stop();
    const first = nextNote(0);
    if (first < 0) {
      state.status = { kind: 'guide-done' };
      return;
    }
    state.mode = 'guide';
    goTarget(first);
  }

  function miss(key: number) {
    cancelMiss?.();
    state.missKey = key;
    state.missCount += 1;
    cancelMiss = schedule(TIMING.missMs, () => {
      state.missKey = -1;
      cancelMiss = undefined;
    });
  }

  /** A tap on a key, from touch, mouse or the physical keyboard. */
  function press(key: number) {
    if (!KEYS[key]) return;
    sound(key);
    if (state.mode !== 'guide') return;
    const target = state.song.notes[state.target];
    if (!target || target.rest) return;
    if (key !== target.key) {
      miss(key);
      return;
    }
    light(noteTimers, state.hit, state.target, TIMING.guideHitMs);
    const next = nextNote(state.target + 1);
    if (next < 0) stop({ kind: 'guide-done' });
    else goTarget(next);
  }

  function togglePlay() {
    if (state.mode === 'play') stop({ kind: 'stopped' });
    else startPlay();
  }

  function toggleGuide() {
    if (state.mode === 'guide') stop({ kind: 'guide-exit' });
    else startGuide();
  }

  function tryParse(raw: unknown, shared: boolean): boolean {
    try {
      const song = parseSong(raw);
      setSong(song, { kind: 'loaded', title: song.title, shared });
      return true;
    } catch (error) {
      state.status = errorStatus(error);
      return false;
    }
  }

  async function loadUrl(text: string, base: string): Promise<boolean> {
    const address = text.trim();
    if (address === '') {
      state.status = { kind: 'error', code: 'empty-url' };
      return false;
    }
    let url: URL;
    try {
      url = new URL(address, base);
    } catch {
      state.status = { kind: 'error', code: 'bad-url', detail: address };
      return false;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      state.status = { kind: 'error', code: 'bad-url', detail: address };
      return false;
    }

    loadRun += 1;
    const id = loadRun;
    state.busy = true;
    state.status = { kind: 'loading' };
    try {
      const raw = await loadJson(url);
      if (id !== loadRun) return false;
      const loaded = tryParse(raw, false);
      if (loaded) {
        state.lastUrl = address;
        storage.writeLastUrl(address);
      }
      return loaded;
    } catch (error) {
      if (id === loadRun) state.status = errorStatus(error);
      return false;
    } finally {
      if (id === loadRun) state.busy = false;
    }
  }

  /** Loads pasted JSON text. */
  function loadText(text: string): boolean {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      state.status = { kind: 'error', code: 'bad-json' };
      return false;
    }
    return tryParse(raw, false);
  }

  /** Loads a song from a `#s=` link. Returns false when the hash is not a song link. */
  function loadShared(hash: string): boolean {
    const payload = readShareHash(hash);
    if (payload === undefined) return false;
    const raw = decodeSong(payload);
    if (raw === undefined) {
      state.status = { kind: 'error', code: 'bad-share' };
      return false;
    }
    return tryParse(raw, true);
  }

  function songJson(): string {
    return JSON.stringify(state.song.raw, null, 1);
  }

  /** Shares `url` natively, else copies it, else asks the UI to show the JSON. */
  async function shareSong(url: string, data: Omit<ShareData, 'url'>): Promise<ShareResult> {
    if (share) {
      try {
        await share({ ...data, url });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      }
    }
    try {
      await copyText(url);
      state.status = { kind: 'copied' };
      return 'copied';
    } catch {
      state.status = { kind: 'share-fallback' };
      return 'fallback';
    }
  }

  /** Startup: shared link first, then `?json=`; restores the last address for the form. */
  function hydrate(location: { hash: string; search: string; href: string }) {
    state.lastUrl = storage.readLastUrl();
    if (readShareHash(location.hash) !== undefined) {
      loadShared(location.hash);
      return;
    }
    const query = new URLSearchParams(location.search).get('json');
    if (query) {
      state.lastUrl = query;
      void loadUrl(query, location.href);
    }
  }

  function dispose() {
    stop();
    loadRun += 1;
  }

  return {
    state,
    press,
    togglePlay,
    toggleGuide,
    stop,
    loadUrl,
    loadText,
    loadShared,
    shareSong,
    songJson,
    hydrate,
    dispose,
  };
}

export type XilofonoEngine = ReturnType<typeof createXilofonoEngine>;
