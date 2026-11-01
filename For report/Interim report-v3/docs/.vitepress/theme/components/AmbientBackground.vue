<script setup lang="ts">
/**
 * Site background. CSS aurora on every page (radial gradients, no blur filter, transform-only
 * drift); the Three.js topographic field is added on the homepage only. Documentation pages
 * get a quieter, slower aurora so equations and tables keep full contrast.
 */
import { computed, defineAsyncComponent } from 'vue'
import { useData } from 'vitepress'

const TopoField = defineAsyncComponent(() => import('./TopoField.vue'))
const { frontmatter } = useData()
const isHome = computed(() => frontmatter.value.layout === 'home')
</script>

<template>
  <div class="ambient" :class="isHome ? 'ambient--home' : 'ambient--doc'" aria-hidden="true">
    <div class="ambient__aurora ambient__aurora--a" />
    <div class="ambient__aurora ambient__aurora--b" />
    <div class="ambient__aurora ambient__aurora--c" />
    <ClientOnly>
      <TopoField v-if="isHome" />
    </ClientOnly>
    <div class="ambient__vignette" />
  </div>
</template>
