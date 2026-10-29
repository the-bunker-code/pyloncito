<script setup lang="ts">
import AdultGate from '../../ui/AdultGate.vue';
import Icon from '../../ui/Icon.vue';
import Mascot from '../../ui/Mascot.vue';
import { LEVELS, MODES } from '../../../games/mira-y-dime/config';
import { copy } from '../../../games/mira-y-dime/copy';
import type { MiraSettings } from '../../../games/mira-y-dime/storage';

defineProps<{ settings: MiraSettings }>();
defineEmits<{
  start: [mode: MiraSettings['mode']];
  level: [level: MiraSettings['level']];
  settings: [];
}>();
</script>

<template>
  <section id="mira-screen-home" class="screen screen--home" tabindex="-1">
    <header class="home-header">
      <div>
        <p class="mira-eyebrow">{{ copy.subtitle }}</p>
        <h1 class="mira-logo">Mira <span class="mira-logo__accent">y Dime</span></h1>
      </div>
      <AdultGate
        class="mira-gear"
        :label="copy.actions.settings"
        icon="settings"
        :icon-size="26"
        compact
        @pass="$emit('settings')"
      />
    </header>

    <div class="greeting">
      <div class="greeting__mascot">
        <Mascot mood="happy" />
      </div>
      <p class="bubble greeting__bubble">{{ copy.greeting }}</p>
    </div>

    <div class="level-picker" role="group" :aria-label="copy.settings.level">
      <button
        v-for="level in LEVELS"
        :key="level.id"
        type="button"
        class="level"
        :class="{ 'is-selected': settings.level === level.id }"
        :aria-pressed="settings.level === level.id"
        @click="$emit('level', level.id)"
      >
        <Icon :name="level.icon" :size="26" :stroke-width="3" />
        <span class="level__name">{{ copy.levels[level.id].name }}</span>
        <span class="level__hint">{{ copy.levels[level.id].hint }}</span>
      </button>
    </div>

    <div class="mode-grid">
      <button
        v-for="mode in MODES"
        :key="mode.id"
        type="button"
        class="mode-card"
        :class="`mode-card--${mode.id}`"
        :data-mode="mode.id"
        @click="$emit('start', mode.id)"
      >
        <span class="mode-card__deco" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="mode-card__icon">
          <Icon :name="mode.icon" :size="32" :stroke-width="3" />
        </span>
        <span class="mode-card__text">
          <span class="mode-card__name">{{ copy.modes[mode.id].name }}</span>
          <span class="mode-card__subtitle">{{ copy.modes[mode.id].subtitle }}</span>
        </span>
      </button>
    </div>

    <p class="mira-note">{{ copy.adultNote }}</p>
  </section>
</template>
