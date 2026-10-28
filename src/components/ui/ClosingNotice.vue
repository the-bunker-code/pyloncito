<script setup lang="ts">
import { computed } from 'vue';
import type { ClosingNotice } from '../../games/shared/session';
import { common } from '../../content/es/common';
import Icon from './Icon.vue';

const props = defineProps<{ notice: ClosingNotice }>();

const message = computed(() => {
  if (props.notice === 'two') return common.session.two;
  if (props.notice === 'one') return common.session.one;
  if (props.notice === 'finished') return common.session.finished;
  return '';
});
</script>

<template>
  <p v-if="message" class="closing-notice" aria-live="polite">
    <Icon name="star" :size="18" />
    <span>{{ message }}</span>
  </p>
</template>
