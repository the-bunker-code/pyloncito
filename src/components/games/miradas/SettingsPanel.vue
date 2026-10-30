<script setup lang="ts">
import { reactive, watch } from 'vue';
import AppButton from '../../ui/AppButton.vue';
import { LOOK_WINDOW_OPTIONS } from '../../../games/miradas/config';
import { copy } from '../../../games/miradas/copy';
import type { MiradasSettings } from '../../../games/miradas/storage';

const props = defineProps<{ settings: MiradasSettings }>();
const emit = defineEmits<{ save: [settings: MiradasSettings]; cancel: [] }>();

const draft = reactive<MiradasSettings>({ ...props.settings, names: [...props.settings.names] });

watch(
  () => props.settings,
  (next) => Object.assign(draft, { ...next, names: [...next.names] }),
);
</script>

<template>
  <form
    class="settings__form"
    @submit.prevent="emit('save', { ...draft, names: [...draft.names] })"
  >
    <fieldset class="settings__section">
      <legend class="settings__legend">{{ copy.settings.voice }}</legend>
      <div class="settings__pills">
        <input
          id="miradas-setting-voice-true"
          v-model="draft.voice"
          class="pill__input"
          type="radio"
          name="miradas-voice"
          :value="true"
        />
        <label class="pill" for="miradas-setting-voice-true">{{ copy.settings.yes }}</label>
        <input
          id="miradas-setting-voice-false"
          v-model="draft.voice"
          class="pill__input"
          type="radio"
          name="miradas-voice"
          :value="false"
        />
        <label class="pill" for="miradas-setting-voice-false">{{ copy.settings.no }}</label>
      </div>
    </fieldset>

    <fieldset class="settings__section">
      <legend class="settings__legend">{{ copy.settings.sound }}</legend>
      <div class="settings__pills">
        <input
          id="miradas-setting-sound-true"
          v-model="draft.sound"
          class="pill__input"
          type="radio"
          name="miradas-sound"
          :value="true"
        />
        <label class="pill" for="miradas-setting-sound-true">{{ copy.settings.yes }}</label>
        <input
          id="miradas-setting-sound-false"
          v-model="draft.sound"
          class="pill__input"
          type="radio"
          name="miradas-sound"
          :value="false"
        />
        <label class="pill" for="miradas-setting-sound-false">{{ copy.settings.no }}</label>
      </div>
    </fieldset>

    <fieldset class="settings__section">
      <legend class="settings__legend">{{ copy.settings.lookWindow }}</legend>
      <div class="settings__pills">
        <template v-for="value in LOOK_WINDOW_OPTIONS" :key="value">
          <input
            :id="`miradas-setting-wait-${value}`"
            v-model="draft.lookWindow"
            class="pill__input"
            type="radio"
            name="miradas-wait"
            :value="value"
          />
          <label class="pill" :for="`miradas-setting-wait-${value}`">
            {{ copy.settings.seconds(value) }}
          </label>
        </template>
      </div>
      <p class="settings__note">{{ copy.settings.lookWindowHint }}</p>
    </fieldset>

    <p class="settings__note">{{ copy.settings.note }}</p>

    <div class="settings__actions">
      <AppButton variant="secondary" @click="emit('cancel')">{{ copy.actions.cancel }}</AppButton>
      <AppButton variant="primary" type="submit">{{ copy.actions.save }}</AppButton>
    </div>
  </form>
</template>
