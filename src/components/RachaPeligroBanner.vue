<script setup>
defineProps({ minutesUntilClose: { type: Number, default: null } });
</script>

<template>
  <div v-if="minutesUntilClose !== null && minutesUntilClose <= 90" class="danger-banner">
    🚨 Racha en peligro — quedan ~{{ minutesUntilClose }} min para marcar tu día.
  </div>
</template>
