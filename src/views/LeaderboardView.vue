<script setup>
import { computed } from 'vue';
import { useBoard } from '../composables/useBoard.js';
import BadgeRow from '../components/BadgeRow.vue';

const { state: boardState } = useBoard();

const ranked = computed(() => {
  if (!boardState.data) return [];
  const byId = new Map(boardState.data.users.map((u) => [u.id, u]));
  return boardState.data.leaderboardOrder.map((id, i) => ({ ...byId.get(id), rank: i + 1 }));
});
</script>

<template>
  <div v-if="boardState.data" class="screen leaderboard-screen">
    <h2>Tabla de posiciones</h2>
    <div v-for="u in ranked" :key="u.id" class="leaderboard-row" :class="{ first: u.rank === 1 }">
      <span class="rank">#{{ u.rank }}</span>
      <span class="name">{{ u.label }}</span>
      <span class="stat">🔥{{ u.currentStreak }}</span>
      <span class="stat">✅{{ u.totalClean }}/31</span>
      <span class="stat">🏅{{ u.longestStreak }}</span>
    </div>

    <h3>Insignias</h3>
    <div v-for="u in ranked" :key="`badges-${u.id}`" class="badges-block">
      <p class="badges-owner">{{ u.label }}</p>
      <BadgeRow :total-clean="u.totalClean" />
    </div>
  </div>
</template>
