---
title: "Computer Vision Research & Task Formulation"
description: "Role of vision on the UGV, detection vs. segmentation vs. anomaly formulation, sensing modality evaluation, and two-stage transfer learning methodology."
owner: "Gabriel Tan"
outline: [2, 3]
---

# Computer Vision Research & Task Formulation

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page defines the role of the onboard computer vision subsystem within the cooperative UAV–UGV workflow, compares vision task formulations (object detection, instance segmentation, and anomaly detection) and onboard sensing modalities, and establishes the two-stage transfer learning methodology adapted from Reis et al. [\[3\]](./references.md#ref-3).

<!-- #region report -->

## 1. Role of Vision in the UGV & Existing Systems {#commercial-sota}

Loose bolts, nuts, and washers on a runway can be ingested into aircraft engines or puncture tyres; Air France Flight 4590 crashed after striking a titanium wear strip left on the runway. Manual FOD walks are slow and rely on personnel spotting small objects by eye, while fixed airfield radar/camera towers are expensive and only report where debris is located—requiring a human ground crew to drive out and retrieve every flagged item.

In our cooperative architecture, the UAV surveys the airfield and dispatches the UGV to candidate FOD coordinates. The UGV's onboard camera then **confirms the FOD up close** so the robot can position its collection mechanism and pick it up. Consequently, the vision subsystem must output two things in real time: **what the object is** (hazard classification for triage) and **where it is in the image** (bounding-box localisation for approach).

Each design choice across the vision subsystem follows a consistent engineering method: state the requirement, compare the candidate options, explain why the alternatives were rejected, and state the trade-offs accepted. All performance numbers reported in the following sections come directly from our training and evaluation logs.

::: details Comparison of existing airfield FOD systems vs. cooperative UAV–UGV approach

| System / Approach | Primary Modality | Detection & Classification | Physical FOD Removal | Key Limitation |
| :--- | :--- | :--- | :--- | :--- |
| **QinetiQ Tarsier / Fixed Radar** | $94.5\text{ GHz}$ mmWave Radar (Fixed Tower) | Detects $\ge 20\text{ mm}$ objects up to $2\text{ km}$ | None (Requires manual vehicle dispatch) | High installation cost; no visual class label; requires human retrieval on the runway. |
| **Stratech iFerret** | High-Zoom PTZ Electro-Optical Cameras | Visual detection and archiving | None (Requires manual vehicle dispatch) | Degrades in heavy haze/glare; alerts still require human confirmation and manual pickup. |
| **Towed Friction Mats (FOD\*Boss)** | None (Blind Mechanical Sweep) | None (No localisation or logging) | Mechanical friction bristle capture | Must sweep the entire runway blindly; misses small fasteners in pavement grooves and logs no data. |
| **FOD Argus × FOD Hunter (Ours)** | **UAV Wide Survey + UGV Global-Shutter RGB** | **6 Hazard Superclasses + 97.0% mAP50 on Fasteners** | **Autonomous Sweep Box & Vacuum Pickup** | Closes the loop from aerial flag to close-range optical confirmation, hazard logging, and physical removal. |

:::

## 2. Task Formulation & Sensing Modalities {#sensor-modalities}

### 2.1 Computer Vision Task Formulation

Before selecting a neural network architecture, we evaluated three computer vision task formulations against the UGV's operational requirements (real-time bounding location for pickup and class label for hazard triage):

| Task | Output | Annotation & Compute Cost | Strengths | Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Object Detection** | Bounding box and class | Low to moderate annotation; real-time | Gives both class and location | Box does not trace the exact pixel outline |
| **Instance Segmentation** | Pixel mask, box, and class | High annotation cost; slower inference | Exact outline and surface area | Extra pixel-level detail that vacuum/sweep collection does not need |
| **Anomaly Detection** | Heatmap and anomaly score | Low annotation (normal images only); high compute | Can flag unfamiliar objects never seen in training | Outputs no class (preventing hazard triage); pavement cracks, paint, and shadows trigger false anomalies |

**Selection Verdict:** We selected **object detection**. Physical collection requires the object's location and operator triage requires its hazard class; object detection provides both in real time at a fraction of the annotation and compute cost of segmentation. Both convolutional detectors (YOLOv8-S, YOLO11-S) and a transformer-based detector (RT-DETR-L) are benchmarked under this formulation in [YOLO Model Comparison & Benchmark](./yolo-comparison.md).

::: details Comparative evaluation of onboard sensing modalities for 3 cm fasteners

While 3D LiDAR is used on the UGV for macro-obstacle avoidance and SLAM, its vertical ring spacing ($\approx 2^\circ\text{–}2.5^\circ$ between laser channels) leaves gaps of several centimetres on the tarmac, making flat $3\text{ cm}$ washers and bolts invisible between scan lines. Similarly, consumer active IR stereo depth cameras suffer from infrared washout in direct daylight and cannot resolve millimetre-high fasteners at $1.5\text{ m}$ standoff. High-resolution **global-shutter monocular RGB vision** (`ELP-USBGS5MP01-L601`, $2592 \times 1944$, $45\text{ px/}^\circ$) paired with calibrated camera-to-ground geometry was therefore selected as the primary FOD confirmation and localisation sensor.

| Sensing Modality | Spatial Resolution at $1.5\text{ m}$ | Outdoor Daylight Reliability | Small Fastener Classification ($\le 3\text{ cm}$) | Role on FOD Hunter UGV |
| :--- | :--- | :--- | :--- | :--- |
| **3D Multi-Layer LiDAR** | $\approx 40\text{–}50\text{ mm}$ vertical ring spacing | High | Insufficient (flat fasteners fall between laser rings) | <Badge type="info" text="Obstacle Avoidance & SLAM" /> |
| **Active IR Stereo RGB-D** | Depth noise $\ge 2\text{–}4\%$ at $1.5\text{ m}$ | Poor (IR pattern washed out by sunlight) | Depth fails on flat $<10\text{ mm}$ metallic items | <Badge type="danger" text="Rejected for Primary FOD" /> |
| **mmWave Radar** | Coarse angular resolution ($1^\circ\text{–}4^\circ$) | High | Cannot classify material or bounding box | <Badge type="danger" text="Rejected" /> |
| **5 MP Global-Shutter RGB (`ELP-USBGS5MP01-L601`)** | **$45\text{ px/}^\circ$ ($46\text{ px}$ per $3\text{ cm}$ fastener at $1.5\text{ m}$)** | **High (Global shutter, $\le 80\ \mu\text{s}$ exposure)** | **97.0 ± 1.4% mAP50 at 1088 px input** | <Badge type="tip" text="Selected Primary FOD Sensor" /> |

:::

## 3. Literature Synthesis & Two-Stage Transfer Learning {#literature-synthesis}

Our literature review and preliminary experiments on the public **FOD-A** dataset [\[4\]](./references.md#ref-4) ($33,793$ video frames) identified three critical findings that shaped our training pipeline:

1. **Small-Object Recall Bottleneck (COCO $< 32 \times 32\text{ px}$):** Under the standard COCO evaluation protocol [\[1\]](./references.md#ref-1), [\[2\]](./references.md#ref-2), objects occupying fewer than $32 \times 32\text{ px}$ fall into the "small" category where detectors perform worst. At $2\text{ m}$ standoff, a $3\text{ cm}$ fastener resized to $640\text{ px}$ spans only $\approx 9\text{ px}$ ($\approx 15 \times 3\text{ px}$ at $1088\text{ px}$), motivating both our $\ge 29\text{ px/}^\circ$ optical requirement and high-resolution ($1088\text{ px}$ / SAHI) inference.
2. **Video Frame Leakage in Public FOD Benchmarks:** FOD-A [\[4\]](./references.md#ref-4) consists of frames extracted from continuous video clips. Random frame-level splitting places nearly identical adjacent frames in both train and test sets ($7,924$ test frames sit immediately adjacent to a training frame), inflating YOLO11-S test mAP50 to **99.42%** via memorisation compared to **50.29%** under a strict video-level split.
3. **Two-Stage Transfer Learning (Reis et al. [\[3\]](./references.md#ref-3)):** Reis et al. [\[3\]](./references.md#ref-3) demonstrated that pre-training YOLOv8 on a broad 40-class flying-object dataset to learn general domain features before transfer-learning onto a smaller, challenging real-world dataset of small and partially occluded targets substantially improves convergence and recall. We adopt the exact same two-stage progression: starting from **COCO weights**, we first train a general 6-superclass FOD detector on the **leak-free FOD-A split**, and then fine-tune those weights onto our own **1,552-image outdoor tarmac fastener dataset**.

::: details Summary of key literature references and direct application to FOD Hunter

| Source | Key Principle / Specification | Application in Our Vision Pipeline |
| :--- | :--- | :--- |
| **Lin et al. (COCO) [\[1\]](./references.md#ref-1) & COCO Metrics [\[2\]](./references.md#ref-2)** | Defines small objects as area $< 32^2\text{ px}$, where convolutional feature maps lose spatial detail. | Set our optical design requirement to $\ge 32\text{ px}$ width across a $3\text{ cm}$ fastener ($\ge 29\text{ px/}^\circ$) and scaled network input from $640\text{ px}$ to $1088\text{ px}$. |
| **Reis et al. (2023) [\[3\]](./references.md#ref-3)** | Two-stage transfer learning from a general domain dataset to a targeted real-world small-object dataset. | Trained YOLO11-S on leak-free FOD-A first, then fine-tuned on our custom 1,552-image outdoor tarmac dataset (raising mAP50 from $11.9\%$ zero-shot to $97.0\%$). |
| **Munyer et al. (FOD-A) [\[4\]](./references.md#ref-4)** | Public 33,793-frame airport FOD dataset with 30+ fine-grained Pascal VOC classes. | Audited and fixed temporal frame leakage via whole-video splitting ($30,377$ clean frames kept; $3,416$ boundary frames discarded) and consolidated 30+ classes into **6 hazard superclasses**. |
| **Unicore UM980 Datasheet [\[5\]](./references.md#ref-5)** | Single-point horizontal positioning accuracy of $1.5\text{ m}$ RMS without RTK corrections ($\approx 1\text{ cm}$ with RTK). | Sized the camera mounting tilt ($\theta = 33^\circ$ at $h = 0.45\text{ m}$) to guarantee $\ge 1.5\text{ m}$ look-ahead ($x_{\text{far}} = 2.12\text{ m}$, band $\Delta x = 1.79\text{ m}$). |

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
