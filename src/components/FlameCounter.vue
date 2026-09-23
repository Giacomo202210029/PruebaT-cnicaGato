<script setup>
defineProps({ streak: { type: Number, required: true } });
</script>

<template>
  <div class="flame-counter">
    <div class="flame-emoji">🔥</div>
    <div class="flame-number">{{ streak }}</div>
    <div class="flame-label">{{ streak === 1 ? 'día limpio seguido' : 'días limpios seguidos' }}</div>
  </div>
</template>
