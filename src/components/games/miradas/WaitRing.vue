<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  remainingMs: number;
  totalMs: number;
}>();

const fraction = computed(() => {
  if (props.totalMs <= 0) return 0;
  return Math.min(1, Math.max(0, props.remainingMs / props.totalMs));
});
</script>

<template>
  <span class="miradas-ring" aria-hidden="true">
    <svg viewBox="0 0 120 120">
      <circle class="miradas-ring__track" cx="60" cy="60" r="54" />
      <circle
        class="miradas-ring__value"
        cx="60"
        cy="60"
        r="54"
        pathLength="100"
        :style="{ '--ring-progress': fraction }"
      />
    </svg>
    <slot />
  </span>
</template>
