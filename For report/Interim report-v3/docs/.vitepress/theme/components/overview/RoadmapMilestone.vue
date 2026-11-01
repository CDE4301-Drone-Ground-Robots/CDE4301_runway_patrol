<script setup lang="ts">
/** One Engineering Roadmap milestone. The body (slot) is Markdown composed from a canonical source. */
import { withBase } from 'vitepress'

defineProps<{
  id: string
  n: number
  title: string
  links?: { text: string; href: string }[]
}>()
</script>

<template>
  <article :id="id" class="rmap__item" tabindex="-1" :aria-labelledby="`${id}-title`">
    <p class="rmap__item-num" aria-hidden="true">{{ String(n).padStart(2, '0') }}</p>
    <h3 :id="`${id}-title`" class="rmap__item-title">{{ title }}</h3>
    <div class="rmap__item-body ov-md"><slot /></div>
    <p v-if="links?.length" class="rmap__links">
      <a v-for="l in links" :key="l.href" class="ovx-more" :href="withBase(l.href)">{{ l.text }} <span aria-hidden="true">↗</span></a>
    </p>
  </article>
</template>
