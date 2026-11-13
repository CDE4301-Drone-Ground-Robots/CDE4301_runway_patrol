<script setup lang="ts">
import { useSlots } from 'vue'

defineProps<{
  title: string
  need: string
  choice: string
  tradeoff: string
  summaryLabel?: string
}>()

const slots = useSlots()
</script>

<template>
  <article class="fh-decision-card">
    <header class="fh-decision-card__head">
      <span class="fh-decision-card__tag">Design Decision</span>
      <h4 class="fh-decision-card__title">{{ title }}</h4>
    </header>

    <dl class="fh-decision-card__grid">
      <div class="fh-decision-card__cell">
        <dt class="fh-decision-card__label">Need</dt>
        <dd class="fh-decision-card__val">{{ need }}</dd>
      </div>
      <div class="fh-decision-card__cell fh-decision-card__cell--choice">
        <dt class="fh-decision-card__label">Choice</dt>
        <dd class="fh-decision-card__val">{{ choice }}</dd>
      </div>
      <div class="fh-decision-card__cell">
        <dt class="fh-decision-card__label">Trade-off accepted</dt>
        <dd class="fh-decision-card__val">{{ tradeoff }}</dd>
      </div>
    </dl>

    <details v-if="slots.default" class="fh-decision-card__details">
      <summary class="fh-decision-card__summary">
        {{ summaryLabel || 'Supporting tables, equations & hardware evidence' }}
      </summary>
      <div class="fh-decision-card__body">
        <slot />
      </div>
    </details>
  </article>
</template>

<style scoped>
.fh-decision-card {
  margin: 18px 0 24px;
  padding: 18px 20px;
  border: 1px solid var(--fh-border, var(--vp-c-divider));
  border-left: 3px solid var(--vp-c-brand-1, #3b82f6);
  border-radius: 14px;
  background: var(--fh-surface, var(--vp-c-bg-soft));
}

.fh-decision-card__head {
  margin-bottom: 12px;
}

.fh-decision-card__tag {
  display: inline-block;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1, #3b82f6);
}

.fh-decision-card__title {
  margin: 0 !important;
  font-size: 16.5px;
  font-weight: 650;
  line-height: 1.35;
  color: var(--vp-c-text-1);
}

.fh-decision-card__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.fh-decision-card__cell {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid var(--fh-border, var(--vp-c-divider));
  border-radius: 10px;
  background: var(--vp-c-bg-alt);
}

.fh-decision-card__cell--choice {
  border-color: rgba(52, 192, 139, 0.45);
  background: rgba(52, 192, 139, 0.08);
}

.fh-decision-card__label {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.fh-decision-card__cell--choice .fh-decision-card__label {
  color: #34c08b;
}

.fh-decision-card__val {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
}

.fh-decision-card__details {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--fh-border, var(--vp-c-divider));
}

.fh-decision-card__summary {
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--vp-c-brand-1, #3b82f6);
  user-select: none;
}

.fh-decision-card__body {
  margin-top: 14px;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .fh-decision-card__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

