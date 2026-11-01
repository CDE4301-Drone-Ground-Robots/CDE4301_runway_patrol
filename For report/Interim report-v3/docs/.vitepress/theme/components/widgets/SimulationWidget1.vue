<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/hilbert-simulation-1.js'

useWidgetScript([['hilbert-simulation-1', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-hilbert-simulation">
<div style="position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #0b1120; border: 1px solid var(--apple-border); box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
            <!-- Toolbar -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--apple-border); flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                <strong style="font-size: 13px; color: var(--apple-text-primary);">Interactive AgileX Scout 2.0 3D Proxy Model</strong>
                <span class="badge" style="background: var(--apple-blue-bg); color: var(--apple-blue); font-size: 10.5px;">scout_v2.glb (18.1 MB)</span>
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="bt-toolbar-btn active" id="btn-cam-iso" onclick="setScoutCam('iso')">Isometric</button>
                <button type="button" class="bt-toolbar-btn" id="btn-cam-front" onclick="setScoutCam('front')">Front</button>
                <button type="button" class="bt-toolbar-btn" id="btn-cam-side" onclick="setScoutCam('side')">Side</button>
                <button type="button" class="bt-toolbar-btn" id="btn-cam-top" onclick="setScoutCam('top')">Top</button>
                <button type="button" class="bt-toolbar-btn" id="btn-cam-axes" onclick="toggleScoutAxes()">Axes (TF)</button>
                <button type="button" class="bt-toolbar-btn" onclick="resetScoutCam()">Reset</button>
              </div>
            </div>

            <!-- Canvas Container with Loading Overlay -->
            <div id="scout-canvas-container" style="position: relative; width: 100%; height: 480px; outline: none;">
              <div id="scout-loading-overlay" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(11, 17, 32, 0.92); z-index: 10;">
                <div style="width: 44px; height: 44px; border: 3px solid rgba(59, 130, 246, 0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>
                <p id="scout-loading-text" style="font-size: 13.5px; color: #94a3b8; margin: 0; font-family: monospace;">Loading Scout 2.0 model (0%)...</p>
              </div>
            </div>

            <!-- Sub-caption & Controls Guide -->
            <div style="padding: 10px 16px; background: rgba(0,0,0,0.3); border-top: 1px solid var(--apple-border); font-size: 12px; color: var(--apple-text-tertiary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <em>Left Click + Drag: Rotate • Right Click + Drag: Pan • Scroll: Zoom</em>
              </div>
              <div>
                <span style="color: #fbbf24;">Note: Interactive visual model reference (not a live Gazebo simulation).</span>
              </div>
            </div>
          </div>
  </div>
</template>

<style>

    /* ========================================================================= */
    /* APPLE EDITORIAL SYSTEM TOKENS                                             */
    /* ========================================================================= */
    .wgt-hilbert-simulation {
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

    .wgt-hilbert-simulation {
      background-color: var(--apple-bg);
      color: var(--apple-text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Editorial Prose Layout: Plain text directly on background */
    .wgt-hilbert-simulation .editorial-section {
      padding: 48px 0;
      border-bottom: 1px solid var(--apple-border);
    }
    .wgt-hilbert-simulation .editorial-section:last-of-type {
      border-bottom: none;
    }

    .wgt-hilbert-simulation .editorial-prose {
      max-width: 820px;
      margin: 0 auto;
      font-size: 15.5px;
      line-height: 1.72;
      color: var(--apple-text-secondary);
    }

    .wgt-hilbert-simulation .editorial-prose p {
      margin: 0 0 18px 0;
    }

    .wgt-hilbert-simulation .editorial-prose strong {
      color: var(--apple-text-primary);
      font-weight: 600;
    }

    .wgt-hilbert-simulation .editorial-prose code {
      background: var(--apple-surface);
      color: var(--apple-text-primary);
      border: 1px solid var(--apple-border);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
      font-family: "SF Mono", Menlo, Consolas, Monaco, monospace;
    }

    .wgt-hilbert-simulation .editorial-h2 {
      font-size: clamp(1.8rem, 3.2vw, 2.3rem);
      font-weight: 700;
      color: var(--apple-text-primary);
      letter-spacing: -0.02em;
      margin: 0 0 16px 0;
    }

    .wgt-hilbert-simulation .editorial-h3 {
      font-size: clamp(1.3rem, 2.2vw, 1.55rem);
      font-weight: 600;
      color: var(--apple-text-primary);
      letter-spacing: -0.01em;
      margin: 36px 0 14px 0;
    }

    .wgt-hilbert-simulation .editorial-h4 {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--apple-text-primary);
      margin: 26px 0 10px 0;
    }

    .wgt-hilbert-simulation .editorial-lead {
      font-size: 17px;
      line-height: 1.68;
      color: var(--apple-text-primary);
      margin-bottom: 22px;
      font-weight: 400;
    }

    /* Full-width container for wide figures, tables, and 3D viewer */
    .wgt-hilbert-simulation .editorial-visual-full {
      max-width: 1040px;
      margin: 32px auto;
    }

    .wgt-hilbert-simulation .editorial-card-container {
      background: var(--apple-surface);
      border: 1px solid var(--apple-border);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }

    /* Clean Engineering Tables */
    .wgt-hilbert-simulation .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 16px 0;
    }

    .wgt-hilbert-simulation .clean-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }

    .wgt-hilbert-simulation .clean-table th {
      padding: 10px 14px;
      font-weight: 600;
      color: var(--apple-text-primary);
      border-bottom: 1px solid var(--apple-border);
      background: rgba(255, 255, 255, 0.02);
      white-space: nowrap;
    }

    .wgt-hilbert-simulation .clean-table td {
      padding: 11px 14px;
      color: var(--apple-text-secondary);
      border-bottom: 1px solid var(--apple-border);
      vertical-align: top;
      line-height: 1.5;
    }

    .wgt-hilbert-simulation .clean-table tr:last-child td {
      border-bottom: none;
    }

    .wgt-hilbert-simulation .clean-table code {
      white-space: nowrap;
    }

    /* Math Formulas */
    .wgt-hilbert-simulation .math-eq-box {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid var(--apple-border);
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      margin: 16px 0;
      overflow-x: auto;
    }

    .wgt-hilbert-simulation .math-eq-hero {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--apple-border);
      border-radius: 8px;
      padding: 16px 20px;
      text-align: center;
      font-size: 15px;
      margin: 16px 0;
      overflow-x: auto;
    }

    /* Citation Badges */
    .wgt-hilbert-simulation .citation-ref {
      color: var(--apple-blue);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.88em;
      padding: 1px 5px;
      margin: 0 1px;
      border-radius: 4px;
      background: var(--apple-blue-bg);
      border: 1px solid rgba(59, 130, 246, 0.22);
      transition: all 0.2s ease;
      display: inline-block;
      line-height: 1.25;
      vertical-align: baseline;
    }
    .wgt-hilbert-simulation .citation-ref:hover {
      background: rgba(59, 130, 246, 0.25);
      color: var(--apple-blue-hover);
      text-decoration: none;
    }

    /* Toolbar buttons for 3D viewer & widgets */
    .wgt-hilbert-simulation .bt-toolbar-btn {
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
    .wgt-hilbert-simulation .bt-toolbar-btn:hover {
      background: var(--apple-surface-card-hover);
      color: var(--apple-text-primary);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .wgt-hilbert-simulation .bt-toolbar-btn.active {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border-color: #3b82f6;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .wgt-hilbert-simulation .editorial-section {
        padding: 32px 0;
      }
      .wgt-hilbert-simulation .clean-table {
        font-size: 12px;
      }
      .wgt-hilbert-simulation .clean-table th, .wgt-hilbert-simulation .clean-table td {
        padding: 8px 10px;
      }
      .wgt-hilbert-simulation #scout-canvas-container {
        height: 340px !important;
      }
    }
  

    .wgt-hilbert-simulation .pdf-export-btn {
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
      box-shadow: 0 6px 24px rgba(41, 151, 255, 0.4), 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      letter-spacing: 0.01em;
    }
    .wgt-hilbert-simulation .pdf-export-btn:hover {
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 10px 32px rgba(41, 151, 255, 0.55), 0 4px 12px rgba(0,0,0,0.4);
      background: linear-gradient(135deg, #0a84ff 0%, #1d4ed8 100%);
    }
    .wgt-hilbert-simulation .pdf-export-btn:active {
      transform: translateY(0) scale(0.98);
    }
    .wgt-hilbert-simulation .pdf-export-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    @media print {
      .wgt-hilbert-simulation .pdf-export-btn,
      .wgt-hilbert-simulation .apple-nav,
      .wgt-hilbert-simulation .apple-subnav,
      .wgt-hilbert-simulation .apple-mobile-drawer,
      .wgt-hilbert-simulation .apple-footer,
      .wgt-hilbert-simulation #scout-viewer-container {
        display: none !important;
      }
      .wgt-hilbert-simulation {
        background: #fff !important;
        color: #111 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .wgt-hilbert-simulation .apple-main-content {
        padding-top: 0 !important;
      }
    }
  
</style>
