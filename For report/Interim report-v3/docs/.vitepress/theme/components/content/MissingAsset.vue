<script setup lang="ts">
/** Placeholder for a figure whose file is not in the repository yet. */
defineProps<{ name: string; alt?: string }>()
</script>

<template>
  <figure class="fh-missing" role="img" :aria-label="`${alt || 'Image'} (file missing)`">
    <span>Image not available{{ alt ? `: ${alt}` : '' }}</span>
    <code>{{ name }}</code>
  </figure>
</template>
