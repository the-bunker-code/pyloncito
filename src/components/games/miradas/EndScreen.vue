<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '../../ui/AppButton.vue';
import Icon from '../../ui/Icon.vue';
import Mascot from '../../ui/Mascot.vue';
import { copy } from '../../../games/miradas/copy';
import type { MiradasState } from '../../../games/miradas/engine';
import { teamStars } from '../../../games/miradas/rules';

const props = defineProps<{ state: MiradasState }>();
const total = computed(() => teamStars(props.state.stars));
defineEmits<{ home: [] }>();
</script>

<template>
  <section id="miradas-screen-end" class="screen screen--end" tabindex="-1">
    <div class="miradas-end">
      <div class="miradas-end__mascot"><Mascot mood="happy" /></div>
      <p class="miradas-end__total" :aria-label="copy.aria.stars">
        <Icon name="star" :size="56" :stroke-width="2" />
        <span>{{ total }}</span>
      </p>
      <h2 class="miradas-end__title">{{ copy.end.title }}</h2>
      <p class="miradas-end__caption">{{ copy.end.teamTotal(total) }}</p>

      <div v-if="state.settings.adults > 1" class="miradas-end__adults">
        <h3>{{ copy.end.perAdult }}</h3>
        <ul>
          <li v-for="index in state.settings.adults" :key="index" :class="`adult-${index}`">
            <span>{{ state.settings.names[index - 1] }}</span>
            <span>
              <Icon name="star" :size="20" :stroke-width="2" />
              {{ state.stars[index - 1] }}
            </span>
          </li>
        </ul>
      </div>

      <AppButton class="miradas-cta" variant="primary" size="kid" @click="$emit('home')">
        {{ copy.actions.home }}
      </AppButton>
    </div>
  </section>
</template>
