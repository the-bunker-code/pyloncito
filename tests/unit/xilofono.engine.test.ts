import { describe, expect, it, vi } from 'vitest';
import { KEYBOARD_MAP, keyFrequency, keyId } from '../../src/games/xilofono/config';
import { createXilofonoEngine, type EngineDependencies } from '../../src/games/xilofono/engine';
import { SCORE } from '../../src/games/xilofono/score';
import { buildShareUrl } from '../../src/games/xilofono/share';

const BASE = 'https://pyloncito.app/juegos/xilofono/';

function setup(overrides: EngineDependencies = {}) {
  let clock = 0;
  let timers: { at: number; callback: () => void; active: boolean }[] = [];
  let frames: ((time: number) => void)[] = [];
  const played: number[] = [];

  const engine = createXilofonoEngine({
    play: (frequency) => played.push(frequency),
    now: () => clock,
    requestFrame: (callback) => frames.push(callback),
    cancelFrame: () => {
      frames = [];
    },
    schedule: (ms, callback) => {
      const timer = { at: clock + ms, callback, active: true };
      timers.push(timer);
      return () => {
        timer.active = false;
      };
    },
    storage: { readLastUrl: () => '', writeLastUrl: () => undefined },
    fetchJson: async () => ({ title: 'Remota', notes: ['Do'] }),
    share: undefined,
    copyText: async () => undefined,
    ...overrides,
  });

  /** Advances fake time, firing due timers and pending animation frames. */
  function advance(ms: number) {
    clock += ms;
    const due = timers.filter((timer) => timer.active && timer.at <= clock);
    timers = timers.filter((timer) => !due.includes(timer));
    for (const timer of due) timer.callback();
    const pending = frames;
    frames = [];
    for (const frame of pending) frame(clock);
  }

  return { engine, played, advance };
}

describe('free play', () => {
  it('plays and lights a key, then turns it off', () => {
    const { engine, played, advance } = setup();
    engine.press(0);
    expect(played).toEqual([keyFrequency(0)]);
    expect(engine.state.lit[0]).toBe(true);
    advance(300);
    expect(engine.state.lit[0]).toBe(false);
    engine.press(99);
    expect(played).toHaveLength(1);
  });

  it('maps the physical keyboard to both octaves', () => {
    expect(KEYBOARD_MAP.a).toBe(keyId(0, 1, false));
    expect(KEYBOARD_MAP.j).toBe(keyId(6, 1, false));
    expect(KEYBOARD_MAP.q).toBe(keyId(0, 2, false));
    expect(KEYBOARD_MAP.u).toBe(keyId(6, 2, false));
  });
});

describe('listen mode', () => {
  it('plays notes as they cross the playhead and finishes', () => {
    const { engine, played, advance } = setup();
    engine.loadText(JSON.stringify({ tempo: 60, notes: ['Do', '-', 'Mi'] }));
    engine.togglePlay();
    expect(engine.state.mode).toBe('play');

    advance(0);
    expect(engine.state.time).toBe(-SCORE.LEAD_BEATS);
    advance(2000);
    expect(played).toEqual([keyFrequency(0)]);
    expect(engine.state.hit[0]).toBe(true);
    advance(2000);
    expect(played).toHaveLength(2);
    advance(1000);
    expect(engine.state.mode).toBe('idle');
    expect(engine.state.status).toEqual({ kind: 'finished' });
    expect(engine.state.lit.every((lit) => !lit)).toBe(true);
  });

  it('stops when toggled again and on dispose', () => {
    const { engine, played, advance } = setup();
    engine.togglePlay();
    engine.togglePlay();
    expect(engine.state.status).toEqual({ kind: 'stopped' });
    engine.togglePlay();
    engine.dispose();
    advance(10_000);
    expect(played).toEqual([]);
    expect(engine.state.mode).toBe('idle');
  });
});

describe('guide mode', () => {
  it('waits for the right key, wobbles wrong ones and skips rests', () => {
    const { engine, advance } = setup();
    engine.loadText(JSON.stringify({ notes: ['Do', '-', 'Re'] }));
    engine.toggleGuide();
    expect(engine.state.target).toBe(0);
    expect(engine.state.status).toMatchObject({ kind: 'guide', note: { degree: 0 } });

    engine.press(keyId(4, 1, false));
    expect(engine.state.target).toBe(0);
    expect(engine.state.missKey).toBe(keyId(4, 1, false));
    advance(400);
    expect(engine.state.missKey).toBe(-1);

    engine.press(keyId(0, 1, false));
    expect(engine.state.target).toBe(2);
    expect(engine.state.time).toBe(engine.state.layout.notes[2]?.start);

    engine.press(keyId(1, 1, false));
    expect(engine.state.mode).toBe('idle');
    expect(engine.state.status).toEqual({ kind: 'guide-done' });
  });

  it('exits when toggled again and ignores songs of only rests', () => {
    const { engine } = setup();
    engine.toggleGuide();
    engine.toggleGuide();
    expect(engine.state.status).toEqual({ kind: 'guide-exit' });
    engine.loadText(JSON.stringify(['-', '-']));
    engine.toggleGuide();
    expect(engine.state.mode).toBe('idle');
  });
});

