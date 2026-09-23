<script setup>
import { computed } from 'vue';
import { COMPETITION_START, COMPETITION_END } from '../../shared/constants.js';

const props = defineProps({
  days: { type: Array, required: true },
  today: { type: String, required: true },
});
const emit = defineEmits(['select']);

function allDates() {
  const dates = [];
  const cursor = new Date(`${COMPETITION_START}T00:00:00Z`);
  const end = new Date(`${COMPETITION_END}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

const cells = computed(() => {
  const byDate = new Map(props.days.map((d) => [d.date, d]));
  return allDates().map((date) => {
    const record = byDate.get(date);
    let state = 'future';
    if (date < props.today) state = record ? record.status : 'no_reportado';
    else if (date === props.today) state = record ? record.status : 'today';
    return { date, day: Number(date.slice(-2)), state, record };
  });
});
</script>

<template>
  <div class="calendar-grid">
    <button
      v-for="cell in cells"
      :key="cell.date"
      type="button"
      class="calendar-cell"
      :class="`state-${cell.state}`"
      :disabled="!cell.record"
      @click="cell.record && emit('select', cell.record)"
    >
      {{ cell.day }}
    </button>
  </div>
</template>
