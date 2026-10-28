<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { common } from '../../content/es/common';
import { speak } from '../../lib/speech';
import AppButton from './AppButton.vue';
import Icon from './Icon.vue';

const status = ref('');
const ready = ref(false);

onMounted(() => {
  ready.value = true;
});

function testVoice(): void {
  const played = speak(common.voice.sample);
  status.value = played ? common.voice.played : common.voice.unavailable;
}
</script>

<template>
  <div class="voice-test" :data-ready="ready">
    <AppButton variant="primary" size="small" @click="testVoice">
      <Icon name="volume-2" :size="18" />
      {{ common.actions.testVoice }}
    </AppButton>
    <p class="voice-test__status" aria-live="polite">{{ status }}</p>
  </div>
</template>
