<script setup lang="ts">
import { common } from '../../content/es/common';
import AppDialog from './AppDialog.vue';

defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <AppDialog :open="open" :title="common.settings.title" @close="$emit('close')">
    <div class="settings">
      <slot />
    </div>
  </AppDialog>
</template>
