<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: 'red' | 'green' | 'blue' | 'gold';
    label?: string | number;
    small?: boolean;
  }>(),
  {
    color: 'red',
    label: '',
    small: false,
  },
);
</script>

<template>
  <span
    class="cap"
    :class="[`cap--${color}`, small && 'cap--small']"
    :aria-hidden="label === '' ? 'true' : undefined"
  >
    {{ label }}
  </span>
</template>
