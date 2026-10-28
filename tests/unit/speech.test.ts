import { describe, expect, it } from 'vitest';
import { chooseSpanishVoice } from '../../src/lib/speech';

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

  it('prefers es-419 among local voices', () => {
    const peru = voice('es-PE', true, 'Peru');
    const latin = voice('es-419', true, 'Latin');
    expect(chooseSpanishVoice([peru, latin])).toBe(latin);
  });

  it('falls back to any Spanish voice', () => {
    const spanish = voice('es-ES', false, 'Spain');
    expect(chooseSpanishVoice([voice('en-US', true, 'English'), spanish])).toBe(spanish);
  });
});
