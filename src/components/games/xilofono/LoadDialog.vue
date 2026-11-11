<script setup lang="ts">
import { ref, useId, watch } from 'vue';
import AppDialog from '../../ui/AppDialog.vue';
import { copy } from '../../../games/xilofono/copy';
import type { StatusMessage } from '../../../games/xilofono/messages';

const props = defineProps<{
  open: boolean;
  lastUrl: string;
  busy: boolean;
  message: StatusMessage | undefined;
}>();

const emit = defineEmits<{ close: []; loadUrl: [url: string]; loadText: [text: string] }>();

const url = ref(props.lastUrl);
const json = ref('');
const urlId = useId();
const jsonId = useId();

watch(
  () => props.open,
  (open) => {
    if (open) url.value = props.lastUrl;
  },
);
</script>

<template>
  <AppDialog :open="open" :title="copy.dialog.title" @close="emit('close')">
    <form class="xilo-load" @submit.prevent="emit('loadUrl', url)">
      <label :for="urlId">{{ copy.dialog.urlLabel }}</label>
      <div class="xilo-load__row">
        <input
          :id="urlId"
          v-model="url"
          type="text"
          inputmode="url"
          autocomplete="off"
          spellcheck="false"
          :placeholder="copy.dialog.urlPlaceholder"
        />
        <button type="submit" class="xilo-button xilo-button--small" :disabled="busy">
          {{ copy.dialog.submit }}
        </button>
      </div>
    </form>

    <section class="xilo-load__samples" :aria-label="copy.dialog.samples">
      <h3>{{ copy.dialog.samples }}</h3>
      <ul>
        <li v-for="sample in copy.samples" :key="sample.url">
          <button
            type="button"
            class="xilo-button xilo-button--small"
            :disabled="busy"
            @click="emit('loadUrl', sample.url)"
          >
            {{ sample.title }}
          </button>
        </li>
      </ul>
    </section>

    <details class="xilo-load__paste">
      <summary>{{ copy.dialog.pasteSummary }}</summary>
      <label :for="jsonId" class="sr-only">{{ copy.dialog.pasteSummary }}</label>
      <textarea
        :id="jsonId"
        v-model="json"
        rows="5"
        spellcheck="false"
        :placeholder="copy.dialog.pastePlaceholder"
      ></textarea>
      <button type="button" class="xilo-button xilo-button--small" @click="emit('loadText', json)">
        {{ copy.dialog.pasteSubmit }}
      </button>
    </details>

    <p class="xilo-load__message" :class="{ 'is-error': message?.error }" role="status">
      {{ message?.text }}
    </p>
  </AppDialog>
</template>
