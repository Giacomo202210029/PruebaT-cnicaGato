<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const { authHeaders, logout } = useAuth();
const notificationsEnabled = ref(true);
const telegramLinked = ref(false);
const loaded = ref(false);

onMounted(load);

async function load() {
  const res = await fetch('/api/settings', { headers: authHeaders() });
  if (res.ok) {
    const data = await res.json();
    notificationsEnabled.value = data.notificationsEnabled;
    telegramLinked.value = data.telegramLinked;
  }
  loaded.value = true;
}

async function toggle() {
  notificationsEnabled.value = !notificationsEnabled.value;
  await fetch('/api/settings', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ notificationsEnabled: notificationsEnabled.value }),
  });
}
</script>

<template>
  <div class="screen settings-screen">
    <h2>Ajustes</h2>
    <label class="toggle-row">
      <span>Notificaciones de Telegram</span>
      <input type="checkbox" :checked="notificationsEnabled" @change="toggle" />
    </label>
    <p class="settings-hint">
      {{ telegramLinked ? 'Tu Telegram está vinculado.' : 'Escríbele /start al bot para vincularlo.' }}
    </p>
    <p class="settings-note">Apagar esto solo apaga el recordatorio — las reglas de honestidad siguen igual.</p>
    <button type="button" class="logout-button" @click="logout">Cerrar sesión</button>
  </div>
</template>
