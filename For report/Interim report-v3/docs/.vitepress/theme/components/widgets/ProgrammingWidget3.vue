<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/programming-1.js'
import s1 from './scripts/programming-2.js'

useWidgetScript([['programming-1', s0], ['programming-2', s1]])
</script>

<template>
  <div class="vp-raw wgt wgt-programming">
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px;">
            <div class="slider-control">
              <label><span>Vehicle Total Mass ($M$):</span> <strong id="val-mass" style="color: #f5f5f7;">65.0 kg</strong></label>
              <input type="range" id="slider-mass" min="40" max="100" step="1" value="65">
            </div>
            <div class="slider-control">
              <label><span>Asphalt Friction ($\mu$):</span> <strong id="val-mu" style="color: #f5f5f7;">0.80</strong></label>
              <input type="range" id="slider-mu" min="0.40" max="1.00" step="0.05" value="0.80">
            </div>
            <div class="slider-control">
              <label><span>Turning Radius ($R$):</span> <strong id="val-radius" style="color: #2997ff;">1.50 m</strong></label>
              <input type="range" id="slider-radius" min="0.0" max="4.0" step="0.1" value="1.5">
            </div>
          </div>
  </div>
</template>

<style>

    /* MATHJAX RESPONSIVE & HIGH-LEGIBILITY STYLING */
    .wgt-programming .MathJax {
      max-width: 100% !important;
      outline: none !important;
    }
    .wgt-programming .MathJax:not([display="true"]) {
      display: inline-block !important;
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
      font-size: 100% !important;
      vertical-align: -0.1em !important;
    }
    .wgt-programming .MathJax[display="true"] {
      margin: 6px 0 !important;
      display: block !important;
      font-size: 105% !important;
      overflow: visible !important;
    }
    .wgt-programming .math-eq-hero {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--apple-border);
      border-radius: 8px;
      padding: 14px 18px;
      text-align: center;
      margin: 14px 0;
      overflow-x: auto;
    }
    /* APPLE DARK-MODE METRIC CARD */
    .wgt-programming .metric-card {
      background: var(--apple-surface-card);
      border: 1px solid var(--apple-border);
      border-radius: 8px;
      padding: 14px;
      text-align: center;
      transition: border-color 0.2s ease;
    }
    .wgt-programming .metric-card:hover {
      border-color: rgba(41, 151, 255, 0.4);
    }
    .wgt-programming .metric-title {
      font-size: 11px;
      text-transform: uppercase;
      color: #86868b;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .wgt-programming .metric-val {
      font-size: 18px;
      font-weight: 700;
      color: #f5f5f7;
      margin-top: 4px;
    }
    /* INTERACTIVE CONTROL PANELS */
    .wgt-programming .interactive-panel {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      padding: 20px;
      margin-top: 16px;
      margin-bottom: 20px;
    }
    .wgt-programming .slider-control {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .wgt-programming .slider-control label {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      color: #86868b;
      font-weight: 500;
    }
    .wgt-programming .slider-control input[type="range"] {
      width: 100%;
      accent-color: #2997ff;
      cursor: pointer;
    }
    /* STEPPER BUTTONS */
    .wgt-programming .step-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--apple-border);
      color: #86868b;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .wgt-programming .step-pill.active {
      background: rgba(41, 151, 255, 0.15);
      border-color: #2997ff;
      color: #2997ff;
      font-weight: 600;
    }
  
</style>
