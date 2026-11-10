<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    poster?: string
    caption?: string
    title?: string
    preload?: 'none' | 'metadata' | 'auto'
  }>(),
  {
    poster: undefined,
    caption: undefined,
    title: undefined,
    preload: 'none'
  }
)

// DOM Refs
const containerRef = ref<HTMLDivElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const timelineRailRef = ref<HTMLDivElement | null>(null)
const speedMenuRef = ref<HTMLDivElement | null>(null)

// Playback State
const isPlaying = ref(false)
const isEnded = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const bufferedEnd = ref(0)
const volume = ref(1)
const previousVolume = ref(1)
const isMuted = ref(false)
const playbackRate = ref(1)
const isSpeedMenuOpen = ref(false)
const isFullscreen = ref(false)
const isPiPAvailable = ref(false)
const isPiPActive = ref(false)

// Interaction & Auto-Hide State
const showControls = ref(true)
const isScrubbing = ref(false)
const isHovering = ref(false)
const isBarHovered = ref(false)
const isVolumeHovered = ref(false)
const isTimelineHovered = ref(false)
const hoverTime = ref<number | null>(null)
const hoverRatio = ref(0)
let hideTimer: ReturnType<typeof setTimeout> | null = null

// Computed Values
const playedPercent = computed(() => {
  if (duration.value <= 0) return 0
  return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100))
})

const bufferedPercent = computed(() => {
  if (duration.value <= 0) return 0
  return Math.min(100, Math.max(0, (bufferedEnd.value / duration.value) * 100))
})

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))
const formattedHoverTime = computed(() => (hoverTime.value !== null ? formatTime(hoverTime.value) : '0:00'))

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const sStr = s < 10 ? `0${s}` : `${s}`
  if (h > 0) {
    const mStr = m < 10 ? `0${m}` : `${m}`
    return `${h}:${mStr}:${sStr}`
  }
  return `${m}:${sStr}`
}

