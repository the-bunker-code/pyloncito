<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { common } from '../../content/es/common';
import Icon from './Icon.vue';

const props = defineProps<{
  open: boolean;
  title: string;
}>();

const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);

function sync(open: boolean): void {
  const element = dialog.value;
  if (!element) return;
  if (open && !element.open) element.showModal();
  if (!open && element.open) element.close();
}

function requestClose(): void {
  dialog.value?.close();
}

watch(() => props.open, sync, { flush: 'post' });
onMounted(() => sync(props.open));
</script>

<template>
  <dialog ref="dialog" class="dialog" @cancel.prevent="requestClose" @close="emit('close')">
    <div class="dialog__panel">
      <header class="dialog__header">
        <h2>{{ title }}</h2>
        <button
          class="icon-button"
          type="button"
          :aria-label="common.actions.close"
          @click="requestClose"
        >
          <Icon name="x" :size="20" />
        </button>
      </header>
      <slot />
    </div>
  </dialog>
</template>
