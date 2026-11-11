<script setup lang="ts">
import Icon from '../../ui/Icon.vue';
import { copy } from '../../../games/xilofono/copy';
import type { Mode } from '../../../games/xilofono/engine';

defineProps<{ mode: Mode; loadOpen: boolean }>();

const emit = defineEmits<{ load: []; play: []; guide: []; share: [] }>();
</script>

<template>
  <nav class="xilo-controls" :aria-label="copy.controlsLabel">
    <button
      type="button"
      class="xilo-button"
      aria-haspopup="dialog"
      :aria-expanded="loadOpen"
      @click="emit('load')"
    >
      <Icon name="link" />
      <span>{{ copy.actions.load }}</span>
    </button>
    <button
      type="button"
      class="xilo-button"
      :aria-pressed="mode === 'play'"
      data-action="play"
      @click="emit('play')"
    >
      <Icon :name="mode === 'play' ? 'square' : 'play'" />
      <span>{{ mode === 'play' ? copy.actions.stop : copy.actions.listen }}</span>
    </button>
    <button
      type="button"
      class="xilo-button"
      :aria-pressed="mode === 'guide'"
      data-action="guide"
      @click="emit('guide')"
    >
      <Icon name="target" />
      <span>{{ mode === 'guide' ? copy.actions.exitGuide : copy.actions.guide }}</span>
    </button>
    <button type="button" class="xilo-button" data-action="share" @click="emit('share')">
      <Icon name="share-2" />
      <span>{{ copy.actions.share }}</span>
    </button>
  </nav>
</template>
