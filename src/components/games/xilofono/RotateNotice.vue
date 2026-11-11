<script setup lang="ts">
import { copy } from '../../../games/xilofono/copy';
</script>

<template>
  <div class="xilo-rotate" role="alert">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <g class="xilo-rotate__phone">
        <rect x="33" y="12" width="34" height="76" rx="7" />
        <line x1="44" y1="21" x2="56" y2="21" />
        <circle cx="50" cy="79" r="3" />
      </g>
      <g class="xilo-rotate__arrow">
        <path d="M82 70 A34 34 0 0 0 82 30" />
        <path d="M74 31 L82 29 L84 37" />
      </g>
    </svg>
    <p>{{ copy.rotate.title }}</p>
    <p>{{ copy.rotate.text }}</p>
  </div>
</template>
