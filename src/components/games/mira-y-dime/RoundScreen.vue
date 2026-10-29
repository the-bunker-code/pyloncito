<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import ClosingNotice from '../../ui/ClosingNotice.vue';
import GameHeader from '../../ui/GameHeader.vue';
import Icon from '../../ui/Icon.vue';
import { levelById, modeById } from '../../../games/mira-y-dime/config';
import { copy } from '../../../games/mira-y-dime/copy';
import type { MiraState } from '../../../games/mira-y-dime/engine';
import type { GameEntry } from '../../../config/games';

const props = defineProps<{ game: GameEntry; state: MiraState }>();
const emit = defineEmits<{
  piece: [value: string];
  said: [value: boolean];
  repeat: [];
  settings: [];
}>();
const tray = ref<HTMLElement | null>(null);

const round = computed(() => props.state.round);
const isPhrase = computed(
  () => round.value?.mode === 'shortPhrase' || round.value?.mode === 'longPhrase',
);
const mode = computed(() => (round.value ? modeById(round.value.mode) : null));
const level = computed(() => (round.value ? levelById(round.value.level) : null));
const canChoose = computed(() => props.state.phase === 'answering');
const showSaid = computed(
  () =>
    props.state.phase === 'saying' ||
    (props.state.phase === 'solved' &&
      round.value !== null &&
      props.state.placed >= round.value.units.length),
);
const saidDisabled = computed(() => props.state.phase !== 'saying');
const waiting = computed(() => props.state.phase === 'showing' || props.state.phase === 'helping');
const tips = computed(() =>
  round.value ? [...copy.modes[round.value.mode].tips, ...copy.adult.generalTips] : [],
);
const statusText = computed(() => {
  if (!round.value) return '';
  if (props.state.phase === 'showing') return copy.status.look;
  if (props.state.phase === 'helping') return copy.status.helping;
  if (props.state.phase === 'answering') {
    return `${round.value.question} ${copy.status.answering(
      props.state.placed,
      round.value.units.length,
    )}`;
  }
  if (props.state.phase === 'saying') return copy.status.saying;
  return copy.result(round.value.target);
});

async function choose(value: string): Promise<void> {
  const active = document.activeElement;
  const wasKeyboard = active instanceof HTMLElement && active.matches(':focus-visible');
  emit('piece', value);
  await nextTick();
  if (!wasKeyboard || !(active instanceof HTMLElement) || active.isConnected) return;
  tray.value?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
}
</script>

<template>
  <section
    id="mira-screen-game"
    class="screen screen--game"
    tabindex="-1"
    :data-mode="round?.mode"
    :data-level="round?.level"
    :data-round="state.roundNumber"
    :data-phase="state.phase"
    :data-total="state.totalRounds"
    :data-said="state.saidCount"
  >
    <h2 class="sr-only">Jugando</h2>
    <GameHeader
      :game="game"
      :progress="state.roundNumber"
      :progress-max="state.totalRounds"
      :progress-label="copy.progressLabel"
      :progress-text="copy.roundCounter(state.roundNumber, state.totalRounds)"
      heading-level="h2"
    >
      <button
        class="mira-gear"
        type="button"
        :aria-label="copy.actions.settings"
        @click="$emit('settings')"
      >
        <Icon name="settings" :size="24" />
      </button>
    </GameHeader>

    <div v-if="round && mode && level" class="round">
      <div class="mode-chip">
        <span class="mode-chip__icon">
          <Icon :name="mode.icon" :size="18" :stroke-width="3" />
        </span>
        <span>{{ copy.modes[round.mode].name }} · {{ copy.levels[round.level].name }}</span>
      </div>

      <button
        class="question"
        type="button"
        :aria-label="`${copy.actions.repeat}: ${round.question}`"
        @click="$emit('repeat')"
      >
        <span class="question__speaker"><Icon name="volume-2" :size="24" /></span>
        <span class="question__text">{{ round.question }}</span>
      </button>

      <ClosingNotice :notice="state.closing" />

      <div class="game-layout">
        <div class="game-layout__main">
          <div class="prompt-card">
            <div class="picture" :class="{ 'is-done': state.phase === 'solved' }">
              <img
                class="picture__drawing"
                :src="round.object.drawing"
                :alt="round.object.word"
                width="128"
                height="128"
                decoding="async"
              />
            </div>
          </div>

          <div class="table" :class="{ 'table--words': isPhrase }">
            <div class="slots">
              <span
                v-for="(unit, index) in round.units"
                :key="`${round.object.id}-${index}`"
                class="slot"
                role="group"
                :aria-label="copy.status.slot(index + 1, index < state.placed ? unit : null)"
                :class="{
                  'is-filled': index < state.placed,
                  'is-landing': index === state.placed - 1,
                  'is-next': index === state.placed,
                }"
              >
                <template v-if="index < state.placed">{{ unit }}</template>
                <span v-else-if="round.guide" class="slot__guide" aria-hidden="true">
                  {{ unit }}
                </span>
              </span>
            </div>
          </div>

          <p class="sr-only" role="status">{{ statusText }}</p>
        </div>

        <div class="game-layout__side">
          <div
            v-if="showSaid"
            ref="tray"
            class="tray tray--said"
            :class="{ 'tray--waiting': saidDisabled }"
          >
            <button
              type="button"
              class="button button--kid said-button said-button--yes"
              :aria-disabled="saidDisabled"
              @click="$emit('said', true)"
            >
              <Icon name="check" :size="28" :stroke-width="3" />
              {{ copy.actions.said }}
            </button>
            <button
              type="button"
              class="button button--kid said-button"
              :aria-disabled="saidDisabled"
              @click="$emit('said', false)"
            >
              <Icon name="arrow-right" :size="28" :stroke-width="3" />
              {{ copy.actions.next }}
            </button>
          </div>

          <div
            v-else
            ref="tray"
            class="tray"
            :class="[`tray--count-${state.bank.length}`, { 'tray--waiting': waiting }]"
          >
            <button
              v-for="value in state.bank"
              :key="`${round.object.id}-${value}`"
              type="button"
              class="piece"
              :class="{
                'piece--word': isPhrase,
                'is-pulsing': state.pulseValue === value,
                'is-nudged': state.shake?.value === value,
              }"
              :data-value="value"
              :aria-label="value"
              :aria-disabled="!canChoose"
              @click="choose(value)"
            >
              {{ value }}
            </button>
          </div>

          <details class="adult">
            <summary class="adult__summary">
              <Icon name="info" :size="22" />
              <span>{{ copy.adult.summary }}</span>
              <span class="adult__chevron"><Icon name="chevron-down" :size="22" /></span>
            </summary>
            <ul class="adult__list">
              <li v-for="tip in tips" :key="tip">{{ tip }}</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  </section>
</template>
