---
title: "Computer Vision Research & Sensor Modalities"
description: "Commercial runway FOD detection state of the art, comparative evaluation of LiDAR, radar, and optical camera modalities, and multi-sensor perception architecture."
owner: "Gabriel Tan"
outline: [2, 3]
---

# Computer Vision Research & Sensor Modalities

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page synthesises published literature and FAA regulatory standards on commercial airfield FOD detection systems, evaluates candidate perception modalities (LiDAR, millimetre-wave radar, stereo RGB-D, and global-shutter monocular RGB), and establishes the architectural basis for FOD Hunter's optical detection and 3D ground localisation pipeline.

<!-- #region report -->

## 1. State of the Art & Commercial Solutions Review {#commercial-sota}

Existing commercial Foreign Object Debris (FOD) management systems fall into two decoupled categories: **fixed-infrastructure detection towers** (such as QinetiQ Tarsier and Stratech iFerret, deployed at major hubs like Singapore Changi Airport) and **towed mechanical sweepers** (such as FOD*Boss and mobile vacuum trucks). Fixed radar and electro-optical towers provide continuous wide-area surveillance across active runways, but they **cannot physically remove debris**—requiring human ground crews in "Follow-Me" vehicles to drive onto active taxiways or runways to locate and retrieve every flagged item.

Conversely, mobile radar trucks (e.g., Trex FOD Finder) and towed friction mats require dedicated human operators and scheduled runway closures. As demonstrated by Öztürk and Kuzucuoğlu (2016), manual single-truck dispatch incurs an average runway closure delay of **$1,468\text{ s}$ ($24.5\text{ min}$)** per event, motivating an autonomous, closed-loop platform that couples **wide-area aerial/tower detection** with **targeted ground-level optical verification and vacuum remediation**.

::: details Commercial airfield FOD systems comparison matrix

**Table 1.1: Evaluation of Commercial Runway FOD Detection & Clearance Systems**

| System / Platform | Primary Sensing Modality | Detection Capability | Physical FOD Removal | Key Operational Limitation |
| :--- | :--- | :--- | :--- | :--- |
| **QinetiQ Tarsier** | $94.5\text{ GHz}$ mmWave Radar (Fixed Tower) | Detects $\ge 20\text{ mm}$ objects up to $2\text{ km}$ in all weather | ✗ **None** (Requires manual truck dispatch) | High capital cost ($>\text{USD }10\text{M}$/runway); zero visual class semantics; requires human retrieval. |
| **Stratech iFerret** | High-Zoom PTZ Electro-Optical Cameras (Fixed Tower) | High-resolution optical detection & visual archiving | ✗ **None** (Requires manual truck dispatch) | Degrades under heavy rain/fog and harsh runway glare; still relies on manual crew dispatch. |
| **Trex FOD Finder** | $77\text{–}81\text{ GHz}$ Mobile mmWave Radar + GPS (Truck) | Scans $180\text{ m}$ swath at up to $48\text{ km/h}$ | ~ **Manual / Vacuum Truck** | Requires dedicated human driver and active runway occupancy window. |
| **FOD\*Boss / Towed Mats** | None (Blind Mechanical Sweep) | ✗ **None** (No target localization or logging) | ✓ Mechanical friction bristle capture | Blindly sweeps entire pavement area ($7.3\text{ h}$ equivalent for a small rover); cannot log FOD taxonomy. |
| **FOD Hunter (Ours)** | **Global-Shutter RGB + 3D LiDAR + Cooperative UAV** | **$\ge 16\text{–}27\text{ px}$ on $30\text{ mm}$ fasteners ($97.0\%\text{ mAP@50}$)** | ✓ **Autonomous Centrifugal Vacuum Pickup** | Closes the loop from georeferenced alert to autonomous verification and physical suction clearance. |

:::

## 2. Evaluation of Sensor Modalities & Perception Paradigms {#sensor-modalities}

Detecting small metallic fasteners ($10\text{–}30\text{ mm}$ nuts, bolts, washers, and safety wire) on textured asphalt at $15.1\text{ km/h}$ ($4.19\text{ m/s}$) places stringent resolution demands on the onboard perception suite. While **3D LiDAR** (Hesai JT16) is essential for $360^\circ$ obstacle avoidance and costmap navigation, vertical angular channel spacing ($2^\circ\text{–}2.5^\circ$ between laser rings) projects rings tens of centimetres apart on the ground, making $10\text{ mm}$-high washers and flat bolts invisible to sparse point clouds.

Similarly, automotive **mmWave radar** lacks the angular resolution to distinguish a $30\text{ mm}$ bolt head from coarse asphalt aggregate at close range, and consumer **active IR stereo RGB-D cameras** (e.g., Intel RealSense D435i) suffer from infrared washout under $>100,000\text{ lux}$ tropical runway sunlight. Consequently, **high-resolution global-shutter monocular RGB vision** paired with **calibrated camera-to-ground homography** was selected as the primary FOD detection and localisation modality, complemented by the 3D LiDAR for macro-obstacle avoidance.

::: details Comparative trade study of onboard FOD sensing modalities

**Table 2.1: Onboard Perception Modality Trade Study for Small Metallic Fasteners ($10\text{–}30\text{ mm}$)**

