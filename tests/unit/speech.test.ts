import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseSpanishVoice } from '../../src/lib/speech';

class FakeUtterance {
  text: string;
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  pitch = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

interface FakeSynth {
  speaking: boolean;
  pending: boolean;
  getVoices: () => SpeechSynthesisVoice[];
  addEventListener: () => void;
  cancel: () => void;
  speak: (utterance: FakeUtterance) => void;
}

let synth: FakeSynth;

beforeEach(() => {
  vi.useFakeTimers();
  synth = {
    speaking: false,
    pending: false,
    getVoices: () => [voice('es-PE', true, 'Peru')],
    addEventListener: () => undefined,
    cancel: () => {
      synth.speaking = false;
    },
    speak: () => undefined,
  };
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth });
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function voice(lang: string, localService: boolean, name: string): SpeechSynthesisVoice {
  return { lang, localService, name } as unknown as SpeechSynthesisVoice;
}

describe('speech', () => {
  it('returns null without Spanish voices', () => {
    expect(chooseSpanishVoice([voice('en-US', true, 'English')])).toBeNull();
  });

  it('prefers a local voice over a network voice', () => {
    const network = voice('es-419', false, 'Network');
    const local = voice('es-PE', true, 'Local');
    expect(chooseSpanishVoice([network, local])).toBe(local);
  });

  it('prefers es-PE among local voices', () => {
    const peru = voice('es-PE', true, 'Peru');
    const latin = voice('es-419', true, 'Latin');
    expect(chooseSpanishVoice([latin, peru])).toBe(peru);
  });

  it('falls back to es-419 when es-PE is not available', () => {
    const latin = voice('es-419', true, 'Latin');
    expect(chooseSpanishVoice([latin])).toBe(latin);
  });

  it('falls back to any Spanish voice', () => {
    const spanish = voice('es-ES', false, 'Spain');
    expect(chooseSpanishVoice([voice('en-US', true, 'English'), spanish])).toBe(spanish);
  });
});

describe('speakAsync', () => {
  it('waits for an active voice to stop before speaking again', async () => {
    synth.speaking = true;
    const spoken: FakeUtterance[] = [];
    const speak = vi.fn((utterance: FakeUtterance) => {
      synth.speaking = true;
      spoken.push(utterance);
    });
    synth.speak = speak;
    const { speakAsync } = await import('../../src/lib/speech');

    const result = speakAsync('Hola');
    expect(speak).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(80);
    expect(spoken).toHaveLength(1);
    spoken[0]?.onend?.();
    await result;
  });

  it('only starts the latest phrase after rapid calls', async () => {
    synth.speaking = true;
    const spoken: FakeUtterance[] = [];
    synth.speak = (utterance) => {
      synth.speaking = true;
      spoken.push(utterance);
    };
    const { speakAsync } = await import('../../src/lib/speech');

    const first = speakAsync('uno');
    const second = speakAsync('dos');
    const third = speakAsync('tres');
    await vi.advanceTimersByTimeAsync(80);

    expect(spoken.map((utterance) => utterance.text)).toEqual(['tres']);
    spoken[0]?.onend?.();
    await Promise.all([first, second, third]);
  });

  it('resolves when the browser never fires onend', async () => {
    const { speakAsync } = await import('../../src/lib/speech');
    let settled = false;

    void speakAsync('Hola').then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(1999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
  });
});
