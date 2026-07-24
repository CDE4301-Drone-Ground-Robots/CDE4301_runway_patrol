---
layout: default
title: "4.1 Hilbert Soh"
parent: "4. Individual Scope"
nav_order: 1
---

# 4.1 Hilbert Soh
{: .fs-9 .fw-700 }

**Drone-Guided Autonomous Navigation and Obstacle Avoidance for UGV**
{: .fs-6 .fw-300 .text-purple-000 .mb-4 }

<div style="display: flex; gap: 8px; margin-bottom: 24px;">
  <span style="background-color: #4c00fd; color: #fff; font-size: 0.8em; padding: 4px 10px; border-radius: 12px; font-weight: bold;">CDE 4301</span>
  <span style="background-color: #f0f0f0; color: #333; font-size: 0.8em; padding: 4px 10px; border-radius: 12px; font-family: monospace;">A0308263H</span>
</div>

---

## 🎯 Objectives
{: .text-purple-000 }

{: .highlight }
> 1. **Establish Link:** Receive dynamic aerial target waypoints over secure telemetry radio from the UAV platform.
> 2. **Autonomous Routing:** Execute high-precision path planning and trajectory following to reach goal locations.
> 3. **Dynamic Avoidance:** Real-time local obstacle detection and re-routing in unstructured outdoor airbase environments.

---

## 🛠️ Key Responsibilities

<div style="background: #f8f9fa; border-left: 4px solid #4c00fd; border-radius: 4px; padding: 16px; margin-bottom: 20px;">
  <ul style="margin: 0; padding-left: 20px;">
    <li><strong>Messaging Architecture:</strong> Design and deploy a custom ROS 2 message parser/validator to process incoming UAV coordinate streams.</li>
    <li><strong>SLAM & Localization:</strong> Configure and fine-tune <code>SLAM Toolbox</code> for 2D/3D map generation in sparse airfield landscapes.</li>
    <li><strong>Path Planning:</strong> Implement <code>Nav2</code> controller and planner plugins for waypoint execution with dynamic obstacle clearance.</li>
    <li><strong>Fail-safe Protocols:</strong> Implement heartbeat monitors and automated emergency stop logic triggered upon signal loss.</li>
  </ul>
</div>

---

## 💻 Tech Stack & Hardware Components

| Category | Component / Library | Operational Function |
| :--- | :--- | :--- |
| **Communication** | `MAVLink`, ROS 2 Topics/Services, Wi-Fi | Telemetry & C2 coordinate transfer |
| **Sensors** | 3D LiDAR, Depth Camera, IMU, GPS/RTK | Centimeter-level positioning & point-cloud generation |
| **Software Stack** | ROS 2 (Nav2), SLAM Toolbox | Autonomous motion planning & map construction |
| **Onboard Compute** | NVIDIA Jetson / Intel NUC | Edge AI processing & real-time point-cloud evaluation |

---

## 📦 Expected Deliverables

{: .note }
> **Key Project Milestones:**
> - [ ] **Drone-to-UGV Bridge:** Fully integrated waypoint parsing communication module.
> - [ ] **Navigation Stack:** Tested ROS 2 autonomous mapping & navigation pipeline.
> - [ ] **Field Demonstration:** Live dynamic obstacle avoidance trial using cued coordinates.
> - [ ] **Telemetry Report:** Performance analytics on navigation drift, latency, and avoidance reaction times.