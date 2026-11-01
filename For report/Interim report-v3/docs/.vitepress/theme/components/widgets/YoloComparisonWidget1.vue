<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/gabriel-yolo-comparison-1.js'

useWidgetScript([['gabriel-yolo-comparison-1', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-gabriel-yolo-comparison">
<div class="chart-box" style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
              <div>
                <strong id="metric-chart-title" style="font-size: 13.5px; color: var(--apple-text-primary);">A40
                  Inference Latency vs. 33.3 ms Real-Time Budget</strong>
                <div style="font-size: 12px; color: var(--apple-text-tertiary); margin-top: 2px;">Select metric to swap
                  bar comparison:</div>
              </div>
              <div class="pill-group" role="group" aria-label="Metric Selection">
                <button type="button" class="pill-btn metric-btn active" data-metric="latency" aria-pressed="true">Latency</button>
                <button type="button" class="pill-btn metric-btn" data-metric="map5095" aria-pressed="false">mAP@50-95</button>
                <button type="button" class="pill-btn metric-btn" data-metric="precision" aria-pressed="false">Precision</button>
                <button type="button" class="pill-btn metric-btn" data-metric="recall" aria-pressed="false">Recall</button>
              </div>
            </div>

            <!-- Chart Bars -->
            <div id="metric-bars-container" style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
              <!-- YOLO11-S -->
              <div class="bar-row" style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 130px; font-size: 13px; font-weight: 600; color: var(--apple-text-primary); text-align: right; flex-shrink: 0;">
                  YOLO11-S <span style="font-size: 11px; font-weight: 400; color: var(--apple-text-tertiary);">(9.4M)</span>
                </div>
                <div class="bar-track" style="flex: 1; background: rgba(255,255,255,0.06); height: 24px; border-radius: 6px; position: relative; overflow: hidden;">
                  <div id="bar-yolo11" class="bar-fill" style="width: 15.6%; height: 100%; background: var(--apple-blue); border-radius: 6px; transition: width 0.4s ease, background 0.3s ease;">
                  </div>
                </div>
                <div id="val-yolo11" style="width: 80px; font-size: 13px; font-weight: 700; font-family: var(--font-mono); color: var(--apple-blue); flex-shrink: 0;">
                  5.2 ms
                </div>
              </div>

              <!-- YOLOv8-S -->
              <div class="bar-row" style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 130px; font-size: 13px; font-weight: 600; color: var(--apple-text-primary); text-align: right; flex-shrink: 0;">
                  YOLOv8-S <span style="font-size: 11px; font-weight: 400; color: var(--apple-text-tertiary);">(11.1M)</span>
                </div>
                <div class="bar-track" style="flex: 1; background: rgba(255,255,255,0.06); height: 24px; border-radius: 6px; position: relative; overflow: hidden;">
                  <div id="bar-yolov8" class="bar-fill" style="width: 13.5%; height: 100%; background: var(--apple-green); border-radius: 6px; transition: width 0.4s ease, background 0.3s ease;">
                  </div>
                </div>
                <div id="val-yolov8" style="width: 80px; font-size: 13px; font-weight: 700; font-family: var(--font-mono); color: var(--apple-green); flex-shrink: 0;">
                  4.5 ms
                </div>
              </div>

              <!-- RT-DETR-L -->
              <div class="bar-row" style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 130px; font-size: 13px; font-weight: 600; color: var(--apple-text-primary); text-align: right; flex-shrink: 0;">
                  RT-DETR-L <span style="font-size: 11px; font-weight: 400; color: var(--apple-text-tertiary);">(32.8M)</span>
                </div>
                <div class="bar-track" style="flex: 1; background: rgba(255,255,255,0.06); height: 24px; border-radius: 6px; position: relative; overflow: hidden;">
                  <div id="bar-rtdetr" class="bar-fill" style="width: 72.7%; height: 100%; background: var(--apple-red); border-radius: 6px; transition: width 0.4s ease, background 0.3s ease;">
                  </div>
                </div>
                <div id="val-rtdetr" style="width: 80px; font-size: 13px; font-weight: 700; font-family: var(--font-mono); color: var(--apple-red); flex-shrink: 0;">
                  24.2 ms
                </div>
              </div>
            </div>

            <!-- Axis scale -->
            <div id="metric-axis-scale" style="display: flex; margin-left: 142px; margin-right: 92px; justify-content: space-between; font-size: 10px; color: var(--apple-text-tertiary); padding-top: 6px; border-top: 1px dashed var(--apple-border); margin-top: 8px;">
              <span>0 ms</span>
              <span>8.3 ms</span>
              <span>16.7 ms</span>
              <span>25.0 ms</span>
              <span>33.3 ms (Budget)</span>
            </div>

            <div id="metric-caption" style="font-size: 11.5px; color: var(--apple-text-tertiary); text-align: center; margin-top: 10px;">
              YOLOv8-S (4.5 ms) and YOLO11-S (5.2 ms) execute ~5x faster than RT-DETR-L (24.2 ms), comfortably within
              the 33.3 ms real-time edge budget.
            </div>
          </div>
  </div>
</template>

<style>

    /* ── High-Impact Dashboard Styling ─────────────────────────────────────── */
    .wgt-gabriel-yolo-comparison .metric-pill-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }

    .wgt-gabriel-yolo-comparison .metric-pill {
      background: var(--apple-surface-card);
      border: 1px solid var(--apple-border);
      border-radius: 14px;
      padding: 16px 14px;
      text-align: center;
      box-shadow: var(--apple-shadow-sm);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .wgt-gabriel-yolo-comparison .metric-pill:hover {
      transform: translateY(-2px);
      border-color: rgba(41, 151, 255, 0.4);
    }

    .wgt-gabriel-yolo-comparison .metric-pill .value {
      font-size: 26px;
      font-weight: 700;
      font-family: var(--font-mono);
      line-height: 1.1;
      margin-bottom: 6px;
    }

    .wgt-gabriel-yolo-comparison .metric-pill .label {
      font-size: 11.5px;
      color: var(--apple-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .wgt-gabriel-yolo-comparison .metric-pill .sublabel {
      font-size: 11px;
      color: var(--apple-text-tertiary);
      margin-top: 4px;
    }

    .wgt-gabriel-yolo-comparison .chart-box {
      background: rgba(12, 12, 16, 0.85);
      border: 1px solid var(--apple-border);
      border-radius: 14px;
      padding: 20px;
      margin: 18px 0;
    }

    .wgt-gabriel-yolo-comparison .svg-container {
      width: 100%;
      overflow-x: auto;
      display: flex;
      justify-content: center;
    }

    .wgt-gabriel-yolo-comparison .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
      gap: 16px;
      margin: 16px 0;
    }

    .wgt-gabriel-yolo-comparison .winner-card {
      border: 1px solid var(--apple-border);
      border-radius: 12px;
      padding: 18px;
      background: rgba(255, 255, 255, 0.02);
      position: relative;
    }

    .wgt-gabriel-yolo-comparison .winner-card.emerald {
      border-left: 4px solid var(--apple-green);
      background: linear-gradient(135deg, rgba(48, 209, 88, 0.05) 0%, transparent 100%);
    }

    .wgt-gabriel-yolo-comparison .winner-card.blue {
      border-left: 4px solid var(--apple-blue);
      background: linear-gradient(135deg, rgba(41, 151, 255, 0.05) 0%, transparent 100%);
    }

    @media (max-width: 600px) {
      .wgt-gabriel-yolo-comparison .card-box {
        padding: 20px 14px;
      }
    }

    .wgt-gabriel-yolo-comparison .checklist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
      margin-top: 14px;
    }

    .wgt-gabriel-yolo-comparison .checklist-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      font-size: 13px;
    }

    /* ── Frame Strip Visualizer & Stat Cards ─────────────────────────────────── */
    .wgt-gabriel-yolo-comparison .frame-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 14px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      justify-content: center;
      align-items: center;
    }

    .wgt-gabriel-yolo-comparison .frame-square {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      transition: background-color 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .wgt-gabriel-yolo-comparison .frame-square:hover {
      transform: scale(1.25);
      z-index: 2;
    }

    @media (max-width: 480px) {
      .wgt-gabriel-yolo-comparison .frame-square {
        width: 12px;
        height: 12px;
        border-radius: 3px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .wgt-gabriel-yolo-comparison .frame-square {
        transition: none !important;
      }
    }

    .wgt-gabriel-yolo-comparison .leak-stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 16px;
      margin-bottom: 20px;
    }

    .wgt-gabriel-yolo-comparison .leak-stat-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 12px;
      padding: 16px 14px;
      text-align: center;
    }

    /* ── Interactive Button Groups ─────────────────────────────────────────── */
    .wgt-gabriel-yolo-comparison .pill-group {
      display: inline-flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .wgt-gabriel-yolo-comparison .pill-btn {
      cursor: pointer;
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--apple-border);
      background: rgba(255, 255, 255, 0.05);
      color: var(--apple-text-secondary);
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .wgt-gabriel-yolo-comparison .pill-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--apple-text-primary);
    }

    .wgt-gabriel-yolo-comparison .pill-btn[aria-pressed="true"] {
      background: var(--apple-blue);
      color: #ffffff;
      border-color: var(--apple-blue);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(41, 151, 255, 0.35);
    }

    /* Keyboard focus accessibility */

    /* ── Tooltips (Accessible on hover and focus) ───────────────────────────── */
    .wgt-gabriel-yolo-comparison .tooltip-term {
      border-bottom: 1px dotted var(--apple-text-secondary);
      cursor: help;
      position: relative;
      display: inline-block;
      outline: none;
    }

    .wgt-gabriel-yolo-comparison .tooltip-term .tooltip-text {
      visibility: hidden;
      opacity: 0;
      width: 230px;
      background-color: #1a1a20;
      color: #f5f5f7;
      text-align: left;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 8px;
      padding: 8px 11px;
      font-size: 11.5px;
      font-weight: 400;
      line-height: 1.45;
      position: absolute;
      z-index: 1000;
      bottom: 125%;
      left: 50%;
      transform: translateX(-50%);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      white-space: normal;
    }

    .wgt-gabriel-yolo-comparison .tooltip-term:hover .tooltip-text,
    .wgt-gabriel-yolo-comparison .tooltip-term:focus .tooltip-text,
    .wgt-gabriel-yolo-comparison .tooltip-term:focus-within .tooltip-text {
      visibility: visible;
      opacity: 1;
      transform: translateX(-50%) translateY(-2px);
    }

    /* ── Expandable "Why?" Sections ────────────────────────────────────────── */
    .wgt-gabriel-yolo-comparison .why-details {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 13px;
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .wgt-gabriel-yolo-comparison .why-details[open] {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(41, 151, 255, 0.3);
    }

    .wgt-gabriel-yolo-comparison .why-details summary {
      cursor: pointer;
      font-weight: 600;
      color: var(--apple-blue);
      user-select: none;
      list-style-position: inside;
    }

    .wgt-gabriel-yolo-comparison .why-details summary::-webkit-details-marker {
      color: var(--apple-blue);
    }

    .wgt-gabriel-yolo-comparison .why-details p {
      margin: 8px 0 0 0;
      color: var(--apple-text-secondary);
      line-height: 1.6;
    }

    /* ── Stepper Component ─────────────────────────────────────────────────── */
    .wgt-gabriel-yolo-comparison .stepper-dots {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .wgt-gabriel-yolo-comparison .step-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      transition: all 0.25s ease;
    }

    .wgt-gabriel-yolo-comparison .step-dot.active {
      background: var(--apple-blue);
      transform: scale(1.3);
    }

    /* ── Lightbox Dialog ───────────────────────────────────────────────────── */
    .wgt-gabriel-yolo-comparison dialog#image-lightbox-dialog {
      border: none;
      border-radius: 12px;
      padding: 0;
      background: var(--apple-surface-card, #1c1c1e);
      color: var(--apple-text-primary);
      max-width: 90vw;
      max-height: 90vh;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
      overflow: hidden;
    }

    .wgt-gabriel-yolo-comparison dialog#image-lightbox-dialog::backdrop {
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
    }

    .wgt-gabriel-yolo-comparison .lightbox-wrapper {
      position: relative;
      padding: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--apple-surface-card, #1c1c1e);
    }

    .wgt-gabriel-yolo-comparison .lightbox-close-btn {
      position: absolute;
      top: 10px;
      right: 12px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--apple-text-primary);
      border: 1px solid var(--apple-border);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 10;
    }

    .wgt-gabriel-yolo-comparison .lightbox-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.08);
    }

    .wgt-gabriel-yolo-comparison .lightbox-close-btn:focus-visible {
      outline: 2px solid var(--apple-blue);
    }

    .wgt-gabriel-yolo-comparison #lightbox-img {
      max-width: 100%;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 6px;
    }

    .wgt-gabriel-yolo-comparison #lightbox-caption {
      margin-top: 12px;
      font-size: 13px;
      color: var(--apple-text-secondary);
      text-align: center;
      max-width: 650px;
      line-height: 1.4;
    }

    /* ── Reduced Motion Preference ─────────────────────────────────────────── */
    @media (prefers-reduced-motion: reduce) {

      .wgt-gabriel-yolo-comparison .bar-fill,
      .wgt-gabriel-yolo-comparison .metric-pill,
      .wgt-gabriel-yolo-comparison .pill-btn,
      .wgt-gabriel-yolo-comparison .why-details {
        transition: none !important;
        animation: none !important;
      }
    }

    .wgt-gabriel-yolo-comparison .highlight-stat {
      color: var(--apple-green);
      font-weight: 600;
    }

    .wgt-gabriel-yolo-comparison .alert-stat {
      color: var(--apple-red);
      font-weight: 600;
    }

    .wgt-gabriel-yolo-comparison .amber-stat {
      color: var(--apple-amber);
      font-weight: 600;
    }

    .wgt-gabriel-yolo-comparison .blue-stat {
      color: var(--apple-blue);
      font-weight: 600;
    }
  

    .wgt-gabriel-yolo-comparison .pdf-export-btn {
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

    .wgt-gabriel-yolo-comparison .pdf-export-btn:hover {
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 10px 32px rgba(41, 151, 255, 0.55), 0 4px 12px rgba(0, 0, 0, 0.4);
      background: linear-gradient(135deg, #0a84ff 0%, #1d4ed8 100%);
    }

    .wgt-gabriel-yolo-comparison .pdf-export-btn:active {
      transform: translateY(0) scale(0.98);
    }

    .wgt-gabriel-yolo-comparison .pdf-export-btn:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    .wgt-gabriel-yolo-comparison .pdf-export-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    @media print {

      .wgt-gabriel-yolo-comparison .pdf-export-btn,
      .wgt-gabriel-yolo-comparison .apple-nav,
      .wgt-gabriel-yolo-comparison .apple-mobile-drawer,
      .wgt-gabriel-yolo-comparison .apple-footer,
      .wgt-gabriel-yolo-comparison .pill-group,
      .wgt-gabriel-yolo-comparison .stepper-dots,
      .wgt-gabriel-yolo-comparison #step-prev-btn,
      .wgt-gabriel-yolo-comparison #step-next-btn {
        display: none !important;
      }

      .wgt-gabriel-yolo-comparison {
        background: #fff !important;
        color: #111 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .wgt-gabriel-yolo-comparison .apple-main-content {
        padding-top: 0 !important;
      }

      .wgt-gabriel-yolo-comparison .why-details {
        border: 1px solid #ccc !important;
        background: #fafafa !important;
      }

      .wgt-gabriel-yolo-comparison .why-details summary {
        color: #000 !important;
      }
    }
  
</style>
