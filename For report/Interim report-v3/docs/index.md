---
layout: page
title: FOD Hunter
titleTemplate: Runway Patrol · CDE4301
description: FOD Hunter — an integrated UAV–UGV approach to autonomous foreign object debris detection and clearance. NUS CDE4301 Runway Patrol.
sidebar: false
aside: false
---

<script setup>
import { withBase } from 'vitepress'
import FodExplorer from '@theme/components/overview/FodExplorer.vue'
import EngineeringRoadmap from '@theme/components/overview/EngineeringRoadmap.vue'
import RoadmapMilestone from '@theme/components/overview/RoadmapMilestone.vue'
import PlanAccordion from '@theme/components/overview/PlanAccordion.vue'
import PlanEntry from '@theme/components/overview/PlanEntry.vue'
import { provideFodStage } from '@theme/components/overview/useFodStage'

// One WebGL stage shared by the cinematic hero and the Explore FOD Hunter viewer.
provideFodStage('/models/fod-hunter.glb')

const roadmap = [
  { id: 'rm-problem', title: 'Problem Statement' },
  { id: 'rm-innovation', title: 'Key Innovation of This Project' },
  { id: 'rm-semester-1', title: 'What Was Achieved in Semester 1' },
  { id: 'rm-mechanical', title: 'Mechanical' },
  { id: 'rm-electrical', title: 'Electrical' },
  { id: 'rm-programming', title: 'Programming' }
]
</script>

<!--
  Overview: an introduction that guides readers to the Report. It shows no report chapters itself.
  Text below is composed at build time from canonical Markdown (report/…, report/members/…/semester-2-plan.md);
  edit those files, not this page. Missing content shows "(To Be Filled)".
-->

<!-- 00 — Cinematic FOD Hunter -->
<FodOverview />

<div class="ovx vp-doc">

<!-- 01 — Acknowledgements -->
<section class="ovx-section ovx-prose ov-md" aria-labelledby="acknowledgements">
<p class="ovx-index">01</p>

<!--@compose: ./report/preliminary/acknowledgements.md-->

</section>

<!-- 02 — Executive Summary -->
<section class="ovx-section ovx-prose ov-md" aria-labelledby="executive-summary">
<p class="ovx-index">02</p>

<!--@compose: ./report/preliminary/executive-summary.md-->

</section>

<!-- 03 — Explore FOD Hunter -->
<div class="vp-raw">
<FodExplorer />
</div>

<!-- 04 — Engineering Roadmap -->
<section id="roadmap" class="ovx-section ovx-wide" aria-labelledby="roadmap-title">
<header class="ovx-head">
<p class="ovx-index">04</p>
<h2 id="roadmap-title" class="ovx-title">Engineering Roadmap</h2>
<p class="ovx-lead">From the problem to the three engineering subsystems. Each milestone links to the full write-up in the Report.</p>
</header>

<EngineeringRoadmap :items="roadmap">

<RoadmapMilestone id="rm-problem" :n="1" title="Problem Statement" :links="[{ text: 'Problem scope in the Report', href: '/report#problem-scope' }, { text: 'Secondary research', href: '/report#secondary-research' }]">

<!--@compose: ./report/introduction/problem-scope.md#problem-summary-->

</RoadmapMilestone>

<RoadmapMilestone id="rm-innovation" :n="2" title="Key Innovation of This Project" :links="[{ text: 'List of features in the Report', href: '/report#list-of-features' }]">

<!--@compose: ./report/design-overview/features.md#key-innovation-->

</RoadmapMilestone>

<RoadmapMilestone id="rm-semester-1" :n="3" title="What Was Achieved in Semester 1" :links="[{ text: 'Project timeline', href: '/timeline' }, { text: 'User journey & progress in the Report', href: '/report#user-journey' }]">

<!--@compose: ./report/introduction/user-journey.md#semester-1-->

</RoadmapMilestone>

<RoadmapMilestone id="rm-mechanical" :n="4" title="Mechanical">

<!--@compose: ./report/design-overview/subsystem-division.md#mechanical-overview-->

</RoadmapMilestone>

<RoadmapMilestone id="rm-electrical" :n="5" title="Electrical">

<!--@compose: ./report/design-overview/subsystem-division.md#electrical-overview-->

</RoadmapMilestone>

<RoadmapMilestone id="rm-programming" :n="6" title="Programming">

<!--@compose: ./report/design-overview/subsystem-division.md#programming-overview-->

</RoadmapMilestone>

</EngineeringRoadmap>
</section>

