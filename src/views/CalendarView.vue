<script setup>
import { ref, computed } from 'vue';
import { useBoard } from '../composables/useBoard.js';
import CalendarGrid from '../components/CalendarGrid.vue';
import { TRIGGER_LABELS } from '../../shared/constants.js';

const { state: boardState } = useBoard();
const activeUserId = ref(null);
const selectedRecord = ref(null);

const users = computed(() => boardState.data?.users ?? []);
const activeUser = computed(() => {
  const id = activeUserId.value ?? boardState.data?.me;
  return users.value.find((u) => u.id === id) ?? users.value[0];
});

const STATUS_LABELS = { clean: 'Limpio', relapse: 'Pecó', no_reportado: 'No reportado' };
</script>

<template>
  <div v-if="boardState.data" class="screen calendar-screen">
    <div class="user-tabs">
      <button
        v-for="u in users"
        :key="u.id"
        type="button"
        class="user-tab"
        :class="{ active: activeUser?.id === u.id }"
        @click="activeUserId = u.id"
      >
        {{ u.label }}
      </button>
    </div>

    <CalendarGrid v-if="activeUser" :days="activeUser.days" :today="boardState.data.targetDate" @select="selectedRecord = $event" />

    <div class="calendar-legend">
      <span class="legend-item"><span class="legend-dot state-clean"></span>Limpio</span>
      <span class="legend-item"><span class="legend-dot state-relapse"></span>Pecó</span>
      <span class="legend-item"><span class="legend-dot state-no_reportado"></span>No reportado</span>
      <span class="legend-item"><span class="legend-dot state-today"></span>Hoy</span>
    </div>

    <div v-if="selectedRecord" class="day-detail">
      <p><strong>{{ selectedRecord.date }}</strong> — {{ STATUS_LABELS[selectedRecord.status] }}</p>
      <p v-if="selectedRecord.trigger">Disparador: {{ TRIGGER_LABELS[selectedRecord.trigger] }}</p>
      <p v-if="selectedRecord.note">"{{ selectedRecord.note }}"</p>
      <button type="button" class="link-button" @click="selectedRecord = null">Cerrar</button>
    </div>
  </div>
</template>
