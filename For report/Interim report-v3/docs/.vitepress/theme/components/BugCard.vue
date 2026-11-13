<script setup lang="ts">
import { useSlots } from 'vue'

defineProps<{
  title: string
  stage?: string
  symptom: string
  rootCause: string
  fix: string
  evidence: string
}>()

const slots = useSlots()
</script>

<template>
  <article class="fh-bug-card">
    <header class="fh-bug-card__head">
      <span v-if="stage" class="fh-bug-card__badge">{{ stage }}</span>
      <h4 class="fh-bug-card__title">{{ title }}</h4>
    </header>

    <div class="fh-bug-card__cols">
      <div class="fh-bug-card__col fh-bug-card__col--problem">
        <div class="fh-bug-card__block">
          <span class="fh-bug-card__label fh-bug-card__label--symptom">Symptom</span>
          <p class="fh-bug-card__text">{{ symptom }}</p>
        </div>
        <div class="fh-bug-card__block">
          <span class="fh-bug-card__label">Root cause</span>
          <p class="fh-bug-card__text">{{ rootCause }}</p>
        </div>
      </div>

      <div class="fh-bug-card__col fh-bug-card__col--solution">
        <div class="fh-bug-card__block">
          <span class="fh-bug-card__label fh-bug-card__label--fix">Fix</span>
          <p class="fh-bug-card__text">{{ fix }}</p>
        </div>
        <div class="fh-bug-card__block">
          <span class="fh-bug-card__label">Evidence</span>
          <p class="fh-bug-card__text">{{ evidence }}</p>
        </div>
      </div>
    </div>

    <details v-if="slots.default" class="fh-bug-card__details">
      <summary class="fh-bug-card__summary">Code &amp; register-level fix</summary>
      <div class="fh-bug-card__body">
        <slot />
      </div>
    </details>
  </article>
</template>

<style scoped>
.fh-bug-card {
  margin: 16px 0 22px;
  padding: 18px 20px;
  border: 1px solid var(--fh-border, var(--vp-c-divider));
  border-radius: 14px;
  background: var(--fh-surface, var(--vp-c-bg-soft));
}

.fh-bug-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.fh-bug-card__badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-brand-1, #3b82f6);
  background: var(--vp-c-brand-soft, rgba(59, 130, 246, 0.14));
}

.fh-bug-card__title {
  margin: 0 !important;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.35;
  color: var(--vp-c-text-1);
}

.fh-bug-card__cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.fh-bug-card__col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--fh-border, var(--vp-c-divider));
  border-radius: 10px;
  background: var(--vp-c-bg-alt);
}

.fh-bug-card__col--problem {
  border-left: 3px solid #f2667a;
}

.fh-bug-card__col--solution {
  border-left: 3px solid #34c08b;
}

.fh-bug-card__label {
  display: inline-block;
  margin-bottom: 3px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.fh-bug-card__label--symptom {
  color: #f2667a;
}

.fh-bug-card__label--fix {
  color: #34c08b;
}

.fh-bug-card__text {
  margin: 0 !important;
  font-size: 13.8px;
  line-height: 1.55;
  color: var(--vp-c-text-1);
}

.fh-bug-card__details {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--fh-border, var(--vp-c-divider));
}

.fh-bug-card__summary {
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-brand-1, #3b82f6);
  user-select: none;
}

.fh-bug-card__body {
  margin-top: 10px;
}

@media (max-width: 720px) {
  .fh-bug-card__cols {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

