---
title: "Semester 2 plan"
owner: "Bryan Ng Rui Jie"
role: "Electrical system & charging dock"
description: "Bryan's Semester 2 (Phase 2) deliverables."
---

# Semester 2 plan — Bryan Ng Rui Jie

<!-- Edit your plan between the region markers; the Overview and the Meet the Team page show this text. -->
<!-- #region plan -->

- Power calculations & battery validation: Update the power budget for the 24 V vacuum, stepper motors and IR sensor, accounting for duty cycles and conversion losses. Validate the 48 V 20 Ah battery against the one-hour runtime requirement.
- Sensor wiring & IMU integration: Connect and test the JT16 LiDAR, ELP camera and UM980 GNSS. Integrate the BNO085 IMU with STM32 and verify communication with Jetson for ROS 2 navigation.
- Electrical protection & safety: Implement the BMS, fuses and emergency kill switch. Verify current ratings, voltage drop and emergency-stop response under operating conditions.
- PCB breakout board: Design, fabricate and test a custom PCB for STM32, CAN, sensors and actuator connections to improve wiring organisation and reliability.
- UGV charging dock and UAV charging platform: Design the charging architecture, including voltage regulation, connectors, battery protection and safe integration with the UGV.

<!-- #endregion plan -->

<!-- Programming Semester 2 task breakdown; included by the Report composition system. -->
<!-- #region programming-tasks -->

## Semester 2 Tasks & Physical Implementation Scope {#electrical-semester-2}