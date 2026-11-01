---
title: "Computer Vision & Sensor Fusion Suite"
owner: "Gabriel Tan"
outline: [2,3]
---
# Computer Vision & Sensor Fusion Suite

<!-- #region report -->

<!-- The Report's Computer Vision section text. -->

## 🧠 Computer Vision & Sensor Fusion Suite {#sec-4-4-1}

Gabriel Tan leads the computer vision and sensor fusion architecture, implementing YOLO target detection algorithms and multi-modal perception.

<CardGrid :cols="4">

<Card title="1. Metallic Fasteners">

Bolts, safety wires, nuts, rivets.

</Card>

<Card title="2. Asphalt Chips">

Loose pavement rocks & spalls.

</Card>

<Card title="3. Maintenance Tools">

Dropped wrenches & screwdrivers.

</Card>

<Card title="4. Tire Rubber">

Shredded tire rubber fragments.

</Card>

</CardGrid>

### Automotive Vision Hardware Stack

| Component | Model / Specification | Operational Role |
| --- | --- | --- |
| **Primary RGB Camera** | `LI-IMX568-GMSL2-050H` | Sony IMX568 global shutter sensor, IP67 enclosure, zero motion blur at ≥10 km/h |
| **Automotive RF Cabling** | `Fakra 1m Type 7` | Heavy-duty shielded coaxial cable delivering high-bandwidth serialized raw video |
| **Video Deserializer** | `GMSL2 Deserialiser Board` | Converts Fakra serial link to USB 3.2 data feed into Hilbert's laptop |
| **Active Illumination** | `Headlights for CV (12V)` | Wide-angle floodlighting to illuminate runway tarmac during low-light & night trials |

<!-- #endregion report -->
