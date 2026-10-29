import { reactive } from 'vue';
import {
  playCountTone,
  playSoftErrorTone,
  playSuccessTone,
  setMuted,
  unlockAudio,
} from '../../lib/audio';
import { trackEvent, type AnalyticsEventName, type AnalyticsParams } from '../../lib/analytics';
import { cancelSpeech, primeSpeech, speakAsync } from '../../lib/speech';
import { wait } from '../../lib/timers';
import { closingNotice, type ClosingNotice } from '../shared/session';
import { MISSES_BEFORE_HELP, TIMING, type LevelId, type ModeId } from './config';
import { copy } from './copy';
import { BUILTIN_OBJECTS, type GameObject } from './objects';
import { createRound, initialBank, nextBank, planSession, unitPhrase, type Round } from './rules';
import { loadSettings, normalizeSettings, saveSettings, type MiraSettings } from './storage';

export type Screen = 'home' | 'game' | 'end';
export type Phase = 'showing' | 'answering' | 'helping' | 'solved' | 'saying';
export type Mood = 'idle' | 'happy' | 'think';

export interface MiraState {
  screen: Screen;
  settings: MiraSettings;
  plan: GameObject[];
  roundNumber: number;
  totalRounds: number;
  round: Round | null;
  phase: Phase;
  placed: number;
  bank: string[];
  misses: number;
  pulseValue: string | null;
  shake: { value: string; nonce: number } | null;
  hopping: boolean;
  mood: Mood;
  saidCount: number;
  endButtonsVisible: boolean;
  closing: ClosingNotice;
}

export interface EngineDependencies {
  speak?: (text: string) => Promise<void>;
  wait?: (milliseconds: number) => Promise<void>;
  random?: () => number;
  playCount?: (count: number) => void;
  playSuccess?: () => void;
  playError?: () => void;
  unlock?: () => void;
  initialSettings?: MiraSettings;
  persistSettings?: (settings: MiraSettings) => void;
  track?: (name: AnalyticsEventName, params: AnalyticsParams) => void;
}

