---
title: "Technical Documentation"
description: "Comprehensive engineering specifications, digital twin simulation guides, communication protocols, and individual member scope deliverables."
owner: "FOD Hunter team"
outline: [2,3]
---
# Technical Documentation

<Badge type="info" text="RESEARCH FOUNDATION" />

## Literature Review & Background Research

<CardGrid :cols="2">

<Card title="Primary Research" tag="Empirical Investigation">

🔬

Direct empirical testing, stakeholder interviews with RSAF/RAiD operational personnel, Changi & military airfield runway maintenance observations, and baseline benchtop vacuum & drivetrain measurements.

[Read Primary Research →](/report#primary-research)

</Card>

<Card title="Secondary Research" tag="Published Literature">

📚

Comprehensive review of existing commercial solutions (Tarsier, iFerret, FODFinder), IEEE robotics papers on autonomous runway inspection, and formal airport safety standards (FAA AC 150/5210-24 & ICAO Annex 14).

[Read Problem Statement & Literature →](/report#secondary-research)

</Card>

</CardGrid>

<Badge type="info" text="INDIVIDUAL SCOPES &amp; ENGINEERING DEEP DIVES" />

## Team Member Documentation Files

Every engineer has their own dedicated folder in `docs/report/members/<name>/` containing Markdown documents for their assigned capstone scopes:

<CardGrid :cols="2">

<Card title="Asuka" tag="Mechanical">

docs/report/members/asuka/

- [▸ Suspension Design and Calculations](./asuka/suspension.md)
- [▸ FOD Remidation Vacuum module](./asuka/vacuum-module.md)

[Suspension →](./asuka/suspension.md) [Vacuum →](./asuka/vacuum-module.md)

</Card>

<Card title="Zacarias" tag="Mechanical">

docs/report/members/zacarias/

- [▸ Chassis Design](./zacarias/chassis-design.md)
- [▸ Material Selection](./zacarias/material-selection.md)
- [▸ FEA Simulation](./zacarias/fea-simulation.md)

[Chassis →](./zacarias/chassis-design.md) [Materials →](./zacarias/material-selection.md) [FEA →](./zacarias/fea-simulation.md)

</Card>

<Card title="Bryan" tag="Electrical &amp; Power">

docs/report/members/bryan/

- [▸ Components List](./bryan/components-list.md)
- [▸ Detailed Power Calculations](./bryan/power-calculations.md)

[Components List →](./bryan/components-list.md) [Power Calcs →](./bryan/power-calculations.md)

</Card>

<Card title="Gabriel" tag="Drone &amp; Vision">

docs/report/members/gabriel/

- [▸ YOLO model comparison](./gabriel/yolo-comparison.md)
- [▸ Computer vison calculation](./gabriel/vision-calculations.md)
- [▸ Computer vison research](./gabriel/vision-research.md)
- [▸ STM32 Hardware Architecture & Interfacing](./gabriel/stm32-hardware.md)
- [▸ STM32 Firmware & Real-Time Control](./gabriel/stm32-firmware.md)

[YOLO →](./gabriel/yolo-comparison.md) [Calculations →](./gabriel/vision-calculations.md) [Research →](./gabriel/vision-research.md) [STM32 HW →](./gabriel/stm32-hardware.md) [STM32 FW →](./gabriel/stm32-firmware.md)

</Card>

<Card title="Hilbert" tag="Software &amp; Nav">

docs/report/members/hilbert/

- [▸ Motor & Drivetrain Sizing](./hilbert/motor-drivetrain-calculation.md)
- [▸ Steering & Kinematics](./hilbert/steering-kinematics.md)
- [▸ Simulation](./hilbert/simulation.md)
- [▸ Navigation](./hilbert/navigation.md)
- [▸ UAV Communication](./hilbert/communications.md)

[Drivetrain →](./hilbert/motor-drivetrain-calculation.md) [Steering →](./hilbert/steering-kinematics.md) [Simulation →](./hilbert/simulation.md) [Navigation →](./hilbert/navigation.md) [C2 Comms →](./hilbert/communications.md)

</Card>

</CardGrid>

::: tip
<Badge type="tip" text="WORKSPACE STRUCTURE" />

**📂 Where documentation lives**

Each team member has their own folder under `docs/report/members/<name>/` with their Markdown pages and an `assets/` folder for images, videos and models. Edit your pages there: the Report shows them in full, and Meet the Team links to them. How to edit, preview and publish is in the `README.md` at the root of the repository.

```
docs/
├── report.md           the Report (orders the sections below)
├── report/
│   ├── introduction/   problem statement, primary & secondary research, scope, competition, user journey
│   ├── design-overview/ features, requirements, specifications, subsystem division
│   ├── members/
│   │   ├── asuka/      suspension, vacuum module, FOD sweep box
│   │   ├── bryan/      components & BOM, power calculations
│   │   ├── gabriel/    sensor fusion, STM32 hardware & firmware, vision calculations & research, YOLO
│   │   ├── hilbert/    navigation, communications, simulation, motor & drivetrain, steering kinematics
│   │   └── zacarias/   chassis design, FEA simulation, material selection
│   └── lead/           Subsystem Lead plates
└── shared/assets/      shared images, videos, models and documents
```
:::

::: info
📖 Regulatory Compliance & Standards

[View the references (Report chapter 7) →](../report.md#references)

All system specifications adhere to Singapore IMDA Technical Specifications for Short Range Devices (IMDA TS SRD), FAA Advisory Circular AC 150/5210-24 for Foreign Object Debris (FOD) Management Equipment, and ASTM D5340 Pavement Condition Index (PCI) standards.
:::
