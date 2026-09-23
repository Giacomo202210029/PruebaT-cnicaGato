<script setup>
import { ref } from 'vue';

const emit = defineEmits(['complete']);
const digits = ref('');

function press(d) {
  if (digits.value.length >= 4) return;
  digits.value += d;
  if (digits.value.length === 4) {
    const pin = digits.value;
    emit('complete', pin);
  }
}

function backspace() {
  digits.value = digits.value.slice(0, -1);
}

function reset() {
  digits.value = '';
}

defineExpose({ reset });
</script>

<template>
  <div class="pinpad">
    <div class="pinpad-dots">
      <span v-for="i in 4" :key="i" class="dot" :class="{ filled: i <= digits.length }"></span>
    </div>
    <div class="pinpad-grid">
      <button v-for="n in 9" :key="n" type="button" class="pinpad-key" @click="press(String(n))">{{ n }}</button>
      <span></span>
      <button type="button" class="pinpad-key" @click="press('0')">0</button>
      <button type="button" class="pinpad-key pinpad-back" @click="backspace" aria-label="Borrar">⌫</button>
    </div>
  </div>
</template>
