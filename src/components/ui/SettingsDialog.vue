<script setup lang="ts">
import { common } from '../../content/es/common';
import AppDialog from './AppDialog.vue';

withDefaults(defineProps<{ open: boolean; title?: string }>(), {
  title: common.settings.title,
});
defineEmits<{ close: [] }>();
</script>

<template>
  <AppDialog :open="open" :title="title" @close="$emit('close')">
    <div class="settings">
      <slot />
    </div>
  </AppDialog>
</template>
