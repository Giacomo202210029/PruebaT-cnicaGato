<script setup>
import { ref, computed, watch } from 'vue';
import { useAuth } from './composables/useAuth.js';
import { useBoard } from './composables/useBoard.js';
import LoginView from './views/LoginView.vue';
import TodayView from './views/TodayView.vue';
import CalendarView from './views/CalendarView.vue';
import LeaderboardView from './views/LeaderboardView.vue';
import ResultsView from './views/ResultsView.vue';
import SettingsView from './views/SettingsView.vue';
import AdminView from './views/AdminView.vue';
import InstallPrompt from './components/InstallPrompt.vue';
import RankChangeBanner from './components/RankChangeBanner.vue';

const { state: authState } = useAuth();
const { state: boardState, startPolling, stopPolling } = useBoard();

const tab = ref('today');

watch(
  () => authState.token,
  (token) => (token ? startPolling() : stopPolling()),
  { immediate: true },
);

const isAdmin = computed(() => boardState.data?.isAdmin ?? false);

const tabs = computed(() => {
  const base = [
    { id: 'today', label: 'Hoy', icon: '🔥' },
    { id: 'calendar', label: 'Calendario', icon: '📅' },
    { id: 'leaderboard', label: 'Tabla', icon: '🏆' },
    { id: 'results', label: 'Resultados', icon: '🎉' },
    { id: 'settings', label: 'Ajustes', icon: '⚙️' },
  ];
  return isAdmin.value ? [...base, { id: 'admin', label: 'Admin', icon: '🛠️' }] : base;
});
</script>

<template>
  <InstallPrompt />
  <LoginView v-if="!authState.token" />
  <template v-else>
    <RankChangeBanner />
    <main class="app-main">
      <TodayView v-if="tab === 'today'" />
      <CalendarView v-else-if="tab === 'calendar'" />
      <LeaderboardView v-else-if="tab === 'leaderboard'" />
      <ResultsView v-else-if="tab === 'results'" />
      <SettingsView v-else-if="tab === 'settings'" />
      <AdminView v-else-if="tab === 'admin' && isAdmin" />
    </main>
    <nav class="bottom-nav">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="nav-button"
        :class="{ active: tab === t.id }"
        @click="tab = t.id"
      >
        <span class="nav-icon">{{ t.icon }}</span>
        <span class="nav-label">{{ t.label }}</span>
      </button>
    </nav>
  </template>
</template>
