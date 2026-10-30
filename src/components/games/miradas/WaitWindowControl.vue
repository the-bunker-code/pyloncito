<script setup lang="ts">
import { computed } from 'vue';
import { LOOK_WINDOW_OPTIONS, type LookWindow } from '../../../games/miradas/config';
import { copy } from '../../../games/miradas/copy';

const props = defineProps<{ value: LookWindow }>();
const emit = defineEmits<{ change: [value: LookWindow] }>();

const index = computed(() => Math.max(0, LOOK_WINDOW_OPTIONS.indexOf(props.value)));
const first = computed(() => index.value === 0);
const last = computed(() => index.value === LOOK_WINDOW_OPTIONS.length - 1);

function move(direction: -1 | 1): void {
  const next = LOOK_WINDOW_OPTIONS[index.value + direction];
  if (next !== undefined) emit('change', next);
}
</script>

<template>
  <div class="miradas-wait-control" role="group" :aria-label="copy.labels.wait">
    <span class="miradas-wait-control__label">{{ copy.labels.wait }}</span>
    <button
      type="button"
      class="miradas-wait-control__button"
      :aria-label="copy.labels.lessWait"
      :disabled="first"
      @click="move(-1)"
    >
      −
    </button>
    <span class="miradas-wait-control__value" aria-live="polite">
      {{ copy.settings.seconds(value) }}
    </span>
    <button
      type="button"
      class="miradas-wait-control__button"
      :aria-label="copy.labels.moreWait"
      :disabled="last"
      @click="move(1)"
    >
      +
    </button>
  </div>
</template>
