<!-- NUS LOGO DISPLAY -->
<p align="center">
  <img src="https://nus.edu.sg/images/default-source/identity-images/NUS_logo_full-horizontal.jpg" alt="NUS Logo" width="600" />
</p>

<!-- PROJECT TITLE & SUBTITLES -->
<h1 align="center">Runway Patrol</h1>
<h2 align="center" style="color: #000000;">Autonomous runway inspection robot</h2>
<p align="center"><strong>DRAFT REPORT FOR CDE 4301</strong></p>

<hr />

<!-- TEAM & SUPERVISION SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 0; border: none; margin: 20px 0;">
  <tr style="border: none;">
<!-- LEFT CARD: PROJECT TEAM -->
<td width="48%" valign="top" style="border: 1px solid #e1e4e8; border-radius: 8px; background-color: #ffffff; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
  <p style="color: #4c00fd; font-weight: bold; font-size: 0.85em; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">
    PROJECT TEAM
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none;">
    <tr style="border-bottom: 1px solid #f6f8fa;">
      <!-- Increased padding-right for extra gap -->
      <td width="65%" style="border: none; padding: 8px 30px 8px 0; color: #24292e;"><strong>Hilbert Soh</strong></td>
      <td width="35%" align="right" style="border: none; padding: 8px 0; text-align: right; color: #586069; font-family: monospace;"><strong>A0308263H</strong></td>
    </tr>
    <tr style="border-bottom: 1px solid #f6f8fa;">
      <td width="65%" style="border: none; padding: 8px 30px 8px 0; color: #24292e;"><strong>Asuka</strong></td>
      <td width="35%" align="right" style="border: none; padding: 8px 0; text-align: right; color: #586069; font-family: monospace;"><strong>[add ID]</strong></td>
    </tr>
    <tr style="border-bottom: 1px solid #f6f8fa;">
      <td width="65%" style="border: none; padding: 8px 30px 8px 0; color: #24292e;"><strong>Gabriel Tan</strong></td>
      <td width="35%" align="right" style="border: none; padding: 8px 0; text-align: right; color: #586069; font-family: monospace;"><strong>A0308452H</strong></td>
    </tr>
    <tr style="border-bottom: 1px solid #f6f8fa;">
      <td width="65%" style="border: none; padding: 8px 30px 8px 0; color: #24292e;"><strong>Zacarias Ng</strong></td>
      <td width="35%" align="right" style="border: none; padding: 8px 0; text-align: right; color: #586069; font-family: monospace;"><strong>[add ID]</strong></td>
    </tr>
    <tr>
      <td width="65%" style="border: none; padding: 8px 30px 0 0; color: #24292e;"><strong>Bryan Ng</strong></td>
      <td width="35%" align="right" style="border: none; padding: 8px 0 0 0; text-align: right; color: #586069; font-family: monospace;"><strong>[add ID]</strong></td>
    </tr>
  </table>
</td>
    <!-- MIDDLE GAP -->
    <td width="20%" style="border: none;"></td>
    <!-- RIGHT CARD: SUPERVISION & FACULTY -->
    <td width="48%" valign="top" style="border: 1px solid #e1e4e8; border-radius: 8px; background-color: #ffffff; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
      <p style="color: #4c00fd; font-weight: bold; font-size: 0.85em; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">
        SUPERVISION &amp; FACULTY
      </p>
      <div style="padding: 4px 0;">
        <p style="font-size: 1.2em; font-weight: bold; color: #1b1f23; margin: 0 0 6px 0;">Dr Tang Kok Zuea</p>
        <p style="color: #586069; font-size: 0.9em; line-height: 1.5; margin: 0;">
          Innovation &amp; Design Programme<br>
          College of Design and Engineering<br>
          National University of Singapore
        </p>
      </div>
    </td>

  </tr>
</table>

<hr />

