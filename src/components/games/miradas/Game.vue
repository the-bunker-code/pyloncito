<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import SettingsDialog from '../../ui/SettingsDialog.vue';
import type { GameEntry } from '../../../config/games';
import { trackEvent } from '../../../lib/analytics';
import { copy } from '../../../games/miradas/copy';
import { createMiradasEngine, type Screen } from '../../../games/miradas/engine';
import type { MiradasSettings } from '../../../games/miradas/storage';
import EndScreen from './EndScreen.vue';
import HomeScreen from './HomeScreen.vue';
import ProgressScreen from './ProgressScreen.vue';
import RoundScreen from './RoundScreen.vue';
import SettingsPanel from './SettingsPanel.vue';

defineProps<{ game: GameEntry }>();

const engine = createMiradasEngine();
const settingsOpen = ref(false);
const savingSettings = ref(false);
const draft = ref<MiradasSettings>({
  ...engine.state.settings,
  names: [...engine.state.settings.names],
});

const screenIds: Record<Screen, string> = {
  home: 'miradas-screen-home',
  round: 'miradas-screen-round',
  end: 'miradas-screen-end',
  progress: 'miradas-screen-progress',
};

const themeClass = computed(() =>
  engine.state.screen === 'home'
    ? 'miradas-game--home'
    : `miradas-game--level-${engine.state.settings.level}`,
);

watch(
  () => engine.state.screen,
  async (screen) => {
    await nextTick();
    document.getElementById(screenIds[screen])?.focus({ preventScroll: true });
  },
);

function openSettings(): void {
  trackEvent('settings_open', {
    game: 'miradas',
    level: engine.state.settings.level,
    source: 'home',
  });
  savingSettings.value = false;
  draft.value = { ...engine.state.settings, names: [...engine.state.settings.names] };
  settingsOpen.value = true;
}

function closeSettings(): void {
  if (savingSettings.value) {
    savingSettings.value = false;
    return;
  }

  trackEvent('settings_cancel', {
    game: 'miradas',
    level: engine.state.settings.level,
    source: 'home',
    reason: 'dismiss',
  });
  settingsOpen.value = false;
}

function saveSettings(next: MiradasSettings): void {
  trackEvent('settings_saved', {
    game: 'miradas',
    level: next.level,
    voice: next.voice,
    sound: next.sound,
    previous_level: engine.state.settings.level,
  });
  savingSettings.value = true;
  engine.updateSettings(next);
  settingsOpen.value = false;
}

function chooseLevel(level: MiradasSettings['level']): void {
  trackEvent('level_select', {
    game: 'miradas',
    level,
    previous_level: engine.state.settings.level,
  });
  engine.chooseLevel(level);
}

function homeFromEnd(): void {
  trackEvent('game_home', { game: 'miradas' });
  engine.goHome();
}

function backToHome(): void {
  engine.goHome('user');
}

onMounted(() => engine.hydrate());

onBeforeUnmount(() => engine.dispose());
</script>

<template>
  <div class="miradas-game" :class="themeClass">
    <div class="miradas-game__inner">
      <HomeScreen
        v-show="engine.state.screen === 'home'"
        :settings="engine.state.settings"
        @start="engine.startSession"
        @level="chooseLevel"
        @adults="engine.chooseAdults"
        @name="engine.setName"
        @settings="openSettings"
        @progress="engine.showProgress"
      />

      <RoundScreen
        v-show="engine.state.screen === 'round'"
        :game="game"
        :state="engine.state"
        @count="engine.countAndWait"
        @looked="engine.looked"
        @ready="engine.ready"
        @choose="engine.chooseEmotion"
        @next="engine.next"
        @finish="engine.finishSession"
        @home="backToHome"
        @look-window="engine.setLookWindow"
      />

      <EndScreen v-show="engine.state.screen === 'end'" :state="engine.state" @home="homeFromEnd" />

      <ProgressScreen
        v-show="engine.state.screen === 'progress'"
        :sessions="engine.state.sessions"
        @back="backToHome"
        @clear="engine.clearProgress"
      />

      <SettingsDialog :open="settingsOpen" :title="copy.settings.title" @close="closeSettings">
        <SettingsPanel :settings="draft" @save="saveSettings" @cancel="closeSettings" />
      </SettingsDialog>
    </div>
  </div>
</template>
