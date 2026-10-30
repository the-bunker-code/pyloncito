<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import ClosingNotice from '../../ui/ClosingNotice.vue';
import GameHeader from '../../ui/GameHeader.vue';
import Icon from '../../ui/Icon.vue';
import SessionClock from '../../ui/SessionClock.vue';
import StarPill from '../../ui/StarPill.vue';
import type { GameEntry } from '../../../config/games';
import { ADULT_FACES, SESSION, imageOf, type LookWindow } from '../../../games/miradas/config';
import { copy } from '../../../games/miradas/copy';
import type { MiradasState, Phase } from '../../../games/miradas/engine';
import { formatClock, remainingMs, teamStars } from '../../../games/miradas/rules';
import WaitRing from './WaitRing.vue';
import WaitWindowControl from './WaitWindowControl.vue';

const props = defineProps<{ game: GameEntry; state: MiradasState }>();
const emit = defineEmits<{
  count: [];
  looked: [adultIndex: number];
  ready: [];
  choose: [emotionId: string];
  next: [];
  finish: [];
  home: [];
  lookWindow: [value: LookWindow];
}>();

const action = ref<HTMLElement | null>(null);
const card = computed(() => copy.cards[props.state.cardId as keyof typeof copy.cards]);
const cardImage = computed(() => imageOf(props.state.cardId));
const emotion = computed(() => copy.emotions[props.state.cardId as keyof typeof copy.emotions]);
const clock = computed(() => formatClock(remainingMs(props.state.elapsedMs, SESSION.durationMs)));
const stars = computed(() => teamStars(props.state.stars));
const lookedAdult = computed(() => {
  const index = props.state.lookedBy;
  if (index === null) return null;
  return {
    name: props.state.settings.names[index] ?? '',
    image: ADULT_FACES[index] ?? ADULT_FACES[0],
  };
});
const nextButton = computed(() => props.state.phase === 'modeled');
const statusText = computed(() => {
  const phase = props.state.phase;
  if (phase === 'card') {
    return card.value ? copy.status.card(card.value.title, card.value.instruction) : '';
  }
  if (phase === 'looked') {
    const message =
      props.state.settings.level === 2 ? copy.round.faceReward : copy.round.giveReward;
    return `${copy.status.looked}. ${lookedAdult.value?.name ?? ''}. ${message}`;
  }
  if (phase === 'waiting' && props.state.waitRemainingMs === 0) {
    return copy.status.waitOver;
  }
  if (phase === 'modeled' && emotion.value) {
    return props.state.chosenId === props.state.cardId ? emotion.value.cheer : emotion.value.model;
  }
  return copy.status[phase as keyof typeof copy.status] as string;
});

watch(
  () => props.state.phase,
  async () => {
    await nextTick();
    if (document.activeElement !== document.body) return;
    action.value?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  },
);

function isEmotionPhase(phase: Phase): boolean {
  return phase === 'choose' || phase === 'modeled';
}
</script>

