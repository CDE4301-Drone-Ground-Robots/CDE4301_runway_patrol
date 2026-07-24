---
layout: default
title: "3. Multi-Agent System Architecture"
nav_order: 4
---

# 3. Multi-Agent System Architecture & Rationale
{: .fs-9 .fw-700 }

**Heterogeneous Collaborative Framework for "Find-and-Fix" Airfield Operations**
{: .fs-6 .fw-300 .text-purple-000 .mb-4 }

Project **Runway Patrol** utilizes a **Heterogeneous Collaborative Framework** to combine the unique physical strengths of aerial and ground robotics into a unified operational loop.

---

## 🏗️ System Architecture Workflow

<!-- SYSTEM ARCHITECTURE DIAGRAM -->
<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 24px; margin: 20px 0;">
  <h3 align="center" style="margin-top: 0; color: #1a1a1a; font-size: 1.25em;">Heterogeneous Multi-Agent Loop</h3>
  <p align="center" style="color: #6c757d; font-size: 0.9em; margin-bottom: 24px;">
    <strong>Deployment Target:</strong> Singapore Changi Airport Terminal 5 Runway (5 km length × 60 m width)
  </p>

  <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
    
    <!-- UAV CARD -->
    <div style="background-color: #ffffff; border-left: 5px solid #0066cc; border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-radius: 6px; padding: 18px; width: 95%; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0; color: #0066cc; font-size: 1.1em;">1. UAV (Aerial Scout Platform)</h4>
        <span style="background-color: #e6f2ff; color: #0066cc; font-size: 0.75em; padding: 2px 8px; border-radius: 10px; font-weight: bold;">MACRO SCANNING</span>
      </div>
      <ul style="margin: 0; padding-left: 20px; font-size: 0.9em; color: #333333; line-height: 1.5;">
        <li>Executes high-velocity aerial grid sweeps across the 5 km × 60 m runway strip.</li>
        <li>Detects candidate Foreign Object Debris (FOD) anomalies using macro computer vision.</li>
        <li>Zero ground footprint during sweep phase to keep active flight lanes completely clear.</li>
      </ul>
    </div>

    <!-- DATA LINK CONNECTOR -->
    <div style="text-align: center; color: #4c00fd; font-weight: bold; font-size: 0.85em; padding: 6px 16px; background-color: #eef0ff; border: 1px dashed #4c00fd; border-radius: 20px;">
      ▼ Secure Encrypted C2 Link (GPS Coordinates &amp; JSON Target Telemetry)
    </div>

    <!-- UGV CARD (PRIMARY TEAM FOCUS) -->
    <div style="background-color: #ffffff; border-left: 6px solid #4c00fd; border-top: 2px solid #4c00fd; border-right: 2px solid #4c00fd; border-bottom: 2px solid #4c00fd; border-radius: 6px; padding: 20px; width: 95%; box-shadow: 0 4px 12px rgba(76, 0, 253, 0.08);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0; color: #4c00fd; font-size: 1.15em;">2. UGV (Ground Remediation Platform)</h4>
        <span style="background-color: #4c00fd; color: #ffffff; font-size: 0.75em; padding: 3px 10px; border-radius: 10px; font-weight: bold; letter-spacing: 0.5px;">PRIMARY REPORT FOCUS</span>
      </div>
      <ul style="margin: 0; padding-left: 20px; font-size: 0.95em; color: #1a1a1a; line-height: 1.6;">
        <li><strong>Precision Waypoint Routing:</strong> Autonomous routing dispatched directly to cued drone coordinates.</li>
        <li><strong>Multi-Modal Target Verification:</strong> Centimeter-accurate local identification using onboard 3D LiDAR &amp; camera suite.</li>
        <li><strong>Physical Debris Extraction:</strong> Heavy payload collection via localized vacuum and magnetic clearance modules.</li>
      </ul>
    </div>

  </div>
</div>

---

## 📊 Operational & Engineering System Justifications

Evaluating architecture options highlights why a joint heterogeneous team outperforms single-agent alternatives across all key mission criteria:

| Mission Metric | UAV Only | UGV Only | Joint UAV + UGV (Selected) |
| :--- | :--- | :--- | :--- |
| **Area Sweep Velocity** | ⚡ Fastest *(High altitude coverage)* | 🐢 Slow *(Limited ground line-of-sight)* | ⚡ **Fastest** *(UAV handles macro grid scan)* |
| **Physical Clearance** | ❌ Impossible *(Weight/thrust limits)* | 🟩 High *(Carries heavy vacuum/payloads)* | 🟩 **High** *(UGV dispatched only when cued)* |
| **Runway Occupancy** | 🟩 Minimal *(Airborne)* | ❌ High *(Occupies lane continuously)* | 🟩 **Optimized** *(UGV targets specific coordinates)* |
| **Verification Accuracy** | ⚠️ Moderate *(Heat haze / altitude)* | 🟩 Precision *(Centimeter-range LiDAR/RGB)* | 🟩 **Precision** *(UGV verifies before extraction)* |

---

{: .note }
> **Key Engineering Takeaway:**
> By decoupling high-speed macro scouting from heavy physical extraction, the system minimizes overall Runway Occupancy Time (ROT) while retaining 100% physical clearance capability.