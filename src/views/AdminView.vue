<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth.js';
import { useBoard } from '../composables/useBoard.js';
import CalendarGrid from '../components/CalendarGrid.vue';
import {
  USER_IDS,
  USER_LABELS,
  STATUS,
  TRIGGER_TAGS,
  TRIGGER_LABELS,
  COMPETITION_START,
  COMPETITION_END,
} from '../../shared/constants.js';

const { authHeaders } = useAuth();
const { state: boardState, refresh } = useBoard();

// ---- Vista de calendarios (solo admin ve los 3 completos) ----
const previewUserId = ref(USER_IDS[0]);
const previewUser = computed(() => boardState.data?.users.find((u) => u.id === previewUserId.value));

// ---- Modo prueba ----
const simUser = ref(USER_IDS[0]);
const simDate = ref(COMPETITION_START);
const simStatus = ref(STATUS.CLEAN);
const simNote = ref('');
const simTrigger = ref(null);
const simBusy = ref(false);
const simMsg = ref(null);

async function simulate() {
  simBusy.value = true;
  simMsg.value = null;
  try {
    const res = await fetch('/api/admin/simulate-checkin', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        targetUser: simUser.value,
        date: simDate.value,
        status: simStatus.value,
        note: simNote.value,
        trigger: simTrigger.value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error);
    simMsg.value = `Simulado: ${USER_LABELS[simUser.value]} · ${simDate.value} · ${simStatus.value === STATUS.CLEAN ? 'sin pecado' : 'pecó'}.`;
    simNote.value = '';
    simTrigger.value = null;
    await refresh();
  } catch (err) {
    simMsg.value = `Error: ${err.message}`;
  } finally {
    simBusy.value = false;
  }
}

// ---- Zona de riesgo ----
const resetBusy = ref(false);
const resetMsg = ref(null);

async function resetAll() {
  if (!confirm('¿Borrar TODOS los check-ins (prueba y reales)? Úsalo justo antes del 1 de octubre.')) return;
  resetBusy.value = true;
  resetMsg.value = null;
  try {
    const res = await fetch('/api/admin/reset', { method: 'POST', headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error);
    resetMsg.value = `Listo — se borraron ${data.deleted} registros.`;
    await refresh();
  } catch (err) {
    resetMsg.value = `Error: ${err.message}`;
  } finally {
    resetBusy.value = false;
  }
}

// ---- Contenido editable ----
const content = ref({ cleanPhrases: [], relapsePhrases: [], scienceFacts: [] });
const contentLoaded = ref(false);
const contentBusy = ref(false);
const contentMsg = ref(null);

onMounted(loadContent);

async function loadContent() {
  const res = await fetch('/api/admin/content', { headers: authHeaders() });
  if (res.ok) content.value = await res.json();
  contentLoaded.value = true;
}

function addLine(key) {
  content.value[key].push('');
}
function removeLine(key, i) {
  content.value[key].splice(i, 1);
}

async function saveContent() {
  contentBusy.value = true;
  contentMsg.value = null;
  try {
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify(content.value),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error);
    content.value = data;
    contentMsg.value = 'Guardado.';
  } catch (err) {
    contentMsg.value = `Error: ${err.message}`;
  } finally {
    contentBusy.value = false;
  }
}
</script>

