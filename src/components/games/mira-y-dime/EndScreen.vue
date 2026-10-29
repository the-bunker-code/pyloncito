<script setup lang="ts">
import AppButton from '../../ui/AppButton.vue';
import Icon from '../../ui/Icon.vue';
import Mascot from '../../ui/Mascot.vue';
import { copy } from '../../../games/mira-y-dime/copy';
import type { MiraState } from '../../../games/mira-y-dime/engine';

defineProps<{ state: MiraState }>();
defineEmits<{ home: []; again: [] }>();
</script>

<template>
  <section id="mira-screen-end" class="screen screen--end" tabindex="-1">
    <div class="end">
      <div class="end__mascot">
        <Mascot mood="happy" />
      </div>
      <div class="end__stars" role="img" :aria-label="copy.starsLabel(state.totalRounds)">
        <Icon v-for="index in state.totalRounds" :key="index" name="star" :size="44" />
      </div>
      <h2 class="end__title">{{ copy.end.title }}</h2>
      <p class="end__line">{{ copy.end.said(state.saidCount, state.totalRounds) }}</p>
      <div v-if="state.endButtonsVisible" class="end__buttons">
        <AppButton variant="secondary" size="kid" @click="$emit('home')">
          <Icon name="house" :size="26" />
          {{ copy.actions.home }}
        </AppButton>
        <AppButton variant="primary" size="kid" @click="$emit('again')">
          <Icon name="rotate-ccw" :size="26" />
          {{ copy.actions.again }}
        </AppButton>
      </div>
    </div>
  </section>
</template>
