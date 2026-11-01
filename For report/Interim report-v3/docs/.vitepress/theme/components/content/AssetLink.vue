<script setup lang="ts">
/** Download link to a file next to your Markdown: <AssetLink href="./assets/documents/x.pdf">Report (PDF)</AssetLink>. */
defineProps<{ href: string }>()
</script>

<template>
  <a class="fh-asset" :href="href" download target="_blank" rel="noopener">
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8m0 0 3-3m-3 3L5 7M3 13h10" /></svg>
    <slot />
  </a>
</template>
