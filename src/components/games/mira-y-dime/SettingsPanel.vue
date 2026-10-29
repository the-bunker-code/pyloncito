<script setup lang="ts">
import { reactive, watch } from 'vue';
import AppButton from '../../ui/AppButton.vue';
import { LEVELS, MODES, ROUND_OPTIONS } from '../../../games/mira-y-dime/config';
import { copy } from '../../../games/mira-y-dime/copy';
import type { MiraSettings } from '../../../games/mira-y-dime/storage';

const props = defineProps<{ settings: MiraSettings }>();
const emit = defineEmits<{ save: [settings: MiraSettings]; cancel: [] }>();

const draft = reactive<MiraSettings>({ ...props.settings });

watch(
  () => props.settings,
  (next) => Object.assign(draft, next),
);
</script>

<template>
  <form class="settings__form" @submit.prevent="emit('save', { ...draft })">
    <fieldset class="settings__section">
      <legend class="settings__legend">{{ copy.settings.mode }}</legend>
      <div class="settings__pills">
        <template v-for="mode in MODES" :key="mode.id">
          <input
            :id="`mira-setting-mode-${mode.id}`"
            v-model="draft.mode"
            class="pill__input"
            type="radio"
            name="mira-mode"
            :value="mode.id"
          />
          <label class="pill" :for="`mira-setting-mode-${mode.id}`">
            {{ copy.modes[mode.id].name }}
          </label>
        </template>
      </div>
    </fieldset>

    <fieldset class="settings__section">
      <legend class="settings__legend">{{ copy.settings.level }}</legend>
      <div class="settings__pills">
        <template v-for="level in LEVELS" :key="level.id">
          <input
            :id="`mira-setting-level-${level.id}`"
            v-model="draft.level"
            class="pill__input"
            type="radio"
            name="mira-level"
            :value="level.id"
          />
          <label class="pill" :for="`mira-setting-level-${level.id}`">
            {{ copy.levels[level.id].name }}
          </label>
        </template>
      </div>
    </fieldset>

    <fieldset class="settings__section">
      <legend class="settings__legend">{{ copy.settings.rounds }}</legend>
      <div class="settings__pills">
        <template v-for="rounds in ROUND_OPTIONS" :key="rounds">
          <input
            :id="`mira-setting-rounds-${rounds}`"
            v-model="draft.rounds"
            class="pill__input"
            type="radio"
            name="mira-rounds"
            :value="rounds"
          />
          <label class="pill" :for="`mira-setting-rounds-${rounds}`">{{ rounds }}</label>
        </template>
      </div>
    </fieldset>

    <fieldset class="settings__section">
      <legend class="settings__legend">{{ copy.settings.voice }}</legend>
      <div class="settings__pills">
        <input
          id="mira-setting-voice-true"
          v-model="draft.voice"
          class="pill__input"
          type="radio"
          name="mira-voice"
          :value="true"
        />
        <label class="pill" for="mira-setting-voice-true">{{ copy.settings.yes }}</label>
        <input
          id="mira-setting-voice-false"
          v-model="draft.voice"
          class="pill__input"
          type="radio"
          name="mira-voice"
          :value="false"
        />
        <label class="pill" for="mira-setting-voice-false">{{ copy.settings.no }}</label>
      </div>
    </fieldset>

    <fieldset class="settings__section">
      <legend class="settings__legend">{{ copy.settings.sound }}</legend>
      <div class="settings__pills">
        <input
          id="mira-setting-sound-true"
          v-model="draft.sound"
          class="pill__input"
          type="radio"
          name="mira-sound"
          :value="true"
        />
        <label class="pill" for="mira-setting-sound-true">{{ copy.settings.yes }}</label>
        <input
          id="mira-setting-sound-false"
          v-model="draft.sound"
          class="pill__input"
          type="radio"
          name="mira-sound"
          :value="false"
        />
        <label class="pill" for="mira-setting-sound-false">{{ copy.settings.no }}</label>
      </div>
    </fieldset>

    <p class="settings__note">{{ copy.settings.note }}</p>

    <div class="settings__actions">
      <AppButton variant="secondary" @click="emit('cancel')">{{ copy.actions.cancel }}</AppButton>
      <AppButton variant="primary" type="submit">{{ copy.actions.save }}</AppButton>
    </div>
  </form>
</template>
