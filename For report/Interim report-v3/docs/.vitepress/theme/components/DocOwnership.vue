<script setup lang="ts">
// Renders the owner strip from page frontmatter (owner, role).
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()
const owner = computed(() => frontmatter.value.owner as string | undefined)
</script>

<template>
  <div v-if="owner" class="doc-ownership">
    <span class="doc-ownership__label">Individual documentation</span>
    <span class="doc-ownership__owner">{{ owner }}</span>
    <span v-if="frontmatter.role" class="doc-ownership__role">{{ frontmatter.role }}</span>
  </div>
</template>
