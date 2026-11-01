<script setup lang="ts">
/**
 * SSR-safe glass container.
 *
 * Baseline (server render, every browser): CSS backdrop-filter glass from custom.css.
 * Enhancement: when GlassFilterDefs has mounted liquid-glass-vue's refraction filters
 * (html.lg-refract), the backdrop "warp" layer references one of them, so only the
 * backdrop bends and slotted text stays sharp.
 *
 * Only GlassFilter is used, not the library's <LiquidGlass> wrapper: the wrapper forces
 * translate(-50%,-50%) positioning, Tailwind utility classes and white 20px text,
 * which conflict with document layout and light mode.
 */
withDefaults(defineProps<{ tag?: string; variant?: 'toolbar' | 'panel' | 'control'; refract?: 'control' | 'nav' | false }>(), {
  tag: 'div',
  variant: 'panel',
  refract: false
})
</script>

<template>
  <component :is="tag" class="glass-surface" :class="[`glass-surface--${variant}`, refract && `lg-refract-${refract}`]">
    <span class="glass-surface__warp" aria-hidden="true" />
    <span v-if="refract" class="glass-surface__lens" aria-hidden="true" />
    <span class="glass-surface__rim" aria-hidden="true" />
    <div class="glass-surface__content"><slot /></div>
  </component>
</template>
