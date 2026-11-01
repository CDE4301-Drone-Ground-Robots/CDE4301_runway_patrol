<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps<{
  src: string
  alt?: string
  caption?: string
  width?: number | string
  height?: number | string
}>()

const isOpen = ref(false)
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const triggerEl = ref<HTMLElement | null>(null)
const modalEl = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)

function openModal(e?: MouseEvent) {
  if (e) triggerEl.value = e.currentTarget as HTMLElement
  isOpen.value = true
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }
  nextTick(() => {
    closeBtn.value?.focus()
  })
}

function closeModal() {
  isOpen.value = false
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
  triggerEl.value?.focus()
}

function zoomIn() {
  scale.value = Math.min(scale.value + 0.35, 4.0)
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.35, 0.75)
  if (scale.value <= 1) {
    translateX.value = 0
    translateY.value = 0
  }
}

function resetZoom() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

function toggleZoom(e: MouseEvent) {
  if (scale.value === 1) {
    scale.value = 2.0
  } else {
    resetZoom()
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

function onMouseDown(e: MouseEvent) {
  if (scale.value <= 1) return
  isDragging.value = true
  startX.value = e.clientX - translateX.value
  startY.value = e.clientY - translateY.value
  e.preventDefault()
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  translateX.value = e.clientX - startX.value
  translateY.value = e.clientY - startY.value
}

function onMouseUp() {
  isDragging.value = false
}

// Touch gestures
let initialTouchDist = 0
function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    initialTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
  } else if (e.touches.length === 1 && scale.value > 1) {
    isDragging.value = true
    startX.value = e.touches[0].clientX - translateX.value
    startY.value = e.touches[0].clientY - translateY.value
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2 && initialTouchDist > 0) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    const factor = dist / initialTouchDist
    if (factor > 1.05) zoomIn()
    else if (factor < 0.95) zoomOut()
    initialTouchDist = dist
    e.preventDefault()
  } else if (e.touches.length === 1 && isDragging.value) {
    translateX.value = e.touches[0].clientX - startX.value
    translateY.value = e.touches[0].clientY - startY.value
    e.preventDefault()
  }
}

function onTouchEnd() {
  isDragging.value = false
  initialTouchDist = 0
}

function onKeyDown(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'Escape') {
    closeModal()
  } else if (e.key === '+' || e.key === '=') {
    zoomIn()
  } else if (e.key === '-' || e.key === '_') {
    zoomOut()
  } else if (e.key === '0') {
    resetZoom()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeyDown)
    if (isOpen.value) {
      document.body.style.overflow = ''
    }
  }
})
</script>

<template>
  <figure class="fh-figure">
    <div
      class="fh-figure__wrapper"
      role="button"
      tabindex="0"
      :aria-label="`Click to enlarge: ${caption || alt || 'Diagram'}`"
      @click="openModal"
      @keydown.enter.space.prevent="openModal"
    >
      <img
        :src="src"
        :alt="alt || caption || ''"
        :width="width"
        :height="height"
        loading="lazy"
        decoding="async"
        class="fh-figure__img"
      />
      <div class="fh-figure__expand-hint" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
          <path d="M3 3h5v2H5v3H3V3zm14 0v5h-2V5h-3V3h5zM3 17v-5h2v3h3v2H3zm14 0h-5v-2h3v-3h2v5z"/>
        </svg>
        <span>Enlarge</span>
      </div>
    </div>
    <figcaption v-if="caption" class="fh-figure__caption" v-html="caption"></figcaption>

    <!-- Fullscreen Diagram Lightbox Modal -->
    <Teleport to="body">
      <Transition name="fh-lightbox-fade">
        <div
          v-if="isOpen"
          ref="modalEl"
          class="fh-lightbox"
          role="dialog"
          aria-modal="true"
          :aria-label="`Enlarged Diagram: ${caption || alt || 'Technical Diagram'}`"
          @click.self="closeModal"
          @wheel="onWheel"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <!-- Top Floating Glass Header -->
          <div class="fh-lightbox__header">
            <div class="fh-lightbox__title">
              <span class="fh-lightbox__badge">DIAGRAM VIEWER</span>
              <span class="fh-lightbox__caption-text">{{ caption || alt || 'Technical Engineering Diagram' }}</span>
            </div>

            <!-- Interactive Toolbar Controls -->
            <div class="fh-lightbox__controls">
              <button
                type="button"
                class="fh-lightbox__btn"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
                :disabled="scale <= 0.75"
                @click.stop="zoomOut"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>

              <span class="fh-lightbox__scale" title="Current Zoom Scale">
                {{ Math.round(scale * 100) }}%
              </span>

              <button
                type="button"
                class="fh-lightbox__btn"
                title="Zoom In (+)"
                aria-label="Zoom In"
                :disabled="scale >= 4.0"
                @click.stop="zoomIn"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>

              <button
                type="button"
                class="fh-lightbox__btn"
                title="Reset Zoom (0)"
                aria-label="Reset Zoom"
                @click.stop="resetZoom"
              >
                Reset
              </button>

              <button
                ref="closeBtn"
                type="button"
                class="fh-lightbox__btn fh-lightbox__btn--close"
                title="Close Viewer (Escape)"
                aria-label="Close Viewer"
                @click.stop="closeModal"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Main Diagram Stage -->
          <div
            class="fh-lightbox__stage"
            :class="{ 'is-draggable': scale > 1, 'is-dragging': isDragging }"
            @mousedown="onMouseDown"
            @touchstart="onTouchStart"
            @dblclick="toggleZoom"
          >
            <img
              :src="src"
              :alt="alt || caption || ''"
              class="fh-lightbox__image"
              :style="{
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }"
              draggable="false"
            />
          </div>

          <!-- Bottom Footer Navigation Hint -->
          <div class="fh-lightbox__footer">
            <span>Scroll wheel or (+/-) to zoom • Drag to pan when enlarged • Double-click to toggle 2× • ESC to exit</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </figure>
