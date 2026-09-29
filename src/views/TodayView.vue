<script setup>
import { computed, ref } from 'vue';
import confetti from 'canvas-confetti';
import { useAuth } from '../composables/useAuth.js';
import { useBoard } from '../composables/useBoard.js';
import FlameCounter from '../components/FlameCounter.vue';
import { STATUS, TRIGGER_TAGS, TRIGGER_LABELS, MAX_NOTE_LENGTH, COMPETITION_START } from '../../shared/constants.js';

const { state: authState } = useAuth();
const { state: boardState, submitCheckin } = useBoard();

const showRelapseForm = ref(false);
const note = ref('');
const trigger = ref(null);
const submitting = ref(false);
const errorMsg = ref(null);
const successPhrase = ref(null);

const me = computed(() => boardState.data?.users.find((u) => u.id === authState.userId));
const todayRecord = computed(() => {
  const today = boardState.data?.today;
  return me.value?.days.find((d) => d.date === today) ?? null;
});

const yesterday = computed(() => boardState.data?.yesterday ?? null);
const yesterdayRecord = computed(() => me.value?.days.find((d) => d.date === yesterday.value) ?? null);
const showYesterdayCard = computed(
  () => yesterday.value && yesterday.value >= COMPETITION_START && !yesterdayRecord.value,
);

const yShowForm = ref(false);
const yNote = ref('');
const yTrigger = ref(null);
const ySubmitting = ref(false);
const yError = ref(null);

async function markClean() {
  submitting.value = true;
  errorMsg.value = null;
  try {
    const res = await submitCheckin(STATUS.CLEAN, { date: boardState.data.today });
    successPhrase.value = res.phrase;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    submitting.value = false;
  }
}

async function markRelapse() {
  submitting.value = true;
  errorMsg.value = null;
  try {
    const res = await submitCheckin(STATUS.RELAPSE, {
      date: boardState.data.today,
      note: note.value,
      trigger: trigger.value,
    });
    successPhrase.value = res.phrase;
    showRelapseForm.value = false;
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    submitting.value = false;
  }
}

async function markYesterdayClean() {
  ySubmitting.value = true;
  yError.value = null;
  try {
    await submitCheckin(STATUS.CLEAN, { date: yesterday.value });
  } catch (err) {
    yError.value = err.message;
  } finally {
    ySubmitting.value = false;
  }
}

async function markYesterdayRelapse() {
  ySubmitting.value = true;
  yError.value = null;
  try {
    await submitCheckin(STATUS.RELAPSE, { date: yesterday.value, note: yNote.value, trigger: yTrigger.value });
    yShowForm.value = false;
  } catch (err) {
    yError.value = err.message;
  } finally {
    ySubmitting.value = false;
  }
}
</script>

<template>
  <div v-if="boardState.data" class="screen today-screen">
    <FlameCounter :streak="me?.currentStreak ?? 0" />

    <div v-if="showYesterdayCard" class="yesterday-card">
      <p class="yesterday-card-label">😴 ¿Se te pasó marcar ayer?</p>
      <div v-if="!yShowForm" class="yesterday-actions">
        <button type="button" class="btn-clean btn-compact" :disabled="ySubmitting" @click="markYesterdayClean">
          ✅ Limpio
        </button>
        <button type="button" class="btn-relapse btn-compact" :disabled="ySubmitting" @click="yShowForm = true">
          😔 Pequé
        </button>
      </div>
      <div v-else class="relapse-form">
        <textarea
          v-model="yNote"
          :maxlength="MAX_NOTE_LENGTH"
          placeholder="Nota privada, opcional — solo la ves tú"
        ></textarea>
        <div class="trigger-chips">
          <button
            v-for="t in TRIGGER_TAGS"
            :key="t"
            type="button"
            class="chip"
            :class="{ active: yTrigger === t }"
            @click="yTrigger = yTrigger === t ? null : t"
          >
            {{ TRIGGER_LABELS[t] }}
          </button>
        </div>
        <button type="button" class="btn-confirm-relapse" :disabled="ySubmitting" @click="markYesterdayRelapse">
          Confirmar
        </button>
        <button type="button" class="link-button" @click="yShowForm = false">Cancelar</button>
      </div>
      <p v-if="yError" class="error-msg">{{ yError }}</p>
    </div>

    <div v-if="todayRecord" class="today-done">
      <p class="today-done-icon">{{ todayRecord.status === 'clean' ? '✅' : '😔' }}</p>
      <p>Ya marcaste tu día de hoy.</p>
      <p v-if="successPhrase" class="today-phrase">{{ successPhrase }}</p>
    </div>

    <template v-else>
      <div v-if="!showRelapseForm" class="today-actions">
        <button type="button" class="btn-clean" :disabled="submitting" @click="markClean">✅ Sin pecado hoy</button>
        <button type="button" class="btn-relapse" :disabled="submitting" @click="showRelapseForm = true">
          😔 Pequé hoy
        </button>
      </div>

      <div v-else class="relapse-form">
        <textarea
          v-model="note"
          :maxlength="MAX_NOTE_LENGTH"
          placeholder="Nota privada, opcional — solo la ves tú"
        ></textarea>
        <div class="trigger-chips">
          <button
            v-for="t in TRIGGER_TAGS"
            :key="t"
            type="button"
            class="chip"
            :class="{ active: trigger === t }"
            @click="trigger = trigger === t ? null : t"
          >
            {{ TRIGGER_LABELS[t] }}
          </button>
        </div>
        <button type="button" class="btn-confirm-relapse" :disabled="submitting" @click="markRelapse">
          Confirmar
        </button>
        <button type="button" class="link-button" @click="showRelapseForm = false">Cancelar</button>
      </div>
    </template>

    <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

    <div v-if="boardState.data.scienceFact" class="science-card">
      <p class="science-card-label">🧪 Dato del día</p>
      <p class="science-card-text">{{ boardState.data.scienceFact }}</p>
    </div>
  </div>
  <div v-else class="screen loading-screen">Cargando…</div>
</template>
