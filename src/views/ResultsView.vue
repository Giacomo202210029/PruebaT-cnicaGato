<script setup>
import { computed } from 'vue';
import { useBoard } from '../composables/useBoard.js';

const { state: boardState } = useBoard();

const winner = computed(() => {
  if (!boardState.data) return null;
  const id = boardState.data.leaderboardOrder[0];
  return boardState.data.users.find((u) => u.id === id);
});
</script>

<template>
  <div class="screen results-screen">
    <template v-if="boardState.data?.competitionEnded && winner">
      <h1>🏆 Resultados de octubre</h1>
      <p class="winner-name">{{ winner.label }}</p>
      <p class="winner-stat">{{ winner.totalClean }} de 31 días limpios</p>
      <p class="winner-streak">Racha más larga: {{ winner.longestStreak }} días</p>
    </template>
    <p v-else>Los resultados se revelan el 1 de noviembre.</p>
  </div>
</template>
