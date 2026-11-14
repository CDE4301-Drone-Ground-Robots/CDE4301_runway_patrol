---
title: "Semester 2 Implementation Plan"
owner: "Gabriel Tan Kai Jie"
role: "Computer Vision, Sensor Fusion & STM32 Embedded Control"
description: "Gabriel's Semester 2 (Phase 2) deliverables across Computer Vision FOD detection and the STM32 low-level controller."
outline: [2, 3]
---

# Semester 2 Plan — Gabriel Tan Kai Jie

> **Semester 2 engineering roadmap · Gabriel Tan Kai Jie**  
> **Scope:** Computer Vision FOD detection & localisation on the NVIDIA Jetson + STM32F446RE low-level embedded controller integration.

<!-- Edit your plan between the region markers; the Overview and the Meet the Team page show this text. -->
<!-- #region plan -->

- **Precision-recall tuning & TensorRT:** Confirm sustained full-resolution UVC capture of the ELP camera on JetPack 6.2, fine-tune on hard cases, sweep confidence and IoU thresholds, export to TensorRT, and achieve ≥ 10 FPS on the Jetson.
- **Weather & illumination:** Collect training data in rain, night, and harsh glare conditions, and integrate onboard regulated LED lighting for uniform fastener contrast.
- **SAHI tile slicing:** Implement native-resolution frame slicing to increase pixel density on small fasteners (approx. 2.4× more pixels), extending effective detection range past 0.8 m.
- **Metric FOD localisation:** Convert 2D pixel bounding-box coordinates into metric ground-plane coordinates using camera pitch and height, publishing ROS 2 target coordinates for UGV approach.
- **STM32 & low-level controller:** Connect Jetson to STM32 over ROS 2 with comms watchdog, fuse IMU with dual-axle wheel odometry, and integrate hardware RF kill switch on custom carrier PCB.

<!-- #endregion plan -->

## Semester 2 Tasks — Computer Vision & FOD Detection {#cv-semester-2}

<Badge type="info" text="Computer Vision & Edge AI • NVIDIA Jetson + ELP 5 MP Camera" />

- **Precision-recall tuning and TensorRT performance:** Confirm sustained full-resolution UVC capture of the ELP camera on JetPack 6.2, fine-tune on hard cases, sweep the confidence threshold and NMS IoU on the PR curve, export to TensorRT, and hit **≥ 10 FPS** on the Jetson.
- **Weather and lighting:** Collect training data in rain, at night, and in harsh glare; design onboard LED lighting so FOD looks consistent across ambient conditions, and test each condition separately.
- **SAHI slicing:** The 5 MP camera captures much more detail than the `1088 px` input. Slicing each frame into overlapping native-resolution tiles gives small FOD about **2.4× more pixels**, extending the `32 px` range past **0.8 m**. _Trade-off:_ about **6× inference cost** per frame.
- **FOD localisation:** Convert the detection's pixel position into metric ground distance using the camera height (`0.45 m`) and tilt (`33°`), and publish target coordinates over ROS 2 for terminal approach.
- **Wider testing & empty-runway false alarms:** Test all **9 fastener types**, other surfaces, and separate days with video-level cross-validation, and add fastener-free tarmac images to measure false alarms on cracks, paint, and shadows.

::: details 01 — Precision-Recall Tuning & TensorRT Edge Performance

**Model operating-point tuning and Jetson deployment**

- **ELP UVC verification:** Confirm sustained full-resolution (`2592 × 1944`) UVC capture on JetPack 6.2 upon camera delivery.
- **Hard-case fine-tuning:** Expand training on hard negative backgrounds (asphalt cracks, aggregate, oil stains) and low-contrast fasteners.
- **Threshold & NMS sweep:** Sweep confidence thresholds and Non-Maximum Suppression (NMS) IoU thresholds on held-out validation videos to select the best precision–recall operating point.
- **TensorRT export:** Export the trained detector to TensorRT (FP16 / INT8) and benchmark end-to-end camera-to-detection throughput to achieve **≥ 10 FPS** on the NVIDIA Jetson paired with the ELP camera.

