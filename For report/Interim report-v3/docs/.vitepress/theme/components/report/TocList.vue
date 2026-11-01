<script setup lang="ts">
/** Chapter → section → document list shared by the desktop roadmap rail and the mobile Contents drawer. */
import type { TocChapter } from './toc'

defineProps<{
  items: TocChapter[]
  active: number // index of the active chapter (-1 before the report)
  activeSub: string | null // active section (level 2)
  activeLeaf: string | null // active document inside it (level 3)
  open: (i: number) => boolean
  openSub: (id: string) => boolean
  prefix: string // keeps aria-controls ids unique between the rail and the drawer
}>()
const emit = defineEmits<{ navigate: [id: string, e: MouseEvent]; toggle: [i: number]; toggleSub: [id: string] }>()
</script>

<template>
  <ol class="rtoc__list">
    <template v-for="(c, i) in items" :key="c.id">
      <li v-if="c.group" class="rtoc__group" aria-hidden="true">{{ c.group }}</li>
      <li class="rtoc__item" :class="{ 'is-active': active === i, 'is-done': active > i, 'is-missing': c.missing }" :data-i="i">
        <div class="rtoc__row">
          <a
            class="rtoc__link"
            :href="`#${c.id}`"
            target="_self"
            :aria-current="active === i && !activeSub ? 'location' : undefined"
            @click="emit('navigate', c.id, $event)"
          >
            <span class="rtoc__dot" aria-hidden="true" />
            <span v-if="c.num" class="rtoc__num">{{ c.num }}</span>
            <span class="rtoc__title">{{ c.title }}</span>
          </a>
          <button
            v-if="c.subs.length"
            type="button"
            class="rtoc__toggle"
            :aria-expanded="open(i)"
            :aria-controls="`${prefix}-subs-${c.id}`"
            :aria-label="`${open(i) ? 'Collapse' : 'Expand'} ${c.title} subsections`"
            @click="emit('toggle', i)"
          >
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
          </button>
        </div>
        <div v-if="c.subs.length" :id="`${prefix}-subs-${c.id}`" class="rtoc__subs" :class="{ 'is-open': open(i) }" :inert="!open(i) || undefined">
          <ol>
            <li v-for="s in c.subs" :key="s.id" :class="{ 'has-leaves': s.leaves.length }">
              <div class="rtoc__subrow">
                <a
                  class="rtoc__sublink"
                  :class="{ 'is-active': activeSub === s.id }"
                  :href="`#${s.id}`"
                  target="_self"
                  :aria-current="activeSub === s.id && !activeLeaf ? 'location' : undefined"
                  @click="emit('navigate', s.id, $event)"
                >
                  <span class="rtoc__subnum">{{ s.num }}</span>{{ s.title }}
                </a>
                <button
                  v-if="s.leaves.length"
                  type="button"
                  class="rtoc__toggle rtoc__toggle--sub"
                  :aria-expanded="openSub(s.id)"
                  :aria-controls="`${prefix}-leaves-${s.id}`"
                  :aria-label="`${openSub(s.id) ? 'Collapse' : 'Expand'} ${s.title} documents`"
                  @click="emit('toggleSub', s.id)"
                >
                  <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
                </button>
              </div>
              <!-- level 3: the individual technical documents of this section -->
              <div v-if="s.leaves.length" :id="`${prefix}-leaves-${s.id}`" class="rtoc__leaves" :class="{ 'is-open': openSub(s.id) }" :inert="!openSub(s.id) || undefined">
                <ol>
                  <li v-for="l in s.leaves" :key="l.id">
                    <a
                      class="rtoc__leaflink"
                      :class="{ 'is-active': activeLeaf === l.id }"
                      :href="`#${l.id}`"
                      target="_self"
                      :aria-current="activeLeaf === l.id ? 'location' : undefined"
                      @click="emit('navigate', l.id, $event)"
                    >
                      <span class="rtoc__leafnum">{{ l.num }}</span>{{ l.title }}
                    </a>
                  </li>
                </ol>
              </div>
            </li>
          </ol>
        </div>
      </li>
    </template>
  </ol>
</template>
