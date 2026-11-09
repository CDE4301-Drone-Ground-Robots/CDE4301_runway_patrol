---
layout: page
title: Report
titleTemplate: Runway Patrol · CDE4301
description: The FOD Hunter engineering report — research, design, programming, mechanical and electrical subsystems, and references.
sidebar: false
aside: false
---

<script setup>
import ReportToc from '@theme/components/report/ReportToc.vue'
</script>

<!--
  The Report page is the complete report, assembled at build time from the canonical Markdown:
    report/introduction, report/design-overview, report/preliminary   team-wide chapter text
    report/design-overview/subsystem-division.md#<chapter>-overview    the chapter openings
    report/members/<member>/<topic>.md (its `report` region)          each section, owned by one member
    report/lead/<member>-lead.md                                      the Subsystem Lead plate under a heading
  This file only orders them: chapter (##) and section (###) headings with ids, a plate, then the source.
  Numbers come from the page styling. `prefix=` keeps each composed page's anchors unique and turns links to
  that page into links within this one (see .vitepress/compose.ts).
-->

<div class="rpt rpt--page">
<ReportToc />
<div class="rpt__main vp-doc rpt-md">

<header class="rpt-cover">
<p class="rpt-cover__kicker">Runway Patrol · CDE4301</p>
<h1 class="rpt-cover__title">FOD Hunter Engineering Report</h1>
</header>

<section class="rpt-pre">

<!--@compose: ./report/preliminary/acknowledgements.md-->

</section>

<section class="rpt-pre">

<!--@compose: ./report/preliminary/executive-summary.md-->

</section>

<!-- report:start -->

<section class="rpt-chapter">

## Introduction {#introduction}

### Problem Statement {#problem-statement}

<!--@compose: ./report/introduction/problem-statement.md#report{shift=2,prefix=pstate}-->

### Primary Research {#primary-research}

<!--@compose: ./report/introduction/primary-research.md#report{shift=2,prefix=primary}-->

### Secondary Research {#secondary-research}

<!--@compose: ./report/introduction/secondary-research.md#report{shift=2,prefix=secondary}-->

<!--@compose: ./report/introduction/problem-scope.md{shift=1}-->

<!--@compose: ./report/introduction/competitive-analysis.md{shift=1}-->

<!--@compose: ./report/introduction/user-journey.md{shift=1}-->

</section>

<section class="rpt-chapter">

## Overview of Design {#overview-of-design}

<!--@compose: ./report/design-overview/features.md{shift=1}-->

<!--@compose: ./report/design-overview/requirements.md{shift=1}-->

<!--@compose: ./report/design-overview/specifications.md{shift=1}-->

<!--@compose: ./report/design-overview/subsystem-division.md#division{shift=1}-->

</section>

<section class="rpt-chapter">

## Programming {#programming}

### Software & Development Environment {#software-environment}

<!--@compose: ./report/lead/hilbert-lead.md-->

<!--@compose: ./report/members/hilbert/software-environment.md#report-->

### Navigation {#navigation}

<!--@compose: ./report/lead/hilbert-lead.md-->

<!--@compose: ./report/members/hilbert/navigation.md#report{shift=2,prefix=nav}-->

### Communication {#communications}

<!--@compose: ./report/lead/hilbert-lead.md-->

<!--@compose: ./report/members/hilbert/communications.md#report{shift=2,prefix=comms}-->

### Simulation {#simulation}

<!--@compose: ./report/lead/hilbert-lead.md-->

<!--@compose: ./report/members/hilbert/simulation.md#report{shift=2,prefix=sim}-->

### Computer Vision {#computer-vision}

#### Vision Research {#vision-research .rpt-l3}

<!--@compose: ./report/lead/gabriel-lead.md-->

<!--@compose: ./report/members/gabriel/vision-research.md#report{shift=3,prefix=cv-research}-->

#### Vision Calculations {#vision-calculations .rpt-l3}

<!--@compose: ./report/lead/gabriel-lead.md-->

<!--@compose: ./report/members/gabriel/vision-calculations.md#report{shift=3,prefix=cv-calc}-->

#### YOLO Comparison {#cv-yolo-comparison .rpt-l3}

<!--@compose: ./report/lead/gabriel-lead.md-->

<!--@compose: ./report/members/gabriel/yolo-comparison.md#report{shift=3,prefix=cv-yolo}-->

#### Sensor Fusion {#cv-sensor-fusion .rpt-l3}

<!--@compose: ./report/lead/gabriel-lead.md-->

<!--@compose: ./report/members/gabriel/sensor-fusion.md#report{shift=3,prefix=cv-fusion}-->

</section>

<section class="rpt-chapter">

## Mechanical {#mechanical}

<!--@compose: ./report/design-overview/subsystem-division.md#mechanical-overview{shift=1}-->

### Chassis {#chassis}

#### Chassis Design {#chassis-structural-design .rpt-l3}

<!--@compose: ./report/lead/zacarias-lead.md-->

<!--@compose: ./report/members/zacarias/chassis-design.md#report{shift=3,prefix=chassis-design}-->

#### FEA Simulation {#fea-simulation .rpt-l3}

<!--@compose: ./report/lead/zacarias-lead.md-->

<!--@compose: ./report/members/zacarias/fea-simulation.md#report{shift=3,prefix=fea}-->

#### Material Selection {#material-selection .rpt-l3}

<!--@compose: ./report/lead/zacarias-lead.md-->

<!--@compose: ./report/members/zacarias/material-selection.md#report{shift=3,prefix=materials}-->

### Suspension {#suspension}

<!--@compose: ./report/lead/asuka-lead.md-->

<!--@compose: ./report/members/asuka/suspension.md#summary{shift=2,prefix=susp}-->

#### Introduction and System Requirements {#susp-intro .rpt-l3}

<!--@compose: ./report/members/asuka/suspension.md#s1{shift=1,prefix=susp1}-->

#### First Principles Modelling {#susp-modelling .rpt-l3}

<!--@compose: ./report/members/asuka/suspension.md#s2{shift=1,prefix=susp2}-->

#### Suspension Design Evaluation {#susp-evaluation .rpt-l3}

<!--@compose: ./report/members/asuka/suspension.md#s3{shift=1,prefix=susp3}-->

#### Prototype and Realisation {#susp-prototype .rpt-l3}

<!--@compose: ./report/members/asuka/suspension.md#s4{shift=1,prefix=susp4}-->

#### Testing and Analysis {#susp-testing .rpt-l3}

<!--@compose: ./report/members/asuka/suspension.md#s5{shift=1,prefix=susp5}-->

#### Future Work {#susp-future-work .rpt-l3}

<!--@compose: ./report/members/asuka/suspension.md#s6{shift=1,prefix=susp6}-->

### Motor Drivetrain Calculations {#motor-selection}

<!--@compose: ./report/lead/hilbert-lead.md-->

<!--@compose: ./report/members/hilbert/motor-drivetrain-calculation.md#report{shift=2,prefix=motor}-->

### Steering Kinematics {#steering}

<!--@compose: ./report/lead/hilbert-lead.md-->

<!--@compose: ./report/members/hilbert/steering-kinematics.md#report{shift=2,prefix=steer}-->

<span id="vacuum-module"></span>

### FOD Remediation {#fod-remediation}

<!--@compose: ./report/lead/asuka-lead.md-->

<!--@compose: ./report/members/asuka/vacuum-module.md#summary{shift=2,prefix=vac}-->

#### Introduction and System Requirements {#vac-intro .rpt-l3}

<!--@compose: ./report/members/asuka/vacuum-module.md#s1{shift=1,prefix=vac1}-->

#### Selection of Remediation Method {#vac-selection .rpt-l3}

<!--@compose: ./report/members/asuka/vacuum-module.md#s2{shift=1,prefix=vac2}-->

#### Airflow Analysis and Design Iteration {#vac-airflow .rpt-l3}

<!--@compose: ./report/members/asuka/vacuum-module.md#s3{shift=1,prefix=vac3}-->

#### Prototyping, Testing, Analysis and Realisation {#vac-prototype .rpt-l3}

<!--@compose: ./report/members/asuka/vacuum-module.md#s4{shift=1,prefix=vac4}-->

#### Future Work {#vac-future-work .rpt-l3}

<!--@compose: ./report/members/asuka/vacuum-module.md#s6{shift=1,prefix=vac6}-->

<span id="fod-sweep-box"></span>


</section>

<section class="rpt-chapter">

## Electrical {#electrical}

<!--@compose: ./report/design-overview/subsystem-division.md#electrical-overview{shift=1}-->

### Power {#power}

#### Power Calculations {#power-calculations .rpt-l3}

<!--@compose: ./report/lead/bryan-lead.md-->

<!--@compose: ./report/members/bryan/power-calculations.md#report{shift=3,prefix=power-calc}-->

#### Components & BOM {#components-bom .rpt-l3}

<!--@compose: ./report/lead/bryan-lead.md-->

<!--@compose: ./report/members/bryan/components-bom.md#report{shift=3,prefix=bom}-->

### Microcontrollers {#microcontrollers}

#### STM32 Hardware {#stm32-hardware .rpt-l3}

<!--@compose: ./report/lead/gabriel-lead.md-->

<!--@compose: ./report/members/gabriel/stm32-hardware.md#report{shift=3,prefix=stm32-hw}-->

#### STM32 Firmware {#stm32-firmware .rpt-l3}

<!--@compose: ./report/lead/gabriel-lead.md-->

<!--@compose: ./report/members/gabriel/stm32-firmware.md#report{shift=3,prefix=stm32-fw}-->

</section>

<section class="rpt-chapter">

<!--@compose: ./report/conclusion.md-->

</section>

<section class="rpt-chapter">

## References and Appendices {#references}

<!--@compose: ./report/references.md{shift=1}-->

### Team Member Reference Lists {#member-references}

<!-- Each list is a dropdown (closed by default) to keep the page short; a citation link into a list opens it. -->

<details class="rpt-refs">
<summary>Literature review (Introduction)</summary>

<!--@compose: ./report/introduction/references.md{shift=3,prefix=refs-literature}-->

</details>

<details class="rpt-refs">
<summary>Hilbert Soh</summary>

<!--@compose: ./report/members/hilbert/references.md{shift=3,prefix=refs-hilbert}-->

</details>

<details class="rpt-refs">
<summary>Takeuchi Asuka</summary>

<!--@compose: ./report/members/asuka/references.md{shift=3,prefix=refs-asuka}-->

</details>

<details class="rpt-refs">
<summary>Zacarias Ng</summary>

<!--@compose: ./report/members/zacarias/references.md{shift=3,prefix=refs-zacarias}-->

</details>

<details class="rpt-refs">
<summary>Gabriel Tan</summary>

<!--@compose: ./report/members/gabriel/references.md{shift=3,prefix=refs-gabriel}-->

</details>

<details class="rpt-refs">
<summary>Bryan Ng</summary>

<!--@compose: ./report/members/bryan/references.md{shift=3,prefix=refs-bryan}-->

</details>

### Appendix {#appendix}

#### Appendix A: Interview with Mr Harry Lim, Industry Partner {#appendix-a .rpt-l3}

<!--@compose: ./report/appendix/interviews.md#a-->

#### Appendix B: Interview with 3SG(NS) Prady, Paya Lebar Air Base {#appendix-b .rpt-l3}

<!--@compose: ./report/appendix/interviews.md#b-->

#### Appendix C: Interview with LTA(NS) Elnathan, Tengah Air Base {#appendix-c .rpt-l3}

<!--@compose: ./report/appendix/interviews.md#c-->

#### Appendix D: Conversation with Ms Cindy Koh, CAAS {#appendix-d .rpt-l3}

<!--@compose: ./report/appendix/interviews.md#d-->

</section>

</div>
</div>
