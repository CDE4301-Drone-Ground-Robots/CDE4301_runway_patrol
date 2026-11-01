<script setup lang="ts">
/** Video with controls: <VideoClip src="./assets/videos/test.mp4" caption="…" />. Loads only when played. */
defineProps<{ src: string; poster?: string; caption?: string }>()
</script>

<template>
  <figure class="fh-figure fh-video">
    <video :src="src" :poster="poster" controls playsinline preload="none" />
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>
