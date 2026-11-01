<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/hilbert-navigation-1.js'
import s1 from './scripts/hilbert-navigation-2.js'
import s2 from './scripts/hilbert-navigation-3.js'

useWidgetScript([['hilbert-navigation-1', s0], ['hilbert-navigation-2', s1], ['hilbert-navigation-3', s2]])
</script>

<template>
  <div class="vp-raw wgt wgt-hilbert-navigation">
<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(255, 255, 255, 0.02); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--apple-border); margin-bottom: 14px;">
<div style="display: flex; align-items: center; gap: 6px;">
<label style="font-size: 12px; font-weight: 600; color: #86868b;">Algorithm:</label>
<select id="pf-algo-select" style="padding: 5px 8px; font-size: 12px; border-radius: 6px; border: 1px solid var(--apple-border); background: var(--apple-surface); color: var(--apple-text-primary);">
<option selected="" value="astar">A* Search (Octile / Euclidean)</option>
<option value="thetastar">Theta* (Any-Angle LOS)</option>
<option value="greedy">Greedy Best-First</option>
<option value="dijkstra">Dijkstra's Algorithm</option>
<option value="bfs">Breadth-First Search (BFS)</option>
</select>
</div>
<div style="display: flex; align-items: center; gap: 6px;">
<label style="font-size: 12px; font-weight: 600; color: #86868b;">Map Preset:</label>
<select id="pf-preset-select" style="padding: 5px 8px; font-size: 12px; border-radius: 6px; border: 1px solid var(--apple-border); background: var(--apple-surface); color: var(--apple-text-primary);">
<option selected="" value="runway">Runway Corridor &amp; FOD</option>
<option value="chicane">Chicane Turnaround</option>
<option value="apron">Apron Ramp Clutter</option>
<option value="clear">Empty Grid</option>
</select>
</div>
<div style="display: flex; align-items: center; gap: 6px;">
<label style="font-size: 12px; font-weight: 600; color: #86868b;">Speed:</label>
<select id="pf-speed-select" style="padding: 5px 8px; font-size: 12px; border-radius: 6px; border: 1px solid var(--apple-border); background: var(--apple-surface); color: var(--apple-text-primary);">
<option value="5">Fast (5 ms)</option>
<option selected="" value="12">Normal (12 ms)</option>
<option value="30">Slow (30 ms)</option>
<option value="0">Instant (0 ms)</option>
</select>
</div>
<div style="display: flex; gap: 6px; flex-wrap: wrap; margin-left: auto;">
<button class="bt-toolbar-btn active" id="pf-run-btn" style="font-weight: 600;">► Run Search</button>
<button class="bt-toolbar-btn" id="pf-benchmark-btn" style="border-color: #10b981; color: #34d399;">📊 Benchmark All</button>
<button class="bt-toolbar-btn" id="pf-clear-path-btn">Clear Path</button>
<button class="bt-toolbar-btn" id="pf-reset-btn">Reset Grid</button>
</div>
</div>
  </div>
</template>

