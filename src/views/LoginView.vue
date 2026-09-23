<script setup>
import { ref } from 'vue';
import { USER_IDS, USER_LABELS } from '../../shared/constants.js';
import { useAuth } from '../composables/useAuth.js';
import PinPad from '../components/PinPad.vue';

const { login } = useAuth();

const selected = ref(null);
const pinPadRef = ref(null);
const error = ref(null);
const busy = ref(false);

function selectUser(id) {
  selected.value = id;
  error.value = null;
}

async function onComplete(pin) {
  busy.value = true;
  error.value = null;
  try {
    await login(selected.value, pin);
  } catch (err) {
    error.value = err.message;
    pinPadRef.value?.reset();
  } finally {
    busy.value = false;
  }
}

function back() {
  selected.value = null;
  error.value = null;
}
</script>

<template>
  <div class="screen login-screen">
    <h1 class="app-title">Racha Limpia</h1>
    <p class="app-subtitle">1–31 de octubre · quién llega más limpio de su Pecado.</p>

    <div v-if="!selected" class="user-picker">
      <button v-for="id in USER_IDS" :key="id" type="button" class="user-button" @click="selectUser(id)">
        {{ USER_LABELS[id] }}
      </button>
    </div>

    <div v-else class="pin-screen">
      <button type="button" class="link-button" @click="back">← Cambiar jugador</button>
      <h2>{{ USER_LABELS[selected] }}</h2>
      <p class="pin-hint">Tu PIN de 4 dígitos (si es tu primera vez, este PIN queda guardado).</p>
      <PinPad ref="pinPadRef" @complete="onComplete" />
      <p v-if="busy" class="pin-status">Entrando…</p>
      <p v-if="error" class="pin-error">{{ error }}</p>
    </div>
  </div>
</template>