<template>
  <div class="screen admin-screen">
    <h2>Admin</h2>

    <section class="admin-section">
      <h3>Vista de calendarios</h3>
      <p class="admin-hint">
        Como admin puedes ver el calendario día a día de los 3 (sin notas ni disparadores de los otros, eso sigue
        siendo privado siempre). Jugador 2 y 3 nunca se ven entre sí — esto es solo para que pruebes la app.
      </p>
      <div class="user-tabs">
        <button
          v-for="id in USER_IDS"
          :key="id"
          type="button"
          class="user-tab"
          :class="{ active: previewUserId === id }"
          @click="previewUserId = id"
        >
          {{ USER_LABELS[id] }}
        </button>
      </div>
      <CalendarGrid
        v-if="previewUser && boardState.data"
        :days="previewUser.days"
        :today="boardState.data.today"
        :yesterday="boardState.data.yesterday"
      />
    </section>

    <section class="admin-section">
      <h3>Modo prueba</h3>
      <p class="admin-hint">
        Simula un check-in para ver cómo queda en Calendario/Tabla/Insignias. No respeta la ventana horaria ni
        exige que sea "hoy" — es solo para previsualizar.
      </p>
      <div class="admin-form-row">
        <select v-model="simUser">
          <option v-for="id in USER_IDS" :key="id" :value="id">{{ USER_LABELS[id] }}</option>
        </select>
        <input v-model="simDate" type="date" :min="COMPETITION_START" :max="COMPETITION_END" />
        <select v-model="simStatus">
          <option :value="STATUS.CLEAN">Sin pecado</option>
          <option :value="STATUS.RELAPSE">Pecó</option>
        </select>
      </div>
      <template v-if="simStatus === STATUS.RELAPSE">
        <textarea v-model="simNote" placeholder="Nota (opcional)"></textarea>
        <div class="trigger-chips">
          <button
            v-for="t in TRIGGER_TAGS"
            :key="t"
            type="button"
            class="chip"
            :class="{ active: simTrigger === t }"
            @click="simTrigger = simTrigger === t ? null : t"
          >
            {{ TRIGGER_LABELS[t] }}
          </button>
        </div>
      </template>
      <button type="button" class="btn-primary" :disabled="simBusy" @click="simulate">Simular</button>
      <p v-if="simMsg" class="admin-msg">{{ simMsg }}</p>
    </section>

    <section class="admin-section">
      <h3>Contenido</h3>
      <p class="admin-hint">Frases de los botones y datos científicos para concientizar — los escribes tú.</p>

      <template v-if="contentLoaded">
        <div class="content-group">
          <h4>Frases — "Sin pecado hoy"</h4>
          <div v-for="(_, i) in content.cleanPhrases" :key="`cp-${i}`" class="content-row">
            <input v-model="content.cleanPhrases[i]" />
            <button type="button" class="icon-btn" aria-label="Quitar" @click="removeLine('cleanPhrases', i)">✕</button>
          </div>
          <button type="button" class="link-button" @click="addLine('cleanPhrases')">+ agregar frase</button>
        </div>

        <div class="content-group">
          <h4>Frases — "Pequé hoy"</h4>
          <div v-for="(_, i) in content.relapsePhrases" :key="`rp-${i}`" class="content-row">
            <input v-model="content.relapsePhrases[i]" />
            <button type="button" class="icon-btn" aria-label="Quitar" @click="removeLine('relapsePhrases', i)">✕</button>
          </div>
          <button type="button" class="link-button" @click="addLine('relapsePhrases')">+ agregar frase</button>
        </div>

        <div class="content-group">
          <h4>Datos científicos (dato del día)</h4>
          <div v-for="(_, i) in content.scienceFacts" :key="`sf-${i}`" class="content-row">
            <input v-model="content.scienceFacts[i]" />
            <button type="button" class="icon-btn" aria-label="Quitar" @click="removeLine('scienceFacts', i)">✕</button>
          </div>
          <button type="button" class="link-button" @click="addLine('scienceFacts')">+ agregar dato</button>
        </div>

        <button type="button" class="btn-primary" :disabled="contentBusy" @click="saveContent">Guardar contenido</button>
        <p v-if="contentMsg" class="admin-msg">{{ contentMsg }}</p>
      </template>
    </section>

    <section class="admin-section admin-danger">
      <h3>Zona de riesgo</h3>
      <p class="admin-hint">Borra TODOS los check-ins. Úsalo una sola vez, justo antes del 1 de octubre.</p>
      <button type="button" class="btn-danger" :disabled="resetBusy" @click="resetAll">🔄 Reiniciar todo</button>
      <p v-if="resetMsg" class="admin-msg">{{ resetMsg }}</p>
    </section>
  </div>
</template>