// Controls Auto-Hide
function scheduleHide() {
  clearHideTimer()
  if (!isPlaying.value || isBarHovered.value || isScrubbing.value || isSpeedMenuOpen.value || isVolumeHovered.value) {
    showControls.value = true
    return
  }
  hideTimer = setTimeout(() => {
    if (isPlaying.value && !isBarHovered.value && !isScrubbing.value && !isSpeedMenuOpen.value && !isVolumeHovered.value) {
      showControls.value = false
    }
  }, 2500)
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function onActivity() {
  showControls.value = true
  scheduleHide()
}

function onPointerLeave() {
  isHovering.value = false
  if (isPlaying.value && !isBarHovered.value && !isSpeedMenuOpen.value && !isScrubbing.value) {
    scheduleHide()
  }
}

function onContainerPointerEnter() {
  isHovering.value = true
  showControls.value = true
  scheduleHide()
}

function onBarMouseEnter() {
  isBarHovered.value = true
  showControls.value = true
  clearHideTimer()
}

function onBarMouseLeave() {
  isBarHovered.value = false
  if (isPlaying.value) {
    scheduleHide()
  }
}

// Video Playback Controls
async function togglePlay() {
  if (!videoRef.value) return
  try {
    if (videoRef.value.paused || videoRef.value.ended) {
      if (videoRef.value.readyState === 0) {
        videoRef.value.load()
      }
      await videoRef.value.play()
    } else {
      videoRef.value.pause()
    }
  } catch {
    // Autoplay rejection handled gracefully
  }
}

function onVideoClick() {
  if (isPlaying.value && !showControls.value) {
    // Reveal hidden controls first on tap/click
    showControls.value = true
    scheduleHide()
    return
  }
  togglePlay()
  showControls.value = true
  scheduleHide()
}

function onTimeUpdate() {
  if (!videoRef.value || isScrubbing.value) return
  currentTime.value = videoRef.value.currentTime
  updateBuffered()
}

function onLoadedMetadata() {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
  updateBuffered()
}

function onProgress() {
  updateBuffered()
}

function updateBuffered() {
  if (!videoRef.value || !videoRef.value.buffered.length) return
  const b = videoRef.value.buffered
  const cur = videoRef.value.currentTime
  for (let i = 0; i < b.length; i++) {
    if (b.start(i) <= cur && cur <= b.end(i)) {
      bufferedEnd.value = b.end(i)
      return
    }
  }
  bufferedEnd.value = b.end(b.length - 1)
}

function onPlay() {
  isPlaying.value = true
  isEnded.value = false
  scheduleHide()
}

function onPause() {
  isPlaying.value = false
  showControls.value = true
  clearHideTimer()
}

function onEnded() {
  isPlaying.value = false
  isEnded.value = true
  showControls.value = true
  clearHideTimer()
}

// Timeline Scrubbing
function onTimelinePointerDown(e: PointerEvent) {
  if (!timelineRailRef.value || !videoRef.value) return
  isScrubbing.value = true
  showControls.value = true
  clearHideTimer()
  timelineRailRef.value.setPointerCapture(e.pointerId)
  seekByPointerEvent(e)
}

function onTimelinePointerMove(e: PointerEvent) {
  if (!timelineRailRef.value) return
  const rect = timelineRailRef.value.getBoundingClientRect()
  const clampedX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  const ratio = rect.width > 0 ? clampedX / rect.width : 0
  hoverRatio.value = ratio
  hoverTime.value = ratio * (duration.value || 0)

  if (isScrubbing.value) {
    seekByPointerEvent(e)
  }
}

function onTimelinePointerUp(e: PointerEvent) {
  if (!isScrubbing.value) return
  isScrubbing.value = false
  try {
    timelineRailRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    // Release capture safe fallback
  }
  scheduleHide()
}

function seekByPointerEvent(e: PointerEvent) {
  if (!timelineRailRef.value || !videoRef.value) return
  const rect = timelineRailRef.value.getBoundingClientRect()
  const clampedX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  const ratio = rect.width > 0 ? clampedX / rect.width : 0
  const targetTime = ratio * (duration.value || 0)
  videoRef.value.currentTime = targetTime
  currentTime.value = targetTime
}

function onTimelineMouseEnter() {
  isTimelineHovered.value = true
}

function onTimelineMouseLeave() {
  isTimelineHovered.value = false
  hoverTime.value = null
}

function seekRelative(deltaSeconds: number) {
  if (!videoRef.value) return
  const target = Math.max(0, Math.min(duration.value || 0, videoRef.value.currentTime + deltaSeconds))
  videoRef.value.currentTime = target
  currentTime.value = target
  showControls.value = true
  scheduleHide()
}

// Volume Controls
function onVolumeInput(e: Event) {
  const target = e.target as HTMLInputElement
  const val = parseFloat(target.value)
  setVolume(val)
}

function setVolume(val: number) {
  if (!videoRef.value) return
  const clamped = Math.max(0, Math.min(1, val))
  volume.value = clamped
  videoRef.value.volume = clamped
  if (clamped === 0) {
    isMuted.value = true
    videoRef.value.muted = true
  } else {
    isMuted.value = false
    videoRef.value.muted = false
    previousVolume.value = clamped
  }
}

function toggleMute() {
  if (!videoRef.value) return
  if (isMuted.value || volume.value === 0) {
    const restore = previousVolume.value > 0.05 ? previousVolume.value : 0.8
    setVolume(restore)
  } else {
    previousVolume.value = volume.value
    setVolume(0)
  }
}

function adjustVolume(delta: number) {
  setVolume(volume.value + delta)
}

// Playback Speed
function toggleSpeedMenu() {
  isSpeedMenuOpen.value = !isSpeedMenuOpen.value
  if (isSpeedMenuOpen.value) {
    showControls.value = true
    clearHideTimer()
  } else {
    scheduleHide()
  }
}

function selectPlaybackRate(rate: number) {
  if (!videoRef.value) return
  playbackRate.value = rate
  videoRef.value.playbackRate = rate
  isSpeedMenuOpen.value = false
  scheduleHide()
}

// Picture-in-Picture
async function togglePiP() {
  if (!videoRef.value || !isPiPAvailable.value) return
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await videoRef.value.requestPictureInPicture()
    }
  } catch {
    // PiP rejection handled gracefully
  }
}

