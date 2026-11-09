<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/introduction-2.js'

useWidgetScript([['introduction-2', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-introduction-heatmap">
    <div class="hm-box">
      <div class="hm-head">
        <span class="hm-title">Five-year sensitivity heat map across 22 usage frequencies</span>
        <span class="hm-hint">Hover cells to inspect sensitivity tier and lifecycle costs</span>
      </div>
      <div id="anychart-heatmap-container"></div>
      <div class="hm-foot">
        <span>ASP: Autonomous System Phase; MS: Manual System. Runway delay penalty benchmarked at USD 1,500/min. Green is cheapest and red is most expensive for each usage frequency (row by row).</span>
        <span>Öztürk &amp; Kuzucuoğlu (2016)</span>
      </div>
    </div>
  </div>
</template>

<style>
.wgt-introduction-heatmap { margin: 24px 0; }
.wgt-introduction-heatmap .hm-box { border: 1px solid var(--apple-border, rgba(255,255,255,.12)); border-radius: 12px; padding: 12px 10px 10px; background: rgba(0,0,0,.18); }
.wgt-introduction-heatmap .hm-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; padding: 0 6px 8px; }
.wgt-introduction-heatmap .hm-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
.wgt-introduction-heatmap .hm-hint { font-size: 11px; color: var(--text-muted, #94a3b8); font-family: var(--font-mono, monospace); }
.wgt-introduction-heatmap #anychart-heatmap-container { width: 100%; height: 620px; min-height: 580px; font-size: 13px; color: var(--text-muted, #94a3b8); }
.wgt-introduction-heatmap .anychart-credits { display: none !important; }
.wgt-introduction-heatmap .hm-foot { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 6px; padding: 8px 6px 0; border-top: 1px solid var(--apple-border, rgba(255,255,255,.12)); font-size: 11px; color: var(--text-muted, #94a3b8); font-style: italic; }
@media (max-width: 640px) { .wgt-introduction-heatmap #anychart-heatmap-container { height: 520px; min-height: 480px; } }
</style>
