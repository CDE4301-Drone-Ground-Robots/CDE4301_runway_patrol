<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s1 from './scripts/hilbert-steering-kinematics-2.js'

useWidgetScript([['hilbert-steering-kinematics-2', s1]])
</script>

<template>
  <div class="vp-raw wgt wgt-hilbert-steering-kinematics">
<div class="editorial-wide">
          <div class="functional-card" id="sec-3d-steering-simulation">
            <div class="functional-card-header">
              <div>
                <span class="functional-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  Interactive 3D Kinematics Simulation — 4WD Skid-Steer Dynamic Behavior
                </span>
                <span style="font-size: 12px; color: var(--apple-text-tertiary); display: block; margin-top: 2px;">
                  WebGL Three.js Simulation • Real-Time Kinematic ICR &amp; Differential Velocity Solver
                </span>
              </div>
              <div style="display: flex; gap: 8px;">
                <span class="badge badge-purple" id="hud-mode-badge">Stationary / Neutral</span>
                <span class="badge badge-blue">Simulation Proxy</span>
              </div>
            </div>

            <!-- Canvas Container -->
            <div style="position: relative; width: 100%; min-height: 535px; background: #0b0f19; border-radius: 10px; overflow: hidden; border: 1px solid var(--apple-border);">
              <div id="scout2-steering-container" style="width: 100%; height: 100%;"></div>
            </div>

            <!-- Simulation Controls Bar -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 16px; padding: 14px; background: rgba(255,255,255,0.02); border-radius: 8px;">
              <div>
                <label style="font-size: 12px; color: var(--apple-text-secondary); display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span>Forward Velocity (v<sub>x</sub>)</span>
                  <span id="scout-speed-val" style="color: #60a5fa; font-weight: 600;">1.00 m/s</span>
                </label>
                <input type="range" id="scout-speed-slider" min="-2.0" max="4.17" step="0.05" value="1.0" style="width: 100%; accent-color: #3b82f6;">
              </div>
              <div>
                <label style="font-size: 12px; color: var(--apple-text-secondary); display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span>Yaw Angular Velocity (&omega;<sub>z</sub>)</span>
                  <span id="scout-yaw-val" style="color: #c084fc; font-weight: 600;">0.80 rad/s</span>
                </label>
                <input type="range" id="scout-yaw-slider" min="-2.0" max="2.0" step="0.05" value="0.8" style="width: 100%; accent-color: #a855f7;">
              </div>
            </div>

            <!-- Telemetry Readouts -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 12px;">
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid var(--apple-border); text-align: center;">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block;">Linear Speed</span>
                <span id="hud-v" style="font-size: 15px; font-weight: 700; color: #60a5fa;">1.00 m/s</span>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid var(--apple-border); text-align: center;">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block;">Yaw Rate</span>
                <span id="hud-omega" style="font-size: 15px; font-weight: 700; color: #c084fc;">0.80 rad/s</span>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid var(--apple-border); text-align: center;">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block;">Turning Radius (R)</span>
                <span id="hud-radius" style="font-size: 15px; font-weight: 700; color: #fbbf24;">1.25 m</span>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid var(--apple-border); text-align: center;">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block;">Left Wheel Bank</span>
                <span id="hud-vl" style="font-size: 15px; font-weight: 700; color: #34d399;">0.72 m/s</span>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid var(--apple-border); text-align: center;">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block;">Right Wheel Bank</span>
                <span id="hud-vr" style="font-size: 15px; font-weight: 700; color: #10b981;">1.28 m/s</span>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid var(--apple-border); text-align: center;">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block;">Pivot-Equivalent Scrub Moment</span>
                <span id="hud-mscrub" style="font-size: 15px; font-weight: 700; color: #f43f5e;">135.0 Nm</span>
              </div>
            </div>

            <!-- Visualization Layer Toggles -->
            <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: #cbd5e1; margin-top: 14px; padding: 10px 14px; background: rgba(0,0,0,0.25); border-radius: 6px; border: 1px solid var(--apple-border);">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" id="toggle-vectors" checked="" style="accent-color: #10b981;">
                <span>Traction &amp; Scrub Force Vectors</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" id="toggle-icr" checked="" style="accent-color: #f59e0b;">
                <span>Instantaneous Center of Rotation (ICR)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" id="toggle-dimensions" checked="" style="accent-color: #3b82f6;">
                <span>Chassis Dimensions (L = 0.498 m, B = 0.583 m)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" id="toggle-trajectory" checked="" style="accent-color: #06b6d4;">
                <span>Ground Trajectory Path</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" id="toggle-follow-cam" checked="" style="accent-color: #8b5cf6;">
                <span>Follow Camera</span>
              </label>
            </div>
          </div>
        </div>
  </div>
