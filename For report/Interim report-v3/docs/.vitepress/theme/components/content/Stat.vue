<script setup lang="ts">
/** A headline figure with its label, e.g. <Stat value="USD 22.7 billion" label="Global annual cost of FOD" />. */
defineProps<{ value: string; label?: string }>()
</script>

<template>
  <div class="fh-stat">
    <p class="fh-stat__value">{{ value }}</p>
    <p v-if="label" class="fh-stat__label">{{ label }}</p>
  </div>
</template>
