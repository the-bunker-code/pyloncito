<script setup lang="ts">
import { computed } from 'vue';
import { icons, type IconName } from './icons';

const props = withDefaults(
  defineProps<{
    name: IconName;
    size?: number;
    label?: string;
    strokeWidth?: number;
  }>(),
  {
    size: 24,
    label: '',
    strokeWidth: 2.5,
  },
);

const parts = computed(() => icons[props.name]);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
  >
    <component :is="part.tag" v-for="(part, index) in parts" :key="index" v-bind="part.attrs" />
  </svg>
</template>
