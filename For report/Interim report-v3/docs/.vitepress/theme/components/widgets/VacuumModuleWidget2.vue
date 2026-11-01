<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/asuka-vacuum-module-1.js'
import s1 from './scripts/asuka-vacuum-module-2.js'

useWidgetScript([['asuka-vacuum-module-1', s0], ['asuka-vacuum-module-2', s1]])
</script>

<template>
  <div class="vp-raw wgt wgt-asuka-vacuum-module">
<div class="calc" id="incline-calc">
            <div class="calc-head">
              <span class="calc-title">Object</span>
              <div class="calc-presets">
                <button type="button" data-obj="A">Case A: screw M8, 25 g</button>
                <button type="button" data-obj="B">Case B: bird carcass, 300 g</button>
              </div>
            </div>
            <div class="calc-ctrls">
              <label class="step-ctrl"><span>Tube angle <i>θ</i></span><output data-out="th"></output><input type="range" data-in="th" min="0" max="60" step="1" aria-label="Tube angle in degrees"></label>
              <label class="step-ctrl"><span>Static friction <i>μ<sub>s</sub></i></span><output data-out="mu"></output><input type="range" data-in="mu" min="0" max="1" step="0.05" aria-label="Static friction coefficient"></label>
            </div>
            <svg class="incline-svg" viewBox="0 0 900 300" role="img" aria-label="Minimum air speed against tube angle"></svg>
            <div class="step-stats" data-istats=""></div>
          </div>
  </div>
</template>

