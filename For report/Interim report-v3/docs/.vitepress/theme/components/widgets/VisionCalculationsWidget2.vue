<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/gabriel-vision-calculations-1.js'

useWidgetScript([['gabriel-vision-calculations-1', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-gabriel-vision-calculations">
<div class="sim-controls-grid">
              <!-- Slider 1: Camera Height -->
              <div class="sim-control-group">
                <div class="sim-label-row">
                  <span class="sim-label">Camera Height (h)</span>
                  <span class="sim-val-badge" id="val-height">0.45 m</span>
                </div>
                <input type="range" class="sim-slider" id="slider-height" min="0.15" max="1.50" step="0.05" value="0.45" aria-label="Camera Mounting Height">
                <div class="sim-hint">
                  <span>0.15 m</span>
                  <span>Default: 0.45 m</span>
                  <span>1.50 m</span>
                </div>
              </div>

              <!-- Slider 2: Camera Tilt Angle -->
              <div class="sim-control-group">
                <div class="sim-label-row">
                  <span class="sim-label">Camera Tilt (θ)</span>
                  <span class="sim-val-badge" id="val-tilt">33.0°</span>
                </div>
                <input type="range" class="sim-slider" id="slider-tilt" min="5" max="90" step="1" value="33" aria-label="Camera Downward Tilt">
                <div class="sim-hint">
                  <span>5° (Horizon)</span>
                  <span>Default: 33°</span>
                  <span>90° (Nadir)</span>
                </div>
              </div>

              <!-- Slider 3: Target Debris Size -->
              <div class="sim-control-group">
                <div class="sim-label-row">
                  <span class="sim-label">Target Debris Size</span>
                  <span class="sim-val-badge" id="val-debris">30 mm</span>
                </div>
                <input type="range" class="sim-slider" id="slider-debris" min="10" max="100" step="1" value="30" aria-label="Target Debris Dimension">
                <div class="sim-hint">
                  <span>10 mm</span>
                  <span>Default: 30 mm</span>
                  <span>100 mm</span>
                </div>
              </div>
            </div>
  </div>
</template>

<style>

    /* ── MathJax Responsive & High-Legibility Styling ─────────────────────── */

    .wgt-gabriel-vision-calculations .math-eq-box {
      background: #0b1120;
      border: 1px solid var(--apple-border, rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      margin: 12px 0 6px 0;
      overflow-x: auto;
      overflow-y: hidden;
      max-width: 100%;
      box-sizing: border-box;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
    }

    .wgt-gabriel-vision-calculations .math-eq-box::-webkit-scrollbar {
      height: 4px;
    }

    .wgt-gabriel-vision-calculations .math-eq-box::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .wgt-gabriel-vision-calculations .plain-words-line {
      font-size: 12.5px;
      color: var(--apple-text-secondary);
      font-style: italic;
      margin-bottom: 14px;
      line-height: 1.45;
    }

    /* ── Breadcrumb Navigation ──────────────────────────────────────────── */
    .wgt-gabriel-vision-calculations .breadcrumb-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      color: var(--apple-text-tertiary);
      margin-bottom: 18px;
      flex-wrap: wrap;
    }

    .wgt-gabriel-vision-calculations .breadcrumb-bar a {
      color: var(--apple-text-secondary);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .wgt-gabriel-vision-calculations .breadcrumb-bar a:hover {
      color: var(--apple-blue);
    }

    .wgt-gabriel-vision-calculations .breadcrumb-sep {
      opacity: 0.4;
      font-size: 11px;
    }

    /* ── TL;DR Metric Pills ──────────────────────────────────────────────── */
    .wgt-gabriel-vision-calculations .metric-pill-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }

    .wgt-gabriel-vision-calculations .metric-pill {
      background: var(--apple-surface-card, #121214);
      border: 1px solid var(--apple-border);
      border-radius: 14px;
      padding: 16px 14px;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: left;
      box-shadow: var(--apple-shadow-sm);
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .wgt-gabriel-vision-calculations .metric-pill:hover {
      transform: translateY(-2px);
      border-color: rgba(41, 151, 255, 0.4);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .wgt-gabriel-vision-calculations .highlight-stat {
      color: var(--apple-green);
      font-weight: 600;
    }

    .wgt-gabriel-vision-calculations .alert-stat {
      color: var(--apple-red);
      font-weight: 600;
    }

    .wgt-gabriel-vision-calculations .amber-stat {
      color: var(--apple-amber);
      font-weight: 600;
    }

    .wgt-gabriel-vision-calculations .blue-stat {
      color: var(--apple-blue);
      font-weight: 600;
    }

    /* ── Interactive Simulator Styles ───────────────────────────────────── */
    .wgt-gabriel-vision-calculations .sim-panel {
      background: rgba(10, 15, 26, 0.7);
      border: 1px solid var(--apple-border);
      border-radius: 16px;
      padding: 20px;
      margin-top: 18px;
      margin-bottom: 18px;
      backdrop-filter: blur(12px);
    }

    .wgt-gabriel-vision-calculations .sim-controls-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 10px;
    }

    .wgt-gabriel-vision-calculations .sim-control-group {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .wgt-gabriel-vision-calculations .sim-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .wgt-gabriel-vision-calculations .sim-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--apple-text-primary);
    }

    .wgt-gabriel-vision-calculations .sim-val-badge {
      font-family: var(--font-mono, monospace);
      font-size: 12.5px;
      font-weight: 700;
      color: var(--apple-blue);
      background: rgba(41, 151, 255, 0.12);
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(41, 151, 255, 0.25);
    }

    .wgt-gabriel-vision-calculations .sim-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.12);
      outline: none;
      margin: 10px 0 6px 0;
      transition: background 0.2s ease;
    }

    .wgt-gabriel-vision-calculations .sim-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--apple-blue);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(41, 151, 255, 0.5);
      transition: transform 0.15s ease, background-color 0.15s ease;
    }

    .wgt-gabriel-vision-calculations .sim-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
      background: #47a6ff;
    }

    .wgt-gabriel-vision-calculations .sim-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border: none;
      border-radius: 50%;
      background: var(--apple-blue);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(41, 151, 255, 0.5);
    }

    .wgt-gabriel-vision-calculations .sim-hint {
      font-size: 11px;
      color: var(--apple-text-tertiary);
      display: flex;
      justify-content: space-between;
    }

    /* ── Expandable "Why?" Sections (matching yolo-comparison.html) ────────── */
    .wgt-gabriel-vision-calculations .why-details {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 13px;
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .wgt-gabriel-vision-calculations .why-details[open] {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(41, 151, 255, 0.3);
    }

    .wgt-gabriel-vision-calculations .why-details summary {
      cursor: pointer;
      font-weight: 600;
      color: var(--apple-blue);
      user-select: none;
      list-style-position: inside;
    }

    .wgt-gabriel-vision-calculations .why-details summary::-webkit-details-marker {
      color: var(--apple-blue);
    }

    .wgt-gabriel-vision-calculations .why-details p {
      margin: 8px 0 0 0;
      color: var(--apple-text-secondary);
      line-height: 1.6;
    }

    .wgt-gabriel-vision-calculations .preset-selector {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .wgt-gabriel-vision-calculations .preset-btn {
      cursor: pointer;
      padding: 5px 11px;
      border-radius: 980px;
      font-size: 11.5px;
      font-weight: 500;
      border: 1px solid var(--apple-border);
      background: rgba(255, 255, 255, 0.04);
      color: var(--apple-text-secondary);
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .wgt-gabriel-vision-calculations .preset-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--apple-text-primary);
    }

    .wgt-gabriel-vision-calculations .preset-btn.active {
      background: var(--apple-blue);
      color: #ffffff;
      border-color: var(--apple-blue);
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(41, 151, 255, 0.4);
    }

    .wgt-gabriel-vision-calculations .canvas-container {
      position: relative;
      width: 100%;
      background: radial-gradient(circle at 15% 30%, rgba(41, 151, 255, 0.06), transparent 50%), #070a12;
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
      box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.4);
    }

    .wgt-gabriel-vision-calculations #sim-canvas {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 800 / 230;
    }

    .wgt-gabriel-vision-calculations .hud-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 8px;
    }

    .wgt-gabriel-vision-calculations .hud-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      padding: 9px 11px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .wgt-gabriel-vision-calculations .hud-card-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--apple-text-tertiary);
      font-weight: 600;
      margin-bottom: 4px;
    }

    .wgt-gabriel-vision-calculations .hud-card-value {
      font-family: var(--font-mono, monospace);
      font-size: 16px;
      font-weight: 700;
      color: var(--apple-text-primary);
      line-height: 1.2;
    }

    .wgt-gabriel-vision-calculations .hud-card-sub {
      font-size: 11px;
      color: var(--apple-text-secondary);
      margin-top: 4px;
      line-height: 1.35;
    }

    .wgt-gabriel-vision-calculations .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .wgt-gabriel-vision-calculations .status-pass {
      background: rgba(48, 209, 88, 0.15);
      color: var(--apple-green);
      border: 1px solid rgba(48, 209, 88, 0.35);
    }

    .wgt-gabriel-vision-calculations .status-marginal {
      background: rgba(255, 159, 10, 0.15);
      color: var(--apple-amber);
      border: 1px solid rgba(255, 159, 10, 0.35);
    }

    .wgt-gabriel-vision-calculations .status-fail {
      background: rgba(255, 69, 58, 0.15);
      color: var(--apple-red);
      border: 1px solid rgba(255, 69, 58, 0.35);
    }

    /* ── Pipeline Steps Layout ──────────────────────────────────────────── */
    .wgt-gabriel-vision-calculations .pipeline-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin: 18px 0;
    }

    .wgt-gabriel-vision-calculations .pipeline-step-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 12px;
      padding: 16px;
      position: relative;
    }

    .wgt-gabriel-vision-calculations .step-number-badge {
      display: inline-block;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      border-radius: 50%;
      background: rgba(41, 151, 255, 0.15);
      color: var(--apple-blue);
      font-weight: 700;
      font-size: 11.5px;
      margin-bottom: 8px;
    }

    /* ── Responsive & Accessibility ─────────────────────────────────────── */
    @media (max-width: 600px) {
      .wgt-gabriel-vision-calculations .card-box {
        padding: 18px 14px;
      }

      .wgt-gabriel-vision-calculations .sim-panel {
        padding: 14px 10px;
      }

      .wgt-gabriel-vision-calculations .hud-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .wgt-gabriel-vision-calculations .hud-grid {
        grid-template-columns: 1fr;
      }
    }

    /* ── Answer Box & Section Flow ──────────────────────────────────────── */
    .wgt-gabriel-vision-calculations .answer-box {
      font-size: 15.5px;
      font-weight: 500;
      color: var(--apple-text-primary);
      line-height: 1.55;
      padding: 12px 16px;
      background: rgba(41, 151, 255, 0.06);
      border-left: 4px solid var(--apple-blue);
      border-radius: 8px;
      margin: 14px 0 10px 0;
    }

    .wgt-gabriel-vision-calculations .answer-box strong {
      color: var(--apple-text-primary);
      font-weight: 700;
    }

    .wgt-gabriel-vision-calculations .why-matters {
      font-size: 13.5px;
      color: var(--apple-text-secondary);
      line-height: 1.6;
      margin: 0 0 14px 0;
    }

    .wgt-gabriel-vision-calculations .why-matters strong {
      color: var(--apple-text-primary);
    }

    .wgt-gabriel-vision-calculations .winner-card {
      border: 1px solid var(--apple-border);
      border-radius: 12px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.02);
      position: relative;
    }

    .wgt-gabriel-vision-calculations .winner-card.emerald {
      border-left: 4px solid var(--apple-green);
      background: linear-gradient(135deg, rgba(48, 209, 88, 0.06) 0%, transparent 100%);
    }

    .wgt-gabriel-vision-calculations .winner-card.blue {
      border-left: 4px solid var(--apple-blue);
      background: linear-gradient(135deg, rgba(41, 151, 255, 0.06) 0%, transparent 100%);
    }

    .wgt-gabriel-vision-calculations .winner-card.amber {
      border-left: 4px solid var(--apple-amber);
      background: linear-gradient(135deg, rgba(255, 159, 10, 0.06) 0%, transparent 100%);
    }

    .wgt-gabriel-vision-calculations .checklist-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
    }

    .wgt-gabriel-vision-calculations .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.55;
      color: var(--apple-text-secondary);
    }

    .wgt-gabriel-vision-calculations .checklist-item>span:first-child {
      font-size: 18px;
      line-height: 1.2;
      flex-shrink: 0;
    }
  

    .wgt-gabriel-vision-calculations .pdf-export-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 22px;
      border: none;
      border-radius: 980px;
      background: linear-gradient(135deg, #2997ff 0%, #2563eb 100%);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(41, 151, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      letter-spacing: 0.01em;
    }

    .wgt-gabriel-vision-calculations .pdf-export-btn:hover {
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 10px 32px rgba(41, 151, 255, 0.55), 0 4px 12px rgba(0, 0, 0, 0.4);
      background: linear-gradient(135deg, #0a84ff 0%, #1d4ed8 100%);
    }

    .wgt-gabriel-vision-calculations .pdf-export-btn:active {
      transform: translateY(0) scale(0.98);
    }

    .wgt-gabriel-vision-calculations .pdf-export-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    @media print {

      .wgt-gabriel-vision-calculations .pdf-export-btn,
      .wgt-gabriel-vision-calculations .apple-nav,
      .wgt-gabriel-vision-calculations .apple-mobile-drawer,
      .wgt-gabriel-vision-calculations .apple-footer,
      .wgt-gabriel-vision-calculations .sim-controls-grid,
      .wgt-gabriel-vision-calculations .preset-selector {
        display: none !important;
      }

      .wgt-gabriel-vision-calculations {
        background: #fff !important;
        color: #111 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .wgt-gabriel-vision-calculations .apple-main-content {
        padding-top: 0 !important;
      }

      .wgt-gabriel-vision-calculations .why-details {
        border: 1px solid #ccc !important;
        background: #fafafa !important;
      }

      .wgt-gabriel-vision-calculations .why-details summary {
        color: #000 !important;
      }
    }
  
</style>
