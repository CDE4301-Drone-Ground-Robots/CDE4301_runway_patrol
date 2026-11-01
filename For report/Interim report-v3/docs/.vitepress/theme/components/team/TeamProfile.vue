<script setup lang="ts">
/**
 * One member's expanded profile inside the Mirror Hall. Identity and documentation links come from
 * data/team.ts; everything the member did is Markdown passed in from team.md through named slots:
 *   #contributions  Semester 1 contributions (always visible)
 *   #scope          Individual scope            (accordion)
 *   #s1             Semester 1 deliverables     (accordion)
 *   #s2             Semester 2 deliverables     (accordion; composed from report/members/<id>/semester-2-plan.md)
 */
import { computed, inject, ref, type Ref } from 'vue'
import { withBase } from 'vitepress'
import { memberById, type MemberId } from '../../data/team'

const props = defineProps<{ member: MemberId }>()
const m = computed(() => memberById(props.member)!)
const hall = inject<{ active: Ref<MemberId | null>; leave: () => void }>('mirror-hall')
const shown = computed(() => hall?.active.value === props.member)

const sections = [
  { key: 'scope', title: 'Individual Scope' },
  { key: 's1', title: 'Semester 1 Deliverables' },
  { key: 's2', title: 'Semester 2 Deliverables' }
] as const
const openKeys = ref<Record<string, boolean>>({})
const toggle = (k: string) => (openKeys.value[k] = !openKeys.value[k])
</script>

<template>
  <article v-show="shown" :id="`profile-${member}`" class="mh-profile" :aria-labelledby="`profile-${member}-name`">
    <header class="mh-profile__head mh-reveal">
      <p class="mh-profile__kicker">{{ m.role }}</p>
      <h2 :id="`profile-${member}-name`" class="mh-profile__name">{{ m.name }}</h2>
      <p class="mh-profile__meta">
        <span>{{ m.discipline }}</span>
        <span class="mh-profile__id">{{ m.matric }}</span>
      </p>
      <p class="mh-profile__subsystem">{{ m.subsystem }}</p>
    </header>

    <section class="mh-profile__block mh-reveal" :aria-labelledby="`profile-${member}-s1c`">
      <h3 :id="`profile-${member}-s1c`" class="mh-profile__label">Semester 1 Contributions</h3>
      <div class="mh-profile__md"><slot name="contributions" /></div>
    </section>

    <div class="mh-profile__accordions mh-reveal">
      <section v-for="s in sections" :key="s.key" class="mh-acc" :class="{ 'is-open': openKeys[s.key] }">
        <h3 class="mh-acc__h">
          <button
            :id="`profile-${member}-${s.key}-btn`"
            type="button"
            class="mh-acc__btn"
            :aria-expanded="!!openKeys[s.key]"
            :aria-controls="`profile-${member}-${s.key}`"
            @click="toggle(s.key)"
          >
            <span>{{ s.title }}</span>
            <span class="mh-acc__icon" aria-hidden="true" />
          </button>
        </h3>
        <div
          :id="`profile-${member}-${s.key}`"
          class="mh-acc__panel"
          role="region"
          :aria-labelledby="`profile-${member}-${s.key}-btn`"
          :inert="!openKeys[s.key] || undefined"
        >
          <div class="mh-acc__inner mh-profile__md">
            <slot :name="s.key" />
          </div>
        </div>
      </section>
    </div>

    <nav class="mh-profile__docs mh-reveal" :aria-label="`${m.shortName}'s technical documentation`">
      <h3 class="mh-profile__label">Technical Documentation</h3>
      <div class="mh-pills">
        <a v-for="d in m.docs" :key="d.route" class="mh-pill" :href="withBase(d.route)" @click="hall?.leave()">
          {{ d.label }} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </nav>

    <p v-if="m.social.length" class="mh-profile__social mh-reveal">
      <a v-for="s in m.social" :key="s.href" :href="s.href" target="_blank" rel="noopener">{{ s.label }}</a>
    </p>
  </article>
</template>

