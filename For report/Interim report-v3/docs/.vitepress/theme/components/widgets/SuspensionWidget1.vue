<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/asuka-suspension-1.js'

useWidgetScript([['asuka-suspension-1', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-asuka-suspension">
<div class="step-grid">
            <div class="step-panel" data-lbf="100" data-b="400"></div>
            <div class="step-panel" data-lbf="400" data-b="400"></div>
          </div>
  </div>
</template>

<style>

    .wgt-asuka-suspension .admin-table tr.row-selected td { background: var(--accent-green-light); }
    .wgt-asuka-suspension .admin-table tr.row-fail td { background: var(--accent-rose-light); }
    .wgt-asuka-suspension .admin-table tr.row-fail td.nf-ok { background: var(--accent-green-light); }
    .wgt-asuka-suspension .admin-table td.nf-ok { background: var(--accent-green-light); color: var(--accent-green); font-weight: 600; }

    .wgt-asuka-suspension .page-content .card-box { min-width: 0; }
    .wgt-asuka-suspension .page-content [style*="display: grid"] > * { min-width: 0; }
    .wgt-asuka-suspension .page-content mjx-container[display="true"] { overflow-x: auto; overflow-y: hidden; max-width: 100%; padding-bottom: 2px; }
    .wgt-asuka-suspension .spring-table td { white-space: nowrap; }
    .wgt-asuka-suspension .admin-table.spring-table thead th { white-space: normal; min-width: 80px; vertical-align: bottom; }
    .wgt-asuka-suspension .susp-thumb { width: 96px; min-width: 96px; height: 96px; object-fit: contain; border-radius: 8px; background: #fff; display: block; }
    .wgt-asuka-suspension .step-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 18px; margin-top: 14px; }
    .wgt-asuka-suspension .step-panel { border: 1px solid var(--apple-border); border-radius: 12px; padding: 16px; background: var(--apple-surface); min-width: 0; }
    .wgt-asuka-suspension .step-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
    .wgt-asuka-suspension .step-title { font-size: 15px; font-weight: 600; color: var(--text-main); }
    .wgt-asuka-suspension .step-reset { font: inherit; font-size: 12px; color: var(--accent-blue); background: none; border: 1px solid var(--apple-border-highlight); border-radius: 980px; padding: 4px 12px; cursor: pointer; }
    .wgt-asuka-suspension .step-reset:hover { background: var(--accent-blue-light); }
    .wgt-asuka-suspension .step-svg { width: 100%; display: block; margin-top: 8px; color: var(--text-muted); font-family: var(--font-apple); }
    .wgt-asuka-suspension .step-eq { font-size: 14px; color: var(--accent-emerald); overflow-x: auto; overflow-y: hidden; min-height: 52px; }
    .wgt-asuka-suspension .step-eq mjx-container { margin: 6px 0 !important; }
    .wgt-asuka-suspension .step-ctrl { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 10px; margin-top: 10px; font-size: 13px; color: var(--text-muted); }
    .wgt-asuka-suspension .step-ctrl output { font-family: var(--font-mono); color: var(--text-main); font-size: 12.5px; }
    .wgt-asuka-suspension .step-ctrl input[type="range"] { grid-column: 1 / -1; width: 100%; accent-color: var(--accent-green); margin: 2px 0 0; }
    .wgt-asuka-suspension .step-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-top: 14px; }
    .wgt-asuka-suspension .step-stat { border: 1px solid var(--apple-border-light); border-radius: 8px; padding: 8px 10px; font-size: 11px; color: var(--text-muted); line-height: 1.4; }
    .wgt-asuka-suspension .step-stat b { display: block; font-size: 14px; color: var(--text-main); font-family: var(--font-mono); font-weight: 600; }
    .wgt-asuka-suspension .step-stat.ok { border-color: var(--accent-green); background: var(--accent-green-light); }
    .wgt-asuka-suspension .step-stat.bad { border-color: var(--accent-rose); background: var(--accent-rose-light); }
    .wgt-asuka-suspension .ph { background: var(--accent-amber-light); color: var(--accent-amber); border-radius: 4px; padding: 0 4px; font-weight: 600; }
  

    .wgt-asuka-suspension .pdf-export-btn {
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
    .wgt-asuka-suspension .pdf-export-btn:hover {
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 10px 32px rgba(41, 151, 255, 0.55), 0 4px 12px rgba(0,0,0,0.4);
      background: linear-gradient(135deg, #0a84ff 0%, #1d4ed8 100%);
    }
    .wgt-asuka-suspension .pdf-export-btn:active {
      transform: translateY(0) scale(0.98);
    }
    .wgt-asuka-suspension .pdf-export-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    @media print {
      .wgt-asuka-suspension .pdf-export-btn,
      .wgt-asuka-suspension .apple-nav,
      .wgt-asuka-suspension .apple-mobile-drawer,
      .wgt-asuka-suspension .apple-footer {
        display: none !important;
      }
      .wgt-asuka-suspension {
        background: #fff !important;
        color: #111 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .wgt-asuka-suspension .apple-main-content {
        padding-top: 0 !important;
      }
    }
  
</style>