</template>

<style scoped>
.fh-figure {
  width: 100%;
  max-width: 100%;
  margin: 28px 0;
}

.fh-figure__wrapper {
  position: relative;
  display: block;
  cursor: zoom-in;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--fh-border, rgba(255, 255, 255, 0.1));
  background: #080B12;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.fh-figure__wrapper:hover {
  border-color: rgba(76, 201, 216, 0.4);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(76, 201, 216, 0.1);
}

.fh-figure__wrapper:focus-visible {
  outline: 2px solid var(--vp-c-brand, #4CC9D8);
  outline-offset: 2px;
}

.fh-figure__img {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 auto;
}

.fh-figure__expand-hint {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #A8B3C5;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  opacity: 0.85;
  transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
  pointer-events: none;
}

.fh-figure__wrapper:hover .fh-figure__expand-hint {
  opacity: 1;
  background: rgba(17, 24, 39, 0.95);
  color: #F3F4F6;
  border-color: rgba(76, 201, 216, 0.4);
}

.fh-figure__caption {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--vp-c-text-2, #9CA3AF);
}

/* ================= Lightbox Modal ================= */
.fh-lightbox {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  background: rgba(8, 11, 18, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  user-select: none;
  touch-action: none;
}

.fh-lightbox__header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  background: rgba(17, 24, 39, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.fh-lightbox__title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.fh-lightbox__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(76, 201, 216, 0.15);
  border: 1px solid rgba(76, 201, 216, 0.35);
  color: #4CC9D8;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.fh-lightbox__caption-text {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #F3F4F6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fh-lightbox__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.fh-lightbox__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #F3F4F6;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.fh-lightbox__btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(76, 201, 216, 0.4);
  color: #4CC9D8;
}

.fh-lightbox__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.fh-lightbox__btn--close {
  background: rgba(229, 115, 115, 0.15);
  border-color: rgba(229, 115, 115, 0.3);
  color: #E57373;
}

.fh-lightbox__btn--close:hover {
  background: rgba(229, 115, 115, 0.3);
  border-color: #E57373;
  color: #FFF;
}

.fh-lightbox__scale {
  min-width: 44px;
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #A8B3C5;
}

.fh-lightbox__stage {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 20px;
  cursor: default;
}

.fh-lightbox__stage.is-draggable {
  cursor: grab;
}

.fh-lightbox__stage.is-dragging {
  cursor: grabbing;
}

.fh-lightbox__image {
  max-width: 92vw;
  max-height: 82vh;
  object-fit: contain;
  pointer-events: none;
}

.fh-lightbox__footer {
  padding: 10px 24px;
  background: rgba(17, 24, 39, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
  color: #6B7280;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 11px;
}

/* Transitions */
.fh-lightbox-fade-enter-active,
.fh-lightbox-fade-leave-active {
  transition: opacity 0.2s ease;
}

.fh-lightbox-fade-enter-from,
.fh-lightbox-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .fh-lightbox__header {
    padding: 10px 14px;
  }
  .fh-lightbox__caption-text {
    display: none;
  }
  .fh-lightbox__footer {
    display: none;
  }
}
</style>