export function createMiraEngine(dependencies: EngineDependencies = {}) {
  const speak = dependencies.speak ?? ((text: string) => speakAsync(text));
  const sleep = dependencies.wait ?? ((milliseconds: number) => wait(milliseconds));
  const random = dependencies.random ?? Math.random;
  const playCount = dependencies.playCount ?? playCountTone;
  const playSuccess = dependencies.playSuccess ?? playSuccessTone;
  const playError = dependencies.playError ?? playSoftErrorTone;
  const unlock = dependencies.unlock ?? unlockAudio;
  const persist = dependencies.persistSettings ?? saveSettings;
  const track = dependencies.track ?? trackEvent;

  const initial = dependencies.initialSettings ?? loadSettings();
  setMuted(!initial.sound);

  const state = reactive<MiraState>({
    screen: 'home',
    settings: normalizeSettings(initial),
    plan: [],
    roundNumber: 0,
    totalRounds: 0,
    round: null,
    phase: 'showing',
    placed: 0,
    bank: [],
    misses: 0,
    pulseValue: null,
    shake: null,
    hopping: false,
    mood: 'happy',
    saidCount: 0,
    endButtonsVisible: false,
    closing: null,
  });

  let roundId = 0;
  let shakeNonce = 0;
  let sessionStartedAt = 0;
  let errorCount = 0;
  let helpCount = 0;
  let roundAttempts = 0;

  const isStale = (id: number): boolean => id !== roundId;

  async function say(text: string): Promise<void> {
    if (!state.settings.voice) return;
    await speak(text);
  }

  async function sayWithin(text: string, maxMs: number): Promise<void> {
    if (!state.settings.voice) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        say(text),
        new Promise<void>((resolve) => {
          timer = setTimeout(resolve, maxMs);
        }),
      ]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  function updateSettings(next: MiraSettings): void {
    state.settings = normalizeSettings(next);
    setMuted(!state.settings.sound);
    persist(state.settings);
  }

  function chooseLevel(level: LevelId): void {
    updateSettings({ ...state.settings, level });
  }

  function startGame(mode: ModeId = state.settings.mode): void {
    unlock();
    primeSpeech();
    updateSettings({ ...state.settings, mode });
    state.plan = planSession(BUILTIN_OBJECTS, state.settings, { random });
    if (state.plan.length === 0) {
      goHome();
      return;
    }
    state.screen = 'game';
    state.roundNumber = 1;
    state.totalRounds = state.plan.length;
    state.saidCount = 0;
    state.endButtonsVisible = false;
    sessionStartedAt = Date.now();
    errorCount = 0;
    helpCount = 0;
    roundAttempts = 0;
    track('game_start', {
      game: 'mira-y-dime',
      mode,
      level: state.settings.level,
      rounds: state.plan.length,
    });
    void playRound();
  }

  function goHome(reason: 'settings_cancel' | 'user' | 'unmount' = 'user'): void {
    if (state.screen === 'game' && state.round) {
      track('game_exit', {
        game: 'mira-y-dime',
        mode: state.settings.mode,
        level: state.settings.level,
        round: state.roundNumber,
        total: state.totalRounds,
        duration_seconds: Math.max(0, Math.round((Date.now() - sessionStartedAt) / 1000)),
        reason,
      });
    }

    roundId++;
    void stopSpeech();
    state.screen = 'home';
    state.plan = [];
    state.roundNumber = 0;
    state.totalRounds = 0;
    state.round = null;
    state.phase = 'solved';
    state.placed = 0;
    state.bank = [];
    state.misses = 0;
    state.pulseValue = null;
    state.shake = null;
    state.hopping = false;
    state.mood = 'happy';
    state.saidCount = 0;
    state.endButtonsVisible = false;
    state.closing = null;
  }

  function pause(): void {
    roundId++;
    void stopSpeech();
  }

  function dispose(): void {
    roundId++;
    void stopSpeech();
  }

  async function stopSpeech(): Promise<void> {
    cancelSpeech();
  }

  function repeatQuestion(): void {
    if (state.round && state.phase === 'answering') void say(state.round.question);
  }

  function choosePiece(value: string): void {
    const { round } = state;
    if (state.phase !== 'answering' || !round) return;
    const position = state.bank.indexOf(value);
    if (position === -1) return;

    roundAttempts += 1;
    if (value === round.units[state.placed]) {
      handleCorrect(round, value, position);
    } else {
      handleMistake(round, value);
    }
  }

  function confirmSaid(said: boolean): void {
    if (state.phase !== 'saying') return;
    void finishRound(said);
  }

  async function playRound(): Promise<void> {
    const id = ++roundId;
    const object = state.plan[state.roundNumber - 1];
    if (!object) {
      goHome();
      return;
    }
    const round = createRound(object, state.settings, copy.question);
    state.round = round;
    state.closing = closingNotice({
      completed: state.roundNumber - 1,
      total: state.totalRounds,
    });
    state.phase = 'showing';
    state.placed = 0;
    state.bank = initialBank(round.units, round.bankSize, random);
    state.misses = 0;
    roundAttempts = 0;
    state.pulseValue = null;
    state.shake = null;
    state.hopping = false;
    state.mood = 'idle';

    if (state.closing === 'two') await sayWithin(copy.session.two, TIMING.speechCap);
    if (state.closing === 'one') await sayWithin(copy.session.one, TIMING.speechCap);
    if (isStale(id)) return;

    await sleep(TIMING.beforeShow);
    if (isStale(id)) return;

    state.phase = 'answering';
    void say(round.question);
  }

  function handleCorrect(round: Round, value: string, position: number): void {
    const errors = state.misses;
    state.placed += 1;
    state.misses = 0;
    state.pulseValue = null;
    state.shake = null;
    state.bank = nextBank(
      state.bank,
      position,
      round.units.slice(state.placed),
      round.bankSize,
      random,
    );
    if (state.settings.sound) playCount(state.placed);

    track('answer', {
      game: 'mira-y-dime',
      mode: round.mode,
      level: round.level,
      round: state.roundNumber,
      result: 'correct',
      attempt: roundAttempts,
      errors,
      help_count: helpCount,
      error_count: errorCount,
    });

    if (state.placed < round.units.length) {
      void say(unitPhrase(value));
      return;
    }
    void solveRound(round);
  }

  async function solveRound(round: Round): Promise<void> {
    const id = roundId;
    track('round_complete', {
      game: 'mira-y-dime',
      mode: round.mode,
      level: round.level,
      round: state.roundNumber,
      total: state.totalRounds,
    });
    state.phase = 'solved';
    state.mood = 'happy';
    state.hopping = true;
    if (state.settings.sound) playSuccess();

    setTimeout(() => {
      if (isStale(id)) return;
      state.hopping = false;
    }, TIMING.hop);

    let capped = false;
    const praise = (async () => {
      await say(copy.result(round.target));
      if (capped || isStale(id)) return;
      await Promise.all([say(copy.voice.great), sleep(TIMING.nextRound)]);
    })();
    await Promise.race([praise, sleep(TIMING.speechCap)]);
    capped = true;
    if (isStale(id)) return;

    state.phase = 'saying';
    void say(copy.voice.sayIt);
  }

  async function finishRound(said: boolean): Promise<void> {
    const id = roundId;
    state.phase = 'solved';
    if (said) {
      state.saidCount += 1;
      if (state.settings.sound) playSuccess();
    }

    await Promise.all([
      said ? sayWithin(copy.voice.saidIt, TIMING.speechCap) : Promise.resolve(),
      sleep(TIMING.saidPause),
    ]);
    if (isStale(id)) return;

    if (state.roundNumber < state.totalRounds) {
      state.roundNumber += 1;
      void playRound();
    } else {
      void endSession();
    }
  }

  function handleMistake(round: Round, value: string): void {
    if (state.settings.sound) playError();
    errorCount += 1;
    state.misses += 1;
    const nonce = ++shakeNonce;
    state.shake = { value, nonce };

    track('answer', {
      game: 'mira-y-dime',
      mode: round.mode,
      level: round.level,
      round: state.roundNumber,
      result: 'incorrect',
      attempt: roundAttempts,
      errors: state.misses,
      help_count: helpCount,
      error_count: errorCount,
    });

    setTimeout(() => {
      if (state.shake?.nonce !== nonce) return;
      state.shake = null;
    }, TIMING.shake);

    if (state.misses >= MISSES_BEFORE_HELP) {
      void runHelp(round);
    } else {
      void say(copy.voice.almost);
    }
  }

  async function runHelp(round: Round): Promise<void> {
    const id = roundId;
    const next = round.units[state.placed];
    if (!next) return;

    state.phase = 'helping';
    state.mood = 'think';
    helpCount += 1;
    track('help_used', {
      game: 'mira-y-dime',
      mode: round.mode,
      level: round.level,
      round: state.roundNumber,
      help_count: helpCount,
      error_count: errorCount,
    });
    await sleep(TIMING.shake + TIMING.helpSettle);
    if (isStale(id)) return;

    state.pulseValue = next;
    await sayWithin(copy.voice.next, TIMING.speechCap);
    if (isStale(id)) return;
    await Promise.all([sayWithin(unitPhrase(next), TIMING.speechCap), sleep(TIMING.helpStep)]);
    if (isStale(id)) return;

    state.misses = 0;
    state.phase = 'answering';
    state.mood = 'idle';
  }

  async function endSession(): Promise<void> {
    const id = ++roundId;
    state.screen = 'end';
    state.mood = 'happy';
    state.endButtonsVisible = false;
    state.closing = null;
    track('session_complete', {
      game: 'mira-y-dime',
      mode: state.settings.mode,
      level: state.settings.level,
      rounds: state.totalRounds,
      said_count: state.saidCount,
      duration_seconds: Math.max(0, Math.round((Date.now() - sessionStartedAt) / 1000)),
      help_count: helpCount,
      error_count: errorCount,
    });
    void say(copy.voice.end);
    await sleep(TIMING.endButtons);
    if (isStale(id)) return;
    state.endButtonsVisible = true;
  }

  return {
    state,
    chooseLevel,
    startGame,
    goHome,
    pause,
    dispose,
    repeatQuestion,
    choosePiece,
    confirmSaid,
    updateSettings,
  };
}

export type MiraEngine = ReturnType<typeof createMiraEngine>;