<style>

    /* ==========================================================================
       EDITORIAL DOCUMENTATION STYLES — APPLE-INSPIRED LAYOUT
       ========================================================================== */
    .wgt-hilbert-navigation .editorial-prose {
      max-width: 820px;
      margin: 0 auto;
    }
    .wgt-hilbert-navigation .editorial-prose p {
      font-size: 15.5px;
      line-height: 1.75;
      color: var(--apple-text-secondary);
      margin-bottom: 20px;
    }
    .wgt-hilbert-navigation .editorial-prose p strong {
      color: var(--apple-text-primary);
      font-weight: 600;
    }
    .wgt-hilbert-navigation .editorial-prose ul, .wgt-hilbert-navigation .editorial-prose ol {
      margin: 0 0 20px 24px;
      padding: 0;
      color: var(--apple-text-secondary);
      line-height: 1.7;
      font-size: 15px;
    }
    .wgt-hilbert-navigation .editorial-prose li {
      margin-bottom: 8px;
    }
    .wgt-hilbert-navigation .editorial-prose li strong {
      color: var(--apple-text-primary);
    }
    .wgt-hilbert-navigation .editorial-wide {
      max-width: 1140px;
      margin: 0 auto;
    }
    .wgt-hilbert-navigation .editorial-section {
      padding: 48px 0;
      border-bottom: 1px solid var(--apple-border);
    }
    .wgt-hilbert-navigation .editorial-section:last-of-type {
      border-bottom: none;
    }
    .wgt-hilbert-navigation .editorial-h2 {
      font-size: clamp(1.8rem, 3.2vw, 2.3rem);
      font-weight: 700;
      color: var(--apple-text-primary);
      letter-spacing: -0.02em;
      margin-top: 0;
      margin-bottom: 22px;
    }
    .wgt-hilbert-navigation .editorial-h3 {
      font-size: clamp(1.25rem, 2.2vw, 1.55rem);
      font-weight: 600;
      color: var(--apple-text-primary);
      letter-spacing: -0.01em;
      margin-top: 36px;
      margin-bottom: 14px;
    }
    .wgt-hilbert-navigation .editorial-h4 {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--apple-text-primary);
      margin-top: 26px;
      margin-bottom: 10px;
    }

    /* FUNCTIONAL CARDS ONLY (Visualizations, Tables, Diagrams, Math) */
    .wgt-hilbert-navigation .functional-card {
      background: var(--apple-surface-card);
      border: 1px solid var(--apple-border);
      border-radius: 12px;
      padding: 20px;
      margin: 28px 0;
      box-shadow: var(--apple-shadow-sm);
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
    .wgt-hilbert-navigation .table-container {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
    }
    .wgt-hilbert-navigation .functional-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--apple-border);
    }
    .wgt-hilbert-navigation .functional-card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--apple-text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Math Formulas */
    .wgt-hilbert-navigation .math-eq-box {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid var(--apple-border);
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      margin: 16px 0;
      overflow-x: auto;
    }

    /* Tables */
    .wgt-hilbert-navigation .clean-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
      text-align: left;
    }
    .wgt-hilbert-navigation .clean-table th {
      padding: 10px 14px;
      font-weight: 600;
      color: var(--apple-text-primary);
      border-bottom: 1px solid var(--apple-border);
      background: rgba(255, 255, 255, 0.02);
    }
    .wgt-hilbert-navigation .clean-table td {
      padding: 11px 14px;
      color: var(--apple-text-secondary);
      border-bottom: 1px solid var(--apple-border);
      vertical-align: middle;
    }
    .wgt-hilbert-navigation .clean-table tr:last-child td {
      border-bottom: none;
    }

    /* Citation Badges */
    .wgt-hilbert-navigation .citation-ref {
      color: var(--apple-blue, #3b82f6);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.88em;
      padding: 1px 5px;
      margin: 0 1px;
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.22);
      transition: all 0.2s ease;
      display: inline-block;
      line-height: 1.25;
      vertical-align: baseline;
    }
    .wgt-hilbert-navigation .citation-ref:hover {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      text-decoration: none;
    }

    /* Interactive Explorer Styles */
    .wgt-hilbert-navigation .bt-toolbar-btn {
      background: var(--apple-surface);
      border: 1px solid var(--apple-border);
      color: var(--apple-text-secondary);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .wgt-hilbert-navigation .bt-toolbar-btn:hover {
      background: var(--apple-surface-card-hover);
      color: var(--apple-text-primary);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .wgt-hilbert-navigation .bt-toolbar-btn.active {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border-color: #3b82f6;
    }

    /* DUAL-EKF ARCHITECTURE BLOCK DIAGRAM STYLING */
    .wgt-hilbert-navigation .ekf-svg-box-bg { fill: #0d131f; stroke: #3b82f6; }
    .wgt-hilbert-navigation .ekf-svg-box-green { fill: #091a14; stroke: #10b981; }
    .wgt-hilbert-navigation .ekf-svg-box-purple { fill: #150f24; stroke: #a855f7; }
    .wgt-hilbert-navigation .ekf-svg-circle { fill: #0b0f19; stroke: #3b82f6; }
    .wgt-hilbert-navigation .ekf-text-p { fill: #f8fafc; }
    .wgt-hilbert-navigation .ekf-text-s { fill: #94a3b8; }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .wgt-hilbert-navigation .apple-megamenu {
        display: none !important;
      }
      .wgt-hilbert-navigation .editorial-section {
        padding: 32px 0;
      }
      .wgt-hilbert-navigation .clean-table {
        font-size: 12px;
      }
      .wgt-hilbert-navigation .clean-table th, .wgt-hilbert-navigation .clean-table td {
        padding: 8px 10px;
      }
    }
  
</style>