// Fullscreen
async function toggleFullscreen() {
  if (!containerRef.value) return
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      if (containerRef.value.requestFullscreen) {
        await containerRef.value.requestFullscreen()
      } else if ((videoRef.value as any)?.webkitEnterFullscreen) {
        (videoRef.value as any).webkitEnterFullscreen()
      }
    }
  } catch {
    // Fullscreen rejection handled gracefully
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  if (isFullscreen.value) {
    showControls.value = true
    scheduleHide()
  }
}

// Keyboard Navigation
function onKeyDown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement && e.target.type !== 'range') return

  switch (e.code) {
    case 'Space':
    case 'KeyK':
      e.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
    case 'KeyJ':
      e.preventDefault()
      seekRelative(-5)
      break
    case 'ArrowRight':
    case 'KeyL':
      e.preventDefault()
      seekRelative(5)
      break
    case 'ArrowUp':
      e.preventDefault()
      adjustVolume(0.1)
      break
    case 'ArrowDown':
      e.preventDefault()
      adjustVolume(-0.1)
      break
    case 'KeyM':
      e.preventDefault()
      toggleMute()
      break
    case 'KeyF':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'Escape':
      if (isSpeedMenuOpen.value) {
        e.preventDefault()
        isSpeedMenuOpen.value = false
      }
      break
  }
}

function onDocumentClick(e: MouseEvent) {
  if (isSpeedMenuOpen.value && speedMenuRef.value && !speedMenuRef.value.contains(e.target as Node)) {
    isSpeedMenuOpen.value = false
    scheduleHide()
  }
}

// Lifecycle Hooks (SSR-Safe)
onMounted(() => {
  if (typeof document !== 'undefined') {
    isPiPAvailable.value = 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('click', onDocumentClick)
  }

  if (videoRef.value) {
    videoRef.value.addEventListener('enterpictureinpicture', () => (isPiPActive.value = true))
    videoRef.value.addEventListener('leavepictureinpicture', () => (isPiPActive.value = false))
  }
})

onBeforeUnmount(() => {
  clearHideTimer()
  if (typeof document !== 'undefined') {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    document.removeEventListener('click', onDocumentClick)
  }
})
</script>

