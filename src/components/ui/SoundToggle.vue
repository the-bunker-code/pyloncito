<script setup lang="ts">
import { common } from '../../content/es/common';
import Icon from './Icon.vue';

defineProps<{ modelValue: boolean }>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>

<template>
  <button
    type="button"
    class="icon-button"
    :aria-label="modelValue ? common.settings.soundOn : common.settings.soundOff"
    :aria-pressed="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <Icon :name="modelValue ? 'volume-2' : 'volume-x'" :size="20" />
  </button>
</template>
