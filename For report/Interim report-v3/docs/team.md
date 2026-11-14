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

- ROS 2 software development
- Autonomous navigation and obstacle avoidance
- Gazebo simulation
- Dual-EKF localisation
- UAV–UGV communications
- Motor sizing and selection
- Skid-steer kinematics
- Mechanical design coordination
- Electrical design support
- FOD Hunter prototype and final design
- Engineering research and documentation
- Website design and development

</template>

<template #scope>

- **Software:** ROS 2 Jazzy setup and system integration.
- **Navigation:** Hybrid A* path planning, Regulated Pure Pursuit control and obstacle avoidance.
- **Localisation:** Dual-EKF using simulated GPS, IMU and wheel odometry.
- **Communications:** CycloneDDS, C2 alert reception and Nav2 goal dispatch.
- **Motor drivetrain:** Motor torque calculations, sizing and selection.
- **Steering:** Skid-steer kinematics and wheel-speed calculations.
- **Mechanical:** Coordinate chassis, suspension and FOD collection integration.
- **Electrical:** Support power-system design and component selection.
- **Safety:** Communication-loss handling and navigation goal cancellation.

</template>

<template #s1>

- Set up ROS 2 Jazzy, Ubuntu 24.04 and Gazebo Harmonic.
- Implemented autonomous navigation using Hybrid A* and Regulated Pure Pursuit in simulation.
- Configured Dual-EKF localisation with simulated GPS, IMU and wheel odometry.
- Tested indoor UAV–UGV communication between Raspberry Pi 5 and workstation.
- Implemented C2 alert reception and Nav2 goal dispatch.
- Completed preliminary motor sizing and skid-steer calculations.
- Supported mechanical and electrical subsystem integration.
- Developed the VitePress engineering report website.

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

- Problem insight report and primary interviews.
- Critical function prototype of the suspension system.
- Critical function prototype of FOD remediation.

</template>

<template #s2>

<!--@compose: ./report/members/asuka/semester-2-plan.md#plan-->

</template>

</TeamProfile>

<TeamProfile member="zacarias">

<template #contributions>

- UGV chassis concept development and CAD design
- Structural material and profile selection
- 4040 aluminium chassis prototype fabrication and assembly
- Electronics mounting plate design and component integration
- Preliminary structural calculations and centre-of-mass analysis
- SOLIDWORKS FEA and structural assessment
- Lightweight 3030 chassis redesign

</template>

<template #scope>

- UGV structural chassis frame design, CAD sizing & weatherproof enclosure.
- Differential drive kinematics mathematical calculations & wheel geometry modelling.
- Structural load calculations & ground clearance dynamics.

</template>

<template #s1>

- Evaluated three chassis concepts and developed a compact rectangular 4040 aluminium extrusion design for the initial UGV prototype.
- Fabricated and assembled the 4040 chassis using mechanical brackets and fasteners, providing a structural platform for the installation of the suspension, drivetrain and electrical components.
- Designed the aluminium electronics mounting plate and performed preliminary structural calculations and centre-of-mass analysis to assess the chassis arrangement.
- Evaluated aluminium alloys, structural steel and carbon-fibre composites to justify the prototype's material selection.
- Conducted four SOLIDWORKS FEA studies covering the 4040 static configuration and the redesigned 3030 chassis under static, skid-steering and uneven-ground loading.
- Developed a lighter 3030 square-tube chassis design, reducing the estimated structural mass from 11.00 kg to 5.15 kg (53.2%), while maintaining a factor of safety above 2.0 in the evaluated primary chassis members.
- Documented the chassis design process, simulation methodology, structural results and engineering considerations for subsequent development.

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
- Electrical architecture oversight

</template>

<template #scope>

- Computer vision optical sizing, camera selection, and close-range FOD detection (YOLO11-S).
- FOD-A leakage auditing, custom tarmac dataset collection, and multi-seed training evaluation.
- STM32 NUCLEO-F446RE hardware interfacing and bare-metal firmware for dual-driver CANopen motion control, stepper actuation, and safety watchdogs.
- Electrical architecture oversight, power distribution coordination, and BMS integration.

</template>

<template #s1>

- Derived camera optical requirements (≥ 29 px/°, ≥ 4.7 FPS min / 10 FPS target, 33° tilt) and selected the ELP 5 MP global-shutter camera (`ELP-USBGS5MP01-L601`).
- Audited FOD-A frame leakage (99.42% → 50.29% mAP50), benchmarked YOLOv8-S, YOLO11-S, and RT-DETR-L, fine-tuned YOLO11-S on a 1,552-image custom tarmac dataset (97.0 ± 1.4% mAP50 at 1088 px), and verified live detection (7 / 7 fasteners) on the UGREEN CM831 webcam.
- Built and verified the 5-stage STM32 NUCLEO-F446RE bare-metal firmware (`controller.c`) for dual ZLAC8015D CANopen motor control, 5 V open-drain stepper actuation (110 mm stroke), CiA 402 state machine (`GUI.py`), and USB Host gamepad teleoperation.

</template>

<template #s2>

<!--@compose: ./report/members/gabriel/semester-2-plan.md#plan-->

</template>

</TeamProfile>

<TeamProfile member="bryan">

<template #contributions>

- Electrical system architecture and component selection.
- Power consumption calculations and battery sizing.
- Battery chemistry comparison and selection.
- Power distribution and electrical protection design.
- Overall electrical wiring schematic and component integration.
- Assisted with STM32 programming.

</template>

<template #scope>

- Electrical power distribution network, battery management & wiring schematic.
- Autonomous contact-charging dock interface & safety interlocks.
- STM32 embedded microcontroller coding for low-level motor actuation.

</template>

<template #s1>

- Established electrical requirements for power, runtime and safety.
- Calculated drivetrain and component power consumption.
- Compared battery chemistries and selected a 48 V 20 Ah LiFePO4 battery.
- Designed the 48 V power distribution and protection architecture.
- Developed the overall electrical wiring schematic.
- Selected electrical components and compiled the components list.
- Assisted with STM32 programming.

</template>

<template #s2>

<!--@compose: ./report/members/bryan/semester-2-plan.md#plan-->

</template>

</TeamProfile>

</MirrorHall>