<template>
  <figure class="fh-figure fh-video-component">
    <div
      ref="containerRef"
      class="apple-player-container"
      :class="{
        'is-fullscreen': isFullscreen,
        'controls-visible': showControls,
        'is-playing': isPlaying,
        'is-paused': !isPlaying,
        'is-scrubbing': isScrubbing
      }"
      tabindex="0"
      aria-label="Video player"
      @keydown="onKeyDown"
      @pointermove="onActivity"
      @mousemove="onActivity"
      @pointerenter="onContainerPointerEnter"
      @mouseenter="onContainerPointerEnter"
      @pointerleave="onPointerLeave"
      @mouseleave="onPointerLeave"
    >
      <!-- Video Element -->
      <video
        ref="videoRef"
        class="apple-video-element"
        :src="src"
        :poster="poster"
        playsinline
        :preload="preload"
        @click="onVideoClick"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @progress="onProgress"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
      />

      <!-- Big Central Glass Play Button (Visible when paused/ended) -->
      <transition name="apple-fade">
        <button
          v-if="!isPlaying"
          class="central-glass-play"
          type="button"
          :aria-label="isEnded ? 'Replay video' : 'Play video'"
          @click.stop="togglePlay"
        >
          <div class="glass-orb-glow" aria-hidden="true" />
          <svg v-if="!isEnded" class="icon-central-play" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.14v14.72a1 1 0 0 0 1.5.86l11.04-7.36a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
          </svg>
          <svg v-else class="icon-central-replay" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </button>
      </transition>

      <!-- Floating Liquid Glass Control Bar -->
      <transition name="apple-hud">
        <div
          v-show="showControls || !isPlaying"
          class="floating-glass-bar"
          @mouseenter="onBarMouseEnter"
          @mouseleave="onBarMouseLeave"
          @pointerdown.stop
        >
          <!-- Play / Pause Button -->
          <button
            class="bar-btn play-btn"
            type="button"
            :aria-label="isPlaying ? 'Pause' : 'Play'"
            @click.stop="togglePlay"
          >
            <svg v-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            <svg v-else-if="isEnded" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.14v14.72a1 1 0 0 0 1.5.86l11.04-7.36a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
            </svg>
          </button>

          <!-- Current Time -->
          <span class="time-display current-time">{{ formattedCurrentTime }}</span>

          <!-- Timeline Scrubber Container -->
          <div
            ref="timelineRailRef"
            class="timeline-track-wrapper"
            role="slider"
            tabindex="0"
            :aria-valuemin="0"
            :aria-valuemax="duration"
            :aria-valuenow="currentTime"
            :aria-valuetext="`${formattedCurrentTime} of ${formattedDuration}`"
            aria-label="Video progress slider"
            @pointerdown="onTimelinePointerDown"
            @pointermove="onTimelinePointerMove"
            @pointerup="onTimelinePointerUp"
            @mouseenter="onTimelineMouseEnter"
            @mouseleave="onTimelineMouseLeave"
          >
            <!-- Hover Time Tooltip -->
            <div
              v-if="isTimelineHovered && hoverTime !== null"
              class="hover-timestamp-bubble"
              :style="{ left: `${hoverRatio * 100}%` }"
            >
              {{ formattedHoverTime }}
            </div>

            <!-- Background Rail -->
            <div class="rail-bg">
              <!-- Buffered Progress Bar -->
              <div class="rail-buffered" :style="{ width: `${bufferedPercent}%` }" />
              <!-- Played Progress Bar -->
              <div class="rail-played" :style="{ width: `${playedPercent}%` }" />
              <!-- Drag Handle / Thumb -->
              <div
                class="rail-thumb"
                :style="{ left: `${playedPercent}%` }"
                :class="{ 'is-active': isScrubbing || isTimelineHovered }"
              />
            </div>
          </div>

          <!-- Total Duration -->
          <span class="time-display total-duration">{{ formattedDuration }}</span>

          <!-- Volume Flyout Group -->
          <div
            class="volume-group"
            @mouseenter="isVolumeHovered = true"
            @mouseleave="isVolumeHovered = false"
          >
            <button
              class="bar-btn volume-btn"
              type="button"
              :aria-label="isMuted ? 'Unmute' : 'Mute'"
              @click.stop="toggleMute"
            >
              <!-- Muted Icon -->
              <svg v-if="isMuted || volume === 0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
              <!-- Low Volume Icon -->
              <svg v-else-if="volume < 0.5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 9v6h4l5 5V4l-5 5H7zm11.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <!-- Full Volume Icon -->
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>

            <!-- Expanded Volume Slider -->
            <div class="volume-slider-wrapper">
              <input
                type="range"
                class="volume-slider"
                min="0"
                max="1"
                step="0.05"
                :value="isMuted ? 0 : volume"
                aria-label="Volume slider"
                @input="onVolumeInput"
                @click.stop
              />
            </div>
          </div>

          <!-- Playback Speed Button & Menu -->
          <div ref="speedMenuRef" class="speed-menu-group">
            <button
              class="bar-btn speed-btn"
              type="button"
              aria-label="Playback speed"
              :aria-expanded="isSpeedMenuOpen"
              @click.stop="toggleSpeedMenu"
            >
              <span class="speed-text">{{ playbackRate === 1 ? '1×' : `${playbackRate}×` }}</span>
            </button>

            <!-- Apple-Style Speed Flyout Popover -->
            <transition name="apple-menu">
              <div v-if="isSpeedMenuOpen" class="speed-flyout" role="menu">
                <div class="speed-flyout-title">Playback Speed</div>
                <button
                  v-for="rate in playbackRates"
                  :key="rate"
                  class="speed-option-btn"
                  :class="{ 'is-selected': playbackRate === rate }"
                  type="button"
                  role="menuitem"
                  @click.stop="selectPlaybackRate(rate)"
                >
                  <span class="option-label">{{ rate === 1 ? '1.0× (Normal)' : `${rate}×` }}</span>
                  <svg v-if="playbackRate === rate" class="check-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </button>
              </div>
            </transition>
          </div>

          <!-- Picture-in-Picture Button (Where Supported) -->
          <button
            v-if="isPiPAvailable"
            class="bar-btn pip-btn"
            type="button"
            :aria-label="isPiPActive ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'"
            @click.stop="togglePiP"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" />
            </svg>
          </button>

          <!-- Fullscreen Button -->
          <button
            class="bar-btn fullscreen-btn"
            type="button"
            :aria-label="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
            @click.stop="toggleFullscreen"
          >
            <svg v-if="isFullscreen" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
          </button>
        </div>
      </transition>
    </div>

    <!-- Optional Technical Caption -->
    <figcaption v-if="caption || title" class="fh-player-caption">
      <span v-if="title" class="caption-title">{{ title }}: </span>
      {{ caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
/* ==========================================================================
   Apple-Inspired Liquid Glass Video Player
   Tokens, Layout, Frosted Surfaces, and Ergonomic Touch Controls
   ========================================================================== */

.fh-video-component {
  margin: 32px 0;
  width: 100%;
}

.apple-player-container {
  position: relative;
  width: min(100%, 960px);
  margin: 0 auto;
  border-radius: 14px;
  overflow: hidden;
  background: #07070a;
  border: 1px solid var(--vp-c-divider, rgba(255, 255, 255, 0.12));
  box-shadow: 0 16px 40px -16px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.2);
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.apple-player-container:focus-visible {
  box-shadow: 0 0 0 2px var(--vp-c-brand-1, #3b82f6), 0 16px 40px -16px rgba(0, 0, 0, 0.7);
}

.apple-video-element {
  display: block;
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
  background: #000;
  cursor: pointer;
}

/* ---------- Center Glass Play Button ---------- */
.central-glass-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(22, 22, 30, 0.75);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  transition: transform 0.22s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1)),
              background-color 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;
}

