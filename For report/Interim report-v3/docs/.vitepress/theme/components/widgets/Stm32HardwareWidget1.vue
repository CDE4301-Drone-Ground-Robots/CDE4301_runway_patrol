<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/gabriel-stm32-hardware-1.js'

useWidgetScript([['gabriel-stm32-hardware-1', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-gabriel-stm32-hardware">
<div class="table-toolbar">
            <input type="text" id="interface-search" class="table-search-input" placeholder="Search device, pin, or interface..." aria-label="Filter interface table">

            <div class="table-filter-pills" role="tablist" aria-label="Filter by Subsystem">
              <button type="button" class="table-filter-pill active" data-filter="all">All (11)</button>
              <button type="button" class="table-filter-pill" data-filter="sensor">Sensor (4)</button>
              <button type="button" class="table-filter-pill" data-filter="power">Power (1)</button>
              <button type="button" class="table-filter-pill" data-filter="motor">Motor (2)</button>
              <button type="button" class="table-filter-pill" data-filter="visual">Visual (1)</button>
              <button type="button" class="table-filter-pill" data-filter="actuator">Actuator (1)</button>
              <button type="button" class="table-filter-pill" data-filter="input">User Input (2)</button>
            </div>
          </div>
  </div>
</template>

<style>

    /* ── Local Design Tokens & Scoped Styles ───────────────────────────────── */
    .wgt-gabriel-stm32-hardware .highlight-stat {
      color: var(--apple-green);
      font-weight: 600;
    }

    .wgt-gabriel-stm32-hardware .blue-stat {
      color: var(--apple-blue);
      font-weight: 600;
    }

    .wgt-gabriel-stm32-hardware .amber-stat {
      color: var(--apple-amber);
      font-weight: 600;
    }

    .wgt-gabriel-stm32-hardware .purple-stat {
      color: var(--apple-purple);
      font-weight: 600;
    }

    /* ── Design Cascade (System At a Glance) ───────────────────────────────── */
    .wgt-gabriel-stm32-hardware .metric-pill-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }

    .wgt-gabriel-stm32-hardware .metric-pill {
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

    .wgt-gabriel-stm32-hardware .metric-pill:hover {
      transform: translateY(-2px);
      border-color: rgba(41, 151, 255, 0.4);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    /* ── Section Headings & Intros ─────────────────────────────────────────── */
    .wgt-gabriel-stm32-hardware .section-intro-line {
      font-size: 15.5px;
      color: var(--apple-text-primary);
      font-weight: 500;
      line-height: 1.6;
      margin: 0 0 18px 0;
    }

    /* ── Three Cards Beneath Diagram ───────────────────────────────────────── */
    .wgt-gabriel-stm32-hardware .cards-three-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 18px;
    }

    @media (max-width: 820px) {
      .wgt-gabriel-stm32-hardware .cards-three-grid {
        grid-template-columns: 1fr;
      }
    }

    .wgt-gabriel-stm32-hardware .why-ecu-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
    }

    .wgt-gabriel-stm32-hardware .why-ecu-card:hover {
      border-color: rgba(41, 151, 255, 0.35);
      background: rgba(255, 255, 255, 0.035);
    }

    .wgt-gabriel-stm32-hardware .why-ecu-card h4 {
      font-size: 16px;
      font-weight: 600;
      color: var(--apple-text-primary);
      margin: 0 0 8px 0;
    }

    .wgt-gabriel-stm32-hardware .why-ecu-card p {
      font-size: 13px;
      color: var(--apple-text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    /* ── Two-Way Page Navigation Buttons ─────────────────────────────────── */
    .wgt-gabriel-stm32-hardware .nav-prev-page-btn:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      border-color: rgba(41, 151, 255, 0.4) !important;
      transform: translateY(-2px);
    }

    .wgt-gabriel-stm32-hardware .nav-next-page-btn:hover {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(41, 151, 255, 0.15) 100%) !important;
      border-color: rgba(168, 85, 247, 0.6) !important;
      transform: translateY(-2px);
    }

    /* ── Compute Utilisation Bar ───────────────────────────────────────────── */
    .wgt-gabriel-stm32-hardware .util-container {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--apple-border);
      border-radius: 14px;
      padding: 18px 20px;
      margin: 16px 0 20px 0;
    }

    .wgt-gabriel-stm32-hardware .util-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 12px;
    }

    .wgt-gabriel-stm32-hardware .util-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--apple-text-primary);
    }

    .wgt-gabriel-stm32-hardware .util-bar-track {
      position: relative;
      width: 100%;
      height: 28px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      border: 1px solid var(--apple-border);
    }

    .wgt-gabriel-stm32-hardware .util-segment {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      transition: width 0.3s ease;
      color: #ffffff;
      padding: 0 4px;
      overflow: hidden;
    }

    .wgt-gabriel-stm32-hardware .seg-base {
      background: linear-gradient(90deg, #2563eb, #3b82f6);
    }

    .wgt-gabriel-stm32-hardware .seg-margin {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
      color: #111;
    }

    .wgt-gabriel-stm32-hardware .seg-headroom {
      background: linear-gradient(90deg, rgba(48, 209, 88, 0.18), rgba(48, 209, 88, 0.28));
      color: var(--apple-green);
      font-weight: 600;
      justify-content: flex-start;
      padding-left: 14px;
    }

    .wgt-gabriel-stm32-hardware .util-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: var(--apple-text-secondary);
    }

    .wgt-gabriel-stm32-hardware .util-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .wgt-gabriel-stm32-hardware .legend-swatch {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }

    /* ── Candidate Board Table Highlights ──────────────────────────────────── */
    .wgt-gabriel-stm32-hardware .row-muted {
      opacity: 0.6;
      background: rgba(255, 255, 255, 0.01);
    }

    .wgt-gabriel-stm32-hardware .row-backup {
      background: rgba(255, 159, 10, 0.04);
    }

    .wgt-gabriel-stm32-hardware .row-selected {
      background: rgba(48, 209, 88, 0.1) !important;
      border-left: 4px solid var(--apple-green) !important;
    }

    /* ── Subsystem Group Tags in Interface Table ───────────────────────────── */
    .wgt-gabriel-stm32-hardware .group-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 980px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .wgt-gabriel-stm32-hardware .group-tag.tag-sensor {
      background: rgba(41, 151, 255, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(41, 151, 255, 0.35);
    }

    .wgt-gabriel-stm32-hardware .group-tag.tag-power {
      background: rgba(255, 159, 10, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(255, 159, 10, 0.35);
    }

    .wgt-gabriel-stm32-hardware .group-tag.tag-motor {
      background: rgba(48, 209, 88, 0.15);
      color: #4ade80;
      border: 1px solid rgba(48, 209, 88, 0.35);
    }

    .wgt-gabriel-stm32-hardware .group-tag.tag-visual {
      background: rgba(191, 90, 242, 0.15);
      color: #c084fc;
      border: 1px solid rgba(191, 90, 242, 0.35);
    }

    .wgt-gabriel-stm32-hardware .group-tag.tag-actuator {
      background: rgba(6, 182, 212, 0.15);
      color: #22d3ee;
      border: 1px solid rgba(6, 182, 212, 0.35);
    }

    .wgt-gabriel-stm32-hardware .group-tag.tag-input {
      background: rgba(249, 115, 22, 0.15);
      color: #fb923c;
      border: 1px solid rgba(249, 115, 22, 0.35);
    }

    /* ── Interface Search & Filter Bar ─────────────────────────────────────── */
    .wgt-gabriel-stm32-hardware .table-toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin: 16px 0 12px 0;
    }

    .wgt-gabriel-stm32-hardware .table-search-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--apple-border);
      border-radius: 980px;
      padding: 8px 16px;
      font-size: 13px;
      color: var(--apple-text-primary);
      width: 100%;
      max-width: 320px;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }

    .wgt-gabriel-stm32-hardware .table-search-input:focus {
      border-color: var(--apple-blue);
      box-shadow: 0 0 0 3px rgba(41, 151, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
    }

    .wgt-gabriel-stm32-hardware .table-filter-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .wgt-gabriel-stm32-hardware .table-filter-pill {
      cursor: pointer;
      font-size: 11.5px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 980px;
      border: 1px solid var(--apple-border);
      background: rgba(255, 255, 255, 0.03);
      color: var(--apple-text-secondary);
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .wgt-gabriel-stm32-hardware .table-filter-pill:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--apple-text-primary);
    }

    .wgt-gabriel-stm32-hardware .table-filter-pill.active {
      background: var(--apple-blue);
      border-color: var(--apple-blue);
      color: #ffffff;
      font-weight: 600;
    }

    /* ── Image & Diagram Boxes ─────────────────────────────────────────────── */
    .wgt-gabriel-stm32-hardware .image-preview-frame {
      position: relative;
      background: rgba(12, 12, 16, 0.85);
      border: 1px solid var(--apple-border);
      border-radius: 14px;
      overflow: hidden;
      margin: 16px 0 10px 0;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .wgt-gabriel-stm32-hardware .image-preview-frame:hover {
      border-color: rgba(41, 151, 255, 0.4);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .wgt-gabriel-stm32-hardware .image-preview-frame img {
      width: 100%;
      height: auto;
      display: block;
      transition: transform 0.25s ease;
    }

    .wgt-gabriel-stm32-hardware .image-preview-frame:hover img {
      transform: scale(1.01);
    }

    .wgt-gabriel-stm32-hardware .image-zoom-overlay {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.65);
      color: #ffffff;
      padding: 5px 10px;
      border-radius: 980px;
      font-size: 11.5px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      pointer-events: none;
    }

    .wgt-gabriel-stm32-hardware .figure-caption {
      font-size: 12px;
      color: var(--apple-text-secondary);
      text-align: center;
      margin-top: 6px;
      line-height: 1.4;
    }

    /* ── Lightbox Dialog ───────────────────────────────────────────────────── */
    .wgt-gabriel-stm32-hardware dialog#image-lightbox-dialog {
      border: none;
      border-radius: 14px;
      padding: 0;
      background: var(--apple-surface-card, #1c1c1e);
      color: var(--apple-text-primary);
      max-width: 92vw;
      max-height: 90vh;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    }

    .wgt-gabriel-stm32-hardware dialog#image-lightbox-dialog::backdrop {
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
    }

    .wgt-gabriel-stm32-hardware .lightbox-wrapper {
      position: relative;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--apple-surface-card, #1c1c1e);
    }

    .wgt-gabriel-stm32-hardware .lightbox-close-btn {
      position: absolute;
      top: 12px;
      right: 14px;
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

    .wgt-gabriel-stm32-hardware .lightbox-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.08);
    }

    .wgt-gabriel-stm32-hardware #lightbox-img {
      max-width: 100%;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 8px;
    }

    .wgt-gabriel-stm32-hardware #lightbox-caption {
      margin-top: 14px;
      font-size: 13px;
      color: var(--apple-text-secondary);
      text-align: center;
      max-width: 700px;
      line-height: 1.5;
    }

    /* ── Inline SVG Diagram Containers ─────────────────────────────────────── */
    .wgt-gabriel-stm32-hardware .svg-container {
      width: 100%;
      overflow-x: auto;
      display: flex;
      justify-content: center;
      background: rgba(12, 12, 16, 0.6);
      border: 1px solid var(--apple-border);
      border-radius: 14px;
      padding: 16px;
      margin: 14px 0;
      scrollbar-width: thin;
    }

    /* ── Software Placeholder ──────────────────────────────────────────────── */
    .wgt-gabriel-stm32-hardware .software-section-placeholder {
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin-top: 32px;
      background: rgba(255, 255, 255, 0.015);
    }
  

    .wgt-gabriel-stm32-hardware .pdf-export-btn {
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

    .wgt-gabriel-stm32-hardware .pdf-export-btn:hover {
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 10px 32px rgba(41, 151, 255, 0.55), 0 4px 12px rgba(0, 0, 0, 0.4);
      background: linear-gradient(135deg, #0a84ff 0%, #1d4ed8 100%);
    }

    .wgt-gabriel-stm32-hardware .pdf-export-btn:active {
      transform: translateY(0) scale(0.98);
    }

    .wgt-gabriel-stm32-hardware .pdf-export-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    @media print {

      .wgt-gabriel-stm32-hardware .pdf-export-btn,
      .wgt-gabriel-stm32-hardware .apple-nav,
      .wgt-gabriel-stm32-hardware .apple-mobile-drawer,
      .wgt-gabriel-stm32-hardware .apple-footer {
        display: none !important;
      }

      .wgt-gabriel-stm32-hardware {
        background: #fff !important;
        color: #111 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .wgt-gabriel-stm32-hardware .apple-main-content {
        padding-top: 0 !important;
      }
    }
  
</style>
