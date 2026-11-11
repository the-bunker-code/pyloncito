<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AppDialog from '../../ui/AppDialog.vue';
import { createMarimba } from '../../../games/xilofono/audio';
import { KEYBOARD_MAP } from '../../../games/xilofono/config';
import { copy } from '../../../games/xilofono/copy';
import { createXilofonoEngine } from '../../../games/xilofono/engine';
import { songTitle, statusMessage } from '../../../games/xilofono/messages';
import { buildShareUrl } from '../../../games/xilofono/share';
import Controls from './Controls.vue';
import Keyboard from './Keyboard.vue';
import LoadDialog from './LoadDialog.vue';
import RotateNotice from './RotateNotice.vue';
import Score from './Score.vue';

const marimba = createMarimba();
const engine = createXilofonoEngine({ play: marimba.play });
const { state } = engine;

const loadOpen = ref(false);
const shareJson = ref<string | undefined>(undefined);

const title = computed(() => songTitle(state.song.title));
const message = computed(() => statusMessage(state.status));
// The load dialog only reports on loading itself, not on playing or guiding.
const loadMessage = computed(() =>
  state.status.kind === 'loading' || state.status.kind === 'error' ? message.value : undefined,
);
const targetKey = computed(() => {
  const note = state.song.notes[state.target];
  return note && !note.rest ? note.key : -1;
});

async function loadUrl(url: string) {
  if (await engine.loadUrl(url, window.location.href)) loadOpen.value = false;
}

function loadText(text: string) {
  if (engine.loadText(text)) loadOpen.value = false;
}

async function share() {
  const url = buildShareUrl(window.location.href, state.song.raw);
  const result = await engine.shareSong(url, {
    title: title.value,
    text: copy.dialog.shareText(title.value),
  });
  if (result === 'fallback') shareJson.value = engine.songJson();
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

function onKeyDown(event: KeyboardEvent) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (loadOpen.value || shareJson.value !== undefined || isTyping(event.target)) return;
  const key = KEYBOARD_MAP[event.key.toLowerCase()];
  if (key === undefined) return;
  event.preventDefault();
  engine.press(key);
}

function onHashChange() {
  engine.loadShared(window.location.hash);
}

let stopListening: (() => void) | undefined;

onMounted(() => {
  stopListening = marimba.listen(window);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('hashchange', onHashChange);
  engine.hydrate(window.location);
});

onBeforeUnmount(() => {
  stopListening?.();
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('hashchange', onHashChange);
  engine.dispose();
});
</script>

<template>
  <div class="xilofono" :data-mode="state.mode">
    <h1 class="sr-only">{{ copy.title }}</h1>

    <section class="xilofono__top">
      <Score
        :layout="state.layout"
        :time="state.time"
        :smooth-scroll="state.smoothScroll"
        :hit="state.hit"
        :target="state.target"
      />
      <Controls
        :mode="state.mode"
        :load-open="loadOpen"
        @load="loadOpen = true"
        @play="engine.togglePlay"
        @guide="engine.toggleGuide"
        @share="share"
      />
    </section>

    <div class="xilofono__info">
      <h2>{{ title }}</h2>
      <span class="xilofono__meta">
        {{
          copy.meta(state.song.notes.length, Math.round(state.song.tempo), state.song.beatsPerBar)
        }}
      </span>
      <p
        class="xilofono__status"
        :class="{ 'is-error': message.error }"
        role="status"
        aria-live="polite"
      >
        {{ message.text }}
      </p>
    </div>

    <Keyboard
      :lit="state.lit"
      :has-sharps="state.song.hasSharps"
      :target-key="targetKey"
      :miss-key="state.missKey"
      :miss-count="state.missCount"
      @press="engine.press"
    />

    <LoadDialog
      :open="loadOpen"
      :last-url="state.lastUrl"
      :busy="state.busy"
      :message="loadMessage"
      @close="loadOpen = false"
      @load-url="loadUrl"
      @load-text="loadText"
    />

    <AppDialog
      :open="shareJson !== undefined"
      :title="copy.dialog.shareTitle"
      @close="shareJson = undefined"
    >
      <label class="xilo-load">
        <span>{{ copy.dialog.shareJsonLabel }}</span>
        <textarea :value="shareJson" rows="8" readonly spellcheck="false"></textarea>
      </label>
    </AppDialog>

    <RotateNotice />
  </div>
</template>
