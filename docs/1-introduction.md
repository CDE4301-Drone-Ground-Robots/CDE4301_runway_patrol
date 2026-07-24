---
layout: default
title: "1. Introduction"
nav_order: 2
---

# 1. Introduction
{: .fs-9 .fw-700 }

**Autonomous Airfield Safety & Foreign Object Debris (FOD) Remediation**
{: .fs-6 .fw-300 .text-purple-000 .mb-4 }

<div style="display: flex; gap: 8px; margin-bottom: 24px;">
  <span style="background-color: #4c00fd; color: #fff; font-size: 0.8em; padding: 4px 10px; border-radius: 12px; font-weight: bold;">CDE 4301</span>
  <span style="background-color: #0066cc; color: #fff; font-size: 0.8em; padding: 4px 10px; border-radius: 12px; font-weight: bold;">NUS &amp; Defense Stakeholders</span>
</div>

---

## ⚠️ Operational Threat & Mission Context

Airfield operational readiness depends heavily on maintaining pristine, hazard-free runway surfaces. **Foreign Object Debris (FOD)**—encompassing metallic jet engine fasteners, asphalt chips, tool components, and tire fragments—poses a severe threat to military and commercial aviation. 

{: .warning }
> **Critical Operational Risks:**
> - **Catastrophic Ingestion:** Small particle intake into high-speed jet turbine blades leads to total engine failure.
> - **High-Speed Punctures:** Tire blowouts during takeoff/landing rollouts jeopardize aircraft stability.
> - **Sortie Compromise:** Runway closures for sweeps severely reduce airbase flight availability.

---

## 📉 Limitations of Conventional Methods

Current operational workflows rely on methods that introduce significant operational friction:

<div style="display: flex; gap: 16px; margin: 20px 0; flex-wrap: wrap;">
  <div style="flex: 1; min-width: 280px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 16px;">
    <h3 style="margin-top: 0; color: #c53030;">🚶 Manual FOD Walks</h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 0.9em;">
      <li>Inherently slow and labor-intensive</li>
      <li>Highly susceptible to human operator fatigue</li>
      <li>Requires extensive runway downtime</li>
    </ul>
  </div>
  <div style="flex: 1; min-width: 280px; background: #fffaf0; border: 1px solid #fbd38d; border-radius: 6px; padding: 16px;">
    <h3 style="margin-top: 0; color: #c05621;">📡 Fixed Camera Towers</h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 0.9em;">
      <li>High capital expenditure (e.g., iFerret 2.0™)</li>
      <li>Provides surveillance only; <strong>zero physical remediation</strong></li>
      <li>Still requires manual dispatch for retrieval</li>
    </ul>
  </div>
</div>

---

## 🚀 The Runway Patrol Solution

Project **Runway Patrol** introduces a **Heterogeneous Multi-Agent Autonomous Architecture (UAV + UGV)** engineered for rapid airfield inspection and targeted hazard remediation at locations such as **Singapore Changi Airport Terminal 5** *(5 km runway length × 60 m width)*.

Developed under **CDE 4301** at the **National University of Singapore (NUS)** in collaboration with defense stakeholders (**RSAF** and **RAiD**), this system pairs an Unmanned Aerial Vehicle with an Unmanned Ground Vehicle:

{: .highlight }
> ### 🛸 Aerial Scout Platform (UAV)
> Conducts high-velocity aerial grid sweeps across vast surface areas to rapidly scan and detect candidate debris anomalies using macro computer vision.

{: .note }
> ### 🤖 Ground Remediation Platform (UGV) — *Primary Report Focus*
> Acts as a targeted ground asset, receiving real-time coordinates over a secure network to perform close-range multimodal verification and physical debris extraction.