<style>
.mh-profile {
  font-family: var(--ov-sans);
  color: var(--mh-ink, #f3eee7);
}
.mh-profile__kicker {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--mh-bronze, #e9a35c);
}
.mh-profile__name {
  margin: 0;
  padding: 0;
  border: 0;
  font-family: var(--ov-display);
  font-size: clamp(30px, 3.6vw, 48px);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: 0.02em;
  color: var(--mh-ink, #f3eee7);
}
.mh-profile__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 12px 0 0;
  font-size: 14px;
  color: rgba(243, 238, 231, 0.66);
}
.mh-profile__id {
  letter-spacing: 0.12em;
  color: rgba(243, 238, 231, 0.85);
}
.mh-profile__subsystem {
  margin: 14px 0 0;
  padding-left: 12px;
  border-left: 2px solid var(--mh-bronze, #e9a35c);
  font-size: 15px;
  color: rgba(243, 238, 231, 0.88);
}
.mh-profile__block {
  margin-top: 30px;
}
.mh-profile__label {
  margin: 0 0 12px;
  padding: 0;
  border: 0;
  font-family: var(--ov-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(243, 238, 231, 0.55);
}
.mh-profile__md {
  font-size: 15px;
  line-height: 1.65;
  color: rgba(243, 238, 231, 0.86);
}
.mh-profile__md ul {
  margin: 0;
  padding-left: 1.1em;
  list-style: disc;
}
.mh-profile__md li::marker {
  color: var(--mh-bronze, #e9a35c);
}
.mh-profile__md li + li {
  margin-top: 4px;
}
.mh-profile__md p {
  margin: 0 0 10px;
}
.mh-profile__md strong {
  color: var(--mh-ink, #f3eee7);
}
.mh-profile__md code {
  font-size: 0.88em;
}

.mh-profile__accordions {
  margin-top: 26px;
  border-top: 1px solid rgba(243, 238, 231, 0.12);
}
.mh-acc {
  border-bottom: 1px solid rgba(243, 238, 231, 0.12);
}
.mh-acc__h {
  margin: 0;
  padding: 0;
  border: 0;
}
.mh-acc__btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 2px;
  font-family: var(--ov-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--mh-ink, #f3eee7);
  text-align: left;
}
.mh-acc__btn:hover {
  color: var(--mh-bronze, #e9a35c);
}
.mh-acc__btn:focus-visible {
  outline: 2px solid var(--mh-bronze, #e9a35c);
  outline-offset: 2px;
}
.mh-acc__icon {
  position: relative;
  width: 12px;
  height: 12px;
  flex: none;
}
.mh-acc__icon::before,
.mh-acc__icon::after {
  content: '';
  position: absolute;
  left: 0;
  top: 5px;
  width: 12px;
  height: 1.5px;
  background: currentColor;
  transition: transform 0.3s ease;
}
.mh-acc__icon::after {
  transform: rotate(90deg);
}
.mh-acc.is-open .mh-acc__icon::after {
  transform: rotate(0deg);
}
/* smooth height: animate the grid row from 0fr to 1fr (no clipping of long content once open) */
.mh-acc__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.38s cubic-bezier(0.16, 1, 0.3, 1);
}
.mh-acc.is-open .mh-acc__panel {
  grid-template-rows: 1fr;
}
.mh-acc__inner {
  min-height: 0;
  overflow: hidden;
}
.mh-acc.is-open .mh-acc__inner {
  padding-bottom: 18px;
}

.mh-profile__docs {
  margin-top: 30px;
}
.mh-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.mh-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px solid rgba(243, 238, 231, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 13px;
  font-weight: 500;
  color: var(--mh-ink, #f3eee7) !important;
  text-decoration: none !important;
  transition: border-color 0.25s ease, background 0.25s ease, color 0.25s ease;
}
.mh-pill:hover {
  border-color: var(--mh-bronze, #e9a35c);
  background: rgba(233, 163, 92, 0.1);
  color: var(--mh-bronze, #e9a35c) !important;
}
.mh-pill:focus-visible {
  outline: 2px solid var(--mh-bronze, #e9a35c);
  outline-offset: 3px;
}
.mh-profile__social {
  display: flex;
  gap: 18px;
  margin: 26px 0 0;
  font-size: 13px;
}
.mh-profile__social a {
  color: rgba(243, 238, 231, 0.6) !important;
}
.mh-profile__social a:hover {
  color: var(--mh-bronze, #e9a35c) !important;
}
@media (prefers-reduced-motion: reduce) {
  .mh-acc__panel,
  .mh-acc__icon::before,
  .mh-acc__icon::after,
  .mh-pill {
    transition: none;
  }
}
</style>
