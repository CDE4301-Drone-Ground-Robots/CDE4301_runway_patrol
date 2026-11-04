<!-- Interactive widget: the markup below, its behaviour in scripts/ (run once per page by useWidgetScript), styles scoped by its .wgt-* class. -->
<script setup lang="ts">
import { useWidgetScript } from './useWidgetScript'

import s0 from './scripts/hilbert-steering-kinematics-1.js'

useWidgetScript([['hilbert-steering-kinematics-1', s0]])
</script>

<template>
  <div class="vp-raw wgt wgt-hilbert-steering-kinematics">
<div class="editorial-wide">
          <div class="functional-card" id="sec-interactive-lb-explorer">
            <div class="functional-card-header">
              <div>
                <span class="functional-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 12h10M12 7v10"></path></svg>
                  Interactive Wheelbase-to-Trackwidth Ratio (L/B) Dynamic Stability &amp; Scrub Explorer
                </span>
                <span style="font-size: 12px; color: var(--apple-text-tertiary); display: block; margin-top: 2px;">
                  Explore pitch stability floors vs. pivot turn traction limits across configurable chassis dimensions
                </span>
              </div>
              <span id="sim-ratio-badge" class="badge badge-purple" style="font-size: 13px;">0.850</span>
            </div>

            <!-- Status Banner -->
            <div id="sim-status-banner" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 14px;">
              <span id="sim-status-icon" style="font-size: 20px;">✓</span>
              <div>
                <strong id="sim-status-title" style="color: #34d399; font-size: 14px;">Within Assumed Design Range (L/B = 0.850) • Predicted Stability Margin</strong>
                <p id="sim-status-desc" style="font-size: 13px; color: var(--apple-text-secondary); margin: 4px 0 0 0; line-height: 1.45;">
                  Analytical prediction indicates the chassis stance resides safely between the emergency pitch lift-off boundary (L/B &ge; 0.70) and the stationary pivot traction limit (L/B &le; 1.00). Direct-drive hub motors produce sufficient shaft torque (14.25 N·m) to overcome lateral tire scrub within simplified traction estimates.
                </p>
              </div>
            </div>

            <!-- Dual Sliders & Preset Buttons -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 20px;">
              <div>
                <label style="font-size: 12.5px; color: var(--apple-text-secondary); display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Wheelbase (L)</span>
                  <span id="val-wheelbase" style="font-weight: 700; color: #60a5fa;">488.8 mm (0.489 m)</span>
                </label>
                <input type="range" id="input-wheelbase" min="300" max="800" step="0.1" value="488.8" oninput="updateLBSimulation()" style="width: 100%; accent-color: #3b82f6;">
                <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--apple-text-tertiary); margin-top: 4px;">
                  <span>300 mm (Pitch Risk)</span>
                  <span>Physical: 488.8 mm</span>
                  <span>800 mm (Excess Scrub)</span>
                </div>
              </div>

              <div>
                <label style="font-size: 12.5px; color: var(--apple-text-secondary); display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Track Width (B)</span>
                  <span id="val-trackwidth" style="font-weight: 700; color: #c084fc;">575.0 mm (0.575 m)</span>
                </label>
                <input type="range" id="input-trackwidth" min="400" max="850" step="0.1" value="575.0" oninput="updateLBSimulation()" style="width: 100%; accent-color: #a855f7;">
                <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--apple-text-tertiary); margin-top: 4px;">
                  <span>400 mm (Narrow)</span>
                  <span>Physical: 575.0 mm</span>
                  <span>850 mm (Wide Stance)</span>
                </div>
              </div>

              <div>
                <label style="font-size: 12.5px; color: var(--apple-text-secondary); display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Pavement Friction (&mu;)</span>
                  <span style="font-weight: 700; color: #34d399;">Selected Surface</span>
                </label>
                <select id="select-friction" onchange="updateLBSimulation()" style="width: 100%; background: #0f172a; color: #f8fafc; border: 1px solid var(--apple-border); border-radius: 6px; padding: 7px 10px; font-size: 13px;">
                  <option value="0.80" selected="">Dry Runway Asphalt / Concrete (&mu; = 0.80)</option>
                  <option value="0.50">Wet Tropical Rain Tarmac (&mu; = 0.50)</option>
                  <option value="0.95">High-Traction Rubberized Apron (&mu; = 0.95)</option>
                  <option value="0.25">Ice / Aviation Oil Contamination (&mu; = 0.25)</option>
                </select>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                  <button type="button" class="bt-toolbar-btn" onclick="setPresetLB(488.8, 575.0)" style="font-size: 11px; padding: 4px 8px; flex: 1;">Hunter Physical (0.85)</button>
                  <button type="button" class="bt-toolbar-btn" onclick="setPresetLB(498.0, 583.0)" style="font-size: 11px; padding: 4px 8px; flex: 1;">AgileX Scout (0.85)</button>
                </div>
              </div>
            </div>

            <!-- Dynamic Metrics Output Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px;">
              <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px; border: 1px solid var(--apple-border);">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block; text-transform: uppercase;">Scrub Torque (M<sub>scrub</sub>)</span>
                <span id="metric-m-scrub" style="font-size: 20px; font-weight: 800; color: #fbbf24; display: block; margin: 4px 0;">124.63 Nm</span>
                <span style="font-size: 11px; color: var(--apple-text-secondary);">0.5 &mu; m g L yaw resistance</span>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px; border: 1px solid var(--apple-border);">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block; text-transform: uppercase;">Shaft Torque (&tau;<sub>shaft</sub>)</span>
                <span id="metric-tau-wheel" style="font-size: 20px; font-weight: 800; color: #38bdf8; display: block; margin: 4px 0;">14.25 Nm</span>
                <span id="metric-tau-sub" style="font-size: 11px; color: #10b981;">Cont: 14.25 Nm | Elec: 16.77 Nm</span>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px; border: 1px solid var(--apple-border);">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block; text-transform: uppercase;">Braking Load Shift (&Delta;N)</span>
                <span id="metric-delta-n" style="font-size: 20px; font-weight: 800; color: #f43f5e; display: block; margin: 4px 0;">208.7 N</span>
                <span id="metric-deltan-sub" style="font-size: 11px; color: var(--apple-text-secondary);">Friction 0.8g (208.7 N) / Struct 1.0g (260.8 N)</span>
              </div>
              <div id="metric-nfront-card" style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px; border: 1px solid var(--apple-border);">
                <span style="font-size: 11px; color: var(--apple-text-tertiary); display: block; text-transform: uppercase;">Rear Axle Normal (N<sub>rear</sub>)</span>
                <span id="metric-n-front" style="font-size: 20px; font-weight: 800; color: #34d399; display: block; margin: 4px 0;">+110.1 N</span>
                <span id="metric-nfront-sub" style="font-size: 11px; color: #34d399;">Positive Calculated Rear-Axle Load</span>
              </div>
            </div>

            <!-- Dynamic Chassis SVG Canvas -->
            <div style="text-align: center; padding: 14px; background: rgba(0,0,0,0.4); border-radius: 8px; border: 1px solid var(--apple-border);">
              <span id="sim-aspect-ratio-label" style="font-size: 12.5px; font-weight: 700; color: var(--apple-text-primary); display: block; margin-bottom: 10px;">
                Chassis Footprint: Wheelbase L = 488.8 mm, Track Width B = 575.0 mm (L/B = 0.850)
              </span>
              <svg id="interactive-chassis-svg" viewBox="-250 -200 500 400" width="100%" height="280" style="max-width: 580px; margin: 0 auto; display: block;"></svg>
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
