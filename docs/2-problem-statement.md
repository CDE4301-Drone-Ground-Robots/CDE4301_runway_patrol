---
layout: default
title: "2. Problem Statement"
nav_order: 3
---

# 2. Problem Statement
{: .fs-9 .fw-700 }

**Key Operational Bottlenecks in Airfield Inspection Protocols**
{: .fs-6 .fw-300 .text-purple-000 .mb-4 }

Current military and commercial airfield inspection protocols rely on legacy workflows or single-agent systems that create three primary operational bottlenecks:

---

## 🛑 Operational Bottlenecks

<div style="display: flex; flex-direction: column; gap: 16px; margin: 24px 0;">

  <!-- BOTTLENECK 1 -->
  <div style="background: #ffffff; border: 1px solid #e1e4e8; border-left: 5px solid #d9381e; border-radius: 6px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <div style="display: flex; justify-content: space-between; align-align: center; margin-bottom: 8px;">
      <h3 style="margin: 0; color: #d9381e;">1. Excessive Runway Occupancy Time (ROT)</h3>
      <span style="background-color: #ffeef0; color: #d9381e; font-size: 0.75em; padding: 2px 8px; border-radius: 10px; font-weight: bold;">HIGH IMPACT</span>
    </div>
    <p style="margin: 0; color: #24292e; line-height: 1.6;">
      Manual visual sweeps ("FOD walks") or slow ground-only vehicle sweeps take too long to cover vast airfield expanses—such as the <strong>5 km × 60 m runway strip at Changi Airport Terminal 5</strong>. This extended occupancy directly conflicts with high-density flight operations, causing severe scheduling delays and restricting sortie generation rates.
    </p>
  </div>

  <!-- BOTTLENECK 2 -->
  <div style="background: #ffffff; border: 1px solid #e1e4e8; border-left: 5px solid #e36209; border-radius: 6px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <h3 style="margin: 0; color: #e36209;">2. The "Detect-to-Clear" Latency Gap</h3>
      <span style="background-color: #fffdef; color: #b05000; font-size: 0.75em; padding: 2px 8px; border-radius: 10px; font-weight: bold;">PROCESS BOTTLENECK</span>
    </div>
    <p style="margin: 0; color: #24292e; line-height: 1.6;">
      Existing automated optical camera systems (e.g., <em>iFerret 2.0™</em>) can alert operators to potential debris, but <strong>they cannot physically remove it</strong>. Human ground crews are still required to receive the alert, drive out to the runway, visually locate the item, and manually retrieve it—creating significant operational latency and requiring additional runway downtime.
    </p>
  </div>

  <!-- BOTTLENECK 3 -->
  <div style="background: #ffffff; border: 1px solid #e1e4e8; border-left: 5px solid #4c00fd; border-radius: 6px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <h3 style="margin: 0; color: #4c00fd;">3. Environmental &amp; Payload Trade-offs</h3>
      <span style="background-color: #eef0ff; color: #4c00fd; font-size: 0.75em; padding: 2px 8px; border-radius: 10px; font-weight: bold;">HARDWARE LIMITATION</span>
    </div>
    <p style="margin: 0; color: #24292e; line-height: 1.6;">
      Single-agent robotic systems fail to balance speed and physical capacity:
    </p>
    <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #444;">
      <li><strong>Aerial Drones (UAV Only):</strong> Possess high speed and wide field-of-view, but lack payload capacity for heavy extraction tooling (vacuums, containment boxes).</li>
      <li><strong>Ground Rovers (UGV Only):</strong> Possess high payload capacity for extraction, but lack high-altitude line-of-sight required for rapid macro-sweeps.</li>
    </ul>
  </div>

</div>

---

{: .highlight }
> ### Summary Goal
> To overcome these bottlenecks, a solution must decouple **macro-scanning speed** (handled by an airborne platform) from **micro-verification and physical extraction** (handled by a targeted ground platform).