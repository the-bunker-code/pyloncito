<script setup lang="ts">
import Icon from './Icon.vue';

defineProps<{
  value: number;
  label: string;
}>();
</script>

<template>
  <p class="star-pill" role="img" :aria-label="`${label}: ${value}`">
    <Icon name="star" :size="22" :stroke-width="2" />
    <span aria-hidden="true">{{ value }}</span>
  </p>
</template>
