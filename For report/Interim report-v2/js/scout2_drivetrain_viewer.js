/**
 * ==============================================================================
 * CDE4301 Runway Patrol — AgileX Scout 2.0 Illustrative Vehicle Dynamics & Drivetrain Viewer
 * Phase 5.8: High-fidelity Three.js 3D simulation of electric drivetrain vehicle dynamics.
 *
 * Demonstrates the 4 Authoritative Powertrain Operating Cases:
 * 1. Flat Cruising (15 km/h)
 * 2. 5° Slope Incline Climbing (Airside Embankment Verge)
 * 3. Dynamic Linear Acceleration (0 -> 15 km/h in 3.0 s)
 * 4. In-Place Zero-Radius Skid-Steer Pivot (Peak Torque Sizing Case)
 *
 * Sizing Calculations use Custom CDE4301 UGV Specifications:
 * - Mass m = 65.0 kg (design limit)
 * - Wheel radius r = 0.1315 m (D = 263 mm pneumatic hub)
 * - Wheelbase L = 0.4888 m, Track B = 0.5750 m (L/B = 0.8500)
 * - Motors: 4x ZLLG80ASM250-4096 48V direct-drive hub motors
 * - Dynamometer data: Certified Shenzhen Zhongling Technology Report FA2201060003
 * ==============================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Scout2DrivetrainViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`[Scout2DrivetrainViewer] Container #${containerId} not found.`);
      return;
    }

    // 35-Point Certified Factory Dynamometer Data (Report No. FA2201060003)
    this.dynamoData = [
      { t: 0.00, rpm: 415.6, pout: 0.00, u: 48.01, i: 0.970, pin: 45.92, eff: 0.0 },
      { t: 0.01, rpm: 416.1, pout: 0.44, u: 48.01, i: 0.931, pin: 44.25, eff: 1.0 },
      { t: 0.11, rpm: 414.6, pout: 4.77, u: 48.00, i: 1.038, pin: 45.57, eff: 10.5 },
      { t: 0.26, rpm: 413.3, pout: 11.24, u: 48.01, i: 1.145, pin: 46.75, eff: 24.1 },
      { t: 0.46, rpm: 411.4, pout: 19.80, u: 48.01, i: 1.321, pin: 56.02, eff: 35.3 },
      { t: 0.67, rpm: 409.3, pout: 28.70, u: 48.01, i: 1.608, pin: 68.45, eff: 41.9 },
      { t: 0.96, rpm: 406.8, pout: 40.86, u: 48.01, i: 1.740, pin: 89.61, eff: 45.6 },
      { t: 1.27, rpm: 404.1, pout: 53.70, u: 48.01, i: 2.016, pin: 93.01, eff: 57.7 },
      { t: 1.62, rpm: 401.3, pout: 68.03, u: 48.01, i: 2.343, pin: 110.27, eff: 61.7 },
      { t: 2.05, rpm: 397.8, pout: 85.33, u: 48.01, i: 2.692, pin: 133.78, eff: 63.8 },
      { t: 2.49, rpm: 393.0, pout: 102.40, u: 48.01, i: 3.078, pin: 145.27, eff: 70.5 },
      { t: 2.96, rpm: 387.5, pout: 120.02, u: 48.00, i: 3.514, pin: 171.74, eff: 69.9 },
      { t: 3.76, rpm: 381.0, pout: 149.90, u: 48.00, i: 4.223, pin: 204.67, eff: 73.2 },
      { t: 4.36, rpm: 376.1, pout: 171.59, u: 48.00, i: 4.751, pin: 226.61, eff: 75.7 },
      { t: 4.97, rpm: 371.0, pout: 192.94, u: 48.00, i: 5.284, pin: 253.06, eff: 76.2 },
      { t: 5.64, rpm: 364.8, pout: 215.29, u: 48.00, i: 5.849, pin: 281.24, eff: 76.6 },
      { t: 6.29, rpm: 359.2, pout: 236.79, u: 48.00, i: 6.449, pin: 309.36, eff: 76.5 },
      { t: 6.65, rpm: 356.1, pout: 248.17, u: 48.00, i: 6.757, pin: 324.00, eff: 76.6 },
      { t: 6.99, rpm: 352.7, pout: 258.34, u: 48.00, i: 7.106, pin: 340.88, eff: 75.8 },
      { t: 7.72, rpm: 345.7, pout: 279.62, u: 48.00, i: 7.733, pin: 372.03, eff: 75.2 },
      { t: 8.49, rpm: 338.6, pout: 301.16, u: 48.00, i: 8.385, pin: 401.54, eff: 75.0 },
      { t: 9.31, rpm: 329.2, pout: 321.05, u: 48.00, i: 9.064, pin: 435.49, eff: 73.7 },
      { t: 10.12, rpm: 321.5, pout: 340.79, u: 48.00, i: 9.768, pin: 468.50, eff: 72.7 },
      { t: 10.96, rpm: 313.5, pout: 359.86, u: 48.00, i: 10.482, pin: 503.74, eff: 71.4 },
      { t: 11.79, rpm: 304.6, pout: 376.10, u: 48.00, i: 11.192, pin: 537.98, eff: 69.9 },
      { t: 12.66, rpm: 295.9, pout: 392.30, u: 48.00, i: 11.989, pin: 576.80, eff: 68.0 },
      { t: 13.55, rpm: 286.3, pout: 406.23, u: 47.99, i: 12.724, pin: 612.17, eff: 66.4 },
      { t: 14.39, rpm: 277.8, pout: 418.59, u: 47.99, i: 13.492, pin: 649.23, eff: 64.5 },
      { t: 15.29, rpm: 269.1, pout: 430.82, u: 47.99, i: 14.280, pin: 686.06, eff: 62.8 },
      { t: 16.20, rpm: 260.3, pout: 441.52, u: 47.99, i: 15.087, pin: 726.65, eff: 60.8 },
      { t: 17.07, rpm: 251.2, pout: 448.95, u: 47.99, i: 15.926, pin: 765.26, eff: 58.7 },
      { t: 18.01, rpm: 242.3, pout: 456.88, u: 47.99, i: 16.784, pin: 807.19, eff: 56.6 },
      { t: 18.89, rpm: 233.4, pout: 461.84, u: 47.99, i: 17.661, pin: 849.03, eff: 54.4 },
      { t: 19.80, rpm: 224.3, pout: 465.19, u: 47.99, i: 18.747, pin: 899.87, eff: 51.7 },
      { t: 20.72, rpm: 215.1, pout: 466.81, u: 47.99, i: 19.686, pin: 946.24, eff: 49.3 },
      { t: 28.50, rpm: 108.7, pout: 324.39, u: 48.36, i: 28.742, pin: 1380.28, eff: 23.5 }
    ];

    // Verified Custom UGV Design Parameters
    this.ugv = {
      mass: 65.0,             // kg (total design curb + payload)
      radius: 0.1315,         // m (confirmed wheel radius for 263 mm tire)
      wheelbase: 0.4888,      // m (L)
      trackwidth: 0.5750,     // m (B)
      numMotors: 4,
      eta: 0.85,              // nominal drivetrain mechanical transmission factor
      C_rr: 0.025,            // rolling resistance on asphalt
      rho: 1.204,             // kg/m^3 air density
      Cd: 0.80,               // aerodynamic drag coefficient
      A: 0.35,                // m^2 frontal area
      mu_skid: 0.80,          // lateral tire scrubbing friction coefficient
      ratedTorque: 15.0,      // Nm continuous thermal rating
      stallTorque: 28.5       // Nm peak measured bench stall torque
    };

    // AgileX Scout 2.0 Simulation Proxy Geometry (for 3D rendering)
    this.proxy = {
      wheelbase: 0.498,       // L (m)
      trackwidth: 0.58306,    // B (m)
      wheelRadius: 0.16459,   // r (m)
      wheelYOffset: -0.0702,  // axle vertical offset in mesh
      contactY: 0.2352        // ground clearance lift
    };

    // State Variables
    this.state = {
      scenario: 'slope',      // 'cruise', 'slope', 'accel', 'pivot'
      speedKmh: 15.0,         // target transit speed
      slopeDeg: 5.0,          // degrees
      accelMps2: 1.389,       // m/s^2 (0 -> 15 km/h in 3 s)
      isPlaying: true,
      showVectors: true,
      showRamp: true,
      showDimensions: true,
      
      // Dynamic forces
      Frr: 0,
      Faero: 0,
      Fgrade: 0,
      Facc: 0,
      Ftotal: 0,
      torquePerMotor: 0,
      wheelRpm: 0,
      
      // Motor electrical metrics from dynamometer interpolation
      phaseCurrent: 0,
      busCurrent: 0,
      mechPower: 0,
      elecPower: 0,
      efficiency: 0,
      headroomRatio: 0,

      // Animation time & pitch
      simTime: 0,
      pitchAngle: 0
    };

    this.wheels = { fl: null, fr: null, rl: null, rr: null };
    this.wheelRotAngle = 0;
    this.yawAngle = 0;
    this.cameraTargetPos = null;

    this.init();
  }

  init() {
    this.buildDOM();
    this.initThree();
    this.setupGroundAndLighting();
    this.setupForceVectors();
    this.loadModel();
    this.bindEvents();
    this.setScenario('slope'); // Default to the most visually developed scenario

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildDOM() {
    this.container.innerHTML = `
      <div class="scout-drivetrain-wrapper" style="position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #0c0f17; border: 1px solid rgba(255, 255, 255, 0.12); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- TOP TOOLBAR -->
        <div class="drivetrain-top-bar" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 12px 18px; background: rgba(18, 22, 34, 0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255, 255, 255, 0.08); gap: 10px; z-index: 10;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; box-shadow: 0 0 10px #3b82f6;"></div>
            <div>
              <div style="font-size: 14.5px; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em;">
                AgileX Scout 2.0 &mdash; Illustrative Vehicle Dynamics Visualization
              </div>
              <div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 6px;">
                <span>Illustrative Simulation Proxy</span>
                <span>&bull;</span>
                <span style="color: #10b981;">Custom UGV Calculations (m=65kg, r=0.1315m)</span>
                <span>&bull;</span>
                <span style="color: #38bdf8;">ZLLG80ASM250-4096 Validation</span>
              </div>
            </div>
          </div>

          <!-- OPERATING SCENARIO TABS -->
          <div class="scout-scenario-tabs" style="display: flex; gap: 6px; background: rgba(0, 0, 0, 0.4); padding: 3px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); overflow-x: auto; max-width: 100%;">
            <button class="scout-case-btn" data-case="cruise" style="background: transparent; border: none; padding: 6px 12px; border-radius: 6px; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
              Case 1: Cruise (15 km/h)
            </button>
            <button class="scout-case-btn active" data-case="slope" style="background: #f59e0b; border: none; padding: 6px 12px; border-radius: 6px; color: #000; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4); white-space: nowrap;">
              Case 2: 5° Incline Slope
            </button>
            <button class="scout-case-btn" data-case="accel" style="background: transparent; border: none; padding: 6px 12px; border-radius: 6px; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
              Case 3: Acceleration (1.39 m/s²)
            </button>
            <button class="scout-case-btn" data-case="pivot" style="background: transparent; border: none; padding: 6px 12px; border-radius: 6px; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
              Case 4: R=0 Skid Pivot
            </button>
          </div>

          <!-- PLAY & RESET -->
          <div style="display: flex; gap: 8px;">
            <button id="scout-drive-play-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #f8fafc; font-size: 12px; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
              <span id="scout-drive-play-icon">⏸</span> Pause
            </button>
            <button id="scout-drive-reset-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #f8fafc; font-size: 12px; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
              ↺ Reset
            </button>
          </div>
        </div>

        <!-- 3D VIEWPORT CONTAINER -->
        <div id="scout-drive-canvas-container" style="position: relative; width: 100%; height: 500px; overflow: hidden; background: radial-gradient(circle at 50% 30%, #151b2b 0%, #080b12 100%);">
          <canvas id="scout-drive-canvas" style="display: block; width: 100%; height: 100%;"></canvas>

          <!-- LOADING OVERLAY -->
          <div id="scout-drive-loading" style="position: absolute; inset: 0; background: rgba(12, 15, 23, 0.92); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; z-index: 20; transition: opacity 0.4s ease;">
            <div style="width: 44px; height: 44px; border: 3px solid rgba(59, 130, 246, 0.2); border-top-color: #3b82f6; border-radius: 50%; animation: scout-spin 1s linear infinite;"></div>
            <div style="color: #f8fafc; font-size: 13.5px; font-weight: 500;">Loading 3D AgileX Vehicle Dynamics Asset...</div>
            <div style="color: #94a3b8; font-size: 11.5px;">scout_v2.glb (Authentic Gazebo Simulation Model)</div>
          </div>

          <!-- FLOATING TELEMETRY HUD (LEFT) -->
          <div class="scout-drive-hud" style="position: absolute; top: 14px; left: 14px; background: rgba(15, 23, 42, 0.82); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 14px 16px; max-width: 320px; pointer-events: none; z-index: 5; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8;">Drivetrain Telemetry</span>
              <span id="drive-hud-case-badge" style="font-size: 10.5px; padding: 2px 7px; border-radius: 4px; background: rgba(245, 158, 11, 0.25); color: #fbbf24; font-weight: 700;">CASE 2: SLOPE</span>
            </div>

            <!-- FORCES SECTION -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11.5px; margin-bottom: 8px;">
              <div>
                <span style="color: #94a3b8;">Total Force ($F_{\\text{total}}$):</span>
                <div id="hud-ftotal" style="font-weight: 700; color: #f8fafc; font-family: 'JetBrains Mono', monospace; font-size: 13px;">74.44 N</div>
              </div>
              <div>
                <span style="color: #94a3b8;">Torque / Motor ($\\tau_m$):</span>
                <div id="hud-torque" style="font-weight: 700; color: #f59e0b; font-family: 'JetBrains Mono', monospace; font-size: 13px;">2.88 Nm</div>
              </div>
              <div>
                <span style="color: #94a3b8;">Phase Current ($I_m$):</span>
                <div id="hud-current-phase" style="font-weight: 700; color: #10b981; font-family: 'JetBrains Mono', monospace;">3.44 A</div>
              </div>
              <div>
                <span style="color: #94a3b8;">4-Motor Bus Current:</span>
                <div id="hud-current-bus" style="font-weight: 700; color: #10b981; font-family: 'JetBrains Mono', monospace;">13.76 A</div>
              </div>
              <div>
                <span style="color: #94a3b8;">Wheel Speed ($N$):</span>
                <div id="hud-rpm" style="font-weight: 700; color: #38bdf8; font-family: 'JetBrains Mono', monospace;">302.6 RPM (15 km/h)</div>
              </div>
              <div>
                <span style="color: #94a3b8;">Motor Efficiency ($\\eta$):</span>
                <div id="hud-eff" style="font-weight: 700; color: #38bdf8; font-family: 'JetBrains Mono', monospace;">70.0% (Measured)</div>
              </div>
            </div>

            <!-- POWER & HEADROOM -->
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 6px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Mechanical Power ($P_{\\text{mech}}$):</span>
                <span id="hud-pmech" style="font-weight: 700; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;">310.2 W (77.5 W/m)</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Electrical Input ($P_{\\text{elec}}$):</span>
                <span id="hud-pelec" style="font-weight: 600; color: #94a3b8; font-family: 'JetBrains Mono', monospace;">443.1 W (Total Bus)</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Motor Safety Headroom:</span>
                <span id="hud-headroom" style="font-weight: 700; color: #10b981; font-family: 'JetBrains Mono', monospace;">5.2x Continuous Margin</span>
              </div>
            </div>
          </div>

          <!-- CAMERA PRESETS BAR (BOTTOM RIGHT) -->
          <div style="position: absolute; bottom: 14px; right: 14px; display: flex; gap: 6px; z-index: 5; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(10px); padding: 4px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <button class="scout-drive-cam" data-cam="iso" style="background: rgba(255, 255, 255, 0.15); border: none; color: #fff; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">Isometric</button>
            <button class="scout-drive-cam" data-cam="side" style="background: transparent; border: none; color: #94a3b8; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">Side Elevation</button>
            <button class="scout-drive-cam" data-cam="top" style="background: transparent; border: none; color: #94a3b8; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">Top (Plan)</button>
            <button class="scout-drive-cam" data-cam="front" style="background: transparent; border: none; color: #94a3b8; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">Front</button>
          </div>
        </div>

        <!-- CONTROLS & INTERACTIVE SLIDERS BAR -->
        <div style="padding: 14px 18px; background: rgba(18, 22, 34, 0.95); border-top: 1px solid rgba(255, 255, 255, 0.08);">
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; align-items: center; margin-bottom: 12px;">
            
            <!-- SLOPE ANGLE SLIDER (ACTIVE IN CASE 2) -->
            <div id="ctrl-slope-group">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                <label for="scout-slope-slider" style="color: #f8fafc; font-weight: 600;">Incline Slope Angle ($\\theta$):</label>
                <span id="scout-slope-val" style="color: #f59e0b; font-weight: 700; font-family: 'JetBrains Mono', monospace;">5.0° (8.75% grade)</span>
              </div>
              <input type="range" id="scout-slope-slider" min="0" max="15" step="0.5" value="5.0" style="width: 100%; accent-color: #f59e0b; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-top: 2px;">
                <span>Flat (0°)</span>
                <span style="color: #f59e0b; font-weight: 600;">Airside Design Limit (5.0°)</span>
                <span>Culvert Check (15.0°)</span>
              </div>
            </div>

            <!-- SPEED SLIDER (ACTIVE IN CASES 1 & 2) -->
            <div id="ctrl-speed-group">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                <label for="scout-speed-kmh-slider" style="color: #f8fafc; font-weight: 600;">Vehicle Speed ($v$):</label>
                <span id="scout-speed-kmh-val" style="color: #38bdf8; font-weight: 700; font-family: 'JetBrains Mono', monospace;">15.0 km/h (4.17 m/s)</span>
              </div>
              <input type="range" id="scout-speed-kmh-slider" min="0" max="20" step="1" value="15" style="width: 100%; accent-color: #38bdf8; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-top: 2px;">
                <span>Standstill (0)</span>
                <span>Sweep Speed (10 km/h)</span>
                <span style="color: #38bdf8; font-weight: 600;">Cruise Target (15 km/h)</span>
                <span>Max (20 km/h)</span>
              </div>
            </div>

            <!-- ACCELERATION SLIDER (ACTIVE IN CASE 3) -->
            <div id="ctrl-accel-group" style="display: none;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                <label for="scout-accel-slider" style="color: #f8fafc; font-weight: 600;">Linear Acceleration ($a$):</label>
                <span id="scout-accel-val" style="color: #60a5fa; font-weight: 700; font-family: 'JetBrains Mono', monospace;">1.389 m/s² (3.0 s to 15 km/h)</span>
              </div>
              <input type="range" id="scout-accel-slider" min="0.5" max="2.5" step="0.1" value="1.389" style="width: 100%; accent-color: #60a5fa; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-top: 2px;">
                <span>Gentle (0.5 m/s²)</span>
                <span style="color: #60a5fa; font-weight: 600;">Design Spec (1.389 m/s²)</span>
                <span>Aggressive (2.5 m/s²)</span>
              </div>
            </div>

          </div>

          <!-- TOGGLE CHECKBOXES -->
          <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: #cbd5e1; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="toggle-drive-vectors" checked style="accent-color: #10b981;">
              <span>3D Force Vectors (Traction, Resistance, Gravity)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="toggle-drive-ramp" checked style="accent-color: #f59e0b;">
              <span>Incline Runway Ramp Geometry</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="toggle-drive-dims" checked style="accent-color: #3b82f6;">
              <span>Chassis Sizing Calipers</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="toggle-drive-equations" checked style="accent-color: #a855f7;">
              <span>Live Governing Equation Card</span>
            </label>
          </div>

          <!-- LIVE GOVERNING EQUATION CARD (EXPANDABLE) -->
          <div id="drive-equation-card" style="margin-top: 12px; padding: 12px 16px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; font-size: 12.5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #f8fafc;" id="eq-card-title">Case 2: Incline Slope Governing Equations</strong>
              <span style="font-size: 11px; color: #94a3b8;">Analytical Mechanics (Gillespie, 1992; Siegwart, 2011)</span>
            </div>
            <div id="eq-card-math" style="font-size: 13px; color: #e2e8f0; overflow-x: auto;">
              <!-- Dynamic MathJax updated per case -->
            </div>
          </div>

          <!-- RECONCILIATION PROVENANCE NOTE -->
          <div style="margin-top: 12px; padding: 10px 14px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 6px; font-size: 11.5px; color: #94a3b8; line-height: 1.5;">
            <strong style="color: #38bdf8;">Provenance &amp; Parameter Reconciliation:</strong> 
            This 3D vehicle dynamics visualizer utilizes the authentic <strong>AgileX Scout 2.0 simulation proxy</strong> ($L=0.498\\text{ m}, B=0.583\\text{ m}, r=0.165\\text{ m}$) employed during Semester 1 Gazebo Harmonic simulation to illustrate physical forces, incline pitch, and wheel scrubbing. All numerical outputs, force equations, and torque ratings in the telemetry panel strictly reflect the final custom CDE4301 UGV design parameters ($m=65.0\\text{ kg}, r=0.1315\\text{ m}, L=0.4888\\text{ m}, B=0.5750\\text{ m}$) and certified factory load-test bench measurements for the purchased <strong>ZLLG80ASM250-4096 48V direct-drive hub motors</strong> (Report FA2201060003).
          </div>

        </div>
      </div>
      
      <style>
        .scout-case-btn:hover:not(.active) {
          color: #f8fafc !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .scout-drive-cam:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          color: #fff !important;
        }
        @media (max-width: 768px) {
          .drivetrain-top-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .scout-scenario-tabs {
            width: 100% !important;
            justify-content: flex-start !important;
            scrollbar-width: thin;
          }
          .scout-case-btn {
            white-space: nowrap !important;
          }
          .scout-drive-hud {
            top: 8px !important;
            left: 8px !important;
            padding: 8px 10px !important;
            max-width: 260px !important;
            font-size: 10.5px !important;
          }
          #scout-drive-canvas-container {
            height: 380px !important;
          }
        }
      </style>
    `;

    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([this.container]).catch(() => {});
    }
  }

  initThree() {
    const canvas = document.getElementById('scout-drive-canvas');
    const container = document.getElementById('scout-drive-canvas-container');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e18);
    this.scene.fog = new THREE.FogExp2(0x0a0e18, 0.055);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    this.camera.position.set(2.8, 1.8, 2.8);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // OrbitControls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 10.0;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.controls.target.set(0, 0.25, 0);
    this.controls.update();

    // Resize Observer
    this.resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    });
    this.resizeObserver.observe(container);
  }

  setupGroundAndLighting() {
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    this.mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.mainLight.position.set(5, 8, 6);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 2048;
    this.mainLight.shadow.mapSize.height = 2048;
    this.mainLight.shadow.camera.near = 0.5;
    this.mainLight.shadow.camera.far = 25;
    this.mainLight.shadow.camera.left = -6;
    this.mainLight.shadow.camera.right = 6;
    this.mainLight.shadow.camera.top = 6;
    this.mainLight.shadow.camera.bottom = -6;
    this.mainLight.shadow.bias = -0.0005;
    this.scene.add(this.mainLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rimLight.position.set(-5, 4, -5);
    this.scene.add(rimLight);

    // Static Base Airside Ground
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0c111d,
      roughness: 0.9,
      metalness: 0.1
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Ambient Airside Grid
    const grid = new THREE.GridHelper(20, 40, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.001;
    this.scene.add(grid);

    // INCLINE RUNWAY RAMP GROUP (Hinged at x = 0, tilts by slopeDeg around Z)
    this.rampGroup = new THREE.Group();
    this.scene.add(this.rampGroup);

    // Ramp Slab (8m long along X, 3m wide along Z)
    const rampGeo = new THREE.BoxGeometry(8, 0.08, 2.6);
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.85,
      metalness: 0.2
    });
    this.rampMesh = new THREE.Mesh(rampGeo, rampMat);
    this.rampMesh.position.set(0, -0.04, 0);
    this.rampMesh.receiveShadow = true;
    this.rampGroup.add(this.rampMesh);

    // Ramp Runway Centerline Dashes (Yellow)
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    for (let x = -3.2; x <= 3.2; x += 1.6) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.08), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.002, 0);
      this.rampGroup.add(dash);
    }

    // Ramp Side Safety Edges (White)
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const edge1 = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 0.05), edgeMat);
    edge1.rotation.x = -Math.PI / 2;
    edge1.position.set(0, 0.002, 1.25);
    this.rampGroup.add(edge1);

    const edge2 = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 0.05), edgeMat);
    edge2.rotation.x = -Math.PI / 2;
    edge2.position.set(0, 0.002, -1.25);
    this.rampGroup.add(edge2);

    // Dynamic Robot Parent Group (mounted on the ramp surface)
    this.vehicleGroup = new THREE.Group();
    this.rampGroup.add(this.vehicleGroup);
  }

  setupForceVectors() {
    // Helper to create high-visibility arrow
    const createArrow = (color) => {
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        0.5,
        color,
        0.12,
        0.07
      );
      arrow.visible = true;
      return arrow;
    };

    this.vectors = {
      // 1. Gravity (W = mg): strictly vertically downward in WORLD coordinates
      gravity: createArrow(0xa855f7),

      // 2. Normal Reaction (N = mg cos theta): perpendicular to surface
      normal_fl: createArrow(0x38bdf8),
      normal_fr: createArrow(0x38bdf8),
      normal_rl: createArrow(0x38bdf8),
      normal_rr: createArrow(0x38bdf8),

      // 3. Grade Resistance (F_grade = mg sin theta): parallel down slope
      grade: createArrow(0xf43f5e),

      // 4. Rolling Resistance (F_rr): parallel backwards
      rr_fl: createArrow(0xf59e0b),
      rr_fr: createArrow(0xf59e0b),
      rr_rl: createArrow(0xf59e0b),
      rr_rr: createArrow(0xf59e0b),

      // 5. Aerodynamic Drag (F_aero): parallel backwards from frontal center
      aero: createArrow(0x06b6d4),

      // 6. Inertial Acceleration Resistance (F_acc = ma): parallel backwards from CG
      accel: createArrow(0xec4899),

      // 7. Driving Traction Force (F_drive): parallel forward at contact patches
      drive_fl: createArrow(0x10b981),
      drive_fr: createArrow(0x10b981),
      drive_rl: createArrow(0x10b981),
      drive_rr: createArrow(0x10b981),

      // 8. Lateral Scrub Resistance (Case 4 Pivot)
      scrub_fl: createArrow(0xf43f5e),
      scrub_fr: createArrow(0xf43f5e),
      scrub_rl: createArrow(0xf43f5e),
      scrub_rr: createArrow(0xf43f5e)
    };

    // Gravity is added to world scene directly so it stays world-downwards
    this.scene.add(this.vectors.gravity);

    // Other vectors are attached to vehicleGroup so they transform with the robot
    Object.entries(this.vectors).forEach(([key, arrow]) => {
      if (key !== 'gravity') {
        this.vehicleGroup.add(arrow);
      }
    });

    // Yaw Pivot Moment Ring (for Case 4)
    this.yawRing = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.40, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
    );
    this.yawRing.rotation.x = -Math.PI / 2;
    this.yawRing.position.y = 0.02;
    this.yawRing.visible = false;
    this.vehicleGroup.add(this.yawRing);
  }

  loadModel() {
    const loader = new GLTFLoader();
    const modelUrl = '../../assets/models/scout_v2.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;
        this.robotRoot = root;

        this.wheels.fl = root.getObjectByName('wheel_fl');
        this.wheels.fr = root.getObjectByName('wheel_fr');
        this.wheels.rl = root.getObjectByName('wheel_rl');
        this.wheels.rr = root.getObjectByName('wheel_rr');

        console.log('[Scout2DrivetrainViewer] Model linked:', {
          fl: !!this.wheels.fl,
          fr: !!this.wheels.fr,
          rl: !!this.wheels.rl,
          rr: !!this.wheels.rr
        });

        root.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            if (node.material) {
              node.material.roughness = 0.55;
              node.material.metalness = 0.25;
            }
          }
        });

        // Lift model so wheels touch ramp surface at y = 0
        root.position.y = this.proxy.contactY;
        this.vehicleGroup.add(root);

        // Hide loading
        const overlay = document.getElementById('scout-drive-loading');
        if (overlay) {
          overlay.style.opacity = '0';
          setTimeout(() => overlay.remove(), 400);
        }
      },
      undefined,
      (err) => {
        console.error('[Scout2DrivetrainViewer] Error loading scout_v2.glb:', err);
        const overlay = document.getElementById('scout-drive-loading');
        if (overlay) {
          overlay.innerHTML = `
            <div style="color: #ef4444; font-weight: 600;">Failed to load scout_v2.glb</div>
            <div style="color: #94a3b8; font-size: 11px;">${err.message}</div>
          `;
        }
      }
    );
  }

  bindEvents() {
    // Scenario Buttons
    const caseBtns = this.container.querySelectorAll('.scout-case-btn');
    caseBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        caseBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = '#94a3b8';
          b.style.boxShadow = 'none';
        });
        btn.classList.add('active');
        btn.style.color = '#000';
        
        const c = btn.dataset.case;
        if (c === 'cruise') {
          btn.style.background = '#10b981';
          btn.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.4)';
        } else if (c === 'slope') {
          btn.style.background = '#f59e0b';
          btn.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.4)';
        } else if (c === 'accel') {
          btn.style.background = '#3b82f6';
          btn.style.color = '#fff';
          btn.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.4)';
        } else if (c === 'pivot') {
          btn.style.background = '#f43f5e';
          btn.style.color = '#fff';
          btn.style.boxShadow = '0 2px 8px rgba(244, 63, 94, 0.4)';
        }

        this.setScenario(c);
      });
    });

    // Play / Pause
    const playBtn = document.getElementById('scout-drive-play-btn');
    playBtn.addEventListener('click', () => {
      this.state.isPlaying = !this.state.isPlaying;
      playBtn.innerHTML = this.state.isPlaying ? '<span>⏸</span> Pause' : '<span>▶</span> Play';
      playBtn.style.borderColor = this.state.isPlaying ? 'rgba(255, 255, 255, 0.15)' : '#38bdf8';
    });

    // Reset View
    const resetBtn = document.getElementById('scout-drive-reset-btn');
    resetBtn.addEventListener('click', () => {
      this.setScenario(this.state.scenario);
      this.setCameraPreset('iso');
    });

    // Sliders
    const slopeSlider = document.getElementById('scout-slope-slider');
    const slopeVal = document.getElementById('scout-slope-val');
    slopeSlider.addEventListener('input', (e) => {
      this.state.slopeDeg = parseFloat(e.target.value);
      const gradePct = (Math.tan(this.state.slopeDeg * Math.PI / 180) * 100).toFixed(2);
      slopeVal.textContent = `${this.state.slopeDeg.toFixed(1)}° (${gradePct}% grade)`;
      this.updatePhysics();
    });

    const speedSlider = document.getElementById('scout-speed-kmh-slider');
    const speedVal = document.getElementById('scout-speed-kmh-val');
    speedSlider.addEventListener('input', (e) => {
      this.state.speedKmh = parseFloat(e.target.value);
      const mps = (this.state.speedKmh / 3.6).toFixed(2);
      speedVal.textContent = `${this.state.speedKmh.toFixed(1)} km/h (${mps} m/s)`;
      this.updatePhysics();
    });

    const accelSlider = document.getElementById('scout-accel-slider');
    const accelVal = document.getElementById('scout-accel-val');
    accelSlider.addEventListener('input', (e) => {
      this.state.accelMps2 = parseFloat(e.target.value);
      const timeToCruise = (4.167 / this.state.accelMps2).toFixed(1);
      accelVal.textContent = `${this.state.accelMps2.toFixed(3)} m/s² (${timeToCruise} s to 15 km/h)`;
      this.updatePhysics();
    });

    // Camera Presets
    const camBtns = this.container.querySelectorAll('.scout-drive-cam');
    camBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        camBtns.forEach(b => {
          b.style.background = 'transparent';
          b.style.color = '#94a3b8';
        });
        btn.style.background = 'rgba(255, 255, 255, 0.15)';
        btn.style.color = '#fff';
        this.setCameraPreset(btn.dataset.cam);
      });
    });

    // Toggles
    document.getElementById('toggle-drive-vectors').addEventListener('change', (e) => {
      this.state.showVectors = e.target.checked;
      Object.values(this.vectors).forEach(v => v.visible = this.state.showVectors);
      if (this.yawRing) this.yawRing.visible = this.state.showVectors && (this.state.scenario === 'pivot');
    });

    document.getElementById('toggle-drive-ramp').addEventListener('change', (e) => {
      this.state.showRamp = e.target.checked;
      this.rampMesh.visible = this.state.showRamp;
    });

    document.getElementById('toggle-drive-equations').addEventListener('change', (e) => {
      const card = document.getElementById('drive-equation-card');
      if (card) card.style.display = e.target.checked ? 'block' : 'none';
    });
  }

  setScenario(scenario) {
    this.state.scenario = scenario;
    const badge = document.getElementById('drive-hud-case-badge');
    const slopeGroup = document.getElementById('ctrl-slope-group');
    const speedGroup = document.getElementById('ctrl-speed-group');
    const accelGroup = document.getElementById('ctrl-accel-group');

    // UI Configuration per Case
    if (scenario === 'cruise') {
      badge.textContent = 'CASE 1: FLAT CRUISE';
      badge.style.background = 'rgba(16, 185, 129, 0.25)';
      badge.style.color = '#34d399';
      this.state.slopeDeg = 0.0;
      this.state.speedKmh = 15.0;
      slopeGroup.style.display = 'none';
      speedGroup.style.display = 'block';
      accelGroup.style.display = 'none';
    } else if (scenario === 'slope') {
      badge.textContent = 'CASE 2: 5° SLOPE';
      badge.style.background = 'rgba(245, 158, 11, 0.25)';
      badge.style.color = '#fbbf24';
      this.state.slopeDeg = 5.0;
      this.state.speedKmh = 15.0;
      slopeGroup.style.display = 'block';
      speedGroup.style.display = 'block';
      accelGroup.style.display = 'none';
    } else if (scenario === 'accel') {
      badge.textContent = 'CASE 3: ACCELERATION';
      badge.style.background = 'rgba(59, 130, 246, 0.25)';
      badge.style.color = '#60a5fa';
      this.state.slopeDeg = 0.0;
      this.state.speedKmh = 15.0;
      this.state.accelMps2 = 1.389;
      slopeGroup.style.display = 'none';
      speedGroup.style.display = 'block';
      accelGroup.style.display = 'block';
    } else if (scenario === 'pivot') {
      badge.textContent = 'CASE 4: R=0 PIVOT';
      badge.style.background = 'rgba(244, 63, 94, 0.25)';
      badge.style.color = '#fb7185';
      this.state.slopeDeg = 0.0;
      this.state.speedKmh = 0.0;
      slopeGroup.style.display = 'none';
      speedGroup.style.display = 'none';
      accelGroup.style.display = 'none';
    }

    // Set slider value readouts
    const slopeSlider = document.getElementById('scout-slope-slider');
    if (slopeSlider) slopeSlider.value = this.state.slopeDeg;
    const speedSlider = document.getElementById('scout-speed-kmh-slider');
    if (speedSlider) speedSlider.value = this.state.speedKmh;
    const accelSlider = document.getElementById('scout-accel-slider');
    if (accelSlider) accelSlider.value = this.state.accelMps2;

    this.updatePhysics();
    this.updateEquationCard();

    // Link with Section 4 dynamometer chart tab if available
    if (window.renderDynamoChart) {
      if (scenario === 'cruise') window.renderDynamoChart('speed');
      else if (scenario === 'slope') window.renderDynamoChart('eff');
      else if (scenario === 'accel') window.renderDynamoChart('power');
      else if (scenario === 'pivot') window.renderDynamoChart('current');
    }
  }

  setCameraPreset(preset) {
    const curTarget = this.controls.target.clone();
    if (preset === 'iso') {
      this.cameraTargetPos = new THREE.Vector3(curTarget.x + 2.8, 1.8, curTarget.z + 2.8);
    } else if (preset === 'side') {
      this.cameraTargetPos = new THREE.Vector3(curTarget.x, 0.6, curTarget.z + 3.2);
    } else if (preset === 'top') {
      this.cameraTargetPos = new THREE.Vector3(curTarget.x + 0.001, 4.2, curTarget.z);
    } else if (preset === 'front') {
      this.cameraTargetPos = new THREE.Vector3(curTarget.x + 3.4, 0.6, curTarget.z);
    }
  }

  interpolateDynamo(torque) {
    const t = Math.max(0, Math.min(28.5, torque));
    const data = this.dynamoData;
    for (let k = 0; k < data.length - 1; k++) {
      if (t >= data[k].t && t <= data[k + 1].t) {
        const p0 = data[k];
        const p1 = data[k + 1];
        const frac = (t - p0.t) / (p1.t - p0.t);
        return {
          t: t,
          rpm: p0.rpm + frac * (p1.rpm - p0.rpm),
          i: p0.i + frac * (p1.i - p0.i),
          pout: p0.pout + frac * (p1.pout - p0.pout),
          pin: p0.pin + frac * (p1.pin - p0.pin),
          eff: p0.eff + frac * (p1.eff - p0.eff)
        };
      }
    }
    return data[data.length - 1];
  }

  updatePhysics() {
    const ugv = this.ugv;
    const g = 9.81;
    const thetaRad = this.state.slopeDeg * (Math.PI / 180);
    const vMps = this.state.speedKmh / 3.6;

    // 1. Calculate Forces using Custom UGV Parameters
    // Rolling Resistance: F_rr = C_rr * m * g * cos(theta)
    const Frr = ugv.C_rr * ugv.mass * g * Math.cos(thetaRad);

    // Aerodynamic Drag: F_aero = 0.5 * rho * Cd * A * v^2
    const Faero = 0.5 * ugv.rho * ugv.Cd * ugv.A * (vMps * vMps);

    // Grade Resistance: F_grade = m * g * sin(theta)
    const Fgrade = ugv.mass * g * Math.sin(thetaRad);

    // Acceleration Force: F_acc = m * a
    let Facc = 0;
    if (this.state.scenario === 'accel') {
      Facc = ugv.mass * this.state.accelMps2;
    }

    // Total Longitudinal Tractive Effort
    let Ftotal = 0;
    let torquePerMotor = 0;
    let wheelRpm = (vMps / (2 * Math.PI * ugv.radius)) * 60;

    if (this.state.scenario === 'cruise') {
      Ftotal = Frr + Faero; // 18.87 N at 15 km/h
      torquePerMotor = (Ftotal * ugv.radius) / (ugv.numMotors * ugv.eta); // 0.73 Nm
    } else if (this.state.scenario === 'slope') {
      Ftotal = Frr + Fgrade + Faero; // 74.44 N at 5 deg
      torquePerMotor = (Ftotal * ugv.radius) / (ugv.numMotors * ugv.eta); // 2.88 Nm
    } else if (this.state.scenario === 'accel') {
      Ftotal = Frr + Facc + Faero; // 109.15 N
      torquePerMotor = (Ftotal * ugv.radius) / (ugv.numMotors * ugv.eta); // 4.22 Nm
    } else if (this.state.scenario === 'pivot') {
      // Zero-Radius Skid-Steer Pivot Equation from Section 3:
      // F_skid = m * g * mu_skid = 510.12 N
      // F_x = 127.53 * (L / B) = 102.02 N per wheel
      // tau_m = (F_x * r) / eta = 15.78 Nm
      const FskidPerWheel = (ugv.mass * g * ugv.mu_skid) / 4;
      const FxPivot = FskidPerWheel * 0.80; // 102.02 N (at L/B = 0.80 sizing corridor from Section 3)
      torquePerMotor = (FxPivot * ugv.radius) / ugv.eta; // 15.78 Nm
      Ftotal = 4 * FxPivot;
      wheelRpm = 45.0; // Slow in-place turning setpoint
    }

    // 2. Query Certified Dynamometer Factory Curve
    const dynamoPt = this.interpolateDynamo(torquePerMotor);

    // Headroom calculation
    let headroomStr = '';
    if (torquePerMotor <= ugv.ratedTorque) {
      const margin = (ugv.ratedTorque / Math.max(0.1, torquePerMotor)).toFixed(1);
      headroomStr = `${margin}x Continuous Margin (15 Nm)`;
    } else {
      const peakMargin = (ugv.stallTorque / Math.max(0.1, torquePerMotor)).toFixed(2);
      headroomStr = `${peakMargin}x Peak Stall Margin (28.5 Nm)`;
    }

    // Save State
    this.state.Frr = Frr;
    this.state.Faero = Faero;
    this.state.Fgrade = Fgrade;
    this.state.Facc = Facc;
    this.state.Ftotal = Ftotal;
    this.state.torquePerMotor = torquePerMotor;
    this.state.wheelRpm = wheelRpm;
    this.state.phaseCurrent = dynamoPt.i;
    this.state.busCurrent = dynamoPt.i * 4;
    this.state.mechPower = (4 * torquePerMotor * (wheelRpm * 2 * Math.PI / 60)) / ugv.eta;
    this.state.elecPower = dynamoPt.pin * 4;
    this.state.efficiency = dynamoPt.eff;
    this.state.headroomRatio = headroomStr;

    // 3. Update DOM Telemetry Readouts
    document.getElementById('hud-ftotal').textContent = `${Ftotal.toFixed(2)} N`;
    document.getElementById('hud-torque').textContent = `${torquePerMotor.toFixed(2)} Nm`;
    document.getElementById('hud-current-phase').textContent = `${dynamoPt.i.toFixed(2)} A`;
    document.getElementById('hud-current-bus').textContent = `${(dynamoPt.i * 4).toFixed(2)} A`;
    document.getElementById('hud-rpm').textContent = `${wheelRpm.toFixed(1)} RPM (${(wheelRpm * 2 * Math.PI * ugv.radius * 3.6 / 60).toFixed(1)} km/h)`;
    document.getElementById('hud-eff').textContent = `${dynamoPt.eff.toFixed(1)}% (Measured)`;
    document.getElementById('hud-pmech').textContent = `${this.state.mechPower.toFixed(1)} W (${(this.state.mechPower / 4).toFixed(1)} W/m)`;
    document.getElementById('hud-pelec').textContent = `${this.state.elecPower.toFixed(1)} W (Total 48V Bus)`;
    document.getElementById('hud-headroom').textContent = headroomStr;

    // 4. Update 3D Visual Force Vectors
    this.update3DSceneGeometry(thetaRad);
  }

  update3DSceneGeometry(thetaRad) {
    // 1. Tilt Incline Ramp
    // Rotate ramp around Z axis by thetaRad so it pitches up in +X
    this.rampGroup.rotation.z = thetaRad;

    // Vehicle Group sits at x = 0 on ramp surface.
    // In acceleration mode, simulate dynamic acceleration rear squat
    if (this.state.scenario === 'accel' && this.state.isPlaying) {
      this.vehicleGroup.rotation.z = -0.015; // subtle squat backwards
    } else {
      this.vehicleGroup.rotation.z = 0;
    }

    // 2. Wheel Positions in Vehicle Group Coordinates
    const wb = this.proxy.wheelbase;      // 0.498m
    const tr = this.proxy.trackwidth;     // 0.583m
    const zOffset = tr / 2;
    const xOffset = wb / 2;
    const yContact = 0.01;                // contact patch level

    const setArrow = (arrow, origin, dir, length, visible = true) => {
      arrow.position.copy(origin);
      if (length < 0.02 || !visible || !this.state.showVectors) {
        arrow.visible = false;
        return;
      }
      arrow.visible = true;
      arrow.setDirection(dir.clone().normalize());
      arrow.setLength(Math.min(length, 1.2), length * 0.22, length * 0.12);
    };

    const isPivot = (this.state.scenario === 'pivot');
    const isSlope = (this.state.scenario === 'slope');
    const isAccel = (this.state.scenario === 'accel');

    // Directions in Vehicle/Ramp Frame:
    const fwd = new THREE.Vector3(1, 0, 0);     // along slope upwards
    const bwd = new THREE.Vector3(-1, 0, 0);    // along slope downwards
    const upNormal = new THREE.Vector3(0, 1, 0); // perpendicular to slope
    const right = new THREE.Vector3(0, 0, -1);
    const left = new THREE.Vector3(0, 0, 1);

    // Dynamic Scales for Visibility
    const forceScale = 0.0035;

    // 1. Gravity Vector W = mg (In World Frame)
    // Sits at the vehicle CG in world coordinates
    const vehicleWorldPos = new THREE.Vector3();
    this.vehicleGroup.getWorldPosition(vehicleWorldPos);
    vehicleWorldPos.y += 0.20; // CG height
    const gravityWorldDir = new THREE.Vector3(0, -1, 0);
    const gravLen = (this.ugv.mass * 9.81) * forceScale * 0.6; // ~1.3m
    setArrow(this.vectors.gravity, vehicleWorldPos, gravityWorldDir, gravLen, true);

    // 2. Normal Reactions N_i = mg cos theta / 4
    const normalLen = ((this.ugv.mass * 9.81 * Math.cos(thetaRad)) / 4) * forceScale * 1.5;
    setArrow(this.vectors.normal_fl, new THREE.Vector3(xOffset, yContact, zOffset), upNormal, normalLen);
    setArrow(this.vectors.normal_fr, new THREE.Vector3(xOffset, yContact, -zOffset), upNormal, normalLen);
    setArrow(this.vectors.normal_rl, new THREE.Vector3(-xOffset, yContact, zOffset), upNormal, normalLen);
    setArrow(this.vectors.normal_rr, new THREE.Vector3(-xOffset, yContact, -zOffset), upNormal, normalLen);

    // 3. Grade Resistance F_grade (Acts down slope from CG)
    const gradeLen = this.state.Fgrade * forceScale * 2.0;
    setArrow(this.vectors.grade, new THREE.Vector3(0, 0.22, 0), bwd, gradeLen, isSlope && this.state.slopeDeg > 0.1);

    // 4. Rolling Resistance F_rr (Acts down slope at 4 contact patches)
    const rrLen = (this.state.Frr / 4) * forceScale * 3.5;
    setArrow(this.vectors.rr_fl, new THREE.Vector3(xOffset, yContact, zOffset), bwd, rrLen, !isPivot);
    setArrow(this.vectors.rr_fr, new THREE.Vector3(xOffset, yContact, -zOffset), bwd, rrLen, !isPivot);
    setArrow(this.vectors.rr_rl, new THREE.Vector3(-xOffset, yContact, zOffset), bwd, rrLen, !isPivot);
    setArrow(this.vectors.rr_rr, new THREE.Vector3(-xOffset, yContact, -zOffset), bwd, rrLen, !isPivot);

    // 5. Aerodynamic Drag F_aero (Acts backward from front face)
    const aeroLen = this.state.Faero * forceScale * 6.0;
    setArrow(this.vectors.aero, new THREE.Vector3(xOffset + 0.1, 0.25, 0), bwd, aeroLen, this.state.speedKmh > 1.0 && !isPivot);

    // 6. Acceleration Inertial Reaction F_acc = ma (Acts backward from CG)
    const accelLen = this.state.Facc * forceScale * 1.5;
    setArrow(this.vectors.accel, new THREE.Vector3(0, 0.25, 0), bwd, accelLen, isAccel);

    // 7. Driving Traction F_drive (Acts forward at contact patches)
    if (!isPivot) {
      const driveLen = (this.state.Ftotal / 4) * forceScale * 1.8;
      setArrow(this.vectors.drive_fl, new THREE.Vector3(xOffset, yContact, zOffset), fwd, driveLen);
      setArrow(this.vectors.drive_fr, new THREE.Vector3(xOffset, yContact, -zOffset), fwd, driveLen);
      setArrow(this.vectors.drive_rl, new THREE.Vector3(-xOffset, yContact, zOffset), fwd, driveLen);
      setArrow(this.vectors.drive_rr, new THREE.Vector3(-xOffset, yContact, -zOffset), fwd, driveLen);

      // Hide pivot scrub vectors
      setArrow(this.vectors.scrub_fl, new THREE.Vector3(), fwd, 0, false);
      setArrow(this.vectors.scrub_fr, new THREE.Vector3(), fwd, 0, false);
      setArrow(this.vectors.scrub_rl, new THREE.Vector3(), fwd, 0, false);
      setArrow(this.vectors.scrub_rr, new THREE.Vector3(), fwd, 0, false);
      this.yawRing.visible = false;
    } else {
      // In-Place Pivot: Left reverse (-X), Right forward (+X)
      const pivotFxLen = 0.45;
      setArrow(this.vectors.drive_fl, new THREE.Vector3(xOffset, yContact, zOffset), bwd, pivotFxLen);
      setArrow(this.vectors.drive_rl, new THREE.Vector3(-xOffset, yContact, zOffset), bwd, pivotFxLen);
      setArrow(this.vectors.drive_fr, new THREE.Vector3(xOffset, yContact, -zOffset), fwd, pivotFxLen);
      setArrow(this.vectors.drive_rr, new THREE.Vector3(-xOffset, yContact, -zOffset), fwd, pivotFxLen);

      // Lateral Scrubbing Resisting Forces (Perpendicular to wheels)
      const scrubLen = 0.38;
      setArrow(this.vectors.scrub_fl, new THREE.Vector3(xOffset, yContact, zOffset), right, scrubLen);
      setArrow(this.vectors.scrub_fr, new THREE.Vector3(xOffset, yContact, -zOffset), right, scrubLen);
      setArrow(this.vectors.scrub_rl, new THREE.Vector3(-xOffset, yContact, zOffset), left, scrubLen);
      setArrow(this.vectors.scrub_rr, new THREE.Vector3(-xOffset, yContact, -zOffset), left, scrubLen);

      this.yawRing.visible = this.state.showVectors;
    }
  }

  updateEquationCard() {
    const cardTitle = document.getElementById('eq-card-title');
    const cardMath = document.getElementById('eq-card-math');
    if (!cardTitle || !cardMath) return;

    const c = this.state.scenario;
    if (c === 'cruise') {
      cardTitle.textContent = 'Case 1: Straight Flat Cruising at 15 km/h';
      cardMath.innerHTML = `
        $$F_{rr} = C_{rr} m g = 0.025 \\times 65.0 \\times 9.81 = \\mathbf{15.94\\text{ N}}$$
        $$F_{aero} = \\frac{1}{2}\\rho C_d A v^2 = 0.5 \\times 1.204 \\times 0.80 \\times 0.35 \\times (4.167)^2 = \\mathbf{2.93\\text{ N}}$$
        $$F_{\\text{total}} = F_{rr} + F_{aero} = \\mathbf{18.87\\text{ N}} \\implies \\tau_{\\text{motor}} = \\frac{F_{\\text{total}} \\cdot r}{4 \\cdot \\eta} = \\frac{18.87 \\times 0.1315}{4 \\times 0.85} = \\mathbf{0.73\\text{ Nm}}$$
      `;
    } else if (c === 'slope') {
      cardTitle.textContent = `Case 2: Incline Slope Climbing (${this.state.slopeDeg.toFixed(1)}° at ${this.state.speedKmh.toFixed(0)} km/h)`;
      cardMath.innerHTML = `
        $$F_{\\text{slope}} = m g \\sin(${this.state.slopeDeg.toFixed(1)}^\\circ) = 65.0 \\times 9.81 \\times \\sin(${this.state.slopeDeg.toFixed(1)}^\\circ) = \\mathbf{${this.state.Fgrade.toFixed(2)}\\text{ N}}$$
        $$F_{rr} = C_{rr} m g \\cos(${this.state.slopeDeg.toFixed(1)}^\\circ) = \\mathbf{${this.state.Frr.toFixed(2)}\\text{ N}}, \\qquad F_{aero} = \\mathbf{${this.state.Faero.toFixed(2)}\\text{ N}}$$
        $$F_{\\text{total}} = F_{rr} + F_{\\text{slope}} + F_{aero} = \\mathbf{${this.state.Ftotal.toFixed(2)}\\text{ N}} \\implies \\tau_{\\text{motor}} = \\frac{${this.state.Ftotal.toFixed(2)} \\times 0.1315}{4 \\times 0.85} = \\mathbf{${this.state.torquePerMotor.toFixed(2)}\\text{ Nm}}$$
      `;
    } else if (c === 'accel') {
      cardTitle.textContent = `Case 3: Dynamic Acceleration (a = ${this.state.accelMps2.toFixed(3)} m/s²)`;
      cardMath.innerHTML = `
        $$a = \\frac{v}{t_{\\text{acc}}} = \\frac{4.167\\text{ m/s}}{3.0\\text{ s}} = \\mathbf{1.3889\\text{ m/s}^2} \\implies F_{\\text{acc}} = m \\cdot a = 65.0 \\times 1.3889 = \\mathbf{90.28\\text{ N}}$$
        $$F_{\\text{total}} = F_{rr} + F_{\\text{acc}} + F_{aero} = 15.94 + 90.28 + 2.93 = \\mathbf{109.15\\text{ N}}$$
        $$\\tau_{\\text{motor}} = \\frac{109.15 \\times 0.1315}{4 \\times 0.85} = \\mathbf{4.22\\text{ Nm per motor}} \\quad (\\text{Margin: } 6.75\\times \\text{ of } 28.5\\text{ Nm peak})$$
      `;
    } else if (c === 'pivot') {
      cardTitle.textContent = 'Case 4: In-Place Zero-Radius Skid-Steer Pivot (Peak Sizing Case)';
      cardMath.innerHTML = `
        $$F_{\\text{skid}} = m g \\mu_{\\text{skid}} = 65.0 \\times 9.81 \\times 0.80 = \\mathbf{510.12\\text{ N}} \\implies F_{y,i} = \\frac{510.12}{4} = \\mathbf{127.53\\text{ N per wheel}}$$
        $$M_{\\text{scrub}} = 4 \\times \\left(F_{y,i} \\cdot \\frac{L}{2}\\right) = \\mathbf{255.06 \\cdot L\\text{ Nm}} \\implies F_x = 127.53 \\times \\left(\\frac{L}{B}\\right) = 127.53 \\times 0.80 = \\mathbf{102.02\\text{ N}}$$
        $$\\tau_{\\text{motor}} = \\frac{F_x \\cdot r}{\\eta} = \\frac{102.02 \\times 0.1315}{0.85} = \\mathbf{15.78\\text{ Nm per motor}} \\quad (\\text{Peak Headroom: } \\mathbf{1.81\\times})$$
      `;
    }

    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([cardMath]).catch(() => {});
    }
  }

  animate(now) {
    requestAnimationFrame(this.animate);

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.state.isPlaying) {
      this.state.simTime += dt;

      // Wheel Rolling Animation
      // Use wheel angular velocity omega = v / r
      const vMps = this.state.speedKmh / 3.6;
      const omegaSim = vMps / this.proxy.wheelRadius;

      if (this.state.scenario !== 'pivot') {
        const dTheta = omegaSim * dt;
        this.wheelRotAngle -= dTheta;

        if (this.wheels.fl) this.wheels.fl.rotation.z = this.wheelRotAngle;
        if (this.wheels.fr) this.wheels.fr.rotation.z = this.wheelRotAngle;
        if (this.wheels.rl) this.wheels.rl.rotation.z = this.wheelRotAngle;
        if (this.wheels.rr) this.wheels.rr.rotation.z = this.wheelRotAngle;
      } else {
        // Pivot: Left reverse, Right forward
        const pivotOmega = 3.0; // rad/s for visualization
        const dTheta = pivotOmega * dt;
        
        if (this.wheels.fl) this.wheels.fl.rotation.z += dTheta; // reverse
        if (this.wheels.rl) this.wheels.rl.rotation.z += dTheta; // reverse
        if (this.wheels.fr) this.wheels.fr.rotation.z -= dTheta; // forward
        if (this.wheels.rr) this.wheels.rr.rotation.z -= dTheta; // forward

        // Rotate vehicle in place around Y
        this.yawAngle += 0.8 * dt;
        this.vehicleGroup.rotation.y = this.yawAngle;
      }

      // Update world gravity arrow position as camera moves
      if (this.vectors.gravity && this.vehicleGroup) {
        const cgPos = new THREE.Vector3();
        this.vehicleGroup.getWorldPosition(cgPos);
        cgPos.y += 0.22;
        this.vectors.gravity.position.copy(cgPos);
      }
    }

    // Smooth camera transition if preset was triggered
    if (this.cameraTargetPos) {
      this.camera.position.lerp(this.cameraTargetPos, 0.08);
      if (this.camera.position.distanceTo(this.cameraTargetPos) < 0.02) {
        this.cameraTargetPos = null;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('scout2-drivetrain-container');
  if (container) {
    window.scoutDrivetrainViewer = new Scout2DrivetrainViewer('scout2-drivetrain-container');
  }
});

export { Scout2DrivetrainViewer };
