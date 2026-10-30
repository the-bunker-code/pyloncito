<script setup lang="ts">
import Icon from './Icon.vue';

defineProps<{
  text: string;
  label: string;
}>();
</script>

<template>
  <p class="session-clock" role="timer" :aria-label="label">
    <Icon name="clock" :size="18" :stroke-width="2" />
    <span>{{ text }}</span>
  </p>
</template>
