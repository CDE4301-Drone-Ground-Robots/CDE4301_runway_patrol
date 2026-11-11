---
title: "Meet the Team"
description: "The five members of the FOD Hunter team: what each of us did in Semester 1, our individual scopes, deliverables, Semester 2 plans and technical documentation."
owner: "FOD Hunter team"
layout: page
sidebar: false
aside: false
---

<script setup>
import MirrorHall from '@theme/components/team/MirrorHall.vue'
import TeamProfile from '@theme/components/team/TeamProfile.vue'
</script>

<!--
  Meet the Team (Mirror Hall). Each <TeamProfile> holds one member's own words, in Markdown:
    #contributions  what you achieved this semester (shown when your profile opens)
    #scope          your individual scope
    #s1             Semester 1 deliverables
    #s2             Semester 2 deliverables — composed from report/members/<you>/semester-2-plan.md; edit it there
  Name, discipline, matric number, portrait and documentation buttons live in
  .vitepress/theme/data/team.ts (shared with the Report's Subsystem Lead plates). Keep a blank line after
  every <template …> tag and before every </template>, or the Markdown inside will not render.
-->

<MirrorHall>

<TeamProfile member="hilbert">

<template #contributions>

- Multi-agent ROS 2 C2 communications & DDS network architecture
- 4WD skid-steer kinematics, instantaneous center of rotation (ICR) & turning dynamics
- ROS 2 Jazzy software architecture, lifecycle management & TF2 transform trees
- Gazebo Harmonic digital twin simulation, airfield world modelling & sensor bridges
- Nav2 autonomous navigation (SmacPlanner2D, Regulated Pure Pursuit & Behavior Trees)
- Direct-drive hub motor sizing, tractive resistance & tarmac scrub torque calculations
- Overseeing mechanical system integration & prototype CAD collaboration
- Electrical system integration & motor driver architecture coordination
- VitePress modern interactive technical documentation engine & visual design
- Secondary research on autonomous airport robotics & aviation safety standards
- FOD Hunter physical platform mechanical integration & architecture synthesis

</template>

<template #scope>

- **System Integration:** Overseeing mechanical integration and physical architecture alignment with autonomous software requirements.
- **Drivetrain & Steering Dynamics:** Analytical sizing of 4× 48V direct-drive hub motors, tractive force modeling, tarmac scrub resistance, and 4WD skid-steer kinematics ($B_{\text{eff}}$).
- **Localization & State Estimation:** Dual-EKF architecture (`robot_localization`) fusing continuous local odometry with global RTK-GNSS positioning.
- **Autonomous Path Planning & Control:** Nav2 stack configuration, Smac 2D cost-aware global planning, and Regulated Pure Pursuit trajectory tracking.
- **Multi-Agent C2 Communications:** ROS 2 DDS publish-subscribe architecture, CycloneDDS unicast bridging, JSON target alert parsing, and operational geofencing.

</template>

<template #s1>

- Autonomous UGV navigation stack on Gazebo Harmonic & ROS 2 Jazzy (SmacPlanner2D, Regulated Pure Pursuit, obstacle costmaps & Behavior Trees)
- Communications with simulated UAV (Raspberry Pi 5 / Charan's laptop) via CycloneDDS unicast router
- Analytical drivetrain & kinematics models (4WD hub motor sizing, tractive effort, tarmac scrub torque & dynamic braking limits)

</template>

<template #s2>

<!--@compose: ./report/members/hilbert/semester-2-plan.md#plan-->

</template>

</TeamProfile>

<TeamProfile member="asuka">

<template #contributions>

- Suspension design
- Suspension calculations
- FOD picking design
- Vacuum calculations
- Assist with prototype FOD Hunter design
- Sourcing for primary interviewee
- Primary and secondary research

</template>

<template #scope>

- FOD physical remediation mechanism & pickup suction/intake module.
- Chassis independent suspension system design, compliance & vibration isolation.
- Mechanical hardware testing & clearance verification.

</template>

<template #s1>

(To Be Filled)

</template>

<template #s2>

<!--@compose: ./report/members/asuka/semester-2-plan.md#plan-->

</template>

</TeamProfile>

<TeamProfile member="zacarias">

<template #contributions>

- Chassis design
- Material choice
- FEA calculations
- Component plate
- Prototype assembly

</template>

<template #scope>

- UGV structural chassis frame design, CAD sizing & weatherproof enclosure.
- Differential drive kinematics mathematical calculations & wheel geometry modelling.
- Structural load calculations & ground clearance dynamics.

</template>

<template #s1>

(To Be Filled)

</template>

<template #s2>

<!--@compose: ./report/members/zacarias/semester-2-plan.md#plan-->

</template>

</TeamProfile>

<TeamProfile member="gabriel">

<template #contributions>

- Computer vision research
- Computer vision model comparison
- Camera calculations
- Creating FOD dataset
- Programming STM32 and controller
- Debugging motor driver
- Creating workflow for motor driver

</template>

<template #scope>

Also overseeing electrical

- YOLO object detection model training, comparison & FOD target classification.
- Multi-modal perception combining camera streams & sensor fusion.
- Close-range target spatial detection & bounding box evaluation.

</template>

<template #s1>

- Derived camera optical requirements ($\ge 29\text{ px/}^\circ$, $\ge 4.7\text{ FPS}$ min / $10\text{ FPS}$ target, $33^\circ$ tilt) and selected the ELP 5 MP global-shutter camera
- Audited FOD-A frame leakage ($99.42\% \rightarrow 50.29\%\text{ mAP50}$), benchmarked YOLOv8-S, YOLO11-S and RT-DETR-L, and fine-tuned YOLO11-S on a 1,552-image custom tarmac dataset ($97.0 \pm 1.4\%\text{ mAP50}$ at $1088\text{ px}$)
- Designed and verified the 5-phase STM32 NUCLEO-F446RE bare-metal firmware (`controller.c`) for dual ZLAC8015D CANopen motor control, 5 V low-side stepper sinking, and USB Host gamepad teleoperation

</template>

<template #s2>

<!--@compose: ./report/members/gabriel/semester-2-plan.md#plan-->

</template>

</TeamProfile>

<TeamProfile member="bryan">

<template #contributions>

- Component and battery selection
- Wiring diagram
- Power distribution calculations
- Assist with STM32

</template>

<template #scope>

- Electrical power distribution network, battery management & wiring schematic.
- Autonomous contact-charging dock interface & safety interlocks.
- STM32 embedded microcontroller coding for low-level motor actuation.

</template>

<template #s1>

(To Be Filled)

</template>

<template #s2>

<!--@compose: ./report/members/bryan/semester-2-plan.md#plan-->

</template>

</TeamProfile>

</MirrorHall>
