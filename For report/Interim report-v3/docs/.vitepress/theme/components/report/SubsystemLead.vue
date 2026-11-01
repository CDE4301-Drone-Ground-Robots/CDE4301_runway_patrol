<script setup lang="ts">
/**
 * Documentation ownership plate: who is responsible for the document below. Placed right under a Report
 * section heading through docs/report/lead/<member>-lead.md. Identity comes from data/team.ts (the same
 * source as Meet the Team), so names, matric numbers and photos cannot drift apart.
 *   <SubsystemLead member="hilbert" />            one lead
 *   <SubsystemLead member="zacarias,asuka" />     several contributors
 */
import { computed } from 'vue'
import { memberById } from '../../data/team'

const props = withDefaults(defineProps<{ member: string; label?: string }>(), { label: 'Subsystem Lead' })
const people = computed(() =>
  props.member
    .split(',')
    .map((id) => memberById(id.trim()))
    .filter((m): m is NonNullable<typeof m> => !!m)
)
</script>

<template>
  <div class="sublead" :class="{ 'sublead--multi': people.length > 1 }">
    <div v-for="m in people" :key="m.id" class="sublead__person">
      <img class="sublead__photo" :src="m.portrait" :alt="`Portrait of ${m.name}`" :style="{ objectPosition: m.focus }" loading="lazy" width="56" height="56" />
      <div class="sublead__text">
        <span class="sublead__label">{{ people.length > 1 ? 'Contributor' : label }}</span>
        <span class="sublead__name">{{ m.shortName }}</span>
        <span class="sublead__id">{{ m.matric }}</span>
      </div>
    </div>
  </div>
</template>

<style>
.sublead {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 44px;
  margin: 18px 0 30px;
  padding: 16px 0;
  border-top: 1px solid var(--rpt-line, rgba(255, 255, 255, 0.12));
  border-bottom: 1px solid var(--rpt-line, rgba(255, 255, 255, 0.12));
}
.sublead__person {
  display: flex;
  align-items: center;
  gap: 16px;
}
.sublead__photo {
  flex: none;
  width: 56px;
  height: 56px;
  margin: 0 !important;
  border-radius: 12px;
  object-fit: cover;
}
.sublead__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}
.sublead__label {
  font-family: var(--ov-sans);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--rpt-bronze, #c98a4b);
}
.sublead__name {
  font-family: var(--ov-sans);
  font-size: 16px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}
.sublead__id {
  font-family: var(--ov-sans);
  font-size: 12.5px;
  letter-spacing: 0.1em;
  color: var(--vp-c-text-2);
}
</style>
