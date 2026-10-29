<script setup lang="ts">
import { computed } from 'vue';
import { common } from '../../content/es/common';

const props = withDefaults(
  defineProps<{
    value: number;
    max?: number;
    label?: string;
    valueText?: string;
  }>(),
  {
    max: 100,
    label: common.settings.progress,
    valueText: undefined,
  },
);

const clamped = computed(() => Math.min(Math.max(props.value, 0), props.max));
const percent = computed(() => (props.max > 0 ? (clamped.value / props.max) * 100 : 0));
</script>

<template>
  <div
    class="progress-bar"
    role="progressbar"
    :aria-label="label"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="clamped"
    :aria-valuetext="valueText"
  >
    <span class="progress-bar__track" aria-hidden="true">
      <span class="progress-bar__fill" :style="{ '--progress': `${percent}%` }"></span>
    </span>
    <span class="progress-bar__label" aria-hidden="true">
      <span v-if="valueText" class="progress-bar__value">{{ valueText }}</span>
      <span v-else>{{ label }}</span>
    </span>
  </div>
</template>
