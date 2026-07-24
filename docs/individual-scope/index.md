---
layout: default
title: "4. Individual Scope"
nav_order: 5
has_children: true
permalink: /individual-scope/
---

# 4. Individual Scope Overview
{: .fs-9 .fw-700 }

**Subsystem Deliverables & Engineering Ownership**
{: .fs-6 .fw-300 .text-purple-000 .mb-4 }

Each member of the project team leads a distinct engineering scope covering navigation, detection, payload manipulation, and system control.

---

## 👥 Team Member Scopes

<div style="display: flex; flex-direction: column; gap: 16px; margin: 24px 0;">

  <!-- HILBERT SOH -->
  <div style="background: #ffffff; border: 1px solid #e1e4e8; border-left: 5px solid #4c00fd; border-radius: 6px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
      <h3 style="margin: 0; color: #1a1a1a;">
        <a href="{% link individual-scope/hilbert-soh.md %}" style="text-decoration: none; color: #1a1a1a;">Hilbert Soh</a>
      </h3>
      <span style="background-color: #eef0ff; color: #4c00fd; font-size: 0.75em; padding: 3px 10px; border-radius: 12px; font-weight: bold;">NAVIGATION &amp; C2</span>
    </div>
    <p style="font-weight: bold; color: #4c00fd; margin: 0 0 10px 0;">Drone-Guided Autonomous Navigation and Obstacle Avoidance</p>
    <ul style="margin: 0; padding-left: 20px; color: #444; font-size: 0.9em; line-height: 1.6;">
      <li>Build a messaging module to parse and validate incoming UAV target waypoints.</li>
      <li>Implement <code>SLAM Toolbox</code> for real-time localization and map building in outdoor airfields.</li>
      <li>Integrate <code>Nav2</code> path planning algorithms for dynamic obstacle avoidance.</li>
      <li>Validate telemetry radio reliability, waypoint precision, and fail-safe safety stops.</li>
    </ul>
    <div style="margin-top: 14px; text-align: right;">
      <a href="{% link individual-scope/hilbert-soh.md %}" class="btn btn-purple" style="font-size: 0.8em; padding: 4px 12px;">View Full Scope →</a>
    </div>
  </div>

  <!-- ASUKA -->
  <div style="background: #ffffff; border: 1px solid #e1e4e8; border-left: 5px solid #0066cc; border-radius: 6px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
      <h3 style="margin: 0; color: #1a1a1a;">
        <a href="{% link individual-scope/asuka.md %}" style="text-decoration: none; color: #1a1a1a;">Asuka</a>
      </h3>
      <span style="background-color: #e6f2ff; color: #0066cc; font-size: 0.75em; padding: 3px 10px; border-radius: 12px; font-weight: bold;">SUBSYSTEM OWNER</span>
    </div>
    <p style="font-weight: bold; color: #0066cc; margin: 0 0 10px 0;">[Insert Scope Title]</p>
    <p style="margin: 0; color: #666; font-size: 0.9em; italic;">[Insert brief summary of key responsibilities and subsystem deliverables]</p>
    <div style="margin-top: 14px; text-align: right;">
      <a href="{% link individual-scope/asuka.md %}" class="btn" style="font-size: 0.8em; padding: 4px 12px;">View Full Scope →</a>
    </div>
  </div>

  <!-- GABRIEL TAN -->
  <div style="background: #ffffff; border: 1px solid #e1e4e8; border-left: 5px solid #0066cc; border-radius: 6px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
      <h3 style="margin: 0; color: #1a1a1a;">
        <a href="{% link individual-scope/gabriel-tan.md %}" style="text-decoration: none; color: #1a1a1a;">Gabriel Tan</a>
      </h3>
      <span style="background-color: #e6f2ff; color: #0066cc; font-size: 0.75em; padding: 3px 10px; border-radius: 12px; font-weight: bold;">SUBSYSTEM OWNER</span>
    </div>
    <p style="font-weight: bold; color: #0066cc; margin: 0 0 10px 0;">[Insert Scope Title]</p>
    <p style="margin: 0; color: #666; font-size: 0.9em; italic;">[Insert brief summary of key responsibilities and subsystem deliverables]</p>
    <div style="margin-top: 14px; text-align: right;">
      <a href="{% link individual-scope/gabriel-tan.md %}" class="btn" style="font-size: 0.8em; padding: 4px 12px;">View Full Scope →</a>
    </div>
  </div>

  <!-- ZACARIAS NG -->
  <div style="background: #ffffff; border: 1px solid #e1e4e8; border-left: 5px solid #0066cc; border-radius: 6px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
      <h3 style="margin: 0; color: #1a1a1a;">
        <a href="{% link individual-scope/zacarias-ng.md %}" style="text-decoration: none; color: #1a1a1a;">Zacarias Ng</a>
      </h3>
      <span style="background-color: #e6f2ff; color: #0066cc; font-size: 0.75em; padding: 3px 10px; border-radius: 12px; font-weight: bold;">SUBSYSTEM OWNER</span>
    </div>
    <p style="font-weight: bold; color: #0066cc; margin: 0 0 10px 0;">[Insert Scope Title]</p>
    <p style="margin: 0; color: #666; font-size: 0.9em; italic;">[Insert brief summary of key responsibilities and subsystem deliverables]</p>
    <div style="margin-top: 14px; text-align: right;">
      <a href="{% link individual-scope/zacarias-ng.md %}" class="btn" style="font-size: 0.8em; padding: 4px 12px;">View Full Scope →</a>
    </div>
  </div>

  <!-- BRYAN NG -->
  <div style="background: #ffffff; border: 1px solid #e1e4e8; border-left: 5px solid #0066cc; border-radius: 6px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
      <h3 style="margin: 0; color: #1a1a1a;">
        <a href="{% link individual-scope/bryan-ng.md %}" style="text-decoration: none; color: #1a1a1a;">Bryan Ng</a>
      </h3>
      <span style="background-color: #e6f2ff; color: #0066cc; font-size: 0.75em; padding: 3px 10px; border-radius: 12px; font-weight: bold;">SUBSYSTEM OWNER</span>
    </div>
    <p style="font-weight: bold; color: #0066cc; margin: 0 0 10px 0;">[Insert Scope Title]</p>
    <p style="margin: 0; color: #666; font-size: 0.9em; italic;">[Insert brief summary of key responsibilities and subsystem deliverables]</p>
    <div style="margin-top: 14px; text-align: right;">
      <a href="{% link individual-scope/bryan-ng.md %}" class="btn" style="font-size: 0.8em; padding: 4px 12px;">View Full Scope →</a>
    </div>
  </div>

</div>

---

{: .note }
> Click on any team member's button or left sidebar link to view their detailed technical specifications, hardware/software stack, and progress deliverables.