:::

::: details 02 — Weather, Illumination & Onboard Lighting

**Environmental reliability across runway operating conditions**

- **Multi-condition dataset expansion:** Collect and annotate tarmac footage in **rain** (wet specular reflections), **at night**, and under **harsh low-angle sun glare**.
- **Controlled onboard illumination:** Design and mount regulated onboard LED floodlighting so fasteners maintain consistent surface contrast and appearance regardless of ambient weather or time of day.
- **Condition-isolated evaluation:** Benchmark precision, recall, and false-alarm rates separately across dry daylight, rain, glare, and night conditions.

:::

::: details 03 — SAHI High-Resolution Tile Slicing

**Extending small-fastener detection range beyond 0.8 m**

- **Full-resolution tiling:** Because the 5 MP camera sensor captures significantly finer spatial detail than a downscaled `1088 px` network input, apply Slicing Aided Hyper Inference (SAHI) to slice each frame into overlapping native-resolution tiles.
- **Resolution & range gain:** Gives small FOD fasteners approximately **2.4× more pixels**, extending the `32 px` detection threshold beyond **0.8 m** ahead of the UGV.
- **Compute trade-off management:** Manage the **~6× per-frame inference cost** by selectively triggering tiled inference (e.g., during slower terminal approach or on lower-frequency keyframes).

:::

::: details 04 — Monocular Pixel-to-Ground FOD Localisation

**Geometric projection from bounding-box coordinates to metric UGV targets**

- **Homography & pinhole ground projection:** Convert each detected bounding box's bottom-centre pixel (u, v) into metric ground-plane coordinates (X_ground, Y_ground) relative to `base_footprint` using the calibrated camera mounting height H and downward pitch angle θ.
- **Terminal approach integration:** Publish localised 3D FOD coordinates to ROS 2 so the UGV can drive directly up to the fastener and position the vacuum head over it.

:::

::: details 05 — Cross-Validated Multi-Surface & 9-Fastener Benchmarking

**Rigorous generalisation testing without video leakage**

- **Full 9-fastener coverage:** Evaluate detection recall and precision across all **9 target fastener types** rather than a subset.
- **Surface & temporal diversity:** Capture test sequences across different tarmac/concrete textures and on separate days.
- **Video-level cross-validation:** Rotate which videos are held out for testing (cross-validation by video) to establish statistically grounded confidence intervals across unseen scenes.

:::

---

## Next (Semester 2) — STM32 Low-Level Controller {#stm32-semester-2}

<Badge type="info" text="Embedded Hardware & Firmware • STM32 NUCLEO-F446RE" />

- **Hardware RF kill switch & `PB1` interlock:** Fit a replacement RF kill switch module, verify that its relay cuts the ZLAC8015D `X0`/`X1` E-stop inputs with the STM32 unpowered, and add the `PB1` state latch in firmware.
- **ROS 2 link to the Jetson for autonomous driving:** Connect the Jetson to the STM32 so autonomous `cmd_vel` and vacuum-head actuator commands call the existing firmware API (`Robot_Set_CmdVel()`, `Robot_Actuator_Toggle()`) with a 500 ms comms watchdog.
- **IMU and wheel-odometry fusion:** Combine 9-DOF IMU (`I2C1`) yaw-rate/attitude data with ZLAC8015D dual-axle wheel encoder feedback for slip-compensated odometry.
- **Live battery telemetry:** Read 48 V LiFePO4 BMS voltage, current, SoC, and temperature over `USART1` with automatic low-battery throttling.
- **Closed-loop speed control:** Use real-time encoder velocity feedback from the motor drivers (`0x606C`) to close the wheel speed and heading loop on the STM32, deployed on the custom KiCad carrier PCB with locking JST connectors.

**Related documentation:** [YOLO Comparison & Training](./yolo-comparison-and-training.md) · [Vision Calculations](./vision-calculations.md) · [STM32 Hardware](./stm32-hardware.md) · [STM32 Firmware](./stm32-firmware.md)
