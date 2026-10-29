<script setup lang="ts">
import { common } from '../../content/es/common';
import type { GameEntry } from '../../config/games';
import Icon from './Icon.vue';
import ProgressBar from './ProgressBar.vue';

withDefaults(
  defineProps<{
    game: GameEntry;
    progress?: number;
    progressMax?: number;
    progressLabel?: string;
    progressText?: string;
    headingLevel?: 'h1' | 'h2';
    backHref?: string | null;
    backLabel?: string;
  }>(),
  {
    progress: undefined,
    progressMax: 100,
    progressLabel: common.settings.progress,
    progressText: undefined,
    headingLevel: 'h1',
    backHref: '/',
    backLabel: common.actions.backHome,
  },
);

defineEmits<{ back: [] }>();
</script>

<template>
  <header class="game-header" :class="`game-header--${game.theme}`">
    <button
      v-if="backHref === null"
      class="icon-button"
      type="button"
      :aria-label="backLabel"
      @click="$emit('back')"
    >
      <Icon name="arrow-left" :size="20" />
    </button>
    <a v-else class="icon-button" :href="backHref" :aria-label="backLabel">
      <Icon name="arrow-left" :size="20" />
    </a>
    <span class="game-header__icon">
      <Icon :name="game.icon" :size="22" />
    </span>
    <div class="game-header__body">
      <component :is="headingLevel">{{ game.name }}</component>
      <p class="game-header__meta">{{ game.skill }}</p>
      <ProgressBar
        v-if="progress !== undefined"
        :value="progress"
        :max="progressMax"
        :label="progressLabel"
        :value-text="progressText"
      />
    </div>
    <slot />
  </header>
</template>
