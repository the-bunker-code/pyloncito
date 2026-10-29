<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import SettingsDialog from '../../ui/SettingsDialog.vue';
import type { GameEntry } from '../../../config/games';
import { trackEvent } from '../../../lib/analytics';
import { copy } from '../../../games/mira-y-dime/copy';
import { createMiraEngine, type Screen } from '../../../games/mira-y-dime/engine';
import type { MiraSettings } from '../../../games/mira-y-dime/storage';
import EndScreen from './EndScreen.vue';
import HomeScreen from './HomeScreen.vue';
import RoundScreen from './RoundScreen.vue';
import SettingsPanel from './SettingsPanel.vue';

const props = defineProps<{ game: GameEntry }>();

const engine = createMiraEngine();
const settingsOpen = ref(false);
const savingSettings = ref(false);
const settingsSource = ref<'home' | 'game'>('home');
const draft = ref<MiraSettings>({ ...engine.state.settings });

const preloaded = new Map<string, HTMLImageElement>();

const screenIds: Record<Screen, string> = {
  home: 'mira-screen-home',
  game: 'mira-screen-game',
  end: 'mira-screen-end',
};

const activeMode = computed(() => engine.state.round?.mode ?? engine.state.settings.mode);
const themeClass = computed(() =>
  engine.state.screen === 'home' ? 'mira-game--home' : `mira-game--${activeMode.value}`,
);

watch(
  () => engine.state.screen,
  async (screen) => {
    await nextTick();
    document.getElementById(screenIds[screen])?.focus({ preventScroll: true });
  },
);

watch(
  () => engine.state.roundNumber,
  () => {
    if (typeof window === 'undefined') return;
    const next = engine.state.plan[engine.state.roundNumber];
    if (!next || preloaded.has(next.drawing)) return;
    const image = new Image();
    image.src = next.drawing;
    preloaded.set(next.drawing, image);
  },
  { immediate: true },
);

function openSettings(source: 'home' | 'game'): void {
  settingsSource.value = source;
  trackEvent('settings_open', {
    game: props.game.slug,
    mode: engine.state.settings.mode,
    level: engine.state.settings.level,
    rounds: engine.state.settings.rounds,
    source,
  });
  engine.pause();
  savingSettings.value = false;
  draft.value = { ...engine.state.settings };
  settingsOpen.value = true;
}

function closeSettings(): void {
  settingsOpen.value = false;
  if (savingSettings.value) {
    savingSettings.value = false;
    return;
  }

  trackEvent('settings_cancel', {
    game: props.game.slug,
    mode: engine.state.settings.mode,
    level: engine.state.settings.level,
    rounds: engine.state.settings.rounds,
    source: settingsSource.value,
    reason: 'dismiss',
  });

  if (engine.state.screen !== 'home') engine.goHome('settings_cancel');
}

function saveSettings(next: MiraSettings): void {
  const previousLevel = engine.state.settings.level;
  trackEvent('settings_saved', {
    game: props.game.slug,
    mode: next.mode,
    level: next.level,
    rounds: next.rounds,
    voice: next.voice,
    sound: next.sound,
    previous_level: previousLevel,
  });
  savingSettings.value = true;
  engine.updateSettings(next);
  engine.startGame(next.mode);
  settingsOpen.value = false;
}

function start(mode: MiraSettings['mode']): void {
  engine.startGame(mode);
}

function chooseLevel(level: MiraSettings['level']): void {
  trackEvent('level_select', {
    game: props.game.slug,
    mode: engine.state.settings.mode,
    level,
    previous_level: engine.state.settings.level,
  });
  engine.chooseLevel(level);
}

function again(): void {
  trackEvent('game_replay', {
    game: props.game.slug,
    mode: engine.state.settings.mode,
    level: engine.state.settings.level,
  });
  engine.startGame(engine.state.settings.mode);
}

function homeFromEnd(): void {
  trackEvent('game_home', { game: props.game.slug });
  engine.goHome();
}

onBeforeUnmount(() => engine.dispose());
</script>

<template>
  <div class="mira-game" :class="themeClass">
    <div class="mira-game__inner">
      <HomeScreen
        v-show="engine.state.screen === 'home'"
        :settings="engine.state.settings"
        @start="start"
        @level="chooseLevel"
        @settings="openSettings('home')"
      />

      <RoundScreen
        v-show="engine.state.screen === 'game'"
        :game="game"
        :state="engine.state"
        @piece="engine.choosePiece"
        @said="engine.confirmSaid"
        @repeat="engine.repeatQuestion"
        @settings="openSettings('game')"
      />

      <EndScreen
        v-show="engine.state.screen === 'end'"
        :state="engine.state"
        @home="homeFromEnd"
        @again="again"
      />

      <SettingsDialog :open="settingsOpen" :title="copy.settings.title" @close="closeSettings">
        <SettingsPanel :settings="draft" @save="saveSettings" @cancel="closeSettings" />
      </SettingsDialog>
    </div>
  </div>
</template>