describe('loading songs', () => {
  it('starts with the built-in song and loads pasted JSON', () => {
    const { engine } = setup();
    expect(engine.state.song.title).toBe('Estrellita');
    expect(engine.loadText('{nope')).toBe(false);
    expect(engine.state.status).toEqual({ kind: 'error', code: 'bad-json' });
    expect(engine.loadText(JSON.stringify({ notes: ['Do', 'Zz'] }))).toBe(false);
    expect(engine.state.status).toMatchObject({ code: 'unknown-note', index: 1 });
    expect(engine.loadText(JSON.stringify({ title: 'Sostenidos', notes: ['Do#'] }))).toBe(true);
    expect(engine.state.song.hasSharps).toBe(true);
  });

  it('loads a relative URL and remembers it', async () => {
    const fetchJson = vi.fn(async () => ({ title: 'Remota', notes: ['Do'] }));
    const writeLastUrl = vi.fn();
    const { engine } = setup({ fetchJson, storage: { readLastUrl: () => '', writeLastUrl } });
    await expect(engine.loadUrl(' /canciones/a.json ', BASE)).resolves.toBe(true);
    expect(fetchJson).toHaveBeenCalledWith(new URL('https://pyloncito.app/canciones/a.json'));
    expect(writeLastUrl).toHaveBeenCalledWith('/canciones/a.json');
    expect(engine.state.busy).toBe(false);
  });

  it('maps bad addresses and failures to error codes', async () => {
    const { engine } = setup();
    await engine.loadUrl('  ', BASE);
    expect(engine.state.status).toMatchObject({ code: 'empty-url' });
    await engine.loadUrl('file:///a.json', BASE);
    expect(engine.state.status).toMatchObject({ code: 'bad-url' });
    await engine.loadUrl('http://[nope', BASE);
    expect(engine.state.status).toMatchObject({ code: 'bad-url' });

    const cases: [() => Promise<unknown>, string][] = [
      [() => Promise.reject(new TypeError('Failed to fetch')), 'network'],
      [() => Promise.reject(new SyntaxError('bad')), 'bad-json'],
      [async () => ({ notes: [] }), 'missing-notes'],
    ];
    for (const [fetchJson, code] of cases) {
      const failing = setup({ fetchJson }).engine;
      await failing.loadUrl('https://example.com/a.json', BASE);
      expect(failing.state.status).toMatchObject({ kind: 'error', code });
    }
  });

  it('reports HTTP status codes', async () => {
    vi.stubGlobal('fetch', async () => new Response('missing', { status: 404 }));
    const { engine } = setup({ fetchJson: undefined });
    await engine.loadUrl('https://example.com/a.json', BASE);
    expect(engine.state.status).toEqual({ kind: 'error', code: 'http', detail: '404' });
    vi.unstubAllGlobals();
  });

  it('ignores a slow load superseded by a newer one', async () => {
    let resolveSlow: (value: unknown) => void = () => undefined;
    const fetchJson = vi
      .fn<(url: URL) => Promise<unknown>>()
      .mockImplementationOnce(() => new Promise((resolve) => (resolveSlow = resolve)))
      .mockImplementationOnce(async () => ({ title: 'Rápida', notes: ['Re'] }));
    const { engine } = setup({ fetchJson });
    const slow = engine.loadUrl('https://example.com/lenta.json', BASE);
    await engine.loadUrl('https://example.com/rapida.json', BASE);
    resolveSlow({ title: 'Lenta', notes: ['Do'] });
    await expect(slow).resolves.toBe(false);
    expect(engine.state.song.title).toBe('Rápida');
  });
});

describe('sharing and startup', () => {
  it('loads shared links and rejects broken ones', () => {
    const { engine } = setup();
    const hash = new URL(buildShareUrl(BASE, { title: 'Mi Corazón', notes: ['Mi'] })).hash;
    expect(engine.loadShared(hash)).toBe(true);
    expect(engine.state.status).toEqual({ kind: 'loaded', title: 'Mi Corazón', shared: true });
    expect(engine.loadShared('#main')).toBe(false);
    expect(engine.loadShared('#s=***')).toBe(false);
    expect(engine.state.status).toEqual({ kind: 'error', code: 'bad-share' });
  });

  it('shares natively, then copies, then falls back to the JSON', async () => {
    const share = vi.fn(async () => undefined);
    const copyText = vi.fn(async () => undefined);
    const { engine } = setup({ share, copyText });
    await expect(engine.shareSong('https://x/#s=a', { title: 'A' })).resolves.toBe('shared');
    share.mockRejectedValueOnce(new DOMException('cancel', 'AbortError'));
    await expect(engine.shareSong('https://x/#s=a', {})).resolves.toBe('cancelled');
    share.mockRejectedValueOnce(new Error('no'));
    await expect(engine.shareSong('https://x/#s=a', {})).resolves.toBe('copied');
    expect(copyText).toHaveBeenCalledWith('https://x/#s=a');
    share.mockRejectedValueOnce(new Error('no'));
    copyText.mockRejectedValueOnce(new Error('denied'));
    await expect(engine.shareSong('https://x/#s=a', {})).resolves.toBe('fallback');
    expect(JSON.parse(engine.songJson())).toEqual(engine.state.song.raw);
  });

  it('prefers the shared link, then ?json=, and restores the last address', async () => {
    const fetchJson = vi.fn(async () => ({ title: 'De la URL', notes: ['Do'] }));
    const storage = { readLastUrl: () => '/guardada.json', writeLastUrl: vi.fn() };
    const { engine } = setup({ fetchJson, storage });
    const hash = new URL(buildShareUrl(BASE, { title: 'Compartida', notes: ['Do'] })).hash;
    engine.hydrate({ hash, search: '?json=/x.json', href: BASE });
    expect(engine.state.song.title).toBe('Compartida');
    expect(engine.state.lastUrl).toBe('/guardada.json');
    expect(fetchJson).not.toHaveBeenCalled();

    engine.hydrate({ hash: '', search: '?json=/canciones/a.json', href: BASE });
    await vi.waitFor(() => expect(engine.state.song.title).toBe('De la URL'));
  });
});
