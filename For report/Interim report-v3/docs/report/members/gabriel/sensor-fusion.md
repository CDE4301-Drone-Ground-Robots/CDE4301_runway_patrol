---
title: "Computer Vision & Sensor Fusion Suite"
owner: "Gabriel Tan"
outline: [2, 3]
---

# Computer Vision & Sensor Fusion Suite

<!-- #region report -->

<!-- The Report's Computer Vision section text. -->

## Computer Vision & Sensor Fusion Overview {#sec-4-4-1}

The computer vision subsystem confirms FOD targets at close range ($0.33\text{–}2.12\text{ m}$ look-ahead at $h = 0.45\text{ m}, \theta = 33^\circ$ tilt) so FOD Hunter can classify hazards across six superclasses and localise small metallic fasteners ($\ge 3\text{ cm}$) for physical collection.

| Superclass | Representative Examples | Hazard Level |
| :--- | :--- | :--- |
| **Metallic Tools** | Wrenches, pliers | High |
| **Metallic Fasteners** | Bolts, nuts, washers, screws *(Primary Focus)* | High |
| **Mineral Stone** | Stone, pavement debris | Moderate |
| **Hazardous Chemical / Liquid** | Spills | Operational |
| **Polymer Rubber** | Tyre debris | Moderate |
| **Organic / Paper** | Paper, boxes, birds | Low |

### Onboard Vision Hardware Stack

| Component | Model / Specification | Operational Role |
| :--- | :--- | :--- |
| **Primary RGB Camera** | `ELP-USBGS5MP01-L601` (OX05B1S, $6\text{ mm}$ M12 lens) | $2592 \times 1944$ (5 MP) global-shutter sensor, $57^\circ \times 42^\circ$ FOV ($45\text{ px/}^\circ$), $50\text{ FPS}$ MJPEG over UVC |
| **Semester 1 Interim Sensor** | `UGREEN CM831` & Smartphone Camera | $1920 \times 1080$ ($62^\circ \times 37^\circ$ FOV) used for Semester 1 dataset collection and live webcam POC |
| **Edge Compute Platform** | `NVIDIA Jetson Orin Nano Super` | Runs TensorRT-accelerated YOLO11-S ($1088\text{ px}$ / SAHI) within the $\le 100\text{ ms}$ ($\ge 10\text{ FPS}$) frame budget |
| **Active Illumination** | `12 V Onboard LED Floodlights` (controlled via STM32 `PB4`/`PB5`) | Provides consistent surface illumination across night, rain, and harsh glare conditions |

<!-- #endregion report -->
