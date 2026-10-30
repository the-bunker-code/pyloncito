import { reactive } from 'vue';
import { trackEvent, type AnalyticsEventName, type AnalyticsParams } from '../../lib/analytics';
import { playCountTone, playSuccessTone, setMuted, unlockAudio } from '../../lib/audio';
import { cancelSpeech, primeSpeech, speakAsync } from '../../lib/speech';
import { wait } from '../../lib/timers';
import type { ClosingNotice } from '../shared/session';
import {
  CARDS_BY_LEVEL,
  EMOTIONS,
  LOOK_WINDOW_OPTIONS,
  ROUND,
  SESSION,
  type LevelId,
  type LookWindow,
} from './config';
import { copy } from './copy';
import { averageLook, drawCard, pickOptions, secondsBetween, teamStars } from './rules';
import {
  DEFAULT_SETTINGS,
  cleanName,
  loadSessions,
  loadSettings,
  normalizeSettings,
  clearSessions as clearSavedSessions,
  appendSession,
  saveSettings,
  type MiradasSettings,
  type SavedSession,
} from './storage';

export type Screen = 'home' | 'round' | 'end' | 'progress';
export type Phase = 'card' | 'counting' | 'waiting' | 'looked' | 'turn' | 'choose' | 'modeled';

export interface MiradasState {
  screen: Screen;
  settings: MiradasSettings;
  sessions: SavedSession[];
  phase: Phase;
  cardId: string;
  deck: string[];
  options: string[];
  chosenId: string | null;
  stars: number[];
  looks: number[];
  elapsedMs: number;
  timeUp: boolean;
  roundNumber: number;
  closing: ClosingNotice;
  waitRemainingMs: number;
  lookedBy: number | null;
}

export interface EngineDependencies {
  speak?: (text: string) => Promise<void>;
  wait?: (milliseconds: number) => Promise<void>;
  random?: () => number;
  now?: () => number;
  playCount?: () => void;
  playCheer?: () => void;
  unlock?: () => void;
  initialSettings?: MiradasSettings;
  initialSessions?: SavedSession[];
  persistSettings?: (settings: MiradasSettings) => void;
  persistSession?: (session: SavedSession) => SavedSession[];
  clearSavedSessions?: () => void;
  loadSavedSessions?: () => SavedSession[];
  track?: (name: AnalyticsEventName, params: AnalyticsParams) => void;
}

