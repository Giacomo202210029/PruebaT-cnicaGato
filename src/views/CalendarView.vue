<script setup>
import { computed, ref } from 'vue';
import { useBoard } from '../composables/useBoard.js';
import CalendarGrid from '../components/CalendarGrid.vue';
import { TRIGGER_LABELS } from '../../shared/constants.js';

const { state: boardState } = useBoard();
const selectedRecord = ref(null);

const me = computed(() => boardState.data?.users.find((u) => u.id === boardState.data.me));

const STATUS_LABELS = { clean: 'Limpio', relapse: 'Pecó', no_reportado: 'No reportado' };
</script>

<template>
  <div v-if="boardState.data && me" class="screen calendar-screen">
    <p class="calendar-hint">🔒 Tu calendario es privado — solo tú lo ves. Lo que ven los demás es tu puntaje, en la Tabla.</p>

    <CalendarGrid
      :days="me.days"
      :today="boardState.data.today"
      :yesterday="boardState.data.yesterday"
      @select="selectedRecord = $event"
    />

    <div class="calendar-legend">
      <span class="legend-item"><span class="legend-dot state-clean"></span>Limpio</span>
      <span class="legend-item"><span class="legend-dot state-relapse"></span>Pecó</span>
      <span class="legend-item"><span class="legend-dot state-no_reportado"></span>No reportado</span>
      <span class="legend-item"><span class="legend-dot state-today"></span>Pendiente</span>
    </div>

    <div v-if="selectedRecord" class="day-detail">
      <p><strong>{{ selectedRecord.date }}</strong> — {{ STATUS_LABELS[selectedRecord.status] }}</p>
      <p v-if="selectedRecord.trigger">Disparador: {{ TRIGGER_LABELS[selectedRecord.trigger] }}</p>
      <p v-if="selectedRecord.note">"{{ selectedRecord.note }}"</p>
      <button type="button" class="link-button" @click="selectedRecord = null">Cerrar</button>
    </div>
  </div>
</template>