<template>
  <section
    id="miradas-screen-round"
    class="screen screen--round"
    tabindex="-1"
    :data-phase="state.phase"
    :data-level="state.settings.level"
    :data-round="state.roundNumber"
    :data-stars="stars"
  >
    <h2 class="sr-only">Ronda</h2>

    <GameHeader
      :game="game"
      :back-href="null"
      :back-label="copy.actions.backGameHome"
      heading-level="h2"
      @back="emit('home')"
    >
      <StarPill :value="stars" :label="copy.aria.stars" />
      <SessionClock :text="clock" :label="copy.aria.clock" />
      <button type="button" class="miradas-finish" @click="emit('finish')">
        {{ copy.actions.finish }}
      </button>
    </GameHeader>

    <ClosingNotice :notice="state.closing" />

    <WaitWindowControl
      v-if="state.phase === 'card' || state.phase === 'waiting'"
      :value="state.settings.lookWindow"
      @change="emit('lookWindow', $event)"
    />

    <div class="miradas-round__stage">
      <template v-if="state.phase === 'looked' && lookedAdult">
        <img
          class="miradas-stage__image miradas-stage__image--adult"
          :src="lookedAdult.image"
          alt=""
          width="160"
          height="160"
          decoding="async"
        />
        <h3 class="miradas-stage__title">{{ lookedAdult.name }}</h3>
        <p class="miradas-stage__text">
          {{ state.settings.level === 2 ? copy.round.faceReward : copy.round.giveReward }}
        </p>
      </template>
      <template v-else-if="state.phase === 'turn' && lookedAdult">
        <img
          class="miradas-stage__image miradas-stage__image--adult"
          :src="lookedAdult.image"
          alt=""
          width="160"
          height="160"
          decoding="async"
        />
        <h3 class="miradas-stage__title">{{ lookedAdult.name }}</h3>
        <p class="miradas-stage__text">{{ copy.round.turnScreen }}</p>
      </template>
      <template v-else-if="state.phase === 'choose'">
        <p class="miradas-big">{{ copy.voice.howIs }}</p>
      </template>
      <template v-else-if="state.phase === 'modeled' && emotion">
        <p class="miradas-big">
          {{ state.chosenId === state.cardId ? emotion.cheer : emotion.model }}
        </p>
      </template>
      <template v-else-if="card">
        <WaitRing
          v-if="state.phase === 'waiting'"
          :remaining-ms="state.waitRemainingMs"
          :total-ms="state.settings.lookWindow * 1000"
        >
          <img
            class="miradas-stage__image"
            :src="cardImage"
            alt=""
            width="160"
            height="160"
            decoding="async"
          />
        </WaitRing>
        <img
          v-else
          class="miradas-stage__image"
          :src="cardImage"
          alt=""
          width="160"
          height="160"
          decoding="async"
        />
        <h3 class="miradas-stage__title">{{ card.title }}</h3>
        <p class="miradas-stage__text">{{ card.instruction }}</p>
      </template>
    </div>

    <div ref="action" class="miradas-round__action">
      <button
        v-if="state.phase === 'card'"
        type="button"
        class="miradas-card-button miradas-card-button--count"
        @click="emit('count')"
      >
        <span class="miradas-card-button__icon"
          ><Icon name="play" :size="32" :stroke-width="3"
        /></span>
        <span class="miradas-card-button__text">{{ copy.round.count }}</span>
      </button>

      <p v-else-if="state.phase === 'counting'" class="miradas-waiting">
        {{ copy.round.counting }}
      </p>

      <template v-else-if="state.phase === 'waiting'">
        <p class="miradas-adult-question">{{ copy.round.whoLooked }}</p>
        <div class="miradas-adult-grid" :class="`miradas-adult-grid--${state.settings.adults}`">
          <button
            v-for="index in state.settings.adults"
            :key="index"
            type="button"
            class="miradas-adult-card"
            :class="`adult-${index}`"
            :aria-label="`${copy.round.whoLooked}: ${state.settings.names[index - 1]}`"
            @click="emit('looked', index - 1)"
          >
            <img
              class="miradas-adult-card__face"
              :src="ADULT_FACES[index - 1]"
              alt=""
              width="72"
              height="72"
              decoding="async"
            />
            <span class="miradas-adult-card__name">{{ state.settings.names[index - 1] }}</span>
          </button>
        </div>
      </template>

      <button
        v-else-if="state.phase === 'looked'"
        type="button"
        class="miradas-card-button"
        @click="emit('next')"
      >
        <span class="miradas-card-button__icon">
          <Icon name="arrow-right" :size="32" :stroke-width="3" />
        </span>
        <span class="miradas-card-button__text">{{ copy.round.next }}</span>
      </button>

      <button
        v-else-if="state.phase === 'turn'"
        type="button"
        class="miradas-card-button button"
        @click="emit('ready')"
      >
        <span class="miradas-card-button__icon"
          ><Icon name="check" :size="32" :stroke-width="3"
        /></span>
        <span class="miradas-card-button__text">{{ copy.round.ready }}</span>
      </button>

      <div v-else-if="isEmotionPhase(state.phase)" class="miradas-options">
        <template v-if="state.phase === 'choose'">
          <button
            v-for="option in state.options"
            :key="option"
            type="button"
            class="miradas-option"
            :data-emotion="option"
            @click="emit('choose', option)"
          >
            <img
              class="miradas-option__image"
              :src="imageOf(option)"
              alt=""
              width="88"
              height="88"
              decoding="async"
            />
            <span>{{ copy.emotions[option as keyof typeof copy.emotions].word }}</span>
          </button>
        </template>
        <template v-else>
          <div
            v-for="option in state.options"
            :key="option"
            class="miradas-option"
            :class="{ 'is-model': option === state.cardId }"
            :data-emotion="option"
          >
            <img
              class="miradas-option__image"
              :src="imageOf(option)"
              alt=""
              width="88"
              height="88"
              decoding="async"
            />
            <span>{{ copy.emotions[option as keyof typeof copy.emotions].word }}</span>
          </div>
        </template>
      </div>

      <button
        v-if="nextButton"
        type="button"
        class="miradas-card-button miradas-card-button--next"
        @click="emit('next')"
      >
        <span class="miradas-card-button__icon">
          <Icon name="arrow-right" :size="32" :stroke-width="3" />
        </span>
        <span class="miradas-card-button__text">{{ copy.round.next }}</span>
      </button>
    </div>

    <p class="sr-only" role="status">{{ statusText }}</p>
  </section>
</template>
