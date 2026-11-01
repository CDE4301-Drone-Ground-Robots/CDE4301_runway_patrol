<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/hilbert-communications-1.js'

useWidgetScript([['hilbert-communications-1', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-hilbert-communications">
<div class="editorial-visual-full">
          <div class="editorial-card-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
              <div>
                <strong style="color: var(--apple-text-primary); font-size: 14px;">Interactive Explorer: C2 Tactical Message Flow Pipeline</strong>
                <p style="font-size: 12px; color: var(--apple-text-tertiary); margin: 2px 0 0 0;">Step through the 5-stage lifecycle from aerial YOLO detection to UGV Nav2 goal dispatch</p>
              </div>
              <div class="interactive-controls" style="display: flex; gap: 6px;">
                <button class="apple-btn-pill" onclick="prevC2Step()">← Prev</button>
                <button class="apple-btn-pill" id="c2-step-play-btn" onclick="toggleC2Play()">▶ Auto Play</button>
                <button class="apple-btn-pill" onclick="nextC2Step()">Next →</button>
              </div>
            </div>

            <!-- Stepper Indicators -->
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px;">
              <button id="step-pill-1" class="apple-btn-pill active" style="justify-content: center; width: 100%; padding: 6px 2px; font-size: 11px;" onclick="goToC2Step(1)">1. Detect</button>
              <button id="step-pill-2" class="apple-btn-pill" style="justify-content: center; width: 100%; padding: 6px 2px; font-size: 11px;" onclick="goToC2Step(2)">2. Serialize</button>
              <button id="step-pill-3" class="apple-btn-pill" style="justify-content: center; width: 100%; padding: 6px 2px; font-size: 11px;" onclick="goToC2Step(3)">3. Ingest</button>
              <button id="step-pill-4" class="apple-btn-pill" style="justify-content: center; width: 100%; padding: 6px 2px; font-size: 11px;" onclick="goToC2Step(4)">4. Transform</button>
              <button id="step-pill-5" class="apple-btn-pill" style="justify-content: center; width: 100%; padding: 6px 2px; font-size: 11px;" onclick="goToC2Step(5)">5. Dispatch</button>
            </div>

            <!-- Active Step Explanation Card -->
            <div id="c2-step-display" class="c2-step-card active">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong id="c2-step-title" style="color: #60a5fa; font-size: 13.5px;">Stage 1: Aerial UAV Target Detection &amp; Classification</strong>
                <span id="c2-step-badge" class="badge" style="background: var(--apple-blue-bg); color: var(--apple-blue);">Raspberry Pi 5 C2 Terminal</span>
              </div>
              <p id="c2-step-desc" style="font-size: 12.5px; color: var(--apple-text-secondary); line-height: 1.5; margin: 0 0 10px 0;">
                YOLOv8 deep learning model on UAV classifies an M8 runway bolt ($X = -15.0\text{ m}, Y = 5.0\text{ m}$) with $96\%$ confidence. The system constructs a JSON alert record with UTC timestamp and SHA-256 signature.
              </p>
              <div id="c2-step-code" class="json-code-block" style="max-height: 140px; overflow-y: auto;">
{
  "mission_id": "RUNWAY_INSPECT_2026_0923",
  "threat_id": "FOD_THREAT_001",
  "object": "screw",
  "coordinates": { "x": -15.0, "y": 5.0, "yaw": 0.0 },
  "confidence": 0.96,
  "timestamp_utc": "2026-09-23T14:32:00.123Z"
}
              </div>
            </div>
          </div>
        </div>
  </div>
</template>

<style>

    /* ========================================================================= */
    /* APPLE EDITORIAL SYSTEM TOKENS                                             */
    /* ========================================================================= */
    .wgt-hilbert-communications {
      --apple-bg: #000000;
      --apple-surface: rgba(255, 255, 255, 0.04);
      --apple-surface-card-hover: rgba(255, 255, 255, 0.07);
      --apple-border: rgba(255, 255, 255, 0.12);
      --apple-text-primary: #f5f5f7;
      --apple-text-secondary: #a1a1a6;
      --apple-text-tertiary: #6e6e73;
      --apple-blue: #3b82f6;
      --apple-blue-hover: #60a5fa;
      --apple-blue-bg: rgba(59, 130, 246, 0.12);
      --apple-green: #34d399;
      --apple-green-bg: rgba(16, 185, 129, 0.12);
      --apple-purple: #c084fc;
      --apple-purple-bg: rgba(168, 85, 247, 0.12);
      --apple-amber: #fbbf24;
      --apple-amber-bg: rgba(245, 158, 11, 0.12);
      --apple-red: #f87171;
      --apple-red-bg: rgba(239, 68, 68, 0.12);
    }

    .wgt-hilbert-communications {
      max-width: 100%;
      overflow-x: hidden;
    }

    .wgt-hilbert-communications {

      background-color: var(--apple-bg);
      color: var(--apple-text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Editorial Prose Layout: Plain text directly on background */
    .wgt-hilbert-communications .editorial-section {
      padding: 48px 0;
      border-bottom: 1px solid var(--apple-border);
    }
    .wgt-hilbert-communications .editorial-section:last-of-type {
      border-bottom: none;
    }

    .wgt-hilbert-communications .editorial-prose {
      max-width: 820px;
      margin: 0 auto;
      font-size: 15.5px;
      line-height: 1.72;
      color: var(--apple-text-secondary);
    }

    .wgt-hilbert-communications .editorial-prose p {
      margin: 0 0 18px 0;
    }

    .wgt-hilbert-communications .editorial-prose strong {
      color: var(--apple-text-primary);
      font-weight: 600;
    }

    .wgt-hilbert-communications .editorial-prose code {
      background: var(--apple-surface);
      color: var(--apple-text-primary);
      border: 1px solid var(--apple-border);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
      font-family: "SF Mono", Menlo, Consolas, Monaco, monospace;
    }

    .wgt-hilbert-communications .editorial-h2 {
      font-size: clamp(1.8rem, 3.2vw, 2.3rem);
      font-weight: 700;
      color: var(--apple-text-primary);
      letter-spacing: -0.02em;
      margin: 0 0 16px 0;
    }

    .wgt-hilbert-communications .editorial-h3 {
      font-size: clamp(1.3rem, 2.2vw, 1.55rem);
      font-weight: 600;
      color: var(--apple-text-primary);
      letter-spacing: -0.01em;
      margin: 36px 0 14px 0;
    }

    .wgt-hilbert-communications .editorial-h4 {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--apple-text-primary);
      margin: 24px 0 10px 0;
    }

    .wgt-hilbert-communications .editorial-lead {
      font-size: 17.5px;
      line-height: 1.6;
      color: var(--apple-text-primary);
      margin-bottom: 24px;
    }

    /* Card Containers: ONLY for Tables, Figures, Widgets */
    .wgt-hilbert-communications .editorial-visual-full {
      max-width: 1040px;
      margin: 32px auto;
    }

    .wgt-hilbert-communications .editorial-card-container {
      background: var(--apple-surface);
      border: 1px solid var(--apple-border);
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    /* Clean Apple Tables */
    .wgt-hilbert-communications .table-container {
      overflow-x: auto;
      margin: 16px 0 0 0;
    }

    .wgt-hilbert-communications .clean-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13.5px;
    }

    .wgt-hilbert-communications .clean-table th {
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--apple-border);
      color: var(--apple-text-tertiary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 14px;
      font-size: 11.5px;
    }

    .wgt-hilbert-communications .clean-table td {
      border-bottom: 1px solid var(--apple-border);
      padding: 12px 14px;
      color: var(--apple-text-secondary);
      line-height: 1.5;
    }

    .wgt-hilbert-communications .clean-table tr:last-child td {
      border-bottom: none;
    }

    /* Apple Navigation Header & Sub-Navigation */
    .wgt-hilbert-communications .apple-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--apple-border);
    }

    .wgt-hilbert-communications .apple-nav-container {
      max-width: 1120px;
      margin: 0 auto;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    /* apple-nav-links styled in styles.css */

    .wgt-hilbert-communications .apple-nav-link {
      font-size: 12.5px;
      color: var(--apple-text-secondary);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .wgt-hilbert-communications .apple-nav-link:hover, .wgt-hilbert-communications .apple-nav-link.active {
      color: var(--apple-text-primary);
    }

    .wgt-hilbert-communications .apple-subnav {
      position: sticky;
      top: 48px;
      z-index: 90;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--apple-border);
    }

    .wgt-hilbert-communications .apple-subnav-container {
      max-width: 1040px;
      margin: 0 auto;
      overflow-x: auto;
      white-space: nowrap;
      display: flex;
      gap: 16px;
      padding: 8px 20px;
      scrollbar-width: none;
    }

    .wgt-hilbert-communications .apple-subnav-container::-webkit-scrollbar {
      display: none;
    }

    .wgt-hilbert-communications .apple-subnav-item {
      font-size: 12px;
      color: var(--apple-text-secondary);
      text-decoration: none;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .wgt-hilbert-communications .apple-subnav-item:hover, .wgt-hilbert-communications .apple-subnav-item.active {
      color: var(--apple-text-primary);
      background: var(--apple-surface);
    }

    .wgt-hilbert-communications .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .wgt-hilbert-communications .math-eq-box {
      background: var(--apple-surface);
      border: 1px solid var(--apple-border);
      border-radius: 8px;
      padding: 14px 18px;
      margin: 16px 0;
      text-align: center;
      overflow-x: auto;
    }

    .wgt-hilbert-communications .citation-ref {
      color: var(--apple-blue);
      text-decoration: none;
      font-weight: 500;
    }
    .wgt-hilbert-communications .citation-ref:hover {
      text-decoration: underline;
    }

    .wgt-hilbert-communications .apple-btn-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--apple-surface);
      color: var(--apple-text-primary);
      border: 1px solid var(--apple-border);
      padding: 6px 14px;
      border-radius: 980px;
      font-size: 12.5px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .wgt-hilbert-communications .apple-btn-pill:hover {
      background: var(--apple-surface-card-hover);
      border-color: rgba(255, 255, 255, 0.25);
    }
    .wgt-hilbert-communications .apple-btn-pill.active {
      background: var(--apple-blue);
      color: #fff;
      border-color: var(--apple-blue);
    }

    /* Interactive Stepper Widget */
    .wgt-hilbert-communications .c2-step-card {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--apple-border);
      border-radius: 10px;
      padding: 16px;
      margin-top: 14px;
      transition: border-color 0.2s ease;
    }
    .wgt-hilbert-communications .c2-step-card.active {
      border-color: var(--apple-blue);
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
    }

    /* JSON Display */
    .wgt-hilbert-communications .json-code-block {
      background: #090d16;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 14px;
      font-family: "SF Mono", Consolas, Monaco, monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #93c5fd;
      overflow-x: auto;
    }


    @media (max-width: 768px) {
      .wgt-hilbert-communications .editorial-section {
        padding: 32px 0;
      }
      .wgt-hilbert-communications .editorial-card-container {
        padding: 16px 12px;
      }
      .wgt-hilbert-communications .apple-container {
        padding: 0 12px 40px 12px !important;
      }
      .wgt-hilbert-communications .clean-table {
        font-size: 11.5px;
      }
      .wgt-hilbert-communications .clean-table th, .wgt-hilbert-communications .clean-table td {
        padding: 8px 10px;
      }
    }

    /* PDF Print Optimization */
    @media print {
      .wgt-hilbert-communications .pdf-export-btn,
      .wgt-hilbert-communications .apple-nav,
      .wgt-hilbert-communications .apple-subnav,
      .wgt-hilbert-communications .apple-mobile-drawer,
      .wgt-hilbert-communications .apple-footer,
      .wgt-hilbert-communications .interactive-controls {
        display: none !important;
      }
      .wgt-hilbert-communications {
        background: #fff !important;
        color: #000 !important;
      }
      .wgt-hilbert-communications .editorial-section {
        page-break-inside: avoid;
        border-bottom: 1px solid #ddd !important;
      }
      .wgt-hilbert-communications .clean-table th, .wgt-hilbert-communications .clean-table td {
        border-color: #ddd !important;
        color: #000 !important;
      }
    }
  
</style>
