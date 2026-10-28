const PREFERRED_LANGUAGES = ['es-419', 'es-pe', 'es-mx', 'es-us', 'es-es'];

export function chooseSpanishVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const spanish = voices.filter((voice) => voice.lang.toLowerCase().startsWith('es'));
  if (spanish.length === 0) return null;

  for (const language of PREFERRED_LANGUAGES) {
    const local = spanish.find(
      (voice) => voice.localService && voice.lang.toLowerCase().startsWith(language),
    );
    if (local) return local;
  }

  const local = spanish.find((voice) => voice.localService);
  if (local) return local;

  for (const language of PREFERRED_LANGUAGES) {
    const voice = spanish.find((candidate) => candidate.lang.toLowerCase().startsWith(language));
    if (voice) return voice;
  }

  return spanish[0] ?? null;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function speak(text: string, options: SpeakOptions = {}): boolean {
  if (!('speechSynthesis' in window)) return false;

  try {
    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = chooseSpanishVoice(synthesis.getVoices());
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? 'es-419';
    utterance.rate = options.rate ?? 0.95;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    synthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function cancelSpeech(): void {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    return;
  }
}
