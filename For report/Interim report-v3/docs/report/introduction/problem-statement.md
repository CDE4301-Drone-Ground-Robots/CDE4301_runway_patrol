---
title: "2. Problem Statement Spec"
owner: "FOD Hunter team"
outline: [2,3]
---
# 2. Problem Statement Spec

## 2. Problem Statement

<!-- #region report -->

Key Operational Bottlenecks in Airfield Inspection Protocols

Current military and commercial airfield inspection protocols rely on legacy workflows or single-agent systems that create three primary operational bottlenecks:

---

## 🛑 Operational Bottlenecks

::: info
**1. Excessive Runway Occupancy Time (ROT)**

<Badge type="danger" text="HIGH IMPACT" />

Manual visual sweeps ("FOD walks") or slow ground-only vehicle sweeps take too long to cover vast airfield expanses—such as the **5 km × 60 m runway strip at Changi Airport Terminal 5**. This extended occupancy directly conflicts with high-density flight operations, causing severe scheduling delays and restricting sortie generation rates.
:::

::: info
**2. The "Detect-to-Clear" Latency Gap**

<Badge type="warning" text="PROCESS BOTTLENECK" />

Existing automated optical camera systems (e.g., *iFerret 2.0™*) can alert operators to potential debris, but **they cannot physically remove it**. Human ground crews are still required to receive the alert, drive out to the runway, visually locate the item, and manually retrieve it—creating significant operational latency and requiring additional runway downtime.
:::

::: info
**3. Environmental & Payload Trade-offs**

<Badge type="info" text="HARDWARE LIMITATION" />

Single-agent robotic systems fail to balance speed and physical capacity:

- **Aerial Drones (UAV Only):** Possess high speed and wide field-of-view, but lack payload capacity for heavy extraction tooling (vacuums, containment boxes).
- **Ground Rovers (UGV Only):** Possess high payload capacity for extraction, but lack high-altitude line-of-sight required for rapid macro-sweeps.
:::

---

::: info Summary Goal
To overcome these bottlenecks, a solution must decouple **macro-scanning speed** (handled by an airborne platform) from **micro-verification and physical extraction** (handled by a targeted ground platform).
:::

<!-- #endregion report -->