<!-- TABLE OF CONTENTS -->
<h2>Table of Contents</h2>
<ol>
  <li><a href="#1-introduction">Introduction</a></li>
  <li><a href="#2-problem-statement">Problem Statement</a></li>
  <li><a href="#3-multi-agent-system-architecture--rationale">Multi-Agent System Architecture &amp; Rationale</a></li>
  <li>
    <a href="#4-individual-scope">Individual Scope</a>
    <ul>
      <li><a href="#41-hilbert-soh">4.1 Hilbert Soh: Drone-Guided Autonomous Navigation and Obstacle Avoidance</a></li>
      <li><a href="#42-asuka">4.2 Asuka: Scope Title</a></li>
      <li><a href="#43-gabriel-tan">4.3 Gabriel Tan: Scope Title</a></li>
      <li><a href="#44-zacarias-ng">4.4 Zacarias Ng: Scope Title</a></li>
      <li><a href="#45-bryan-ng">4.5 Bryan Ng: Scope Title</a></li>
    </ul>
  </li>
</ol>

<hr />

<!-- SECTION 1 -->
<h2 id="1-introduction">1. Introduction</h2>
<p>
  Airfield operational readiness depends heavily on maintaining pristine, hazard-free runway surfaces. Foreign Object Debris (FOD), encompassing metallic jet engine fasteners, asphalt chips, tool components, and tire fragments, poses a severe threat to military and commercial aviation. Ingestion of small FOD particles into jet turbine intakes or high-speed tire punctures during rollout can lead to catastrophic aircraft loss and severely compromise airbase sortie generation rates.
</p>
<p>
  Traditional manual sweeps ("FOD walks") or manned driver patrols are inherently slow, labor-intensive, subject to operator fatigue, and require extended runway downtime that directly restricts airfield availability. While commercial stationary camera towers (e.g., iFerret 2.0™) provide fixed surveillance, they require massive capital infrastructure and lack physical remediation capabilities.
</p>
<p>
  Project <strong>Runway Patrol</strong> introduces a <strong>Heterogeneous Multi-Agent Autonomous Architecture (UAV + UGV)</strong> engineered for rapid airfield inspection and targeted hazard remediation at locations such as Singapore Changi Airport Terminal 5 (5 km runway length × 60 m width). Developed under CDE 4301 at the National University of Singapore (NUS) in collaboration with defense stakeholders (<strong>RSAF</strong> and <strong>RAiD</strong>), this system pairs an Unmanned Aerial Vehicle (UAV) with an Unmanned Ground Vehicle (UGV). While the full system integrates both platforms, this project report focuses primarily on the design, development, and implementation of the <strong>UGV ground platform</strong>:
</p>
<ul>
  <li>The <strong>UAV</strong> conducts high-velocity aerial grid sweeps to rapidly scan vast surface areas and detect candidate anomalies.</li>
  <li>The <strong>UGV</strong> (Primary Report Focus) acts as a targeted ground asset, receiving real-time coordinates over a secure network to perform close-range multimodal verification and physical debris extraction.</li>
</ul>

<hr />

<!-- SECTION 2 -->
<h2 id="2-problem-statement">2. Problem Statement</h2>
<p>Current military and commercial airfield inspection protocols present three primary operational bottlenecks:</p>
<ol>
  <li><strong>Excessive Runway Occupancy Time (ROT):</strong> Manual visual sweeps or slow ground-only vehicle sweeps take too long to cover full runway lengths (~5 km at Changi T5), conflicting directly with high-density flight operations.</li>
  <li><strong>The "Detect-to-Clear" Latency Gap:</strong> Existing automated optical camera systems like iFerret 2.0 can alert operators to debris but cannot remove it. Human ground crews are still required to drive out, locate, and manually retrieve the object, creating operational downtime.</li>
  <li><strong>Environmental &amp; Payload Trade-offs:</strong> Single-agent systems fail to balance speed and physical capacity. Aerial drones lack the payload capacity to carry heavy physical extraction tooling (vacuum motors, containment boxes), while ground rovers lack the high-altitude line-of-sight required for rapid macro-sweeps.</li>
</ol>

<hr />

<!-- SECTION 3 -->
<h2 id="3-multi-agent-system-architecture--rationale">3. Multi-Agent System Architecture &amp; Rationale</h2>

<p>
  Project <strong>Runway Patrol</strong> utilizes a <strong>Heterogeneous Collaborative Framework</strong> to combine the unique physical strengths of aerial and ground robotics into a unified "Find-and-Fix" operational loop:
