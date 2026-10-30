<script setup lang="ts">
import { computed, ref } from 'vue';
import AppButton from '../../ui/AppButton.vue';
import ConfirmDialog from '../../ui/ConfirmDialog.vue';
import Icon from '../../ui/Icon.vue';
import { copy } from '../../../games/miradas/copy';
import type { SavedSession } from '../../../games/miradas/storage';

const props = defineProps<{ sessions: readonly SavedSession[] }>();
const emit = defineEmits<{ back: []; clear: [] }>();

const confirmOpen = ref(false);
const dateFormat = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const recent = computed(() =>
  props.sessions.slice(-12).map((session) => ({
    ...session,
    height:
      session.avgLook === null
        ? 0
        : Math.max(
            4,
            Math.round(
              (session.avgLook / Math.max(1, ...props.sessions.map((item) => item.avgLook ?? 0))) *
                100,
            ),
          ),
  })),
);

const rows = computed(() =>
  [...props.sessions].reverse().map((session) => ({
    ...session,
    date: dateFormat.format(new Date(session.date)),
    levelName: copy.levels[session.level].name,
    look: lookText(session.avgLook),
  })),
);

function lookText(seconds: number | null): string {
  return seconds === null ? copy.progress.noLooks : `${String(seconds).replace('.', ',')} s`;
}

function confirmClear(): void {
  confirmOpen.value = false;
  emit('clear');
}
</script>

<template>
  <section id="miradas-screen-progress" class="screen screen--progress" tabindex="-1">
    <header class="miradas-topbar">
      <h2>{{ copy.progress.title }}</h2>
      <AppButton variant="ghost" @click="emit('back')">{{ copy.actions.backGameHome }}</AppButton>
    </header>

    <p v-if="sessions.length === 0" class="miradas-empty">{{ copy.progress.empty }}</p>

    <template v-else>
      <section class="miradas-chart" aria-hidden="true">
        <h3>{{ copy.progress.chartTitle }}</h3>
        <ol>
          <li v-for="(session, index) in recent" :key="index">
            <span class="miradas-chart__value">
              {{ session.avgLook === null ? '–' : String(session.avgLook).replace('.', ',') }}
            </span>
            <span class="miradas-chart__bar" :style="{ '--h': `${session.height}%` }"></span>
          </li>
        </ol>
      </section>

      <ul class="miradas-sessions">
        <li v-for="(session, index) in rows" :key="index">
          <span class="miradas-session__date">{{ session.date }}</span>
          <span>{{ session.levelName }}</span>
          <span class="miradas-session__stars">
            <Icon name="star" :size="16" :stroke-width="2" />
            {{ session.stars }}
          </span>
          <span>{{ copy.progress.avgLook }}: {{ session.look }}</span>
        </li>
      </ul>

      <AppButton class="miradas-clear" variant="ghost" @click="confirmOpen = true">
        <Icon name="trash-2" :size="18" />
        {{ copy.progress.clear }}
      </AppButton>
    </template>

    <ConfirmDialog
      :open="confirmOpen"
      :title="copy.progress.confirmTitle"
      :message="copy.progress.confirmText"
      :confirm-label="copy.progress.confirmClear"
      :cancel-label="copy.progress.confirmCancel"
      @confirm="confirmClear"
      @cancel="confirmOpen = false"
    />
  </section>
</template>
