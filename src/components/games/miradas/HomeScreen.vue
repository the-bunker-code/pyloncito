<script setup lang="ts">
import AppButton from '../../ui/AppButton.vue';
import Icon from '../../ui/Icon.vue';
import Mascot from '../../ui/Mascot.vue';
import { ADULT_COUNTS, ADULT_FACES, LEVEL_ICONS, LEVEL_IDS } from '../../../games/miradas/config';
import { copy } from '../../../games/miradas/copy';
import type { MiradasSettings } from '../../../games/miradas/storage';

defineProps<{ settings: MiradasSettings }>();
const emit = defineEmits<{
  start: [];
  level: [level: MiradasSettings['level']];
  adults: [count: MiradasSettings['adults']];
  name: [index: number, value: string];
  settings: [];
  progress: [];
}>();

function onName(index: number, event: Event): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) emit('name', index, target.value);
}
</script>

<template>
  <section id="miradas-screen-home" class="screen screen--home" tabindex="-1">
    <header class="miradas-home__header">
      <div>
        <p class="miradas-eyebrow">{{ copy.subtitle }}</p>
        <h1 class="miradas-logo">Miradas</h1>
      </div>
      <button
        type="button"
        class="miradas-gear"
        :aria-label="copy.actions.settings"
        @click="emit('settings')"
      >
        <Icon name="settings" :size="26" />
      </button>
    </header>

    <div class="miradas-greeting">
      <div class="miradas-greeting__mascot is-floating">
        <Mascot mood="happy" />
      </div>
      <p class="miradas-bubble">{{ copy.greeting }}</p>
    </div>

    <div class="miradas-group" role="group" :aria-label="copy.labels.level">
      <p class="miradas-group__label">{{ copy.labels.level }}</p>
      <div class="miradas-levels">
        <button
          v-for="level in LEVEL_IDS"
          :key="level"
          type="button"
          class="miradas-level"
          :class="{ 'is-selected': settings.level === level }"
          :aria-pressed="settings.level === level"
          @click="emit('level', level)"
        >
          <Icon :name="LEVEL_ICONS[level]" :size="26" :stroke-width="3" />
          <span class="miradas-level__name">{{ copy.levels[level].name }}</span>
          <span class="miradas-level__topic">{{ copy.levels[level].topic }}</span>
        </button>
      </div>
      <p class="miradas-hint">{{ copy.levels[settings.level].hint }}</p>
    </div>

    <div class="miradas-panel">
      <div class="miradas-group" role="group" :aria-label="copy.labels.adults">
        <p class="miradas-group__label">{{ copy.labels.adults }}</p>
        <div class="miradas-adults">
          <button
            v-for="count in ADULT_COUNTS"
            :key="count"
            type="button"
            class="miradas-choice"
            :aria-pressed="settings.adults === count"
            @click="emit('adults', count)"
          >
            {{ count }}
          </button>
        </div>
      </div>

      <div class="miradas-names">
        <label
          v-for="(name, index) in settings.names"
          v-show="index < settings.adults"
          :key="index"
          class="miradas-name"
        >
          <span class="miradas-name__avatar" :class="`adult-${index + 1}`" aria-hidden="true">
            <img :src="ADULT_FACES[index]" alt="" width="32" height="32" decoding="async" />
          </span>
          <span class="sr-only">{{ copy.labels.name(index + 1) }}</span>
          <input
            class="miradas-name__input"
            type="text"
            maxlength="20"
            autocomplete="off"
            :value="name"
            @change="onName(index, $event)"
          />
        </label>
      </div>
    </div>

    <AppButton class="miradas-cta" variant="primary" size="kid" @click="emit('start')">
      <Icon name="play" :size="26" :stroke-width="3" />
      {{ copy.actions.start }}
    </AppButton>

    <button type="button" class="miradas-link" @click="emit('progress')">
      {{ copy.actions.progress }}
    </button>

    <p class="miradas-note">{{ copy.adultNote }}</p>
  </section>
</template>
