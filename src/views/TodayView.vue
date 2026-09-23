<script setup>
import { computed, ref } from 'vue';
import confetti from 'canvas-confetti';
import { useAuth } from '../composables/useAuth.js';
import { useBoard } from '../composables/useBoard.js';
import FlameCounter from '../components/FlameCounter.vue';
import RachaPeligroBanner from '../components/RachaPeligroBanner.vue';
import { STATUS, TRIGGER_TAGS, TRIGGER_LABELS, MAX_NOTE_LENGTH } from '../../shared/constants.js';

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
  const target = boardState.data?.targetDate;
  return me.value?.days.find((d) => d.date === target) ?? null;
});

async function markClean() {
  submitting.value = true;
  errorMsg.value = null;
  try {
    const res = await submitCheckin(STATUS.CLEAN);
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
    const res = await submitCheckin(STATUS.RELAPSE, { note: note.value, trigger: trigger.value });
    successPhrase.value = res.phrase;
    showRelapseForm.value = false;
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div v-if="boardState.data" class="screen today-screen">
    <RachaPeligroBanner v-if="!todayRecord" :minutes-until-close="boardState.data.minutesUntilClose" />

    <FlameCounter :streak="me?.currentStreak ?? 0" />

    <div v-if="todayRecord" class="today-done">
      <p class="today-done-icon">{{ todayRecord.status === 'clean' ? '✅' : '😔' }}</p>
      <p>Ya marcaste tu día de hoy.</p>
      <p v-if="successPhrase" class="today-phrase">{{ successPhrase }}</p>
    </div>

    <div v-else-if="!boardState.data.isWithinWindow" class="today-closed">
      <p>El check-in solo se abre de noche (18:00–04:00).</p>
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
          placeholder="Nota opcional (la ven los otros 2)"
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
  </div>
  <div v-else class="screen loading-screen">Cargando…</div>
</template>