</p>

<!-- SYSTEM ARCHITECTURE DIAGRAM -->
<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 24px; margin: 20px 0;">
  <h3 align="center" style="margin-top: 0; color: #1a1a1a;">Heterogeneous Multi-Agent Architecture</h3>
  <p align="center" style="color: #6c757d; font-size: 0.9em; margin-bottom: 20px;">
    Deployment Environment: Singapore Changi Airport Terminal 5 Runway (5 km length × 60 m width)
  </p>

  <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
    <!-- UAV CARD -->
    <div style="background-color: #ffffff; border-left: 4px solid #0066cc; border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; width: 90%; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <h4 style="margin: 0 0 8px 0; color: #0066cc;">1. UAV (Aerial Scout Platform)</h4>
      <ul style="margin: 0; padding-left: 20px; font-size: 0.9em; color: #333333;">
        <li>Executes high-velocity aerial grid sweeps across the 5 km × 60 m runway strip</li>
        <li>Detects candidate Foreign Object Debris (FOD) anomalies using macro computer vision</li>
        <li>Zero ground footprint during sweep phase to keep flight lanes clear</li>
      </ul>
    </div>
    <!-- DATA LINK CONNECTOR -->
    <div style="text-align: center; color: #4c00fd; font-weight: bold; font-size: 0.85em; padding: 4px 12px; background-color: #eef0ff; border-radius: 12px;">
      ▼ Secure Encrypted C2 Link (GPS Coordinates &amp; JSON Target Data)
    </div>
    <!-- UGV CARD (PRIMARY TEAM FOCUS) -->
    <div style="background-color: #ffffff; border-left: 6px solid #4c00fd; border-top: 2px solid #4c00fd; border-right: 2px solid #4c00fd; border-bottom: 2px solid #4c00fd; border-radius: 6px; padding: 18px; width: 90%; box-shadow: 0 4px 8px rgba(76, 0, 253, 0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0; color: #4c00fd; font-size: 1.1em;">2. UGV (Ground Remediation Platform)</h4>
        <span style="background-color: #4c00fd; color: #ffffff; font-size: 0.75em; padding: 2px 8px; border-radius: 10px; font-weight: bold;">PRIMARY REPORT FOCUS</span>
      </div>
      <ul style="margin: 0; padding-left: 20px; font-size: 0.95em; color: #1a1a1a;">
        <li><strong>Waypoint Navigation:</strong> Autonomous precision routing dispatched directly to cued coordinates</li>
        <li><strong>Target Verification:</strong> Centimeter-accurate local identification using onboard 3D LiDAR &amp; vision suite</li>
        <li><strong>Physical Extraction:</strong> Heavy payload collection via localized vacuum and magnetic clearance modules</li>
      </ul>
    </div>

  </div>
</div>

<h3>Operational &amp; Engineering System Justifications</h3>

<table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; text-align: left;">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th>Mission Metric</th>
      <th>UAV Only</th>
      <th>UGV Only</th>
      <th>Joint UAV + UGV (Selected)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Area Sweep Velocity</strong></td>
      <td>⚡ Fastest (High altitude coverage)</td>
      <td>🐢 Slow (Limited ground line-of-sight)</td>
      <td>⚡ Fastest (UAV handles macro grid scan)</td>
    </tr>
    <tr>
      <td><strong>Physical Clearance</strong></td>
      <td>❌ Impossible (Weight/thrust limits)</td>
      <td>🟩 High (Carries heavy vacuum/payloads)</td>
      <td>🟩 High (UGV dispatched only when cued)</td>
    </tr>
    <tr>
      <td><strong>Runway Occupancy</strong></td>
      <td>🟩 Minimal (Airborne)</td>
      <td>❌ High (Occupies lane continuously)</td>
      <td>🟩 Optimized (UGV targets specific coordinates)</td>
    </tr>
    <tr>
      <td><strong>Verification Accuracy</strong></td>
      <td>⚠️ Moderate (Heat haze / altitude)</td>
      <td>🟩 Precision (Centimeter-range LiDAR/RGB)</td>
      <td>🟩 Precision (UGV verifies before extraction)</td>
    </tr>
  </tbody>
