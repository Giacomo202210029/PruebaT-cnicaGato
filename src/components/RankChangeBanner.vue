<script setup>
import { useRankWatch } from '../composables/useRankWatch.js';

const { notice, dismiss } = useRankWatch();
</script>

<template>
  <button v-if="notice.message" type="button" class="rank-banner" :class="`rank-banner-${notice.kind}`" @click="dismiss">
    <span>{{ notice.kind === 'up' ? '📈' : '📉' }}</span>
    <span>{{ notice.message }}</span>
  </button>
</template>
