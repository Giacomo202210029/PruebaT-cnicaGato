<script setup>
import { computed } from 'vue';
import { MILESTONES } from '../../shared/constants.js';

const props = defineProps({ totalClean: { type: Number, required: true } });

const badges = computed(() => MILESTONES.map((m) => ({ milestone: m, unlocked: props.totalClean >= m })));
</script>

<template>
  <div class="badge-row">
    <div v-for="b in badges" :key="b.milestone" class="badge" :class="{ unlocked: b.unlocked }">
      <span class="badge-icon">{{ b.unlocked ? '🏆' : '🔒' }}</span>
      <span class="badge-label">{{ b.milestone }}d</span>
    </div>
  </div>
</template>