export function createMiradasEngine(dependencies: EngineDependencies = {}) {
  const speakText = dependencies.speak ?? ((text: string) => speakAsync(text));
  const sleep = dependencies.wait ?? ((milliseconds: number) => wait(milliseconds));
  const random = dependencies.random ?? Math.random;
  const now = dependencies.now ?? (() => Date.now());
  const playCount = dependencies.playCount ?? (() => playCountTone(1));
  const playCheer = dependencies.playCheer ?? playSuccessTone;
  const unlock = dependencies.unlock ?? unlockAudio;
  const persistSettings = dependencies.persistSettings ?? saveSettings;
  const persistSession = dependencies.persistSession ?? appendSession;
  const clearSaved = dependencies.clearSavedSessions ?? clearSavedSessions;
  const loadSaved = dependencies.loadSavedSessions ?? loadSessions;
  const track = dependencies.track ?? trackEvent;

  const initial = dependencies.initialSettings ?? DEFAULT_SETTINGS;
  setMuted(!initial.sound);

  const state = reactive<MiradasState>({
    screen: 'home',
    settings: normalizeSettings(initial),
    sessions: dependencies.initialSessions ?? [],
    phase: 'card',
    cardId: '',
    deck: [],
    options: [],
    chosenId: null,
    stars: [0, 0, 0],
    looks: [],
    elapsedMs: 0,
    timeUp: false,
    roundNumber: 0,
    closing: null,
    waitRemainingMs: 0,
    lookedBy: null,
  });

  let roundId = 0;
  let startedAt = 0;
  let waitStartedAt = 0;
  let waitDeadline = 0;
  let clockTimer: ReturnType<typeof setInterval> | undefined;
  let warned = false;
  let lastSpeech: Promise<void> = Promise.resolve();

  const isStale = (id: number): boolean => id !== roundId;
  const isQuietPhase = (): boolean => ['card', 'looked', 'modeled'].includes(state.phase);

  function stopClock(): void {
    if (clockTimer !== undefined) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  }

  function say(text: string): Promise<void> {
    if (!state.settings.voice) return Promise.resolve();
    return speakText(text);
  }

  function speak(text: string): Promise<void> {
    lastSpeech = say(text);
    return lastSpeech;
  }

  function tick(): void {
    state.elapsedMs = now() - startedAt;
    if (state.elapsedMs >= SESSION.durationMs) {
      state.timeUp = true;
      if (state.phase === 'card') {
        finishSession();
        return;
      }
    }
    void maybeAnnounceLastRound();
  }

  async function maybeAnnounceLastRound(): Promise<void> {
    if (state.screen !== 'round' || warned || state.elapsedMs < SESSION.warnAtMs) return;
    if (!isQuietPhase()) return;

    warned = true;
    const id = roundId;
    await lastSpeech;
    if (isStale(id) || !isQuietPhase()) {
      warned = false;
      return;
    }

    state.closing = 'one';
    void speak(copy.voice.lastOne);
  }

  function updateSettings(next: MiradasSettings): void {
    state.settings = normalizeSettings(next);
    setMuted(!state.settings.sound);
    persistSettings(state.settings);
  }

  function hydrate(): void {
    state.settings = loadSettings();
    setMuted(!state.settings.sound);
    state.sessions = loadSaved();
  }

  function chooseLevel(level: LevelId): void {
    updateSettings({ ...state.settings, level });
  }

  function chooseAdults(adults: MiradasSettings['adults']): void {
    updateSettings({ ...state.settings, adults });
  }

  function setLookWindow(value: LookWindow): void {
    if (!LOOK_WINDOW_OPTIONS.includes(value)) return;

    const previous = state.settings.lookWindow;
    updateSettings({ ...state.settings, lookWindow: value });

    if (state.phase === 'waiting' && state.waitRemainingMs > 0) {
      waitDeadline = Math.max(now(), waitDeadline + (value - previous) * 1000);
      state.waitRemainingMs = Math.max(0, waitDeadline - now());
    }
  }

  function setName(index: number, value: string): void {
    if (index < 0 || index >= state.settings.names.length) return;
    const fallback = DEFAULT_SETTINGS.names[index] ?? 'Adulto';
    state.settings.names[index] = cleanName(value, fallback);
    persistSettings(normalizeSettings(state.settings));
  }

  function drawNext(): void {
    const ids = CARDS_BY_LEVEL[state.settings.level].map((card) => card.id);
    const next = drawCard(state.deck, ids, random, state.cardId || null);
    state.cardId = next.id;
    state.deck = next.deck;
    state.options = [];
    state.chosenId = null;
    state.phase = 'card';
    state.roundNumber += 1;
    state.waitRemainingMs = 0;
    state.lookedBy = null;
  }

  function startSession(): void {
    unlock();
    primeSpeech();
    roundId += 1;
    stopClock();

    state.stars = [0, 0, 0];
    state.looks = [];
    state.deck = [];
    state.cardId = '';
    state.options = [];
    state.chosenId = null;
    state.elapsedMs = 0;
    state.timeUp = false;
    state.roundNumber = 0;
    state.closing = null;
    state.waitRemainingMs = 0;
    state.lookedBy = null;
    warned = false;
    waitDeadline = 0;
    startedAt = now();
    clockTimer = setInterval(tick, 1000);
    drawNext();
    state.screen = 'round';

    track('game_start', { game: 'miradas', level: state.settings.level });
  }

  async function countAndWait(): Promise<void> {
    if (state.screen !== 'round' || state.phase !== 'card') return;

    const id = ++roundId;
    state.phase = 'counting';
    playCount();
    await Promise.all([speak(copy.voice.countStart), sleep(ROUND.countGapMs)]);
    if (isStale(id)) return;

    playCount();
    await Promise.all([speak(copy.voice.countNext), sleep(ROUND.countGapMs)]);
    if (isStale(id)) return;

    playCount();
    await speak(copy.voice.countFinal);
    if (isStale(id)) return;

    waitStartedAt = now();
    waitDeadline = now() + state.settings.lookWindow * 1000;
    state.waitRemainingMs = Math.max(0, waitDeadline - now());
    state.phase = 'waiting';

    while (now() < waitDeadline) {
      state.waitRemainingMs = Math.max(0, waitDeadline - now());
      await sleep(Math.min(ROUND.waitTickMs, state.waitRemainingMs));
      if (isStale(id)) return;
    }

    state.waitRemainingMs = 0;
  }

  function looked(adultIndex: number): void {
    if (state.phase !== 'waiting' || adultIndex < 0 || adultIndex >= state.settings.adults) {
      return;
    }

    roundId += 1;
    state.lookedBy = adultIndex;
    state.waitRemainingMs = 0;
    state.stars[adultIndex] = (state.stars[adultIndex] ?? 0) + 1;
    state.looks.push(secondsBetween(waitStartedAt, now()));
    state.phase = state.settings.level === 3 ? 'turn' : 'looked';
    playCheer();
    void speak(copy.voice.lookedBy(state.settings.names[adultIndex] ?? ''));
    void maybeAnnounceLastRound();
  }

  function ready(): void {
    if (state.phase !== 'turn') return;

    state.options = pickOptions(
      state.cardId,
      EMOTIONS.map((emotion) => emotion.id),
      random,
    );
    state.phase = 'choose';
    void speak(copy.voice.howIs);
  }

  function chooseEmotion(emotionId: string): void {
    if (state.phase !== 'choose' || !state.options.includes(emotionId)) return;

    state.chosenId = emotionId;
    state.phase = 'modeled';
    const emotion = copy.emotions[state.cardId as keyof typeof copy.emotions];
    if (!emotion) return;

    if (emotionId === state.cardId) {
      playCheer();
      void speak(emotion.cheer);
    } else {
      void speak(emotion.model);
    }
  }

  function next(): void {
    if (state.phase !== 'looked' && state.phase !== 'modeled') return;

    track('round_complete', {
      game: 'miradas',
      level: state.settings.level,
      round: state.roundNumber,
    });
    advance();
  }

  function advance(): void {
    if (state.timeUp) {
      finishSession();
      return;
    }
    drawNext();
  }

  function finishSession(): void {
    if (state.screen !== 'round') return;

    roundId += 1;
    stopClock();
    state.closing = null;
    state.screen = 'end';

    const total = teamStars(state.stars);
    state.sessions = persistSession({
      date: new Date(now()).toISOString(),
      level: state.settings.level,
      stars: total,
      avgLook: averageLook(state.looks),
    });

    track('session_complete', {
      game: 'miradas',
      level: state.settings.level,
      rounds: state.roundNumber,
      duration_seconds: Math.max(0, Math.round((now() - startedAt) / 1000)),
    });

    void speak(copy.voice.total(total));
  }

  function goHome(reason: 'user' | 'unmount' = 'user'): void {
    if (state.screen === 'round') {
      track('game_exit', {
        game: 'miradas',
        level: state.settings.level,
        round: state.roundNumber,
        duration_seconds: Math.max(0, Math.round((now() - startedAt) / 1000)),
        reason,
      });
    }

    roundId += 1;
    stopClock();
    cancelSpeech();
    state.screen = 'home';
    state.phase = 'card';
    state.cardId = '';
    state.deck = [];
    state.options = [];
    state.chosenId = null;
    state.stars = [0, 0, 0];
    state.looks = [];
    state.elapsedMs = 0;
    state.timeUp = false;
    state.roundNumber = 0;
    state.closing = null;
    state.waitRemainingMs = 0;
    state.lookedBy = null;
    waitDeadline = 0;
  }

  function showProgress(): void {
    state.sessions = loadSaved();
    state.screen = 'progress';
  }

  function clearProgress(): void {
    clearSaved();
    state.sessions = [];
  }

  function dispose(): void {
    roundId += 1;
    stopClock();
    cancelSpeech();
  }

  return {
    state,
    chooseLevel,
    chooseAdults,
    setLookWindow,
    setName,
    updateSettings,
    hydrate,
    startSession,
    countAndWait,
    looked,
    ready,
    chooseEmotion,
    next,
    finishSession,
    goHome,
    showProgress,
    clearProgress,
    dispose,
  };
}

export type MiradasEngine = ReturnType<typeof createMiradasEngine>;
