// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    (function() {
      'use strict';

      // Runs only where its markup is on the page (mission pipeline simulator); merged member pages carry these widgets separately.
      if (document.getElementById('sim-btn-prev')) {
      // =========================================================================
      // INTERACTIVE 1: DETECT-TO-CLEAR MISSION PIPELINE SIMULATOR
      // =========================================================================
      const stages = [
        {
          title: "Stage 1: Aerial UAV Edge Detection & Geotagging",
          node: "Active Node: DemoComs_C2.py (Companion RPi 5)",
          latency: "\u0394t = 33.3 ms (30 FPS TensorRT)",
          desc: "Aerial companion computer executes edge YOLOv8 tensor inference on camera stream. Detects FOD fastener with 94.2% confidence and associates instantaneous UAV GNSS/IMU attitude to calculate geodetic ground coordinates.",
          payload: `{\n  "event": "TARGET_DETECTED",\n  "source": "UAV-ALPHA (DJI Matrice Proxy)",\n  "confidence": 0.942,\n  "wgs84": { "lat": 1.3005821, "lon": 103.7712394, "alt_m": 18.52 }\n}`
        },
        {
          title: "Stage 2: C2 Alert Packaging & Cryptographic Signing",
          node: "Active Node: uav_waypoint_commander.py (Tactical C2)",
          latency: "\u0394t = 1.2 ms (JSON + HMAC)",
          desc: "Formats structured JSON packet with message sequence ID, target classification, priority level, and computes a SHA-256 HMAC signature using pre-shared mission keys to safeguard against unauthorized spoofing.",
          payload: `{\n  "header": { "msg_id": "FOD-2026-0042", "timestamp": 1726561800.125 },\n  "target_type": "METALLIC_FASTENER",\n  "priority": "HIGH",\n  "signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"\n}`
        },
        {
          title: "Stage 3: CycloneDDS Static Unicast Transmission",
          node: "Active Middleware: CycloneDDS (192.168.137.233 \u2192 192.168.137.1)",
          latency: "\u0394t = 12.4 ms (Zero Packet Loss)",
          desc: "Transmits packet over 5 GHz Wi-Fi / direct RJ45 datalink via static unicast XML peering. Bypasses router multicast IGMP snooping filters, guaranteeing instantaneous peer-to-peer delivery without broadcast storms.",
          payload: `// cyclonedds.xml Peering Transmission:\n<Discovery>\n  <Peers>\n    <Peer address="192.168.137.1"/>\n    <Peer address="192.168.137.233"/>\n  </Peers>\n</Discovery>`
        },
        {
          title: "Stage 4: UGV Alert Ingestion & Geodetic Transformation",
          node: "Active Node: ugv_c2_bridge_node.py (Hilbert's Laptop)",
          latency: "\u0394t = 2.1 ms (WGS84 \u2192 UTM \u2192 Map)",
          desc: "Validates HMAC integrity, unpacks geodetic lat/lon, projects into UTM Zone 48N Easting/Northing, and executes rigid 2D planar rotation into the Nav2 /map coordinate frame before queueing into FIFO goal buffer.",
          payload: `// UTM Zone 48N \u2192 Nav2 /map frame:\nTarget UTM: E = 363241.182 m, N = 143789.245 m\nNav2 Goal Pose: x = 124.52 m, y = 8.21 m, yaw = 0.072 rad`
        },
        {
          title: "Stage 5: Nav2 Smac Planning & 10 km/h RPP Sprint",
          node: "Active Stack: planner_server & controller_server",
          latency: "\u0394t = 18.4 ms Planning \u2022 50 Hz Control Loop",
          desc: "SmacPlanner2D computes an accelerated costmap corridor path with conjugate gradient curve smoothing. Regulated Pure Pursuit (RPP) guides the UGV along the trajectory at 2.78 m/s (10.0 km/h) with dynamic curvature braking.",
          payload: `// Controller cmd_vel Output (20 Hz):\ngeometry_msgs/msg/Twist {\n  linear:  { x: 2.78 m/s, y: 0.0, z: 0.0 },\n  angular: { x: 0.0, y: 0.0, z: 0.12 rad/s }\n}`
        },
        {
          title: "Stage 6: Safety Stop & Remediation Verification",
          node: "Active Node: nav2_collision_monitor & UGV Bridge",
          latency: "\u0394t = 45.0 ms E-Brake Response \u2022 Clearance ACK",
          desc: "Collision monitor ensures a 0.80 m safety clearance buffer as the rover docks directly over the FOD item. Mechanical vacuum and magnetic arrays engage, clearing the debris and publishing a Telemetry ACK to Base Station.",
          payload: `{\n  "event": "FOD_CLEARED",\n  "target_id": "FOD-2026-0042",\n  "ugv_status": "MISSION_COMPLETE",\n  "runway_state": "ALL_CLEAR"\n}`
        }
      ];

      let currentStage = 0;

      function updateStageDisplay(idx) {
        currentStage = idx;
        const s = stages[idx];
        document.getElementById('sim-node-badge').textContent = s.node;
        document.getElementById('sim-stage-title').textContent = s.title;
        document.getElementById('sim-stage-latency').textContent = s.latency;
        document.getElementById('sim-stage-desc').textContent = s.desc;
        document.getElementById('sim-stage-payload').querySelector('code').textContent = s.payload;

        const pills = document.querySelectorAll('#sim-stage-pills button');
        pills.forEach((p, i) => {
          if (i === idx) {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });
      }

      document.getElementById('sim-btn-prev').addEventListener('click', () => {
        currentStage = (currentStage - 1 + stages.length) % stages.length;
        updateStageDisplay(currentStage);
      });

      document.getElementById('sim-btn-next').addEventListener('click', () => {
        currentStage = (currentStage + 1) % stages.length;
        updateStageDisplay(currentStage);
      });

      document.querySelectorAll('#sim-stage-pills button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const st = parseInt(e.target.getAttribute('data-step'), 10);
          updateStageDisplay(st);
        });
      });

      }

      // Runs only where its markup is on the page (scrub torque calculator); merged member pages carry these widgets separately.
      if (document.getElementById('slider-mass')) {
      // =========================================================================
      // INTERACTIVE 2: TARMAC SCRUB TORQUE & BATTERY CURRENT CALCULATOR
      // =========================================================================
      const sliderMass = document.getElementById('slider-mass');
      const sliderMu = document.getElementById('slider-mu');
      const sliderRadius = document.getElementById('slider-radius');

      const valMass = document.getElementById('val-mass');
      const valMu = document.getElementById('val-mu');
      const valRadius = document.getElementById('val-radius');

      const outMz = document.getElementById('out-mz');
      const outTau = document.getElementById('out-tau');
      const outCurr = document.getElementById('out-curr');
      const outMargin = document.getElementById('out-margin');
      const statusBadge = document.getElementById('scrub-status-badge');

      function calculateScrub() {
        const M = parseFloat(sliderMass.value);
        const mu = parseFloat(sliderMu.value);
        const R = parseFloat(sliderRadius.value);

        valMass.textContent = M.toFixed(1) + ' kg';
        valMu.textContent = mu.toFixed(2);
        valRadius.textContent = R.toFixed(2) + ' m';

        const g = 9.81;
        const L = 0.50; // wheelbase (m)
        const B = 0.58; // track width (m)
        const r = 0.1315; // tire radius (m)
        const eta = 1.00; // direct-drive hub motors (no external gearbox losses)
        const PEAK_MOTOR_TORQUE = 28.5; // Nm (measured dynamometer peak at 108.7 RPM)
        const TAU_CRUISE = 0.73; // Nm (measured cruising resistance per motor)

        // Pivot scrub moment at zero-radius: Mz = 0.5 * mu * M * g * L
        const Mz = 0.5 * mu * M * g * L;

        // Breakaway torque per motor shaft (Nm): tau = (Mz * r) / (2 * B * eta)
        const tau_pivot = (Mz * r) / (2 * B * eta);

        let tau_active;
        if (R <= 0.05) {
          tau_active = tau_pivot;
        } else {
          // Heuristic curve attenuation: scrub diminishes as radius expands
          const scrub_factor = (L / 2) / (R + (L / 2));
          tau_active = TAU_CRUISE + (tau_pivot - TAU_CRUISE) * scrub_factor;
        }

        // Estimated motor phase current (A) interpolated from manufacturer dynamometer load curve
        // Certified load test: 0.73 Nm -> 1.64 A; 2.88 Nm -> 3.44 A; 14.46 Nm -> 13.65 A
        const i_phase = 1.00 + 0.875 * tau_active;

        outMz.textContent = Mz.toFixed(1) + ' N\u00B7m';
        outTau.textContent = tau_active.toFixed(2) + ' N\u00B7m';
        outCurr.textContent = i_phase.toFixed(2) + ' A';

        // Torque headroom against manufacturer peak dynamometer torque (28.5 Nm)
        const margin = Math.max(0, ((PEAK_MOTOR_TORQUE - tau_active) / PEAK_MOTOR_TORQUE) * 100);
        outMargin.textContent = margin.toFixed(1) + '% Headroom';

        if (R < 0.50 || tau_active > 10.0) {
          statusBadge.textContent = '\u26A0\uFE0F High Scrub / Pivot Sizing Case';
          statusBadge.style.background = 'rgba(255, 69, 58, 0.15)';
          statusBadge.style.color = '#ff453a';
          outCurr.style.color = '#ff453a';
          outMargin.style.color = '#ff453a';
        } else if (R < 1.50) {
          statusBadge.textContent = '\u26A0\uFE0F Moderate Scrub Curvature';
          statusBadge.style.background = 'rgba(255, 214, 10, 0.15)';
          statusBadge.style.color = '#ffd60a';
          outCurr.style.color = '#ffd60a';
          outMargin.style.color = '#ffd60a';
        } else {
          statusBadge.textContent = '\u2705 Dubins Envelope (Low Scrub)';
          statusBadge.style.background = 'rgba(41, 151, 255, 0.15)';
          statusBadge.style.color = '#2997ff';
          outCurr.style.color = '#2997ff';
          outMargin.style.color = '#30d158';
        }
      }

      sliderMass.addEventListener('input', calculateScrub);
      sliderMu.addEventListener('input', calculateScrub);
      sliderRadius.addEventListener('input', calculateScrub);
      calculateScrub();

      }

      // Runs only where its markup is on the page (hardware migration switch); merged member pages carry these widgets separately.
      if (document.getElementById('hw-cards-container')) {
      // =========================================================================
      // INTERACTIVE 4: HARDWARE MIGRATION ARCHITECTURE SWITCH
      // =========================================================================
      const p1Specs = [
        { title: "Compute Platform", val: "Hilbert's Laptop (WSL2)", sub: "Intel Core i7 / 16GB RAM / DirectX D3D12 vGPU" },
        { title: "Simulation Bridge", val: "Software-in-the-Loop (ros_gz_bridge)", sub: "Direct ROS 2 Twist to Gazebo DiffDrive plugin; standalone STM32 bench testing" },
        { title: "Global Planner", val: "SmacPlanner2D (Cost-Aware)", sub: "Conjugate gradient curve smoothing on 0.05 m/px costmap" },
        { title: "Datalink Network", val: "CycloneDDS Unicast (Wi-Fi)", sub: "<15 ms Latency across 192.168.137.0/24 testbed" },
        { title: "Perception & SLAM", val: "Gazebo Harmonic SIL Simulation", sub: "2D LiDAR raytracing + AgileX Scout 2.0 proxy model" }
      ];

      const p2Specs = [
        { title: "Compute Platform", val: "NVIDIA Jetson AGX Orin / Industrial PC", sub: "275 TOPS AI / 64GB / Ubuntu 24.04 LTS" },
        { title: "Real-Time Actuation Bridge", val: "STM32 F446RE (USB micro-ROS)", sub: "FreeRTOS client + 1 Mbps isolated CAN to ZLLG80 hub motor servo drivers" },
        { title: "Global Planner", val: "SmacPlannerHybrid (SE(2) Dubins)", sub: "Non-holonomic Dubins state lattice (R >= 1.50 m, 72 angle bins)" },
        { title: "Datalink Network", val: "Microhard P900 V2 FHSS RF", sub: "Sub-1 GHz FHSS, AES-256, subject to IMDA regulatory verification" },
        { title: "Perception & SLAM", val: "3D LiDAR + UM980 RTK-GNSS", sub: "Pointcloud safety polygons + Dual-EKF +/-2cm geodetic fusion" }
      ];

      const hwContainer = document.getElementById('hw-cards-container');
      const btnP1 = document.getElementById('toggle-hw-p1');
      const btnP2 = document.getElementById('toggle-hw-p2');

      function renderHwCards(specs, isPhase2) {
        hwContainer.innerHTML = '';
        specs.forEach(s => {
          const card = document.createElement('div');
          card.style.background = '#0d1117';
          card.style.border = isPhase2 ? '1px solid rgba(41, 151, 255, 0.4)' : '1px solid var(--apple-border)';
          card.style.borderRadius = '8px';
          card.style.padding = '14px';
          card.innerHTML = `
            <div style="font-size: 11px; text-transform: uppercase; color: #86868b; font-weight: 600;">${s.title}</div>
            <div style="font-size: 14.5px; font-weight: 700; color: ${isPhase2 ? '#2997ff' : '#f5f5f7'}; margin-top: 4px;">${s.val}</div>
            <div style="font-size: 11.5px; color: #86868b; margin-top: 4px; line-height: 1.4;">${s.sub}</div>
          `;
          hwContainer.appendChild(card);
        });
      }

      btnP1.addEventListener('click', () => {
        btnP1.classList.add('active');
        btnP2.classList.remove('active');
        renderHwCards(p1Specs, false);
      });

      btnP2.addEventListener('click', () => {
        btnP2.classList.add('active');
        btnP1.classList.remove('active');
        renderHwCards(p2Specs, true);
      });

      // Initial render Phase 1
      renderHwCards(p1Specs, false);

      }

    })();
  
}
