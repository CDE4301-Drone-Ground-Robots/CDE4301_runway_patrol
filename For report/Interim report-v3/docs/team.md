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

- Communication (indoor)
- Steering kinematics
- Software (ROS 2)
- Simulation (Gazebo)
- Navigation (RViz2)
- Motor calculation (determine battery spec)
- Assist with prototype FOD Hunter design
- Assist with overall electrical design
- Website report design (GitHub)
- Secondary research
- Final FOD Hunter design (vac fabrication)

</template>

<template #scope>

Also overseeing mechanical

- **Messaging architecture:** custom ROS 2 message parser/validator for incoming UAV coordinate streams.
- **SLAM & localisation:** `SLAM Toolbox` tuning for 2D/3D airfield mapping & pose tracking.
- **Path planning & avoidance:** `Nav2` controller/planner plugins for waypoint execution with dynamic obstacle clearance.
- **Fail-safe protocols:** heartbeat monitors & automated emergency stop logic upon signal loss.

</template>

<template #s1>

- Autonomous UGV navigation on Gazebo Harmonic & RViz2 (ROS 2 Jazzy on Ubuntu 24.04)
- Communications with simulated UAV (Raspberry Pi 5 / Charan's laptop) via router

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
- Project manager

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

(To Be Filled)

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
