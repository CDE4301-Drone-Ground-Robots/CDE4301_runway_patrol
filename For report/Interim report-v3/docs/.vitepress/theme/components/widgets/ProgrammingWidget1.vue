<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/programming-1.js'
import s1 from './scripts/programming-2.js'

useWidgetScript([['programming-1', s0], ['programming-2', s1]])
</script>

<template>
  <div class="vp-raw wgt wgt-programming">
<div class="interactive-panel">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="color: #f5f5f7; font-size: 14.5px;">End-to-End "Detect-to-Clear" Mission Dataflow Simulator</strong>
              </div>
              <p style="font-size: 12px; color: #86868b; margin: 4px 0 0 0;">
                Step through the asynchronous 6-stage UAV-to-UGV remediation pipeline to inspect message payloads, active ROS 2 nodes, and latency budgets.
              </p>
            </div>
            <div style="display: flex; gap: 6px;">
              <button id="sim-btn-prev" class="step-pill">← Prev Stage</button>
              <button id="sim-btn-next" class="step-pill" style="border-color: #2997ff; color: #2997ff;">Next Stage →</button>
            </div>
          </div>

          <!-- STAGE PROGRESS PILLS -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 6px; margin-bottom: 14px;" id="sim-stage-pills">
            <button class="step-pill active" data-step="0">01. UAV Vision</button>
            <button class="step-pill" data-step="1">02. C2 Packaging</button>
            <button class="step-pill" data-step="2">03. DDS Unicast</button>
            <button class="step-pill" data-step="3">04. Coordinate Map</button>
            <button class="step-pill" data-step="4">05. Nav2 Sprint</button>
            <button class="step-pill" data-step="5">06. Safe Remediation</button>
          </div>

          <!-- STAGE DISPLAY CARD -->
          <div style="background: #0d1117; border: 1px solid var(--apple-border); border-radius: 8px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; margin-bottom: 12px;">
              <div>
                <span id="sim-node-badge" class="badge" style="background: rgba(41, 151, 255, 0.15); color: #2997ff; font-size: 11px;">Active Node: uav_waypoint_commander.py</span>
                <h4 id="sim-stage-title" style="font-size: 15px; color: #f5f5f7; margin: 4px 0 0 0;">Stage 1: Aerial UAV Edge Detection &amp; Geotagging</h4>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 11px; color: #86868b; text-transform: uppercase;">Estimated Latency</span>
                <div id="sim-stage-latency" style="font-size: 14px; font-weight: 700; color: #2997ff; font-family: 'SF Mono', Consolas, monospace;">Δt = 33.3 ms (30 FPS)</div>
              </div>
            </div>

            <p id="sim-stage-desc" style="font-size: 12.5px; color: var(--apple-text-secondary); line-height: 1.5; margin-bottom: 12px;">
              Aerial companion computer executes edge YOLOv8 tensor inference on synthetic runway video stream. Detects FOD fastener with 94.2% confidence and associates instantaneous UAV GNSS/IMU attitude to calculate geodetic ground coordinates.
            </p>

            <div style="background: #06090e; border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 12px; overflow-x: auto;">
              <div style="font-size: 11px; font-weight: 600; color: #86868b; margin-bottom: 6px; text-transform: uppercase; font-family: 'SF Mono', Consolas, monospace;">
                Active Payload / ROS 2 Interface:
              </div>
              <pre id="sim-stage-payload" style="margin: 0; font-family: 'SF Mono', Consolas, monospace; font-size: 12px; color: #7ee787; line-height: 1.45;"><code>{
  "event": "TARGET_DETECTED",
  "source": "UAV-ALPHA (DJI Matrice Proxy)",
  "confidence": 0.942,
  "wgs84": { "lat": 1.3005821, "lon": 103.7712394, "alt_m": 18.52 }
}</code></pre>
            </div>
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