</table>

<hr />

<!-- SECTION 4 -->
<h2 id="4-individual-scope">4. Individual Scope</h2>

<table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; text-align: left;">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th width="20%">Member Name</th>
      <th width="35%">Scope Title</th>
      <th width="45%">Key Responsibilities &amp; Summary</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Hilbert Soh</strong></td>
      <td><strong>Drone-Guided Autonomous Navigation and Obstacle Avoidance for a UGV</strong></td>
      <td>
        • Build a messaging module to parse/validate incoming drone waypoints.<br>
        • Implement SLAM for real-time localization and map building.<br>
        • Integrate path planning algorithms for waypoint navigation and obstacle avoidance.<br>
        • Test wireless communication reliability, waypoint accuracy, and safety stops.
      </td>
    </tr>
    <tr>
      <td><strong>Asuka</strong></td>
      <td><em>[Insert Scope Title]</em></td>
      <td><em>[Insert brief summary of key responsibilities]</em></td>
    </tr>
    <tr>
      <td><strong>Gabriel Tan</strong></td>
      <td><em>[Insert Scope Title]</em></td>
      <td><em>[Insert brief summary of key responsibilities]</em></td>
    </tr>
    <tr>
      <td><strong>Zacarias Ng</strong></td>
      <td><em>[Insert Scope Title]</em></td>
      <td><em>[Insert brief summary of key responsibilities]</em></td>
    </tr>
    <tr>
      <td><strong>Bryan Ng</strong></td>
      <td><em>[Insert Scope Title]</em></td>
      <td><em>[Insert brief summary of key responsibilities]</em></td>
    </tr>
  </tbody>
</table>

<br />

<h3>Detailed Individual Scopes</h3>

<h4 id="41-hilbert-soh">4.1 Hilbert Soh: Drone-Guided Autonomous Navigation and Obstacle Avoidance</h4>

<p><strong>Objectives</strong></p>
<ul>
  <li>Establish a communication link to receive target waypoints from a drone.</li>
  <li>Execute autonomous navigation and path-following to reach drone-assigned goals.</li>
  <li>Detect and dynamically avoid obstacles along the path in outdoor environments.</li>
</ul>

<p><strong>Key Responsibilities</strong></p>
<ul>
  <li>Build a messaging module to parse and validate incoming drone waypoints.</li>
  <li>Implement SLAM for real-time localization and map building.</li>
  <li>Integrate path planning algorithms to navigate toward waypoints while avoiding obstacles.</li>
  <li>Test wireless communication reliability, waypoint accuracy, and safety stops on signal loss.</li>
</ul>

<p><strong>Hardware/Software Components</strong></p>
<ul>
  <li><strong>Communication:</strong> MAVLink, ROS 2 Topics/Services, Telemetry Radio / Wi-Fi</li>
  <li><strong>Sensors:</strong> LiDAR, Depth Camera, IMU, GPS / RTK</li>
  <li><strong>Software:</strong> ROS / ROS 2 (Nav2), SLAM Toolbox</li>
  <li><strong>Compute:</strong> Onboard Computer (e.g., NVIDIA Jetson, Intel NUC)</li>
</ul>

<p><strong>Expected Deliverables [Individual]</strong></p>
<ul>
  <li>Drone-to-UGV waypoint communication module</li>
  <li>Autonomous navigation and mapping stack</li>
  <li>Demonstration of drone-guided navigation with dynamic obstacle avoidance</li>
  <li>Navigation and telemetry performance report</li>
</ul>

<hr />

<h4 id="42-asuka">4.2 Asuka: [Scope Title]</h4>
<p><em>(Add detailed scope breakdown here)</em></p>

<hr />

<h4 id="43-gabriel-tan">4.3 Gabriel Tan: [Scope Title]</h4>
<p><em>(Add detailed scope breakdown here)</em></p>

<hr />

<h4 id="44-zacarias-ng">4.4 Zacarias Ng: [Scope Title]</h4>
<p><em>(Add detailed scope breakdown here)</em></p>

<hr />

<h4 id="45-bryan-ng">4.5 Bryan Ng: [Scope Title]</h4>
<p><em>(Add detailed scope breakdown here)</em></p>