/**
 * ==============================================================================
 * CDE4301 Runway Patrol — AgileX Scout 2.0 Interactive Steering Kinematics Viewer
 * Phase 5.7: High-fidelity Three.js 3D simulation of 4WD skid-steer kinematics.
 *
 * Simulates the authentic AgileX Scout 2.0 simulation proxy used in Semester 1:
 * - Model: runway_description URDF meshes (base_link.dae, wheel_type1.dae, wheel_type2.dae)
 * - Wheelbase L = 0.498 m (498 mm)
 * - Track width B = 0.58306 m (583.06 mm)
 * - Wheel radius r = 0.16459 m (164.59 mm, diameter 329.18 mm)
 * - Stance ratio L/B = 0.8541 (within 0.80 <= L/B <= 1.00 stability corridor)
 * - Effective track width W_eff = chi * B = 1.18 * 0.583 = 0.688 m
 * ==============================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Scout2SteeringViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`[Scout2Viewer] Container #${containerId} not found.`);
      return;
    }

    // Kinematic Parameters (AgileX Scout 2.0 Authentic Simulation Proxy)
    this.params = {
      wheelbase: 0.498,       // L (m)
      trackwidth: 0.58306,    // B (m)
      wheelRadius: 0.16459,   // r (m)
      wheelOffsetVo: -0.0702, // vertical offset of wheel hubs (m)
      chi: 1.18,              // effective trackwidth factor on tarmac
      get effectiveTrack() { return this.chi * this.trackwidth; }, // W_eff = 0.688 m
      mass: 65.0,             // kg (curb mass + lidar payload)
      mu_tarmac: 0.85         // tire-runway friction coefficient
    };

    // State Variables
    this.state = {
      mode: 'turn',           // 'straight', 'turn', 'pivot'
      v: 1.0,                 // linear velocity (m/s)
      omega: 0.8,             // yaw rate (rad/s)
      isPlaying: true,
      followCamera: false,
      showVectors: true,
      showTrajectory: true,
      showDimensions: true,
      showICR: true,
      
      // Dynamic pose in world coordinates
      pose: { x: 0, z: 0, heading: 0 },
      
      // Calculated wheel metrics
      vL: 0, vR: 0,
      omegaL: 0, omegaR: 0,
      rpmL: 0, rpmR: 0,
      turningRadius: 0,
      mScrub: 0
    };

    // Animation & Scene References
    this.wheels = { fl: null, fr: null, rl: null, rr: null };
    this.wheelRotationAngles = { L: 0, R: 0 };
    this.robotRoot = null;
    this.trajectoryPoints = [];
    this.maxTrajectoryPoints = 240;

    // Camera preset targets for smooth animation
    this.cameraTargetPos = null;
    this.controlsTargetPos = null;

    this.init();
  }

  init() {
    this.buildDOM();
    this.initThree();
    this.setupGroundAndLighting();
    this.setupOverlays();
    this.loadModel();
    this.bindEvents();
    this.updateKinematics();

    // Start render loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildDOM() {
    this.container.innerHTML = `
      <div class="scout-viewer-wrapper" style="position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #0c0f17; border: 1px solid rgba(255, 255, 255, 0.12); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- TOP TOOLBAR -->
        <div class="scout-top-bar" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 12px 18px; background: rgba(18, 22, 34, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255, 255, 255, 0.08); gap: 10px; z-index: 10;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981;"></div>
            <div>
              <div style="font-size: 14.5px; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em;">
                AgileX Scout 2.0 &mdash; Interactive Steering Kinematics
              </div>
              <div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 6px;">
                <span>Semester 1 Simulation Proxy</span>
                <span>&bull;</span>
                <span>Gazebo Harmonic & ROS 2 Jazzy</span>
                <span>&bull;</span>
                <span style="color: #38bdf8;">L/B = 0.854</span>
              </div>
            </div>
          </div>

          <!-- MODE PILLS -->
          <div class="scout-mode-pills" style="display: flex; gap: 6px; background: rgba(0, 0, 0, 0.4); padding: 3px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); overflow-x: auto; max-width: 100%;">
            <button class="scout-mode-btn" data-mode="straight" style="background: transparent; border: none; padding: 6px 12px; border-radius: 6px; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              1. Straight ($v_L = v_R$)
            </button>
            <button class="scout-mode-btn active" data-mode="turn" style="background: #3b82f6; border: none; padding: 6px 12px; border-radius: 6px; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);">
              2. Differential Turn ($v_L \\neq v_R$)
            </button>
            <button class="scout-mode-btn" data-mode="pivot" style="background: transparent; border: none; padding: 6px 12px; border-radius: 6px; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              3. Zero-Radius Pivot ($v_L = -v_R$)
            </button>
          </div>

          <!-- PLAY & RESET -->
          <div style="display: flex; gap: 8px;">
            <button id="scout-play-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #f8fafc; font-size: 12px; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
              <span id="scout-play-icon">⏸</span> Pause
            </button>
            <button id="scout-reset-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #f8fafc; font-size: 12px; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" title="Reset Vehicle Pose and Path">
              ↺ Reset Path
            </button>
          </div>
        </div>

        <!-- 3D VIEWPORT CONTAINER -->
        <div id="scout-canvas-container" style="position: relative; width: 100%; height: 480px; overflow: hidden; background: radial-gradient(circle at 50% 30%, #161c2c 0%, #090c14 100%);">
          <!-- Canvas inserted here by Three.js -->
          <canvas id="scout-three-canvas" style="display: block; width: 100%; height: 100%;"></canvas>

          <!-- LOADING OVERLAY -->
          <div id="scout-loading-overlay" style="position: absolute; inset: 0; background: rgba(12, 15, 23, 0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; z-index: 20; transition: opacity 0.4s ease;">
            <div style="width: 44px; height: 44px; border: 3px solid rgba(59, 130, 246, 0.2); border-top-color: #3b82f6; border-radius: 50%; animation: scout-spin 1s linear infinite;"></div>
            <div style="color: #f8fafc; font-size: 13.5px; font-weight: 500;">Loading AgileX Scout 2.0 Simulation Model...</div>
            <div style="color: #94a3b8; font-size: 11.5px;">runway_description (URDF / DAE mesh conversion)</div>
          </div>

          <!-- FLOATING TELEMETRY HUD -->
          <div class="scout-telemetry-hud" style="position: absolute; top: 14px; left: 14px; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 12px 14px; max-width: 290px; pointer-events: none; z-index: 5; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8;">Real-Time Kinematics</span>
              <span id="hud-mode-badge" style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(59, 130, 246, 0.25); color: #60a5fa; font-weight: 600;">TURN</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11.5px; margin-bottom: 8px;">
              <div>
                <span style="color: #94a3b8;">Linear $v_x$:</span>
                <div id="hud-v" style="font-weight: 700; color: #f8fafc; font-family: 'JetBrains Mono', monospace;">1.00 m/s</div>
              </div>
              <div>
                <span style="color: #94a3b8;">Yaw Rate $\\omega_z$:</span>
                <div id="hud-omega" style="font-weight: 700; color: #f8fafc; font-family: 'JetBrains Mono', monospace;">0.80 rad/s</div>
              </div>
              <div>
                <span style="color: #94a3b8;">Left Wheels $v_L$:</span>
                <div id="hud-vl" style="font-weight: 700; color: #10b981; font-family: 'JetBrains Mono', monospace;">0.72 m/s</div>
              </div>
              <div>
                <span style="color: #94a3b8;">Right Wheels $v_R$:</span>
                <div id="hud-vr" style="font-weight: 700; color: #10b981; font-family: 'JetBrains Mono', monospace;">1.28 m/s</div>
              </div>
              <div>
                <span style="color: #94a3b8;">Left Spin $\\omega_L$:</span>
                <div id="hud-omegal" style="font-weight: 700; color: #38bdf8; font-family: 'JetBrains Mono', monospace;">4.41 rad/s (42 rpm)</div>
              </div>
              <div>
                <span style="color: #94a3b8;">Right Spin $\\omega_R$:</span>
                <div id="hud-omegar" style="font-weight: 700; color: #38bdf8; font-family: 'JetBrains Mono', monospace;">7.75 rad/s (74 rpm)</div>
              </div>
            </div>

            <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 6px; font-size: 11px; display: flex; flex-direction: column; gap: 3px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Turning Radius ($R = v/\\omega$):</span>
                <span id="hud-radius" style="font-weight: 700; color: #fbbf24; font-family: 'JetBrains Mono', monospace;">1.25 m</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Effective Track ($W_{\\text{eff}}$):</span>
                <span style="font-weight: 600; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;">0.688 m ($\\chi=1.18$)</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Est. Scrub Torque ($M_{\\text{scrub}}$):</span>
                <span id="hud-mscrub" style="font-weight: 600; color: #f43f5e; font-family: 'JetBrains Mono', monospace;">45.2 Nm</span>
              </div>
            </div>
          </div>

          <!-- CAMERA PRESETS BAR (BOTTOM RIGHT) -->
          <div style="position: absolute; bottom: 14px; right: 14px; display: flex; gap: 6px; z-index: 5; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(10px); padding: 4px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <button class="scout-cam-btn" data-cam="iso" style="background: rgba(255, 255, 255, 0.1); border: none; color: #f8fafc; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">Isometric</button>
            <button class="scout-cam-btn" data-cam="top" style="background: transparent; border: none; color: #94a3b8; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">Top (Plan)</button>
            <button class="scout-cam-btn" data-cam="front" style="background: transparent; border: none; color: #94a3b8; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">Front</button>
            <button class="scout-cam-btn" data-cam="side" style="background: transparent; border: none; color: #94a3b8; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">Side</button>
          </div>
        </div>

        <!-- BOTTOM CONTROLS & SLIDERS BAR -->
        <div style="padding: 14px 18px; background: rgba(18, 22, 34, 0.95); border-top: 1px solid rgba(255, 255, 255, 0.08);">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; align-items: center; margin-bottom: 12px;">
            
            <!-- LINEAR SPEED SLIDER -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                <label for="scout-speed-slider" style="color: #f8fafc; font-weight: 600;">Forward Linear Speed ($v_x$):</label>
                <span id="scout-speed-val" style="color: #38bdf8; font-weight: 700; font-family: 'JetBrains Mono', monospace;">1.00 m/s</span>
              </div>
              <input type="range" id="scout-speed-slider" min="-0.5" max="2.5" step="0.1" value="1.0" style="width: 100%; accent-color: #38bdf8; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-top: 2px;">
                <span>Reverse (-0.5 m/s)</span>
                <span>Stop (0)</span>
                <span>Nominal (1.0 m/s)</span>
                <span>Max Airside (2.5 m/s)</span>
              </div>
            </div>

            <!-- YAW RATE / CURVATURE SLIDER -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                <label for="scout-yaw-slider" style="color: #f8fafc; font-weight: 600;">Steering Yaw Rate ($\\omega_z$):</label>
                <span id="scout-yaw-val" style="color: #a855f7; font-weight: 700; font-family: 'JetBrains Mono', monospace;">0.80 rad/s</span>
              </div>
              <input type="range" id="scout-yaw-slider" min="-2.0" max="2.0" step="0.1" value="0.8" style="width: 100%; accent-color: #a855f7; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-top: 2px;">
                <span>Hard Right (-2.0 rad/s)</span>
                <span>Straight (0)</span>
                <span>Hard Left (+2.0 rad/s)</span>
              </div>
            </div>

          </div>

          <!-- TOGGLE CHECKBOXES -->
          <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: #cbd5e1; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="toggle-vectors" checked style="accent-color: #10b981;">
              <span>Traction &amp; Scrub Force Vectors</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="toggle-icr" checked style="accent-color: #f59e0b;">
              <span>Instantaneous Center of Rotation (ICR)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="toggle-dimensions" checked style="accent-color: #3b82f6;">
              <span>Chassis Dimensions ($L = 0.498\\text{ m}, B = 0.583\\text{ m}$)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="toggle-trajectory" checked style="accent-color: #06b6d4;">
              <span>Ground Trajectory Path</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="toggle-follow-cam" style="accent-color: #8b5cf6;">
              <span>Follow Camera</span>
            </label>
          </div>

          <!-- COMPARISON FOOTNOTE CARD -->
          <div style="margin-top: 12px; padding: 10px 14px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 6px; font-size: 11.5px; color: #94a3b8; line-height: 1.5;">
            <strong style="color: #38bdf8;">Simulation vs. Physical Hardware Reconciliation:</strong> 
            This interactive viewer visualizes the authentic <strong>AgileX Scout 2.0 simulation proxy</strong> ($L=0.498\\text{ m}, B=0.583\\text{ m}, r=0.165\\text{ m}$, mass $65\\text{ kg}$) utilized in the ROS 2 Jazzy / Gazebo Harmonic digital twin during Semester 1 software development. The final custom physical CDE4301 UGV prototype incorporates verified custom dimensions ($L=0.4888\\text{ m}, B=0.5750\\text{ m}, r=0.1315\\text{ m}$, mass $26\\text{ kg}$) sharing identical non-dimensional stance ratio compliance ($L/B = 0.8500$ vs $0.8541$).
          </div>

        </div>
      </div>
      
      <style>
        @keyframes scout-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .scout-mode-btn:hover:not(.active) {
          color: #f8fafc !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .scout-cam-btn:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          color: #fff !important;
        }
        @media (max-width: 768px) {
          .scout-top-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .scout-mode-pills {
            width: 100% !important;
            justify-content: flex-start !important;
            scrollbar-width: thin;
          }
          .scout-mode-btn {
            white-space: nowrap !important;
          }
          .scout-telemetry-hud {
            top: 8px !important;
            left: 8px !important;
            padding: 8px 10px !important;
            max-width: 250px !important;
            font-size: 10.5px !important;
          }
          #scout-canvas-container {
            height: 380px !important;
          }
        }
      </style>
    `;
    // Typeset MathJax if available
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([this.container]).catch(() => {});
    }
  }

  initThree() {
    const canvas = document.getElementById('scout-three-canvas');
    const container = document.getElementById('scout-canvas-container');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c101c);
    this.scene.fog = new THREE.FogExp2(0x0c101c, 0.07);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    this.camera.position.set(2.2, 1.8, 2.4);

    // 3. Renderer
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
    this.renderer.toneMappingExposure = 1.1;

    // 4. Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 10.0;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03; // Stay above ground
    this.controls.target.set(0, 0.2, 0);
    this.controls.update();

    // 5. Resize Observer
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

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainLight.position.set(4, 7, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 25;
    mainLight.shadow.camera.left = -6;
    mainLight.shadow.camera.right = 6;
    mainLight.shadow.camera.top = 6;
    mainLight.shadow.camera.bottom = -6;
    mainLight.shadow.bias = -0.0005;
    this.scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-5, 4, -5);
    this.scene.add(rimLight);

    // Ground Plane & Airside Grid
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f1523,
      roughness: 0.9,
      metalness: 0.1
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Grid Helper
    const grid = new THREE.GridHelper(20, 40, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.001;
    this.scene.add(grid);

    // Radial Distance Rings
    const ringMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.6 });
    [1.0, 2.0, 3.0, 4.0].forEach(r => {
      const ringGeo = new THREE.BufferGeometry();
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * r, 0.002, Math.sin(theta) * r));
      }
      ringGeo.setFromPoints(pts);
      this.scene.add(new THREE.Line(ringGeo, ringMat));
    });

    // Runway Centerline Dashes (Yellow)
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.7 });
    for (let x = -10; x <= 10; x += 2.0) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.1), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.003, 0);
      this.scene.add(dash);
    }
  }

  setupOverlays() {
    // 1. Vehicle Parent Group (moves and rotates with kinematics)
    this.vehicleGroup = new THREE.Group();
    this.scene.add(this.vehicleGroup);

    // 2. Trajectory Line
    const trajGeo = new THREE.BufferGeometry();
    const trajMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    this.trajectoryMesh = new THREE.Line(trajGeo, trajMat);
    this.scene.add(this.trajectoryMesh);

    // 3. Instantaneous Center of Rotation (ICR) Visualizer
    this.icrGroup = new THREE.Group();
    
    // ICR Center Pole & Beacon
    const icrPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 })
    );
    icrPole.position.y = 0.3;
    this.icrGroup.add(icrPole);

    const icrRing = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.18, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
    );
    icrRing.rotation.x = -Math.PI / 2;
    icrRing.position.y = 0.01;
    this.icrGroup.add(icrRing);

    // ICR Radius Line connecting to vehicle center
    const radiusLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(0, 0.01, 0)
    ]);
    this.icrRadiusLine = new THREE.Line(radiusLineGeo, new THREE.LineDashedMaterial({
      color: 0xfbbf24,
      dashSize: 0.15,
      gapSize: 0.08,
      linewidth: 2
    }));
    this.scene.add(this.icrRadiusLine);
    this.scene.add(this.icrGroup);

    // 4. Force Vectors on Wheels
    // We attach arrow helpers to the vehicleGroup so they transform with the robot
    this.forceVectors = {
      // Longitudinal Traction Arrows (Emerald)
      fl_traction: this.createArrow(0x10b981),
      fr_traction: this.createArrow(0x10b981),
      rl_traction: this.createArrow(0x10b981),
      rr_traction: this.createArrow(0x10b981),

      // Lateral Scrub Resisting Arrows (Amber/Red)
      fl_scrub: this.createArrow(0xf43f5e),
      fr_scrub: this.createArrow(0xf43f5e),
      rl_scrub: this.createArrow(0xf43f5e),
      rr_scrub: this.createArrow(0xf43f5e)
    };

    Object.values(this.forceVectors).forEach(arrow => this.vehicleGroup.add(arrow));

    // 5. Dimension Calipers & Stance Annotation
    this.dimensionGroup = new THREE.Group();
    this.setupDimensionCalipers();
    this.vehicleGroup.add(this.dimensionGroup);
  }

  createArrow(color) {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      0.3,
      color,
      0.08,
      0.05
    );
    arrow.visible = true;
    return arrow;
  }

  setupDimensionCalipers() {
    const wb = this.params.wheelbase;      // 0.498m
    const tr = this.params.trackwidth;     // 0.583m
    const zOffset = tr / 2 + 0.18;         // offset outward from wheels
    const xOffset = wb / 2 + 0.18;

    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });

    // Wheelbase L line (along X)
    const wbPts = [
      new THREE.Vector3(-wb / 2, 0.02, zOffset),
      new THREE.Vector3(wb / 2, 0.02, zOffset),
      // End ticks
      new THREE.Vector3(-wb / 2, 0.02, zOffset - 0.05),
      new THREE.Vector3(-wb / 2, 0.02, zOffset + 0.05),
      new THREE.Vector3(wb / 2, 0.02, zOffset - 0.05),
      new THREE.Vector3(wb / 2, 0.02, zOffset + 0.05)
    ];
    const wbGeo = new THREE.BufferGeometry().setFromPoints(wbPts);
    this.dimensionGroup.add(new THREE.LineSegments(wbGeo, lineMat));

    // Trackwidth B line (along Z)
    const trPts = [
      new THREE.Vector3(xOffset, 0.02, -tr / 2),
      new THREE.Vector3(xOffset, 0.02, tr / 2),
      // End ticks
      new THREE.Vector3(xOffset - 0.05, 0.02, -tr / 2),
      new THREE.Vector3(xOffset + 0.05, 0.02, -tr / 2),
      new THREE.Vector3(xOffset - 0.05, 0.02, tr / 2),
      new THREE.Vector3(xOffset + 0.05, 0.02, tr / 2)
    ];
    const trGeo = new THREE.BufferGeometry().setFromPoints(trPts);
    this.dimensionGroup.add(new THREE.LineSegments(trGeo, lineMat));

    // Stance Center marker (CG)
    const cgRing = new THREE.Mesh(
      new THREE.RingGeometry(0.04, 0.06, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    cgRing.rotation.x = -Math.PI / 2;
    cgRing.position.y = 0.02;
    this.dimensionGroup.add(cgRing);
  }

  loadModel() {
    const loader = new GLTFLoader();
    const modelUrl = '../../assets/models/scout_v2.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;
        this.robotRoot = root;

        // Extract wheel groups
        this.wheels.fl = root.getObjectByName('wheel_fl');
        this.wheels.fr = root.getObjectByName('wheel_fr');
        this.wheels.rl = root.getObjectByName('wheel_rl');
        this.wheels.rr = root.getObjectByName('wheel_rr');

        console.log('[Scout2Viewer] Wheels linked:', {
          fl: !!this.wheels.fl,
          fr: !!this.wheels.fr,
          rl: !!this.wheels.rl,
          rr: !!this.wheels.rr
        });

        // Set materials and shadows
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

        // Lift model so wheels touch ground at y = 0
        // In scout_v2.glb, wheel axle y = -0.0702, radius = 0.165, min y = -0.2352
        root.position.y = 0.2352;
        this.vehicleGroup.add(root);

        // Hide loading overlay
        const overlay = document.getElementById('scout-loading-overlay');
        if (overlay) {
          overlay.style.opacity = '0';
          setTimeout(() => overlay.remove(), 400);
        }
      },
      undefined,
      (err) => {
        console.error('[Scout2Viewer] Error loading scout_v2.glb:', err);
        const overlay = document.getElementById('scout-loading-overlay');
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
    // Mode Buttons
    const modeBtns = this.container.querySelectorAll('.scout-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = '#94a3b8';
          b.style.boxShadow = 'none';
        });
        btn.classList.add('active');
        btn.style.background = '#3b82f6';
        btn.style.color = '#fff';
        btn.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.4)';

        this.setMode(btn.dataset.mode);
      });
    });

    // Play / Pause
    const playBtn = document.getElementById('scout-play-btn');
    const playIcon = document.getElementById('scout-play-icon');
    playBtn.addEventListener('click', () => {
      this.state.isPlaying = !this.state.isPlaying;
      playBtn.innerHTML = this.state.isPlaying ? '<span>⏸</span> Pause' : '<span>▶</span> Play';
      playBtn.style.borderColor = this.state.isPlaying ? 'rgba(255, 255, 255, 0.15)' : '#38bdf8';
    });

    // Reset Path
    const resetBtn = document.getElementById('scout-reset-btn');
    resetBtn.addEventListener('click', () => {
      this.state.pose = { x: 0, z: 0, heading: 0 };
      this.vehicleGroup.position.set(0, 0, 0);
      this.vehicleGroup.rotation.y = 0;
      this.trajectoryPoints = [];
      this.updateTrajectoryMesh();
    });

    // Sliders
    const speedSlider = document.getElementById('scout-speed-slider');
    const speedVal = document.getElementById('scout-speed-val');
    speedSlider.addEventListener('input', (e) => {
      this.state.v = parseFloat(e.target.value);
      speedVal.textContent = `${this.state.v.toFixed(2)} m/s`;
      this.updateKinematics();
    });

    const yawSlider = document.getElementById('scout-yaw-slider');
    const yawVal = document.getElementById('scout-yaw-val');
    yawSlider.addEventListener('input', (e) => {
      this.state.omega = parseFloat(e.target.value);
      yawVal.textContent = `${this.state.omega.toFixed(2)} rad/s`;
      this.updateKinematics();
    });

    // Camera Presets
    const camBtns = this.container.querySelectorAll('.scout-cam-btn');
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
    document.getElementById('toggle-vectors').addEventListener('change', (e) => {
      this.state.showVectors = e.target.checked;
      Object.values(this.forceVectors).forEach(a => a.visible = this.state.showVectors);
    });

    document.getElementById('toggle-icr').addEventListener('change', (e) => {
      this.state.showICR = e.target.checked;
      this.icrGroup.visible = this.state.showICR;
      this.icrRadiusLine.visible = this.state.showICR;
    });

    document.getElementById('toggle-dimensions').addEventListener('change', (e) => {
      this.state.showDimensions = e.target.checked;
      this.dimensionGroup.visible = this.state.showDimensions;
    });

    document.getElementById('toggle-trajectory').addEventListener('change', (e) => {
      this.state.showTrajectory = e.target.checked;
      this.trajectoryMesh.visible = this.state.showTrajectory;
    });

    document.getElementById('toggle-follow-cam').addEventListener('change', (e) => {
      this.state.followCamera = e.target.checked;
    });
  }

  setMode(mode) {
    this.state.mode = mode;
    const speedSlider = document.getElementById('scout-speed-slider');
    const yawSlider = document.getElementById('scout-yaw-slider');
    const speedVal = document.getElementById('scout-speed-val');
    const yawVal = document.getElementById('scout-yaw-val');
    const badge = document.getElementById('hud-mode-badge');

    if (mode === 'straight') {
      badge.textContent = 'STRAIGHT';
      badge.style.background = 'rgba(16, 185, 129, 0.25)';
      badge.style.color = '#34d399';
      this.state.v = 1.0;
      this.state.omega = 0.0;
      speedSlider.value = 1.0;
      yawSlider.value = 0.0;
      yawSlider.disabled = true;
    } else if (mode === 'turn') {
      badge.textContent = 'DIFF TURN';
      badge.style.background = 'rgba(59, 130, 246, 0.25)';
      badge.style.color = '#60a5fa';
      this.state.v = 1.0;
      this.state.omega = 0.8;
      speedSlider.value = 1.0;
      yawSlider.value = 0.8;
      yawSlider.disabled = false;
    } else if (mode === 'pivot') {
      badge.textContent = 'ZERO-RADIUS PIVOT';
      badge.style.background = 'rgba(168, 85, 247, 0.25)';
      badge.style.color = '#c084fc';
      this.state.v = 0.0;
      this.state.omega = 1.2;
      speedSlider.value = 0.0;
      yawSlider.value = 1.2;
      speedSlider.disabled = true;
      yawSlider.disabled = false;
    }

    if (mode !== 'straight') yawSlider.disabled = false;
    if (mode !== 'pivot') speedSlider.disabled = false;

    speedVal.textContent = `${this.state.v.toFixed(2)} m/s`;
    yawVal.textContent = `${this.state.omega.toFixed(2)} rad/s`;

    this.updateKinematics();
  }

  setCameraPreset(preset) {
    const curTarget = this.controls.target.clone();
    if (preset === 'iso') {
      this.cameraTargetPos = new THREE.Vector3(curTarget.x + 2.0, 1.8, curTarget.z + 2.2);
    } else if (preset === 'top') {
      this.cameraTargetPos = new THREE.Vector3(curTarget.x + 0.001, 3.8, curTarget.z);
    } else if (preset === 'front') {
      this.cameraTargetPos = new THREE.Vector3(curTarget.x + 2.8, 0.5, curTarget.z);
    } else if (preset === 'side') {
      this.cameraTargetPos = new THREE.Vector3(curTarget.x, 0.5, curTarget.z + 2.8);
    }
  }

  updateKinematics() {
    const v = this.state.v;
    const omega = this.state.omega;
    const Weff = this.params.effectiveTrack;
    const r = this.params.wheelRadius;

    // Inverse Kinematics for Differential Drive:
    // vL = v - (Weff / 2) * omega
    // vR = v + (Weff / 2) * omega
    const vL = v - (Weff / 2) * omega;
    const vR = v + (Weff / 2) * omega;

    const omegaL = vL / r;
    const omegaR = vR / r;

    const rpmL = (omegaL * 60) / (2 * Math.PI);
    const rpmR = (omegaR * 60) / (2 * Math.PI);

    // Turning Radius R = v / omega
    let radiusStr = '∞ (Straight)';
    let radius = 0;
    if (Math.abs(omega) > 0.001) {
      radius = v / omega;
      if (Math.abs(v) < 0.001) {
        radiusStr = '0 m (Pure Pivot)';
      } else {
        radiusStr = `${radius.toFixed(2)} m`;
      }
    }

    // Scrub Torque Estimation from Section 4 formula:
    // M_scrub = mu_s * N * L / 2
    // N per wheel = (m * g) / 4
    const g = 9.81;
    const normalPerWheel = (this.params.mass * g) / 4;
    // Resisting torque during skid steer
    let mScrub = 0;
    if (Math.abs(omega) > 0.05) {
      mScrub = this.params.mu_tarmac * (this.params.mass * g) * (this.params.wheelbase / 4);
    }

    this.state.vL = vL;
    this.state.vR = vR;
    this.state.omegaL = omegaL;
    this.state.omegaR = omegaR;
    this.state.rpmL = rpmL;
    this.state.rpmR = rpmR;
    this.state.turningRadius = radius;
    this.state.mScrub = mScrub;

    // Update Telemetry HUD DOM
    document.getElementById('hud-v').textContent = `${v.toFixed(2)} m/s`;
    document.getElementById('hud-omega').textContent = `${omega.toFixed(2)} rad/s`;
    document.getElementById('hud-vl').textContent = `${vL.toFixed(2)} m/s`;
    document.getElementById('hud-vr').textContent = `${vR.toFixed(2)} m/s`;
    document.getElementById('hud-omegal').textContent = `${omegaL.toFixed(2)} rad/s (${Math.round(rpmL)} rpm)`;
    document.getElementById('hud-omegar').textContent = `${omegaR.toFixed(2)} rad/s (${Math.round(rpmR)} rpm)`;
    document.getElementById('hud-radius').textContent = radiusStr;
    document.getElementById('hud-mscrub').textContent = mScrub > 0 ? `${mScrub.toFixed(1)} Nm` : '0.0 Nm';

    // Update Force Vector Helpers
    this.updateForceVectors(vL, vR, omega);
  }

  updateForceVectors(vL, vR, omega) {
    const wb = this.params.wheelbase;
    const tr = this.params.trackwidth;
    const scale = 0.25;

    // Wheel positions relative to vehicle center:
    // FL: (+wb/2, 0.01, +tr/2)
    // FR: (+wb/2, 0.01, -tr/2)
    // RL: (-wb/2, 0.01, +tr/2)
    // RR: (-wb/2, 0.01, -tr/2)
    const setArrow = (arrow, pos, dir, length) => {
      arrow.position.copy(pos);
      if (length < 0.02) {
        arrow.visible = false;
        return;
      }
      arrow.visible = this.state.showVectors;
      arrow.setDirection(dir.clone().normalize());
      arrow.setLength(Math.min(length, 0.8), length * 0.25, length * 0.15);
    };

    // Longitudinal Traction (Emerald)
    const fwd = new THREE.Vector3(1, 0, 0);
    const rev = new THREE.Vector3(-1, 0, 0);

    setArrow(this.forceVectors.fl_traction, new THREE.Vector3(wb/2, 0.01, tr/2), vL >= 0 ? fwd : rev, Math.abs(vL) * scale);
    setArrow(this.forceVectors.fr_traction, new THREE.Vector3(wb/2, 0.01, -tr/2), vR >= 0 ? fwd : rev, Math.abs(vR) * scale);
    setArrow(this.forceVectors.rl_traction, new THREE.Vector3(-wb/2, 0.01, tr/2), vL >= 0 ? fwd : rev, Math.abs(vL) * scale);
    setArrow(this.forceVectors.rr_traction, new THREE.Vector3(-wb/2, 0.01, -tr/2), vR >= 0 ? fwd : rev, Math.abs(vR) * scale);

    // Lateral Scrub Resisting Forces (Red/Amber)
    // When turning left (omega > 0): front wheels scrub outward/inward, rear scrub opposite
    const scrubLen = Math.abs(omega) * 0.22;
    const outLeft = new THREE.Vector3(0, 0, 1);
    const inRight = new THREE.Vector3(0, 0, -1);

    if (Math.abs(omega) > 0.05) {
      const sign = Math.sign(omega);
      setArrow(this.forceVectors.fl_scrub, new THREE.Vector3(wb/2, 0.01, tr/2), sign > 0 ? inRight : outLeft, scrubLen);
      setArrow(this.forceVectors.fr_scrub, new THREE.Vector3(wb/2, 0.01, -tr/2), sign > 0 ? inRight : outLeft, scrubLen);
      setArrow(this.forceVectors.rl_scrub, new THREE.Vector3(-wb/2, 0.01, tr/2), sign > 0 ? outLeft : inRight, scrubLen);
      setArrow(this.forceVectors.rr_scrub, new THREE.Vector3(-wb/2, 0.01, -tr/2), sign > 0 ? outLeft : inRight, scrubLen);
    } else {
      this.forceVectors.fl_scrub.visible = false;
      this.forceVectors.fr_scrub.visible = false;
      this.forceVectors.rl_scrub.visible = false;
      this.forceVectors.rr_scrub.visible = false;
    }
  }

  updateTrajectoryMesh() {
    if (!this.trajectoryMesh) return;
    const pts = this.trajectoryPoints;
    if (pts.length < 2) {
      this.trajectoryMesh.geometry.setFromPoints([]);
      return;
    }
    this.trajectoryMesh.geometry.dispose();
    this.trajectoryMesh.geometry = new THREE.BufferGeometry().setFromPoints(pts);
  }

  animate(now) {
    requestAnimationFrame(this.animate);

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.state.isPlaying) {
      const v = this.state.v;
      const omega = this.state.omega;

      // 1. Update Vehicle Pose (Planar Differential Drive Odometry)
      // Heading psi (rad): +psi is counter-clockwise yaw in X-Z plane
      this.state.pose.heading += omega * dt;
      const heading = this.state.pose.heading;

      // In Three.js: forward is +X, lateral left is +Z
      const dx = v * Math.cos(heading) * dt;
      const dz = -v * Math.sin(heading) * dt; // negative sin for right-handed +Y up

      this.state.pose.x += dx;
      this.state.pose.z += dz;

      // Soft loop boundary if vehicle wanders too far
      const bound = 9.0;
      if (Math.abs(this.state.pose.x) > bound || Math.abs(this.state.pose.z) > bound) {
        this.state.pose.x *= -0.85;
        this.state.pose.z *= -0.85;
        this.trajectoryPoints = [];
      }

      // Update vehicle group transform
      this.vehicleGroup.position.set(this.state.pose.x, 0, this.state.pose.z);
      this.vehicleGroup.rotation.y = heading;

      // 2. Animate Wheel Rotations
      // Left and right wheels spin according to their respective angular velocities
      const dThetaL = this.state.omegaL * dt;
      const dThetaR = this.state.omegaR * dt;

      this.wheelRotationAngles.L -= dThetaL;
      this.wheelRotationAngles.R -= dThetaR;

      if (this.wheels.fl) this.wheels.fl.rotation.z = this.wheelRotationAngles.L;
      if (this.wheels.rl) this.wheels.rl.rotation.z = this.wheelRotationAngles.L;
      if (this.wheels.fr) this.wheels.fr.rotation.z = this.wheelRotationAngles.R;
      if (this.wheels.rr) this.wheels.rr.rotation.z = this.wheelRotationAngles.R;

      // 3. Update Trajectory Breadcrumbs
      const curPos = new THREE.Vector3(this.state.pose.x, 0.015, this.state.pose.z);
      if (this.trajectoryPoints.length === 0 || curPos.distanceTo(this.trajectoryPoints[this.trajectoryPoints.length - 1]) > 0.08) {
        this.trajectoryPoints.push(curPos);
        if (this.trajectoryPoints.length > this.maxTrajectoryPoints) {
          this.trajectoryPoints.shift();
        }
        this.updateTrajectoryMesh();
      }

      // 4. Update Instantaneous Center of Rotation (ICR)
      if (this.state.showICR) {
        if (Math.abs(omega) > 0.05) {
          const R = this.state.turningRadius;
          // In vehicle local frame, ICR is at (0, 0, R)
          // Transform to world coordinates:
          const localIcr = new THREE.Vector3(0, 0.01, R);
          localIcr.applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
          const worldIcr = curPos.clone().add(localIcr);

          this.icrGroup.position.copy(worldIcr);
          this.icrGroup.visible = true;

          // Connect dashed radius line from vehicle center to ICR
          this.icrRadiusLine.geometry.dispose();
          this.icrRadiusLine.geometry = new THREE.BufferGeometry().setFromPoints([curPos, worldIcr]);
          this.icrRadiusLine.computeLineDistances();
          this.icrRadiusLine.visible = true;
        } else {
          this.icrGroup.visible = false;
          this.icrRadiusLine.visible = false;
        }
      }

      // 5. Follow Camera
      if (this.state.followCamera) {
        this.controls.target.lerp(new THREE.Vector3(this.state.pose.x, 0.2, this.state.pose.z), 0.08);
      }
    }

    // Smooth camera transition if preset was clicked
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
  const container = document.getElementById('scout2-steering-container');
  if (container) {
    window.scoutViewer = new Scout2SteeringViewer('scout2-steering-container');
  }
});

export { Scout2SteeringViewer };
