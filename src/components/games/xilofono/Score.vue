<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { noteLabel } from '../../../games/xilofono/messages';
import {
  CLEF_PATH,
  SCORE,
  clefTransform,
  noteShapes,
  scrollForTime,
  viewport,
  type ScoreLayout,
  type ScoreNote,
} from '../../../games/xilofono/score';

const props = defineProps<{
  layout: ScoreLayout;
  time: number;
  smoothScroll: boolean;
  hit: readonly boolean[];
  target: number;
}>();

const { S, TOP, CLEF_W, LABEL_Y, LYRIC_Y } = SCORE;
const STAFF_LINES = [0, 1, 2, 3, 4].map((line) => line * S);

const box = ref<HTMLElement | null>(null);
const scroller = ref<HTMLElement | null>(null);
const size = ref({ width: 0, height: 0 });

const view = computed(() => {
  const { width, height } = size.value;
  return width > 0 && height > 0 ? viewport(props.layout, width, height) : undefined;
});

const shapes = computed(() => props.layout.notes.map(noteShapes));
const haloHeight = (note: ScoreNote) =>
  (note.event.lyric ? LYRIC_Y : LABEL_Y) + 0.3 * S - TOP - 0.2 * S;

function noteClass(note: ScoreNote) {
  const { event, index } = note;
  return [
    'xilo-note',
    !event.rest && `xilo-tone xilo-tone--${event.degree}`,
    !event.rest && event.sharp && 'xilo-tone--sharp',
    props.hit[index] && 'is-hit',
    props.target === index && 'is-now',
  ];
}

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function syncScroll(smooth: boolean) {
  const element = scroller.value;
  const current = view.value;
  if (!element || !current) return;
  element.scrollTo({
    left: scrollForTime(props.layout, current, props.time),
    behavior: smooth && !reducedMotion ? 'smooth' : 'instant',
  });
}

watch(
  () => props.time,
  () => syncScroll(props.smoothScroll),
);
watch(view, () => syncScroll(false), { flush: 'post' });

let observer: ResizeObserver | undefined;
onMounted(() => {
  if (!box.value) return;
  observer = new ResizeObserver(([entry]) => {
    if (!entry) return;
    size.value = { width: entry.contentRect.width, height: entry.contentRect.height };
  });
  observer.observe(box.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div
    ref="box"
    class="xilo-score"
    aria-hidden="true"
    :style="view ? { '--xilo-playhead': `${view.playheadPx}px` } : undefined"
  >
    <div v-if="view" ref="scroller" class="xilo-score__scroller">
      <svg
        class="xilo-score__clef"
        :width="view.clefPx"
        :height="size.height"
        :viewBox="`0 ${TOP} ${CLEF_W} ${layout.height}`"
      >
        <line
          v-for="y in STAFF_LINES"
          :key="y"
          class="staff-line"
          x1="0"
          :x2="CLEF_W"
          :y1="y"
          :y2="y"
        />
        <path class="clef-glyph" :d="CLEF_PATH" :transform="clefTransform()" />
        <text class="time-sig" :x="4.55 * S" :y="2 * S">{{ layout.beatsPerBar }}</text>
        <text class="time-sig" :x="4.55 * S" :y="4 * S">4</text>
      </svg>
      <svg
        class="xilo-score__staff"
        :width="view.totalU * view.scale"
        :height="size.height"
        :viewBox="`0 ${TOP} ${view.totalU} ${layout.height}`"
      >
        <line
          v-for="y in STAFF_LINES"
          :key="y"
          class="staff-line"
          x1="0"
          :x2="view.totalU"
          :y1="y"
          :y2="y"
        />
        <g :transform="`translate(${view.padU} 0)`">
          <line
            v-for="x in layout.barLines"
            :key="`bar-${x}`"
            class="bar-line"
            :x1="x"
            :x2="x"
            y1="0"
            :y2="4 * S"
          />
          <line
            class="bar-line"
            :x1="layout.endX + 0.2 * S"
            :x2="layout.endX + 0.2 * S"
            y1="0"
            :y2="4 * S"
          />
          <line
            class="bar-end"
            :x1="layout.endX + 0.55 * S"
            :x2="layout.endX + 0.55 * S"
            y1="0"
            :y2="4 * S"
          />
          <g v-for="note in layout.notes" :key="note.index" :class="noteClass(note)">
            <rect
              class="halo"
              :x="note.cx - 1.5 * S"
              :y="TOP + 0.2 * S"
              :width="3 * S"
              :height="haloHeight(note)"
              rx="10"
            />
            <component
              :is="shape.tag"
              v-for="(shape, index) in shapes[note.index]"
              :key="index"
              :class="shape.className"
              v-bind="shape.attrs"
            />
            <text v-if="!note.event.rest" class="label" :x="note.cx" :y="LABEL_Y">
              {{ noteLabel(note.event.degree, note.event.sharp) }}
            </text>
            <text v-if="note.event.lyric" class="lyric" :x="note.cx" :y="LYRIC_Y">
              {{ note.event.lyric }}
            </text>
          </g>
        </g>
      </svg>
    </div>
    <div class="xilo-score__playhead"></div>
  </div>
</template>
