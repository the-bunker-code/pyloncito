<script setup lang="ts">
import AppButton from './AppButton.vue';
import AppDialog from './AppDialog.vue';

defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}>();

defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <AppDialog :open="open" :title="title" @close="$emit('cancel')">
    <p class="confirm-dialog__message">{{ message }}</p>
    <div class="dialog__actions">
      <AppButton variant="secondary" @click="$emit('cancel')">{{ cancelLabel }}</AppButton>
      <AppButton variant="primary" @click="$emit('confirm')">{{ confirmLabel }}</AppButton>
    </div>
  </AppDialog>
</template>