<style>

    .wgt-asuka-vacuum-module .page-content .card-box { min-width: 0; }
    .wgt-asuka-vacuum-module .page-content [style*="display: grid"] > * { min-width: 0; }
    .wgt-asuka-vacuum-module .page-content mjx-container[display="true"] { overflow-x: auto; overflow-y: hidden; max-width: 100%; padding-bottom: 2px; }
    .wgt-asuka-vacuum-module .vac-p { font-size: 14px; color: var(--text-muted); line-height: 1.65; }
    .wgt-asuka-vacuum-module .eq { font-size: 16px; margin: 8px 0; }
    .wgt-asuka-vacuum-module .admin-table tr.row-selected td { background: var(--accent-green-light); }
    .wgt-asuka-vacuum-module .admin-table td.tbc { color: var(--apple-text-tertiary); font-style: italic; }
    @media (max-width: 640px) { .wgt-asuka-vacuum-module .vac-physics { grid-template-columns: minmax(0, 1fr) !important; } .wgt-asuka-vacuum-module .vac-physics svg { max-width: 180px !important; } }

    .wgt-asuka-vacuum-module .vac-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr)); gap: 12px; margin-top: 16px; counter-reset: s; }
    .wgt-asuka-vacuum-module .vac-step { display: flex; align-items: center; gap: 12px; border: 1px solid var(--apple-border); border-radius: 12px; padding: 14px 16px; background: var(--apple-surface); font-size: 14px; color: var(--text-main); }
    .wgt-asuka-vacuum-module .vac-step span { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-blue-light); color: var(--accent-blue); font-weight: 700; font-size: 13px; }

    .wgt-asuka-vacuum-module .calc { border: 1px solid var(--apple-border); border-radius: 12px; padding: 16px; background: var(--apple-surface); margin-top: 10px; }
    .wgt-asuka-vacuum-module .calc-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
    .wgt-asuka-vacuum-module .calc-title { font-size: 13px; color: var(--text-muted); }
    .wgt-asuka-vacuum-module .calc-presets { display: flex; gap: 8px; flex-wrap: wrap; }
    .wgt-asuka-vacuum-module .calc-presets button { font: inherit; font-size: 12px; color: var(--accent-blue); background: none; border: 1px solid var(--apple-border-highlight); border-radius: 980px; padding: 4px 12px; cursor: pointer; }
    .wgt-asuka-vacuum-module .calc-presets button:hover, .wgt-asuka-vacuum-module .calc-presets button.on { background: var(--accent-blue-light); }
    .wgt-asuka-vacuum-module .calc-ctrls { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 4px 24px; margin-top: 4px; }
    .wgt-asuka-vacuum-module .step-ctrl { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 10px; margin-top: 10px; font-size: 13px; color: var(--text-muted); }
    .wgt-asuka-vacuum-module .step-ctrl output { font-family: var(--font-mono); color: var(--text-main); font-size: 12.5px; }
    .wgt-asuka-vacuum-module .step-ctrl input[type="range"] { grid-column: 1 / -1; width: 100%; accent-color: var(--accent-blue); margin: 2px 0 0; }
    .wgt-asuka-vacuum-module .step-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-top: 16px; }
    .wgt-asuka-vacuum-module .step-stat { border: 1px solid var(--apple-border-light); border-radius: 8px; padding: 8px 10px; font-size: 11px; color: var(--text-muted); line-height: 1.4; }
    .wgt-asuka-vacuum-module .step-stat b { display: block; font-size: 14px; color: var(--text-main); font-family: var(--font-mono); font-weight: 600; }
    .wgt-asuka-vacuum-module .calc-bars { margin-top: 16px; display: grid; gap: 6px; }
    .wgt-asuka-vacuum-module .calc-bars .bar-row { display: grid; grid-template-columns: 120px 1fr 78px; align-items: center; gap: 10px; font-size: 12px; color: var(--text-muted); }
    .wgt-asuka-vacuum-module .calc-bars .bar-track { height: 14px; position: relative; }
    .wgt-asuka-vacuum-module .calc-bars .bar-fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--accent-blue); border-radius: 0 4px 4px 0; min-width: 2px; transition: width .15s ease; }
    .wgt-asuka-vacuum-module .calc-bars .bar-row.total .bar-fill { background: var(--text-main); opacity: .55; }
    .wgt-asuka-vacuum-module .calc-bars .bar-val { font-family: var(--font-mono); color: var(--text-main); text-align: right; }
    .wgt-asuka-vacuum-module .calc-bars .bar-row.total { border-top: 1px solid var(--apple-border); padding-top: 6px; color: var(--text-main); font-weight: 600; }
    .wgt-asuka-vacuum-module .calc-check { margin-top: 14px; font-size: 13px; line-height: 1.55; border-radius: 8px; padding: 10px 12px; border: 1px solid var(--apple-border); color: var(--text-main); }
    .wgt-asuka-vacuum-module .calc-check.ok { border-color: var(--accent-green); background: var(--accent-green-light); }
    .wgt-asuka-vacuum-module .calc-check.bad { border-color: var(--accent-rose); background: var(--accent-rose-light); }
  

    .wgt-asuka-vacuum-module .fod-tree { border: 1px solid var(--apple-border); border-radius: 12px; padding: 16px; background: var(--apple-surface); }
    .wgt-asuka-vacuum-module .fod-tree .ft-node { display: inline-flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; line-height: 1.25; color: var(--text-main); border: 1px solid var(--apple-border-highlight); border-radius: 6px; padding: 6px 8px; background: var(--apple-surface-card); }
    .wgt-asuka-vacuum-module .fod-tree .ft-key { font-weight: 700; border-color: var(--accent-blue); background: var(--accent-blue-light); padding: 6px 16px; }
    .wgt-asuka-vacuum-module .fod-tree .ft-sub { border-color: var(--accent-blue); }
    .wgt-asuka-vacuum-module .fod-tree .ft-root { text-align: center; }
    .wgt-asuka-vacuum-module .fod-tree .ft-branches { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 16px; margin-top: 12px; border-top: 1px solid var(--apple-border-highlight); padding-top: 12px; }
    .wgt-asuka-vacuum-module .fod-tree .ft-branch { display: grid; gap: 10px; justify-items: center; align-content: start; }
    .wgt-asuka-vacuum-module .fod-tree .ft-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; width: 100%; }
    .wgt-asuka-vacuum-module .fod-tree .ft-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
    .wgt-asuka-vacuum-module .fod-tree .ft-wild { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }
    .wgt-asuka-vacuum-module .fod-tree .ft-col { display: grid; gap: 6px; justify-items: center; }
    .wgt-asuka-vacuum-module .admin-table.wrap-head thead th { white-space: normal; min-width: 110px; vertical-align: bottom; }
    .wgt-asuka-vacuum-module .sub-h { font-size: 17px; color: var(--text-main); margin: 30px 0 8px; padding-top: 14px; border-top: 1px solid var(--apple-border); }
    .wgt-asuka-vacuum-module .card-header + .sub-h { border-top: 0; padding-top: 0; margin-top: 14px; }
    .wgt-asuka-vacuum-module .cad-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 14px; margin-top: 12px; }
    .wgt-asuka-vacuum-module .cad-fig { margin: 0; }
    .wgt-asuka-vacuum-module .cad-img { position: relative; aspect-ratio: 4 / 3; border-radius: 10px; overflow: hidden; background: rgb(196, 200, 210); border: 1px solid var(--apple-border); }
    .wgt-asuka-vacuum-module .cad-img img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .wgt-asuka-vacuum-module .cad-grid.single { grid-template-columns: minmax(0, 720px); }
    .wgt-asuka-vacuum-module .cad-grid.single .cad-img { aspect-ratio: 629 / 394; }
    .wgt-asuka-vacuum-module .cad-missing { display: none; }
    .wgt-asuka-vacuum-module .cad-fig.missing .cad-img { background: transparent; border: 1px dashed var(--apple-border-highlight); }
    .wgt-asuka-vacuum-module .cad-fig.missing img { display: none; }
    .wgt-asuka-vacuum-module .cad-fig.missing .cad-missing { display: grid; place-items: center; position: absolute; inset: 0; font-size: 12px; color: var(--apple-text-tertiary); }
    .wgt-asuka-vacuum-module .cad-fig figcaption { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 13px; color: var(--text-main); font-weight: 600; }
    .wgt-asuka-vacuum-module .fig-step { flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-blue-light); color: var(--accent-blue); font-size: 12px; }
    .wgt-asuka-vacuum-module .video-fig { margin: 12px 0 0; max-width: 360px; }
    .wgt-asuka-vacuum-module .video-fig video { width: 100%; display: block; border-radius: 10px; border: 1px solid var(--apple-border); background: #000; }
    .wgt-asuka-vacuum-module .video-fig figcaption { margin-top: 8px; font-size: 12px; color: var(--text-muted); }
    .wgt-asuka-vacuum-module .model-frame { border: 1px solid var(--apple-border); border-radius: 12px; overflow: hidden; margin-top: 10px; background: var(--apple-surface); }
    .wgt-asuka-vacuum-module .model-frame iframe { display: block; width: 100%; height: 640px; border: 0; }
    .wgt-asuka-vacuum-module .incline-svg { width: 100%; display: block; margin-top: 14px; color: var(--text-muted); font-family: var(--font-apple); touch-action: none; }
  

    .wgt-asuka-vacuum-module .pdf-export-btn {
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
    .wgt-asuka-vacuum-module .pdf-export-btn:hover {
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 10px 32px rgba(41, 151, 255, 0.55), 0 4px 12px rgba(0,0,0,0.4);
      background: linear-gradient(135deg, #0a84ff 0%, #1d4ed8 100%);
    }
    .wgt-asuka-vacuum-module .pdf-export-btn:active {
      transform: translateY(0) scale(0.98);
    }
    .wgt-asuka-vacuum-module .pdf-export-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    @media print {
      .wgt-asuka-vacuum-module .pdf-export-btn,
      .wgt-asuka-vacuum-module .apple-nav,
      .wgt-asuka-vacuum-module .apple-mobile-drawer,
      .wgt-asuka-vacuum-module .apple-footer {
        display: none !important;
      }
      .wgt-asuka-vacuum-module {
        background: #fff !important;
        color: #111 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .wgt-asuka-vacuum-module .apple-main-content {
        padding-top: 0 !important;
      }
    }
  
</style>
