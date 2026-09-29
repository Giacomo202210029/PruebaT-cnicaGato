<script setup>
import { computed } from 'vue';
import { COMPETITION_START, COMPETITION_END } from '../../shared/constants.js';

const props = defineProps({
  days: { type: Array, required: true },
  today: { type: String, required: true },
  yesterday: { type: String, default: null },
});
const emit = defineEmits(['select']);

const WEEKDAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

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

// Monday-first offset so the grid lines up like a real calendar page.
const leadingBlanks = computed(() => {
  const firstWeekday = new Date(`${COMPETITION_START}T00:00:00Z`).getUTCDay();
  return (firstWeekday + 6) % 7;
});

const cells = computed(() => {
  const byDate = new Map(props.days.map((d) => [d.date, d]));
  return allDates().map((date) => {
    const record = byDate.get(date);
    let state = 'future';
    if (record) state = record.status;
    else if (date === props.today || date === props.yesterday) state = 'today';
    else if (date < props.today) state = 'no_reportado';
    return { date, day: Number(date.slice(-2)), state, record };
  });
});
</script>

<template>
  <div class="calendar-card">
    <div class="calendar-weekdays">
      <span v-for="w in WEEKDAY_LABELS" :key="w">{{ w }}</span>
    </div>
    <div class="calendar-grid">
      <span v-for="n in leadingBlanks" :key="`blank-${n}`" class="calendar-blank"></span>
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
  </div>
</template>
