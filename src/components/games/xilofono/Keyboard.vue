<script setup lang="ts">
import { copy } from '../../../games/xilofono/copy';
import { KEYS, type KeyDefinition } from '../../../games/xilofono/config';
import { noteLabel } from '../../../games/xilofono/messages';

const props = defineProps<{
  lit: readonly boolean[];
  hasSharps: boolean;
  targetKey: number;
  missKey: number;
  missCount: number;
}>();

const emit = defineEmits<{ press: [key: number] }>();

function keyClass(key: KeyDefinition) {
  return [
    'xilo-key',
    'xilo-tone',
    `xilo-tone--${key.degree}`,
    key.sharp ? 'xilo-key--sharp xilo-tone--sharp' : 'xilo-key--natural',
    props.lit[key.id] && 'is-lit',
    props.targetKey === key.id && 'is-target',
    // Two identical animations alternate so every wrong tap restarts the wobble.
    props.missKey === key.id && (props.missCount % 2 === 0 ? 'is-miss-a' : 'is-miss-b'),
  ];
}

function keyStyle(key: KeyDefinition) {
  return { '--i': key.sharp ? 0 : key.id, '--col': (key.octave - 1) * 7 + key.degree + 1 };
}

/** Touch and mouse play on press; keyboard activation (Enter/Space) arrives as a click with detail 0. */
function onPointerDown(event: PointerEvent, key: number) {
  if (event.button !== 0) return;
  event.preventDefault();
  emit('press', key);
}

function onClick(event: MouseEvent, key: number) {
  if (event.detail === 0) emit('press', key);
}
</script>

<template>
  <div
    class="xilo-keyboard"
    :class="{ 'xilo-keyboard--sharps': hasSharps }"
    role="group"
    :aria-label="copy.keyboardLabel"
  >
    <template v-for="key in KEYS" :key="key.id">
      <button
        v-if="!key.sharp || hasSharps"
        type="button"
        :class="keyClass(key)"
        :style="keyStyle(key)"
        @pointerdown="onPointerDown($event, key.id)"
        @click="onClick($event, key.id)"
      >
        <!-- Screen readers hear "Do sostenido 1"; the key shows "Do♯ 1". -->
        <span v-if="key.sharp">
          <span aria-hidden="true">{{ noteLabel(key.degree, true) }}</span>
          <span class="sr-only">{{ noteLabel(key.degree, false) }} {{ copy.sharp }}</span>
        </span>
        <span v-else>{{ noteLabel(key.degree, false) }}</span>
        {{ ' ' }}<small>{{ key.octave }}</small>
      </button>
    </template>
  </div>
</template>
