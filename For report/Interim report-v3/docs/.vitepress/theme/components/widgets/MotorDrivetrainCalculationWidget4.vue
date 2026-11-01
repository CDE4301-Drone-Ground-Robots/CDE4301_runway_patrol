<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/hilbert-motor-drivetrain-calculation-1.js'
import s1 from './scripts/hilbert-motor-drivetrain-calculation-2.js'

useWidgetScript([['hilbert-motor-drivetrain-calculation-1', s0], ['hilbert-motor-drivetrain-calculation-2', s1]])
</script>

<template>
  <div class="vp-raw wgt wgt-hilbert-motor-drivetrain-calculation">
<div id="scout2-drivetrain-container"></div>
  </div>
</template>

<style>

    /* MATHJAX RESPONSIVE & HIGH-LEGIBILITY STYLING */
    .wgt-hilbert-motor-drivetrain-calculation .math-eq-box {
      background: #0b1120;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      margin: 10px 0;
      overflow-x: auto;
      overflow-y: hidden;
      max-width: 100%;
      box-sizing: border-box;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
    }
    .wgt-hilbert-motor-drivetrain-calculation .math-eq-box::-webkit-scrollbar {
      height: 4px;
    }
    .wgt-hilbert-motor-drivetrain-calculation .math-eq-box::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }
    .wgt-hilbert-motor-drivetrain-calculation .diagram-fbd-container {
      background: #070d18;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 20px;
      margin: 16px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 30px rgba(0,0,0,0.5);
    }
    /* DYNAMOMETER INTERACTIVE CHART & LOAD-TEST STYLES */
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-chart-card {
      background: #090f1d;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 22px;
      margin: 18px 0;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 14px;
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-tab-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      padding: 7px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-tab-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f8fafc;
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-tab-btn.active {
      background: #2563eb;
      border-color: #3b82f6;
      color: #ffffff;
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-chart-container {
      position: relative;
      width: 100%;
      height: 380px;
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-tooltip {
      position: absolute;
      pointer-events: none;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #38bdf8;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11.5px;
      color: #f8fafc;
      box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      display: none;
      z-index: 20;
      line-height: 1.45;
      backdrop-filter: blur(8px);
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      justify-content: center;
      margin-top: 14px;
      font-size: 11.5px;
      color: #94a3b8;
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .wgt-hilbert-motor-drivetrain-calculation .dynamo-legend-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }
    .wgt-hilbert-motor-drivetrain-calculation .test-table-collapse-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #38bdf8;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 14px 0 8px 0;
      transition: all 0.2s ease;
    }
    .wgt-hilbert-motor-drivetrain-calculation .test-table-collapse-btn:hover {
      background: rgba(56, 189, 248, 0.1);
      border-color: #38bdf8;
    }
    @media (max-width: 640px) {
      .wgt-hilbert-motor-drivetrain-calculation .dynamo-chart-container {
        height: 210px !important;
      }
      .wgt-hilbert-motor-drivetrain-calculation .dynamo-controls {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      .wgt-hilbert-motor-drivetrain-calculation .dynamo-tabs {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .wgt-hilbert-motor-drivetrain-calculation .dynamo-tab-btn {
        text-align: center;
        padding: 6px 4px;
        font-size: 11px;
      }
      .wgt-hilbert-motor-drivetrain-calculation .dynamo-legend {
        gap: 8px;
        font-size: 10.5px;
      }
    }

  
    /* Apple-inspired citation badge styling */
    .wgt-hilbert-motor-drivetrain-calculation .citation-ref {
      color: var(--apple-blue, #2997ff);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.88em;
      padding: 1px 5px;
      margin: 0 1px;
      border-radius: 4px;
      background: rgba(41, 151, 255, 0.08);
      border: 1px solid rgba(41, 151, 255, 0.22);
      transition: all 0.2s ease;
      display: inline-block;
      line-height: 1.25;
      vertical-align: baseline;
    }
    .wgt-hilbert-motor-drivetrain-calculation .citation-ref:hover {
      background: rgba(41, 151, 255, 0.22);
      border-color: rgba(41, 151, 255, 0.5);
      color: #5ac8fa;
      text-decoration: none;
      transform: translateY(-1px);
    }

  
</style>