| Sensing Modality | Spatial Resolution at $1.24\text{ m}$ | Outdoor Sunlight Immunity ($100\text{k lux}$) | Small Fastener Classification ($<30\text{ mm}$) | Role on FOD Hunter UGV |
| :--- | :--- | :--- | :--- | :--- |
| **2D Planar LiDAR** (e.g., RPLiDAR S2) | Single horizontal scan plane ($0^\circ$ vertical) | ✓ High ($80\text{k lux}$) | ✗ **Impossible** (Beam passes above ground debris) | <Badge type="danger" text="Rejected" /> |
| **3D Multi-Layer LiDAR** (Hesai JT16, 16-ch) | $\approx 40\text{–}50\text{ mm}$ vertical ring spacing | ✓ High ($100\text{k lux}$) | ✗ **Insufficient** ($<10\text{ mm}$ flat fasteners fall between rings) | <Badge type="info" text="Macro Obstacle Avoidance & SLAM" /> |
| **Active IR Stereo RGB-D** (e.g., RealSense D435i) | Depth noise $\ge 2\text{–}4\%$ at $1.5\text{ m}$; rolling RGB | ✗ **Poor** (IR projector washed out in direct sun) | ~ Depth fails on flat $<10\text{ mm}$ items in bright sunlight | <Badge type="danger" text="Rejected for Primary FOD" /> |
| **77 GHz Automotive Radar** | Coarse angular resolution ($\sim 1^\circ\text{–}4^\circ$) | ✓ Immune | ✗ Cannot classify FOD material or bounding-box geometry | <Badge type="danger" text="Rejected" /> |
| **5.1 MP Global-Shutter RGB** (Leopard LI-IMX568) | **$0.50\text{ mm/px}$ transverse GSD ($60 \times 21\text{ px}$ per bolt)** | ✓ **High** (With controlled exposure + 12 V LED fill) | ✓ **Excellent** ($97.0\%\text{ mAP@50}$ at $1088$ input) | <Badge type="tip" text="Selected Primary FOD Sensor" /> |

:::

## 3. Literature Synthesis & Airfield Perception Architecture {#literature-synthesis}

Regulatory guidance under **FAA Advisory Circular AC 150/5220-24** (*Airport Foreign Object Debris (FOD) Detection Equipment*) specifies that automated FOD detection systems must reliably resolve metallic and non-metallic objects down to **$20\text{–}30\text{ mm}$** across varied pavement textures and lighting conditions. However, our audit of published deep-learning FOD literature (centered on the widely cited **FOD-A** dataset of $33,793$ video frames) identified three critical deployment gaps between academic benchmarks and real-world runway robotics:

1. **Temporal Leakage in Video Benchmarks:** Standard random frame splits in published FOD-A studies place adjacent video frames in both training and test sets, inflating reported $\text{mAP@50}$ to $>99\%$ via background pavement memorization (which drops to **$50.29\%$** under strict scene-level isolation; see [YOLO Model Comparison →](./yolo-comparison.md#leakage-audit)).
2. **Convolutional Feature Loss on Sub-32 px Targets:** Standard $640 \times 640$ input resizing compresses $30\text{ mm}$ fasteners at $>1.2\text{ m}$ standoff into single stride-8 feature cells ($\approx 8\text{ px}$), causing missed detections due to spatial downsampling rather than inter-class confusion.
3. **Functional Remediation Taxonomy:** While FOD-A defines 31 fine-grained object categories, physical UGV clearance requires grouping targets into **functional remediation superclasses** (*Metallic Fasteners*, *Asphalt Chips*, *Maintenance Tools*, and *Tire Rubber*) aligned with vacuum suction thresholds and camera Ground Sample Distance (GSD).

::: details Architectural synthesis and literature references

**Table 3.1: Key Literature Findings & Direct Engineering Translation into FOD Hunter**

| Literature / Standard Source | Core Finding or Requirement | Translation into FOD Hunter Vision Architecture |
| :--- | :--- | :--- |
| **FAA AC 150/5220-24** (Airport FOD Detection Equipment) | Minimum target resolution of $20\text{–}30\text{ mm}$ cylinder/sphere on grooved asphalt under day/night conditions. | Sized $50^\circ$ global-shutter optics at $H = 0.45\text{ m}, \theta = 20^\circ$ to achieve $0.50\text{ mm/px}$ GSD ($27\text{ px}$ at $1088$ input) plus $12\text{ V}$ active LED illumination. |
| **Öztürk & Kuzucuoğlu (2016)** (Multi-Robot FOD Clearance) | Solo ground sweeping is time-prohibitive; dispatching autonomous rovers to pre-detected FOD coordinates cuts runway downtime by $56\%$. | Adopted two-tier **UAV wide-area search + UGV targeted optical verification & vacuum pickup** workflow. |
| **FOD-A Benchmark Audit** (Munyer et al. / Custom Scene Split) | Random video frame splitting inflates test $\text{mAP@50}$ from $50.29\%$ to $99.42\%$; zero-shot transfer to local tarmac yields only $11.91\%\text{ mAP@50}$. | Enforced strict **video-level dataset partitioning** (`build_arch2_dataset.py`) and collected $1,552$ native tarmac frames across 16 videos. |
| **Small-Object CNN Stride Analysis** (YOLOv8 / YOLO11 / RT-DETR) | Stride-8/16 downsampling erases sub-$16\text{ px}$ fasteners at $640$ input ($8.3$ false alarms); scaling to $1088$ retains $\approx 14\text{–}27\text{ px}$. | Selected **YOLO11-S @ 1088 input** ($97.0\%\text{ mAP@50}$, $1.0$ false alarm) with Semester 2 **SAHI tiling** ($2.4\times$ pixel boost past $0.8\text{ m}$). |

:::

<!-- #endregion report -->

<CardGrid :cols="2">

<Card>

← [Previous Documentation](./yolo-comparison.md)

**YOLO Model Comparison & Edge Benchmark**

</Card>

<Card>

[Next Documentation](./stm32-hardware.md) →

**STM32 Low-Level Control Unit (Hardware)**

</Card>

</CardGrid>
