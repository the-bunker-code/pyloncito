<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'white' | 'primary' | 'secondary' | 'ghost';
    size?: 'normal' | 'small' | 'kid';
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    variant: 'white',
    size: 'normal',
    type: 'button',
  },
);
</script>

<template>
  <button
    :type="type"
    class="button"
    :class="[
      variant === 'primary' && 'button--primary',
      variant === 'secondary' && 'button--secondary',
      variant === 'ghost' && 'button--ghost',
      size === 'small' && 'button--small',
      size === 'kid' && 'button--kid',
    ]"
  >
    <slot />
  </button>
</template>
