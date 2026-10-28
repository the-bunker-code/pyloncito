<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { common } from '../../content/es/common';
import Icon from './Icon.vue';

const props = withDefaults(
  defineProps<{
    label?: string;
    duration?: number;
  }>(),
  {
    label: common.settings.adultGate,
    duration: 3000,
  },
);

const emit = defineEmits<{ pass: [] }>();

const progress = ref(0);
const holding = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

function clearTimer(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function stop(): void {
  clearTimer();
  holding.value = false;
  progress.value = 0;
}

function start(): void {
  if (holding.value || props.duration <= 0) return;
  holding.value = true;
  progress.value = 0;
  const step = (50 / props.duration) * 100;

  timer = setInterval(() => {
    progress.value = Math.min(100, progress.value + step);
    if (progress.value >= 100) {
      clearTimer();
      holding.value = false;
      progress.value = 100;
      emit('pass');
    }
  }, 50);
}

onBeforeUnmount(stop);
</script>

<template>
  <button
    type="button"
    class="adult-gate"
    :aria-label="label"
    @pointerdown.prevent="start"
    @pointerup="stop"
    @pointercancel="stop"
    @pointerleave="stop"
    @keydown.space.prevent="start"
    @keydown.enter.prevent="start"
    @keyup.space="stop"
    @keyup.enter="stop"
    @blur="stop"
  >
    <span class="adult-gate__label">
      <Icon name="lock" :size="18" />
      {{ label }}
    </span>
    <span class="adult-gate__track" aria-hidden="true">
      <span class="adult-gate__bar" :style="{ '--progress': `${progress}%` }"></span>
    </span>
  </button>
</template>
