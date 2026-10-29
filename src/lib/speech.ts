const PREFERRED_LANGUAGES = ['es-pe', 'es-419'];
const DEFAULT_LANGUAGE = 'es-PE';
const SPEECH_SETTLE_MS = 80;
const DEFAULT_TIMEOUT_MS = 2000;

let chosenVoice: SpeechSynthesisVoice | null = null;
let voicesBound = false;
let speechToken = 0;
let activeFinish: (() => void) | null = null;
let settleTimer: ReturnType<typeof setTimeout> | undefined;

function getSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

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

function refreshVoice(): void {
  const synthesis = getSynthesis();
  if (!synthesis) return;
  chosenVoice = chooseSpanishVoice(synthesis.getVoices());
}

export function primeSpeech(): void {
  const synthesis = getSynthesis();
  if (!synthesis) return;

  if (!chosenVoice) refreshVoice();
  if (voicesBound) return;

  synthesis.addEventListener?.('voiceschanged', refreshVoice);
  voicesBound = true;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface SpeakAsyncOptions extends SpeakOptions {
  timeoutMs?: number;
}

function stopCurrent(): void {
  clearTimeout(settleTimer);
  settleTimer = undefined;

  const finish = activeFinish;
  activeFinish = null;
  finish?.();

  try {
    getSynthesis()?.cancel();
  } catch {
    return;
  }
}

export function cancelSpeech(): void {
  speechToken++;
  stopCurrent();
}

export function speak(text: string, options: SpeakOptions = {}): boolean {
  if (!text || !getSynthesis()) return false;
  void speakAsync(text, options);
  return true;
}

export function speakAsync(text: string, options: SpeakAsyncOptions = {}): Promise<void> {
  const synthesis = getSynthesis();
  if (!text || !synthesis) return Promise.resolve();

  primeSpeech();

  const token = ++speechToken;
  const wasSpeaking = Boolean(settleTimer) || synthesis.speaking || synthesis.pending;
  stopCurrent();

  return new Promise((resolve) => {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (): void => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearTimeout(settleTimer);
      settleTimer = undefined;
      if (activeFinish === finish) activeFinish = null;
      resolve();
    };

    const start = (): void => {
      if (token !== speechToken) {
        finish();
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = chosenVoice;
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang ?? DEFAULT_LANGUAGE;
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1.05;
        utterance.volume = options.volume ?? 1;
        utterance.onend = finish;
        utterance.onerror = finish;
        timer = setTimeout(finish, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
        synthesis.speak(utterance);
      } catch {
        finish();
      }
    };

    activeFinish = finish;
    if (wasSpeaking) {
      settleTimer = setTimeout(start, SPEECH_SETTLE_MS);
    } else {
      start();
    }
  });
}