<!-- 05 — Semester 2 Development Plans -->
<section id="semester-2" class="ovx-section ovx-wide" aria-labelledby="semester-2-title">
<header class="ovx-head">
<p class="ovx-index">05</p>
<h2 id="semester-2-title" class="ovx-title">Semester 2 Development Plans</h2>
<p class="ovx-lead">From engineering development to physical integration and validation.</p>
</header>

<PlanAccordion>

<PlanEntry
  index="01"
  name="Hilbert Soh Yong Tai"
  role="AUTONOMOUS NAVIGATION · SLAM · C2 COMMUNICATIONS"
  preview="Physical UGV integration, RF communications, sensor fusion and field validation."
  docs="/members/hilbert/navigation"
  plan="/members/hilbert/semester-2-plan"
>

<!--@compose: ./report/members/hilbert/semester-2-plan.md#programming-tasks-->

</PlanEntry>

<PlanEntry
  index="02"
  name="Takeuchi Asuka"
  role="FOD PICK-UP & SUSPENSION"
  preview="CNC-machined suspension redesign and two dedicated FOD remediation tools."
  docs="/members/asuka/vacuum-module"
  plan="/members/asuka/semester-2-plan"
>

<!--@compose: ./report/members/asuka/semester-2-plan.md#plan-->

</PlanEntry>

<PlanEntry
  index="03"
  name="Zacarias Eleazar Ng Han En"
  role="CHASSIS DESIGN & DIFFERENTIAL DRIVE KINEMATICS"
  preview="(To Be Filled)"
  docs="/members/zacarias/chassis-design"
  plan="/members/zacarias/semester-2-plan"
>

<!--@compose: ./report/members/zacarias/semester-2-plan.md#plan-->

</PlanEntry>

<PlanEntry
  index="04"
  name="Gabriel Tan Kai Jie"
  role="COMPUTER VISION, SENSOR FUSION & STM32 EMBEDDED CONTROL"
  preview="TensorRT edge deployment with ELP 5 MP global-shutter camera, SAHI tiling, ROS 2–STM32 link, IMU/encoder fusion, and carrier PCB."
  docs="/members/gabriel/stm32-hardware"
  plan="/members/gabriel/semester-2-plan"
>

<!--@compose: ./report/members/gabriel/semester-2-plan.md#plan-->

</PlanEntry>

<PlanEntry
  index="05"
  name="Bryan Ng Rui Jie"
  role="ELECTRICAL SYSTEM & CHARGING DOCK"
  preview="(To Be Filled)"
  docs="/members/bryan/components-list"
  plan="/members/bryan/semester-2-plan"
>

<!--@compose: ./report/members/bryan/semester-2-plan.md#plan-->

</PlanEntry>

</PlanAccordion>
</section>

<!-- 06 — Road to Semester 2 -->
<section
  id="road-ahead"
  class="ovx-band"
  aria-labelledby="road-ahead-title"
  :style="{
    backgroundImage: `linear-gradient(180deg, rgba(11, 11, 16, 0.85) 0%, rgba(11, 11, 16, 0.65) 50%, rgba(11, 11, 16, 0.92) 100%), url(${withBase('/assets/images/overview/HunterXArgus.png')})`
  }"
>
<p class="ovx-index">06</p>
<h2 id="road-ahead-title" class="ovx-band__title">The Road Ahead</h2>
<p class="ovx-band__text">From Semester 1 development to Semester 2 implementation.</p>
<a class="ovx-button" href="./timeline#gantt">View project timeline &amp; Gantt chart <span aria-hidden="true">↗</span></a>
</section>

<!-- 07 — Read Full Report -->
<section
  id="read-report"
  class="ovx-finale"
  aria-labelledby="finale-title"
  :style="{
    backgroundImage: `radial-gradient(70% 90% at 30% 20%, rgba(160, 98, 48, 0.35), transparent 70%), linear-gradient(180deg, rgba(11, 11, 16, 0.82) 0%, rgba(11, 11, 16, 0.6) 50%, rgba(11, 11, 16, 0.94) 100%), url(${withBase('/assets/images/overview/fod-hunter-render-960.webp')})`
  }"
>
<p class="ovx-index">07</p>
<h2 id="finale-title" class="ovx-finale__title">The Engineering Behind FOD Hunter</h2>
<p class="ovx-finale__text">Explore the complete technical documentation, design decisions, calculations and development work.</p>
<a class="ovx-button ovx-button--solid" href="./report">Read full report <span aria-hidden="true">↗</span></a>
</section>

</div>
