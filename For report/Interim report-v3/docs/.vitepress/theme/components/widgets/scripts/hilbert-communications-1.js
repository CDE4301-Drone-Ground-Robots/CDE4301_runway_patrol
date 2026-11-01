// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    // -------------------------------------------------------------
    // Interactive Widget A: Network Architecture Explorer
    // -------------------------------------------------------------
    const netSem1SVG = `
      <svg viewBox="0 0 880 260" width="100%"  xmlns="http://www.w3.org/2000/svg" style="max-height: 260px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Background Grid -->
        <rect width="880" height="260" fill="#090d16" rx="8"/>
        
        <!-- Machine 1: Raspberry Pi 5 (UAV C2) -->
        <g transform="translate(40, 30)">
          <rect width="240" height="190" rx="8" fill="#131c2e" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="120" y="28" fill="#60a5fa" font-size="13" font-weight="700" text-anchor="middle">🍓 Machine 1: Raspberry Pi 5</text>
          <text x="120" y="46" fill="#94a3b8" font-size="10.5" text-anchor="middle">UAV C2 Ground Terminal</text>
          
          <rect x="20" y="65" width="200" height="42" rx="5" fill="#1e293b" stroke="#334155"/>
          <text x="120" y="84" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">DemoComs_C2.py</text>
          <text x="120" y="98" fill="#38bdf8" font-size="9.5" text-anchor="middle">Publishes /c2/target_alert</text>

          <rect x="20" y="120" width="200" height="42" rx="5" fill="#1e293b" stroke="#334155"/>
          <text x="120" y="139" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">CycloneDDS Transport</text>
          <text x="120" y="153" fill="#a78bfa" font-size="9.5" text-anchor="middle">IP: 192.168.168.50 (wlan0)</text>
          
          <rect x="20" y="174" width="200" height="26" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981"/>
          <text x="120" y="191" fill="#34d399" font-size="10" font-weight="700" text-anchor="middle">VALIDATED IN BENCHTOP SIL</text>
        </g>

        <!-- Transport: Wi-Fi Router / Hotspot -->
        <g transform="translate(340, 65)">
          <circle cx="100" cy="65" r="55" fill="#1e293b" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/>
          <text x="100" y="58" fill="#38bdf8" font-size="22" text-anchor="middle">📶</text>
          <text x="100" y="80" fill="#f8fafc" font-size="11.5" font-weight="700" text-anchor="middle">Wi-Fi Subnet</text>
          <text x="100" y="95" fill="#94a3b8" font-size="9.5" text-anchor="middle">2.4 / 5.8 GHz WLAN</text>
          <text x="100" y="108" fill="#64748b" font-size="9" text-anchor="middle">Static Unicast Peering</text>
        </g>

        <!-- Connecting Arrows -->
        <path d="M 280 140 L 340 130" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,4" fill="none" marker-end="url(#arrow)"/>
        <path d="M 540 130 L 600 140" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,4" fill="none"/>

        <!-- Machine 2: Engineering Workstation (Laptop) -->
        <g transform="translate(600, 30)">
          <rect width="240" height="190" rx="8" fill="#131c2e" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="120" y="28" fill="#60a5fa" font-size="13" font-weight="700" text-anchor="middle">💻 Machine 2: Laptop (WSL2)</text>
          <text x="120" y="46" fill="#94a3b8" font-size="10.5" text-anchor="middle">UGV Simulation &amp; Autonomy</text>

          <rect x="20" y="65" width="200" height="42" rx="5" fill="#1e293b" stroke="#334155"/>
          <text x="120" y="84" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">ugv_c2_bridge_node</text>
          <text x="120" y="98" fill="#34d399" font-size="9.5" text-anchor="middle">Subscribes &amp; Dispatches to Nav2</text>

          <rect x="20" y="120" width="200" height="42" rx="5" fill="#1e293b" stroke="#334155"/>
          <text x="120" y="139" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">CycloneDDS Transport</text>
          <text x="120" y="153" fill="#a78bfa" font-size="9.5" text-anchor="middle">IP: 192.168.168.100 (WSL2 NAT)</text>

          <rect x="20" y="174" width="200" height="26" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981"/>
          <text x="120" y="191" fill="#34d399" font-size="10" font-weight="700" text-anchor="middle">VALIDATED IN BENCHTOP SIL</text>
        </g>
      </svg>
    `;

    const netSem2SVG = `
      <svg viewBox="0 0 880 260" width="100%"  xmlns="http://www.w3.org/2000/svg" style="max-height: 260px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Background Grid -->
        <rect width="880" height="260" fill="#090d16" rx="8"/>
        
        <!-- UAV Drone Subsystem -->
        <g transform="translate(30, 30)">
          <rect width="250" height="190" rx="8" fill="#131c2e" stroke="#c084fc" stroke-width="1.5"/>
          <text x="125" y="28" fill="#c084fc" font-size="13" font-weight="700" text-anchor="middle">🚁 Aerial Scouting UAV</text>
          <text x="125" y="46" fill="#94a3b8" font-size="10.5" text-anchor="middle">YOLO Edge Vision + RPi 5</text>
          
          <rect x="15" y="65" width="220" height="38" rx="5" fill="#1e293b" stroke="#334155"/>
          <text x="125" y="82" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">C2 Mission Dispatcher</text>
          <text x="125" y="95" fill="#a78bfa" font-size="9" text-anchor="middle">JSON Target Assembly</text>

          <rect x="15" y="112" width="220" height="42" rx="5" fill="rgba(192, 132, 252, 0.1)" stroke="#a855f7"/>
          <text x="125" y="129" fill="#f8fafc" font-size="10.5" font-weight="600" text-anchor="middle">Serial Framing Gateway Node</text>
          <text x="125" y="143" fill="#c084fc" font-size="9" text-anchor="middle">COBS Encoding + CRC-32 (UART)</text>
          
          <rect x="15" y="165" width="220" height="38" rx="4" fill="#0f172a" stroke="#475569"/>
          <text x="125" y="182" fill="#38bdf8" font-size="10.5" font-weight="700" text-anchor="middle">Holybro P900 V2 (UAV OEM)</text>
          <text x="125" y="194" fill="#94a3b8" font-size="9" text-anchor="middle">UART Interface (JST-GH) @ 115.2 kbps</text>
        </g>

        <!-- Long-Range RF Link -->
        <g transform="translate(320, 65)">
          <rect x="0" y="20" width="240" height="90" rx="8" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.5"/>
          <text x="120" y="42" fill="#a5b4fc" font-size="12" font-weight="700" text-anchor="middle">📡 900 MHz FHSS Physical Link</text>
          <text x="120" y="60" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">Microhard P900 V2 Wireless Datalink</text>
          <text x="120" y="78" fill="#34d399" font-size="10" text-anchor="middle">Conforming to Singapore 917–925 MHz</text>
          <text x="120" y="94" fill="#fbbf24" font-size="9.5" text-anchor="middle">Point-to-Point Range &gt; 3.0 km (Air-to-Ground)</text>
        </g>

        <!-- Connecting Lines -->
        <path d="M 280 184 L 320 65" stroke="#818cf8" stroke-width="1.5" stroke-dasharray="4,4" fill="none"/>
        <path d="M 560 65 L 600 184" stroke="#818cf8" stroke-width="1.5" stroke-dasharray="4,4" fill="none"/>

        <!-- UGV Chassis Subsystem -->
        <g transform="translate(600, 30)">
          <rect width="250" height="190" rx="8" fill="#131c2e" stroke="#34d399" stroke-width="1.5"/>
          <text x="125" y="28" fill="#34d399" font-size="13" font-weight="700" text-anchor="middle">🚜 Autonomous Runway UGV</text>
          <text x="125" y="46" fill="#94a3b8" font-size="10.5" text-anchor="middle">Jetson Orin + STM32 Firmware</text>

          <rect x="15" y="65" width="220" height="38" rx="5" fill="#1e293b" stroke="#334155"/>
          <text x="125" y="82" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle">ugv_c2_bridge_node</text>
          <text x="125" y="95" fill="#34d399" font-size="9" text-anchor="middle">Nav2 Action Queue &amp; Marker Array</text>

          <rect x="15" y="112" width="220" height="42" rx="5" fill="rgba(52, 211, 153, 0.1)" stroke="#10b981"/>
          <text x="125" y="129" fill="#f8fafc" font-size="10.5" font-weight="600" text-anchor="middle">Serial Framing Gateway Node</text>
          <text x="125" y="143" fill="#34d399" font-size="9" text-anchor="middle">COBS Decoding + CRC-32 Ingestion</text>

          <rect x="15" y="165" width="220" height="38" rx="4" fill="#0f172a" stroke="#475569"/>
          <text x="125" y="182" fill="#38bdf8" font-size="10.5" font-weight="700" text-anchor="middle">Holybro P900 V2 (UGV OEM)</text>
          <text x="125" y="194" fill="#94a3b8" font-size="9" text-anchor="middle">UART Interface (USB-C / JST-GH)</text>
        </g>
      </svg>
    `;

    function setNetworkView(view) {
      const container = document.getElementById('net-arch-svg-container');
      const banner = document.getElementById('net-arch-status-banner');
      const btnSem1 = document.getElementById('net-btn-sem1');
      const btnSem2 = document.getElementById('net-btn-sem2');

      if (view === 'sem1') {
        container.innerHTML = netSem1SVG;
        btnSem1.classList.add('active');
        btnSem2.classList.remove('active');
        banner.style.background = 'rgba(16, 185, 129, 0.1)';
        banner.style.borderColor = 'rgba(16, 185, 129, 0.25)';
        banner.style.color = '#34d399';
        banner.innerHTML = '<strong>Validation Status:</strong> Verified in physical multi-machine hardware-in-the-loop benchtop tests with CycloneDDS static unicast peering.';
      } else {
        container.innerHTML = netSem2SVG;
        btnSem2.classList.add('active');
        btnSem1.classList.remove('active');
        banner.style.background = 'rgba(192, 132, 252, 0.1)';
        banner.style.borderColor = 'rgba(192, 132, 252, 0.25)';
        banner.style.color = '#c084fc';
        banner.innerHTML = '<strong>Validation Status:</strong> Proposed Semester 2 Architecture. Subject to Singapore IMDA 917–925 MHz regulatory verification, serial gateway software bring-up, and vendor hardware procurement.';
      }
    }

    // Initialize Widget A
    setNetworkView('sem1');

    // -------------------------------------------------------------
    // Interactive Widget B: C2 Message-Flow Explorer
    // -------------------------------------------------------------
    const c2Steps = [
      {
        step: 1,
        title: "Stage 1: Aerial UAV Target Detection & Classification",
        badge: "Raspberry Pi 5 C2 Terminal",
        desc: "YOLOv8 deep learning model on UAV classifies an M8 runway bolt at (X = -15.0 m, Y = 5.0 m) with 96% confidence. The system constructs an initial JSON alert dictionary with a UTC timestamp and SHA-256 signature.",
        code: `{\n  "mission_id": "RUNWAY_INSPECT_2026_0923",\n  "threat_id": "FOD_THREAT_001",\n  "object": "screw",\n  "coordinates": { "x": -15.0, "y": 5.0, "yaw": 0.0 },\n  "confidence": 0.96,\n  "timestamp_utc": "2026-09-23T14:32:00.123Z"\n}`
      },
      {
        step: 2,
        title: "Stage 2: Transport Layer Serialization & Link Broadcast",
        badge: "CycloneDDS / Serial Framing",
        desc: "The JSON payload is converted to a UTF-8 string and published on /c2/target_alert with Transient Local + Reliable QoS. In Sem 2, the Serial Gateway applies COBS packet delimitation and appends a 32-bit CRC checksum across the 900 MHz FHSS RF datalink.",
        code: `// Latched ROS 2 String Topic\nTopic: "/c2/target_alert"\nQoS: { Reliability: RELIABLE, Durability: TRANSIENT_LOCAL, Depth: 10 }\nPayload Size: 486 bytes\nCOBS Delimiter: 0x00 | Checksum: CRC-32 (0x7F2B891A)`
      },
      {
        step: 3,
        title: "Stage 3: UGV Receiver Ingestion & Security Validation",
        badge: "ugv_c2_bridge_node",
        desc: "The UGV tactical bridge node intercepts the message, validates structural integrity, verifies cryptographic hash, checks for duplicate threat IDs, and inspects coordinate bounds against the aerodrome geofence.",
        code: `[SECURITY AUDIT] Received Threat ID: FOD_THREAT_001\n[VALIDATION] Geofence check: X=-15.0 in [-30, 25], Y=5.0 in [-15, 15] -> PASSED\n[VALIDATION] Duplicate check: Threat ID not in active history -> PASSED\n[PRIORITY] Level: NORMAL -> Routing to Nav2 Action Queue`
      },
      {
        step: 4,
        title: "Stage 4: Coordinate Frame Transformation",
        badge: "TF2 Spatial Pipeline",
        desc: "Target coordinates are wrapped into a geometry_msgs/msg/PoseStamped message referencing the global 'map' frame. The yaw angle is converted into a unit quaternion (qz = sin(theta/2), qw = cos(theta/2)).",
        code: `geometry_msgs/msg/PoseStamped:\n  header:\n    frame_id: "map"\n    stamp: { sec: 1727101920, nanosec: 123000000 }\n  pose:\n    position: { x: -15.0, y: 5.0, z: 0.0 }\n    orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }`
      },
      {
        step: 5,
        title: "Stage 5: Nav2 Action Dispatch & Live Telemetry Uplink",
        badge: "Nav2 NavigateToPose & RViz2",
        desc: "The goal is transmitted to Nav2's NavigateToPose action server. Active RViz marker arrays are published on /c2/goal_markers. Concurrently, the UGV streams live telemetry (speed, ETA, distance, battery) back to the UAV via /c2/ugv_telemetry at 1.0 Hz.",
        code: `// Nav2 Action Client: Goal Active\nAction: "navigate_to_pose" -> ACCEPTED\nTarget: FOD_THREAT_001 | Distance: 15.8 m | ETA: 7.1 s\nTelemetry Heartbeat: seq=143 | Battery: 94.5% (23.8V)\nSuction Hood: READY_STANDBY -> Transitions to ACTIVE_SUCTION at target`
      }
    ];

    let currentC2Step = 1;
    let c2PlayInterval = null;

    function renderC2Step(stepNum) {
      currentC2Step = stepNum;
      const data = c2Steps[stepNum - 1];

      document.getElementById('c2-step-title').innerText = data.title;
      document.getElementById('c2-step-badge').innerText = data.badge;
      document.getElementById('c2-step-desc').innerText = data.desc;
      document.getElementById('c2-step-code').innerText = data.code;

      for (let i = 1; i <= 5; i++) {
        const pill = document.getElementById('step-pill-' + i);
        if (pill) {
          if (i === stepNum) pill.classList.add('active');
          else pill.classList.remove('active');
        }
      }
    }

    function nextC2Step() {
      let next = currentC2Step + 1;
      if (next > 5) next = 1;
      renderC2Step(next);
    }

    function prevC2Step() {
      let prev = currentC2Step - 1;
      if (prev < 1) prev = 5;
      renderC2Step(prev);
    }

    function goToC2Step(n) {
      renderC2Step(n);
    }

    function toggleC2Play() {
      const btn = document.getElementById('c2-step-play-btn');
      if (c2PlayInterval) {
        clearInterval(c2PlayInterval);
        c2PlayInterval = null;
        btn.innerText = '▶ Auto Play';
        btn.classList.remove('active');
      } else {
        btn.innerText = '⏸ Pause';
        btn.classList.add('active');
        nextC2Step();
        c2PlayInterval = setInterval(nextC2Step, 3500);
      }
    }

    // Initialize Widget B
    renderC2Step(1);
  
}
