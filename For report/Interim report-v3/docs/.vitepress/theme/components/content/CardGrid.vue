<script setup lang="ts">
/** Responsive grid of <Card> / <Stat> items. `cols` is the desktop column count (collapses on small screens). */
withDefaults(defineProps<{ cols?: number | string }>(), { cols: 3 })
</script>

<template>
  <div class="fh-grid" :style="{ '--fh-cols': String(cols) }"><slot /></div>
</template>