.central-glass-play:hover {
  transform: translate(-50%, -50%) scale(1.09);
  background: rgba(36, 36, 48, 0.88);
  border-color: rgba(255, 255, 255, 0.55);
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.75), 0 0 24px rgba(59, 130, 246, 0.35);
}

.central-glass-play:active {
  transform: translate(-50%, -50%) scale(0.95);
  transition-duration: 0.08s;
}

.central-glass-play .icon-central-play {
  width: 30px;
  height: 30px;
  margin-left: 4px;
  fill: currentColor;
}

.central-glass-play .icon-central-replay {
  width: 30px;
  height: 30px;
  fill: currentColor;
}

/* ---------- Floating Pill Control Bar ---------- */
.floating-glass-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 36px);
  max-width: 720px;
  min-height: 46px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 9999px;
  background: var(--lg-tint-strong, rgba(20, 20, 28, 0.78));
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 16px 38px -8px rgba(0, 0, 0, 0.8),
              inset 0 1px 0 rgba(255, 255, 255, 0.25),
              inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  color: #f5f5f7;
  z-index: 10;
  transition: opacity 0.28s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1)),
              transform 0.28s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

/* Light theme support */
:root:not(.dark) .floating-glass-bar {
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(0, 0, 0, 0.12);
  color: #1d1d1f;
  box-shadow: 0 14px 32px -10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

:root:not(.dark) .central-glass-play {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(0, 0, 0, 0.15);
  color: #1d1d1f;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

/* ---------- Control Bar Buttons ---------- */
.bar-btn {
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.18s ease, transform 0.18s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.bar-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

:root:not(.dark) .bar-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.bar-btn:active {
  transform: scale(0.92);
}

.bar-btn:focus-visible {
  box-shadow: 0 0 0 2px var(--vp-c-brand-1, #3b82f6);
}

.bar-btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

/* ---------- Time Display ---------- */
.time-display {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 11.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  letter-spacing: -0.02em;
}

:root:not(.dark) .time-display {
  color: rgba(0, 0, 0, 0.75);
}

/* ---------- Timeline Track Scrubber ---------- */
.timeline-track-wrapper {
  position: relative;
  flex: 1;
  height: 28px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
}

.rail-bg {
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.2);
  overflow: visible;
  transition: height 0.18s ease;
}

:root:not(.dark) .rail-bg {
  background: rgba(0, 0, 0, 0.12);
}

.timeline-track-wrapper:hover .rail-bg,
.apple-player-container.is-scrubbing .rail-bg {
  height: 6px;
}

.rail-buffered {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.35);
  pointer-events: none;
  transition: width 0.2s ease;
}

:root:not(.dark) .rail-buffered {
  background: rgba(0, 0, 0, 0.22);
}

.rail-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: inherit;
  background: var(--vp-c-brand-1, #3b82f6);
  pointer-events: none;
}

.rail-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%) scale(0.65);
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease, transform 0.18s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.timeline-track-wrapper:hover .rail-thumb,
.rail-thumb.is-active {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

/* Tooltip on timeline hover */
.hover-timestamp-bubble {
  position: absolute;
  bottom: 22px;
  transform: translateX(-50%);
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(18, 18, 24, 0.92);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 10.5px;
  font-weight: 500;
  color: #fff;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* ---------- Volume Group & Slider ---------- */
.volume-group {
  display: flex;
  align-items: center;
  position: relative;
}

.volume-slider-wrapper {
  width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  transition: width 0.22s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1)),
              margin 0.22s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.volume-group:hover .volume-slider-wrapper,
.volume-group:focus-within .volume-slider-wrapper {
  width: 58px;
  margin-left: 4px;
}

.volume-slider {
  width: 54px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
}

:root:not(.dark) .volume-slider {
  background: rgba(0, 0, 0, 0.2);
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  border: none;
}

/* ---------- Speed Menu & Flyout ---------- */
.speed-menu-group {
  position: relative;
}

.speed-text {
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.speed-flyout {
  position: absolute;
  bottom: calc(100% + 12px);
  right: -10px;
  width: 138px;
  background: rgba(24, 24, 32, 0.88);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 25;
}

:root:not(.dark) .speed-flyout {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}

.speed-flyout-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.45);
  padding: 4px 8px 2px;
}

:root:not(.dark) .speed-flyout-title {
  color: rgba(0, 0, 0, 0.45);
}

.speed-option-btn {
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  padding: 6px 8px;
  border-radius: 6px;
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

:root:not(.dark) .speed-option-btn {
  color: rgba(0, 0, 0, 0.82);
}

.speed-option-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

:root:not(.dark) .speed-option-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #000;
}

.speed-option-btn.is-selected {
  color: var(--vp-c-brand-1, #3b82f6);
  font-weight: 600;
}

.check-icon {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

/* ---------- Fullscreen Mode ---------- */
.apple-player-container.is-fullscreen {
  width: 100vw !important;
  height: 100vh !important;
  max-width: none !important;
  border-radius: 0 !important;
  border: none !important;
  background: #000000 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.apple-player-container.is-fullscreen .apple-video-element {
  max-height: 100vh;
  width: 100%;
  height: 100%;
}

.apple-player-container.is-fullscreen .floating-glass-bar {
  bottom: 32px;
  max-width: 840px;
}

/* ---------- Caption Styling ---------- */
.fh-player-caption {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--vp-c-text-2, #8e8e93);
}

.caption-title {
  font-weight: 600;
  color: var(--vp-c-text-1, #f5f5f7);
}

/* ---------- Transitions ---------- */
.apple-fade-enter-active,
.apple-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.apple-fade-enter-from,
.apple-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.92);
}

.apple-hud-enter-active,
.apple-hud-leave-active {
  transition: opacity 0.26s ease, transform 0.26s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.apple-hud-enter-from,
.apple-hud-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.apple-menu-enter-active,
.apple-menu-leave-active {
  transition: opacity 0.18s ease, transform 0.18s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.apple-menu-enter-from,
.apple-menu-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* ---------- Responsive Layouts ---------- */
@media (max-width: 580px) {
  .floating-glass-bar {
    bottom: 12px;
    width: calc(100% - 20px);
    padding: 5px 10px;
    gap: 6px;
    min-height: 42px;
  }

  .time-display {
    font-size: 10.5px;
  }

  .volume-group {
    display: none; /* Hide volume slider on phones, volume is hardware controlled */
  }

  .speed-text {
    font-size: 10.5px;
  }

  .bar-btn {
    width: 28px;
    height: 28px;
  }

  .bar-btn svg {
    width: 16px;
    height: 16px;
  }

  .central-glass-play {
    width: 60px;
    height: 60px;
  }

  .central-glass-play svg {
    width: 24px;
    height: 24px;
  }
}

/* ---------- Reduced Motion Accessibility ---------- */
@media (prefers-reduced-motion: reduce) {
  .apple-player-container *,
  .apple-player-container *::before,
  .apple-player-container *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
