<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/introduction-1.js'

useWidgetScript([['introduction-1', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-introduction">
<div class="comp-wrap">
            <div class="comp-plot" id="comp-plot" aria-label="Competitor map: detection performance against collection performance">
              <div class="comp-axis comp-axis-x"></div><div class="comp-axis comp-axis-y"></div>
              <span class="comp-label comp-label-y">Detection performance ↑</span>
              <span class="comp-label comp-label-x">Collection performance →</span>
            </div>
            <div class="comp-legend">
              <span><i class="cl-det"></i>Detection only</span><span><i class="cl-col"></i>Collection only</span><span><i class="cl-both"></i>Detection and collection</span><span><i class="cl-ours"></i>Our solution</span>
            </div>
            <div class="comp-detail" id="comp-detail" aria-live="polite"></div>
          </div>
  </div>
</template>

<style>

    /* Naked text sections, matching the overview page. Cards are kept for images, tables, figures and interactive boards. */
    .wgt-introduction .intro-sec { max-width: 920px; margin: 0 auto; padding: 0 0 88px; }
    .wgt-introduction .intro-sec + .intro-sec { padding-top: 88px; border-top: 1px solid var(--apple-border); }
    .wgt-introduction .intro-sec-head { margin-bottom: 8px; }
    .wgt-introduction .intro-sec-head .apple-section-title { margin-bottom: 20px; }
    .wgt-introduction .intro-deep-link { display: inline-block; font-size: 15px; font-weight: 500; color: var(--apple-blue); text-decoration: none; margin: -6px 0 20px; }
    .wgt-introduction .intro-deep-link:hover { text-decoration: underline; }
    .wgt-introduction .intro-h3 { font-size: 22px; font-weight: 600; letter-spacing: -0.015em; color: #ffffff; margin: 40px 0 14px; }
    .wgt-introduction .intro-sec-head + .intro-h3 { margin-top: 12px; }
    .wgt-introduction .intro-p, .wgt-introduction .intro-list { font-size: 17px; line-height: 1.7; color: #ffffff; letter-spacing: -0.01em; margin: 0 0 18px; max-width: 72ch; }
    .wgt-introduction .intro-list { padding-left: 22px; }
    .wgt-introduction .intro-list li { margin-bottom: 10px; }
    .wgt-introduction .intro-stat { margin: 4px 0 18px; }
    .wgt-introduction .intro-stat-num { font-size: clamp(36px, 6vw, 56px); font-weight: 700; color: var(--text-main); letter-spacing: -0.03em; line-height: 1.05; }
    .wgt-introduction .intro-stat-label { font-size: 15px; color: var(--text-muted); margin-top: 8px; max-width: 72ch; }
    .wgt-introduction .intro-board { margin: 8px 0 0; }
    .wgt-introduction .intro-transcripts { display: grid; gap: 4px; margin-bottom: 22px; max-width: 72ch; }
    .wgt-introduction .intro-transcript summary { cursor: pointer; color: var(--apple-blue); font-size: 16px; font-weight: 500; padding: 6px 0; }
    .wgt-introduction .intro-transcript-body { padding: 10px 0 18px; font-size: 16px; line-height: 1.7; color: #ffffff; white-space: pre-wrap; }
    .wgt-introduction .intro-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: 16px; }
    .wgt-introduction .intro-fig { margin: 0; }
    .wgt-introduction .intro-img { position: relative; aspect-ratio: 16 / 10; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); background: var(--card-bg-subtle, rgba(255,255,255,0.03)); }
    .wgt-introduction .intro-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .wgt-introduction .intro-missing { display: none; }
    .wgt-introduction .intro-fig.missing .intro-img { border-style: dashed; }
    .wgt-introduction .intro-fig.missing img { display: none; }
    .wgt-introduction .intro-fig.missing .intro-missing { display: grid; place-items: center; position: absolute; inset: 0; font-size: 12px; color: var(--text-muted); }
    .wgt-introduction .intro-fig figcaption { margin-top: 8px; font-size: 13px; color: var(--text-main); display: grid; gap: 2px; }
    .wgt-introduction .intro-fig figcaption span { font-size: 11.5px; color: var(--text-muted); }
    .wgt-introduction .journey-fig .intro-img img { object-fit: contain; background: #0b0f19; }

    .wgt-introduction .stake-map { display: grid; grid-template-columns: auto 1fr; grid-template-rows: 1fr auto; gap: 6px 8px; max-width: 760px; }
    .wgt-introduction .stake-axis-y { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 12px; color: var(--text-muted); text-align: center; }
    .wgt-introduction .stake-axis-x { grid-column: 2; text-align: right; font-size: 12px; color: var(--text-muted); }
    .wgt-introduction .stake-grid { display: grid; grid-template-columns: 1fr 1fr; border-left: 2px solid var(--text-muted); border-bottom: 2px solid var(--text-muted); }
    .wgt-introduction .stake-q { min-height: 120px; padding: 14px; display: flex; flex-wrap: wrap; align-content: center; justify-content: center; gap: 6px; border: 1px dashed var(--border-color); }
    .wgt-introduction .stake-chip { font-size: 12.5px; font-weight: 600; color: var(--text-main); border: 1px solid var(--border-color); border-radius: 999px; padding: 5px 12px; background: var(--card-bg); }
    .wgt-introduction .stake-strong { border-color: var(--accent-blue); }
    .wgt-introduction .stake-note { width: 100%; text-align: center; font-size: 11.5px; color: var(--text-muted); }

    .wgt-introduction .learn-table td { vertical-align: top; }
    .wgt-introduction .learn-role { font-size: 11.5px; color: var(--text-muted); }
    .wgt-introduction .senti { display: inline-block; font-size: 11.5px; font-weight: 700; padding: 2px 9px; border-radius: 999px; border: 1px solid; white-space: nowrap; }
    .wgt-introduction .senti-frust { color: var(--accent-rose); border-color: var(--accent-rose); background: var(--accent-rose-light); }
    .wgt-introduction .senti-neg { color: var(--accent-amber); border-color: var(--accent-amber); background: var(--accent-amber-light); }
    .wgt-introduction .senti-pos { color: var(--accent-green); border-color: var(--accent-green); background: var(--accent-green-light); }
    .wgt-introduction .senti-ins { color: var(--accent-blue); border-color: var(--accent-blue); background: var(--accent-blue-light); }

    .wgt-introduction .comp-wrap { display: grid; gap: 14px; }
    .wgt-introduction .comp-plot { position: relative; aspect-ratio: 16 / 10; border: 1px solid var(--border-color); border-radius: 12px; background: var(--card-bg-subtle, rgba(255,255,255,0.02)); overflow: hidden; }
    .wgt-introduction .comp-axis { position: absolute; background: var(--text-muted); opacity: 0.7; }
    .wgt-introduction .comp-axis-x { left: 4%; right: 4%; top: 50%; height: 2px; }
    .wgt-introduction .comp-axis-y { top: 5%; bottom: 5%; left: 50%; width: 2px; }
    .wgt-introduction .comp-label { position: absolute; font-size: 11.5px; font-weight: 600; color: var(--text-muted); }
    .wgt-introduction .comp-label-y { left: calc(50% + 8px); top: 4%; }
    .wgt-introduction .comp-label-x { right: 4%; top: calc(50% + 6px); }
    .wgt-introduction .comp-pt { position: absolute; transform: translate(-50%, -50%); border: 2px solid var(--comp-c); border-radius: 10px; padding: 0; width: clamp(48px, 11%, 104px); aspect-ratio: 4 / 3; overflow: hidden; cursor: pointer; background: var(--card-bg); box-shadow: 0 2px 8px rgba(0,0,0,0.25); transition: transform .15s ease, box-shadow .15s ease; }
    .wgt-introduction .comp-pt img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .wgt-introduction .comp-pt .comp-fallback { display: none; position: absolute; inset: 0; place-items: center; font-size: 10.5px; font-weight: 700; color: var(--text-main); padding: 2px; text-align: center; line-height: 1.15; }
    .wgt-introduction .comp-pt.noimg img { display: none; }
    .wgt-introduction .comp-pt.noimg .comp-fallback { display: grid; }
    .wgt-introduction .comp-pt:hover, .wgt-introduction .comp-pt:focus-visible { transform: translate(-50%, -50%) scale(1.08); z-index: 2; outline: none; box-shadow: 0 0 0 3px var(--comp-c); }
    .wgt-introduction .comp-pt.on { transform: translate(-50%, -50%) scale(1.12); z-index: 3; box-shadow: 0 0 0 3px var(--comp-c), 0 6px 18px rgba(0,0,0,0.35); }
    .wgt-introduction .comp-legend { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 12px; color: var(--text-muted); }
    .wgt-introduction .comp-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; border: 2px solid; }
    .wgt-introduction .cl-det { border-color: var(--accent-blue) !important; } .wgt-introduction .cl-col { border-color: var(--accent-amber) !important; } .wgt-introduction .cl-both { border-color: var(--accent-purple) !important; } .wgt-introduction .cl-ours { border-color: var(--accent-green) !important; }
    .wgt-introduction .comp-detail { border: 1px solid var(--border-color); border-left: 4px solid var(--comp-c, var(--accent-blue)); border-radius: 12px; padding: 16px; display: grid; grid-template-columns: minmax(0, 200px) minmax(0, 1fr); gap: 16px; background: var(--card-bg); }
    .wgt-introduction .comp-detail img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color); }
    .wgt-introduction .comp-detail h4 { margin: 0 0 2px; font-size: 16px; color: var(--text-main); }
    .wgt-introduction .comp-detail .cd-cat { font-size: 11.5px; font-weight: 700; color: var(--comp-c); text-transform: uppercase; letter-spacing: 0.04em; }
    .wgt-introduction .comp-detail .cd-how { font-size: 13.5px; color: var(--text-muted); margin: 8px 0 10px; line-height: 1.6; }
    .wgt-introduction .comp-detail .cd-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr)); gap: 10px; }
    .wgt-introduction .comp-detail .cd-cols div { font-size: 13px; color: var(--text-muted); line-height: 1.55; }
    .wgt-introduction .comp-detail .cd-cols strong { display: block; font-size: 12px; margin-bottom: 4px; }
    .wgt-introduction .comp-detail ul { margin: 0; padding-left: 18px; }
    .wgt-introduction .comp-detail.one { grid-template-columns: 1fr; }
    @media (max-width: 640px) { .wgt-introduction .comp-detail { grid-template-columns: 1fr; } .wgt-introduction .comp-label { font-size: 10px; } }

    .wgt-introduction .journey { list-style: none; counter-reset: j; margin: 28px 0 0; padding: 0; display: grid; gap: 22px; max-width: 72ch; }
    .wgt-introduction .journey li { counter-increment: j; padding-left: 44px; position: relative; }
    .wgt-introduction .journey li::before { content: counter(j); position: absolute; left: 0; top: 1px; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 700; color: var(--accent-blue); background: var(--accent-blue-light); }
    .wgt-introduction .journey b { display: block; font-size: 17px; font-weight: 600; color: var(--text-main); margin-bottom: 4px; }
    .wgt-introduction .journey span { font-size: 17px; color: #ffffff; line-height: 1.7; }

    .wgt-introduction .demo-fig { margin: 0; }
    .wgt-introduction .demo-fig video { width: 100%; display: block; border-radius: 12px; border: 1px solid var(--border-color); background: #000; }

    .wgt-introduction .mr-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: 12px; margin: 16px 0; }
    .wgt-introduction .mr-card { border: 1px solid var(--border-color); border-left: 4px solid var(--mr-c); border-radius: 10px; padding: 14px; background: var(--card-bg-subtle, rgba(255,255,255,0.02)); font-size: 13px; color: var(--text-muted); }
    .wgt-introduction .mr-card h4 { margin: 0 0 8px; font-size: 14px; color: var(--mr-c); }
    .wgt-introduction .mr-card table { width: 100%; border-collapse: collapse; }
    .wgt-introduction .mr-card td { padding: 2px 0; } .wgt-introduction .mr-card td:last-child { text-align: right; color: var(--text-main); font-family: var(--font-mono, monospace); }
    .wgt-introduction .mr-card tr.tot td { border-top: 1px solid var(--border-color); padding-top: 6px; font-weight: 700; color: var(--text-main); }
    .wgt-introduction .mr-save { font-size: clamp(26px, 4vw, 34px); font-weight: 700; color: var(--accent-green); }

    .wgt-introduction .vps { display: grid; gap: 12px; }
    .wgt-introduction .vps-row { display: grid; grid-template-columns: 90px 1fr; gap: 14px; align-items: baseline; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; }
    .wgt-introduction .vps-row:last-child { border-bottom: 0; }
    .wgt-introduction .vps-k { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-green); }
    .wgt-introduction .vps-row p { margin: 0; font-size: clamp(17px, 2.2vw, 21px); line-height: 1.45; color: var(--text-main); font-weight: 600; }

    .wgt-introduction .vpc-wrap { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 20px; }
    .wgt-introduction .vpc { margin: 0; text-align: center; }
    .wgt-introduction .vpc svg { width: 100%; max-width: 420px; display: block; margin: 0 auto; font-family: var(--font-apple, sans-serif); }
    .wgt-introduction .vpc-shape { fill: none; stroke: var(--text-main); stroke-width: 2; }
    .wgt-introduction .vpc-line { stroke: var(--text-main); stroke-width: 2; }
    .wgt-introduction .vpc-head { fill: var(--accent-blue); font-size: 14px; font-weight: 700; text-anchor: middle; }
    .wgt-introduction .vpc-t { fill: var(--text-main); font-size: 11.5px; text-anchor: middle; }
    .wgt-introduction .vpc figcaption { margin-top: 6px; font-size: 15px; font-weight: 600; color: var(--text-main); }
    .wgt-introduction .fit-table .fit-group td { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-blue); background: var(--accent-blue-light); }
    .wgt-introduction .fit-table .fit-arrow { color: var(--accent-green); font-weight: 700; text-align: center; width: 40px; }
  
</style>