</template>

<style>

    /* Editorial Layout Architecture */
    .wgt-hilbert-steering-kinematics {
      overflow-x: hidden;
      max-width: 100vw;
    }

    .wgt-hilbert-steering-kinematics .apple-main-content {
      overflow-x: hidden;
      max-width: 100%;
    }

    .wgt-hilbert-steering-kinematics {
      background-color: var(--apple-bg, #000000);
      color: var(--apple-text-primary, #f5f5f7);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .wgt-hilbert-steering-kinematics .apple-container {
      max-width: 980px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .wgt-hilbert-steering-kinematics .editorial-section {
      padding: 44px 0;
      border-bottom: 1px solid var(--apple-border, rgba(255, 255, 255, 0.08));
    }
    .wgt-hilbert-steering-kinematics .editorial-section:last-of-type {
      border-bottom: none;
    }

    .wgt-hilbert-steering-kinematics .editorial-prose {
      max-width: 760px;
      margin: 0 auto 28px auto;
    }

    .wgt-hilbert-steering-kinematics .editorial-wide {
      max-width: 980px;
      margin: 28px auto 0 auto;
    }

    .wgt-hilbert-steering-kinematics .editorial-h2 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: var(--apple-text-primary, #f5f5f7);
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .wgt-hilbert-steering-kinematics .editorial-h3 {
      font-size: 19px;
      font-weight: 600;
      color: var(--apple-text-primary, #f5f5f7);
      margin: 28px 0 10px 0;
    }

    .wgt-hilbert-steering-kinematics .editorial-prose p {
      font-size: 15.5px;
      line-height: 1.68;
      color: var(--apple-text-secondary, #a1a1a6);
      margin-bottom: 16px;
    }

    .wgt-hilbert-steering-kinematics .editorial-prose ul {
      margin: 12px 0 20px 24px;
      color: var(--apple-text-secondary, #a1a1a6);
      font-size: 15px;
      line-height: 1.65;
    }
    .wgt-hilbert-steering-kinematics .editorial-prose li {
      margin-bottom: 8px;
    }

    /* Functional Cards */
    .wgt-hilbert-steering-kinematics .functional-card {
      background: var(--apple-surface, #161618);
      border: 1px solid var(--apple-border, rgba(255, 255, 255, 0.08));
      border-radius: 14px;
      padding: 24px;
      margin-top: 20px;
      margin-bottom: 24px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
      position: relative;
    }
    .wgt-hilbert-steering-kinematics .functional-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--apple-border, rgba(255, 255, 255, 0.08));
    }
    .wgt-hilbert-steering-kinematics .functional-card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--apple-text-primary, #f5f5f7);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Math Formulas */
    .wgt-hilbert-steering-kinematics .math-eq-box {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid var(--apple-border, rgba(255, 255, 255, 0.08));
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      margin: 16px 0;
      overflow-x: auto;
    }

    /* Clean Tables */
    .wgt-hilbert-steering-kinematics .clean-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
      text-align: left;
    }
    .wgt-hilbert-steering-kinematics .clean-table th {
      padding: 10px 14px;
      font-weight: 600;
      color: var(--apple-text-primary, #f5f5f7);
      border-bottom: 1px solid var(--apple-border, rgba(255, 255, 255, 0.08));
      background: rgba(255, 255, 255, 0.02);
    }
    .wgt-hilbert-steering-kinematics .clean-table td {
      padding: 11px 14px;
      color: var(--apple-text-secondary, #a1a1a6);
      border-bottom: 1px solid var(--apple-border, rgba(255, 255, 255, 0.08));
      vertical-align: middle;
    }
    .wgt-hilbert-steering-kinematics .clean-table tr:last-child td {
      border-bottom: none;
    }

    /* Citation Badges */
    .wgt-hilbert-steering-kinematics .citation-ref {
      color: var(--apple-blue, #3b82f6);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.88em;
      padding: 1px 5px;
      margin: 0 1px;
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.22);
      transition: all 0.2s ease;
      display: inline-block;
      line-height: 1.25;
      vertical-align: baseline;
    }
    .wgt-hilbert-steering-kinematics .citation-ref:hover {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      text-decoration: none;
    }

    /* Badges */
    .wgt-hilbert-steering-kinematics .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .wgt-hilbert-steering-kinematics .badge-purple { background: rgba(168, 85, 247, 0.12); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.25); }
    .wgt-hilbert-steering-kinematics .badge-blue { background: rgba(59, 130, 246, 0.12); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.25); }
    .wgt-hilbert-steering-kinematics .badge-green { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); }
    .wgt-hilbert-steering-kinematics .badge-amber { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); }
    .wgt-hilbert-steering-kinematics .badge-red { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); }

    /* Interactive Buttons */
    .wgt-hilbert-steering-kinematics .bt-toolbar-btn {
      background: var(--apple-surface, #161618);
      border: 1px solid var(--apple-border, rgba(255, 255, 255, 0.08));
      color: var(--apple-text-secondary, #a1a1a6);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .wgt-hilbert-steering-kinematics .bt-toolbar-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      color: var(--apple-text-primary, #f5f5f7);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .wgt-hilbert-steering-kinematics .bt-toolbar-btn.active {
      background: rgba(168, 85, 247, 0.2);
      color: #c084fc;
      border-color: #a855f7;
    }

    /* Modals */
    .wgt-hilbert-steering-kinematics .steering-modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .wgt-hilbert-steering-kinematics .steering-modal-container {
      background: var(--apple-surface, #161618);
      border: 1px solid var(--apple-border, rgba(255, 255, 255, 0.12));
      border-radius: 16px;
      width: 100%;
      max-width: 820px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      padding: 28px;
      position: relative;
    }
    .wgt-hilbert-steering-kinematics .steering-modal-close {
      position: absolute;
      top: 18px; right: 20px;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: var(--apple-text-secondary, #a1a1a6);
      width: 32px; height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.2s ease;
    }
    .wgt-hilbert-steering-kinematics .steering-modal-close:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
    }

    @media (max-width: 768px) {
      .wgt-hilbert-steering-kinematics .editorial-section { padding: 32px 0; }
      .wgt-hilbert-steering-kinematics .clean-table { font-size: 12px; }
      .wgt-hilbert-steering-kinematics .clean-table th, .wgt-hilbert-steering-kinematics .clean-table td { padding: 8px 10px; }
      .wgt-hilbert-steering-kinematics .functional-card { padding: 18px 14px; }
      .wgt-hilbert-steering-kinematics .apple-container { padding-left: 14px; padding-right: 14px; }
      .wgt-hilbert-steering-kinematics .math-eq-box {
        padding: 14px 10px;
        overflow-x: auto;
        max-width: 100%;
        box-sizing: border-box;
      }
      .wgt-hilbert-steering-kinematics .editorial-prose ul {
        padding-left: 18px;
      }
    }
  
</style>
