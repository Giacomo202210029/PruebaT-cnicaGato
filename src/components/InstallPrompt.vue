<script setup>
import { ref, onMounted } from 'vue';

const deferredPrompt = ref(null);
const showAndroid = ref(false);
const showIOS = ref(false);

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function wasDismissed() {
  try {
    return localStorage.getItem('racha-limpia:install-dismissed') === '1';
  } catch {
    return false;
  }
}

onMounted(() => {
  if (isStandalone() || wasDismissed()) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
    showAndroid.value = true;
  });

  if (isIOS()) showIOS.value = true;
});

async function install() {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  await deferredPrompt.value.userChoice;
  deferredPrompt.value = null;
  showAndroid.value = false;
}

function dismiss() {
  showAndroid.value = false;
  showIOS.value = false;
  try {
    localStorage.setItem('racha-limpia:install-dismissed', '1');
  } catch {
    // ignore
  }
}
</script>

<template>
  <div v-if="showAndroid || showIOS" class="install-prompt">
    <span v-if="showAndroid">Instala la app para abrirla en 1 toque.</span>
    <span v-else>Toca <strong>Compartir</strong> → <strong>Agregar a inicio</strong> para instalarla.</span>
    <button v-if="showAndroid" type="button" class="install-btn" @click="install">Instalar</button>
    <button type="button" class="install-dismiss" aria-label="Cerrar" @click="dismiss">✕</button>
  </div>
</template>
