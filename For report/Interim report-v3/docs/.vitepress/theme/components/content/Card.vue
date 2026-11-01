<script setup lang="ts">
/** A grouped block of content (design option, comparison item, spec group). Body is ordinary Markdown. */
defineProps<{ title?: string; tag?: string; accent?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | '' }>()
</script>

<template>
  <article class="fh-card" :data-accent="accent || undefined">
    <header v-if="title || tag" class="fh-card__head">
      <span v-if="tag" class="fh-card__tag">{{ tag }}</span>
      <p v-if="title" class="fh-card__title">{{ title }}</p>
    </header>
    <div class="fh-card__body"><slot /></div>
  </article>
</template>
