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

In this chapter, we discuss why runway foreign object debris (FOD) remains a problem worth solving and make the case for FOD Argus and FOD Hunter as the answer. We first revisit the loss of Air France Flight 4590, the global cost of FOD and Singapore's shrinking military manpower. We then walk through the user journey of the two-robot system, and close with a value proposition for low to moderate air traffic airports that struggle with manpower, and seven stakeholder needs that Chapter 2 turns into requirements and specifications. The detailed background research, covering the users who carry the problem, the competitive analysis, the problem statement and scope, and the multi-robot rationale, is in Appendices E to H.

<!--
ARCHIVED, previous Chapter 1 (the team's earlier sections, kept for reference and untouched on disk).
To bring a section back, move its line below out of this comment and change "ARCHIVED-COMPOSE" to "@compose".
Their old anchors (#primary-research, #secondary-research) are kept as the invisible spans below so existing links still land on this chapter.

ARCHIVED-COMPOSE: ./report/introduction/problem-statement.md#report{shift=2,prefix=pstate}      (was 1.1 Problem Statement)
ARCHIVED-COMPOSE: ./report/introduction/primary-research.md#report{shift=2,prefix=primary}      (was 1.2 Primary Research)
ARCHIVED-COMPOSE: ./report/introduction/secondary-research.md#report{shift=2,prefix=secondary}  (was 1.3 Secondary Research)
ARCHIVED-COMPOSE: ./report/introduction/problem-scope.md{shift=1}                                (was 1.4 Problem Scope)
ARCHIVED-COMPOSE: ./report/introduction/competitive-analysis.md{shift=1}                         (was 1.5 Competitive Analysis)
ARCHIVED-COMPOSE: ./report/introduction/user-journey.md{shift=1}                                 (was 1.6 User Journey)
-->

<span id="primary-research"></span>
<span id="secondary-research"></span>

### The Problem {#problem-statement}

On 25 July 2000, Air France Flight 4590 struck a 435 mm titanium wear strip on runway 26R at Paris Charles de Gaulle. The strip had fallen from a Continental Airlines DC-10 that departed five minutes earlier. Tyre debris ruptured a fuel tank, and the resulting fire brought the Concorde down at Gonesse, killing all 109 people on board and four on the ground [\[1\]](#refs-literature-ref-1). Figure 1.1.1 shows the sequence of events and Figure 1.1.2 the strip itself.

<div class="fig-row" style="max-width: 680px; margin-left: auto; margin-right: auto;">

<Figure src="./shared/assets/images/plane-on-fire.png" alt="Air France Flight 4590 on fire shortly after take-off" caption="Figure 1.1.1: Air France Flight 4590 on fire shortly after take-off." />

<Figure src="./shared/assets/images/titanium-strip.png" alt="The titanium wear strip that fell from the preceding DC-10" caption="Figure 1.1.2: The titanium wear strip that fell from the preceding DC-10 and was recovered from the runway." />

</div>

A full runway inspection scheduled for that afternoon had been postponed for a fire drill [\[3\]](#refs-literature-ref-3). Research into FOD detection and prevention increased sharply after the accident [\[4\]](#refs-literature-ref-4), and runway FOD began to be treated as a safety problem in its own right rather than a housekeeping task [\[5\]](#refs-literature-ref-5). FOD remains costly. El-Sayed places the annual cost of FOD to global aviation at US\$1.26 billion in direct damage and US\$13.9 billion once indirect costs such as delays and cancellations are included [\[6\]](#refs-literature-ref-6); an FAA study puts the upper estimate at US\$22.7 billion in 2020 dollars [\[7\]](#refs-literature-ref-7). Runway FOD is disproportionately expensive: only about 15% of FOD is found on runways, yet it accounts for up to half of FOD damage [\[4\]](#refs-literature-ref-4). Removal is still largely manual [\[5\]](#refs-literature-ref-5), and the runway must close while personnel drive out, locate and pick up each item [\[4\]](#refs-literature-ref-4).

In Singapore, the manpower behind that manual process is shrinking. The total fertility rate fell to 1.1 in 2020, and MINDEF has described low fertility as a significant structural challenge to national defence [\[8\]](#refs-literature-ref-8). In the same reply, then-Minister for Defence Dr Ng Eng Hen stated: "This relentless drive to optimise manpower must continue. Job re-design is also an important initiative to optimise our manpower resource." [\[8\]](#refs-literature-ref-8)

MINDEF has already begun trialling automated vehicles at SAF air bases and AI-enabled drones to assess runway damage [\[9\]](#refs-literature-ref-9), and the SAF projects a one-third reduction in manpower by 2030 [\[10\]](#refs-literature-ref-10). Whether this pressure translates into a real burden on the runway is a question for the people who clear FOD, so the team interviewed them.

A detailed discussion of the **[users who carry this problem](#appendix-e)**, the **[competitive analysis](#appendix-f)**, the **[problem statement and scope](#appendix-g)**, and the **[rationale for a multi-robot approach](#appendix-h)** can be seen from Appendix E onwards.

### User Journey and Demonstration {#user-journey}

Figure 1.2.1 shows the intended operating cycle in six steps.<!-- TODO: confirm the steps against the team's final operating concept. -->

<Figure src="./shared/assets/images/user-journey.jpg" alt="Six-panel illustration: FOD on the runway, aerial scanning by the drone, data transmission to the rover, ground navigation to the target, pickup by the sweep and vacuum system, and return to home with the drone landing on top" caption="Figure 1.2.1: FOD Hunter × FOD Argus user journey (concept illustration)." />

1. **FOD on the runway.** Bolts, nuts, screws, stones and dead birds lie on the runway, posing a risk to aircraft.
2. **Aerial scanning.** During a scheduled inspection or closure window, FOD Argus flies a pre-planned path and flags candidate FOD with its location.
3. **Data transmission.** FOD Argus sends the locations to the ground station, where the operator confirms each flag and filters false positives such as bird droppings.
4. **Ground navigation.** FOD Hunter drives to each confirmed location and verifies the target with its onboard sensors.
5. **Pickup.** FOD Hunter removes the item with the sweep box and vacuum.
6. **Return to home.** FOD Hunter returns to its base, and FOD Argus lands on top. Each item is logged with its location and time, giving the RSAF a record of thoroughness that the current process lacks.

The video below demonstrates the first stage in simulation: FOD Argus launches and patrols the runway on a pre-planned path whilst FOD Hunter waits on standby, before being dispatched to each reported target.<!-- TODO: state what the demonstration shows end to end and what remains to be shown on hardware. -->

<VideoClip src="./shared/assets/videos/fod-hunter-argus-demo.mp4" poster="./shared/assets/images/fod-hunter-argus-demo-poster.jpg" caption="Video 1.2.1: Simulated demonstration of FOD Hunter × FOD Argus in Gazebo." />

After implementing the solution, the team hopes to run a benchmarking test that compares the speed and time taken to clear a fixed amount of FOD between a human crew and FOD Hunter × FOD Argus. The accuracy and clearing rate will be a significant indication of the effectiveness of the solution.


### Value Proposition {#sec-vps}

<Figure src="./shared/assets/images/vps-render.jpg" alt="Concept render of FOD Hunter on a runway at sunset with FOD Argus flying above it" style="max-width: 760px; margin: 28px auto;" caption="Figure 1.3.1: Concept render of FOD Hunter with FOD Argus (illustrative, not the built prototype)." />

Our value proposition statement is as follows. For low to moderate air traffic airports that struggle with effective use of manpower, our automated solution detects and removes FOD from the runway, while staff focus on more critical jobs. Unlike the current manual, time-consuming and laborious processes of clearing FOD, the system works autonomously, targets the small hard objects that are most often missed, and logs every item it handles.

Figure 1.3.2 sets out the value map and customer map, and Figure 1.3.3 shows the value proposition fit, in which each customer pain and gain is answered by a feature of the system. Table 1.3.4 maps each stakeholder need to the feature that addresses it. Chapter 2 carries these features through to requirements and specifications.

<div class="fig-row" style="max-width: 760px; margin-left: auto; margin-right: auto;">

<Figure src="./shared/assets/diagrams/value-map.svg" alt="Value map: products and services, gain creators and pain relievers" caption="Figure 1.3.2a: Value map." />

<Figure src="./shared/assets/diagrams/customer-map.svg" alt="Customer map: jobs, gains and pains" caption="Figure 1.3.2b: Customer map." />

</div>

<Figure src="./shared/assets/diagrams/value-proposition-fit.svg" alt="Value proposition fit: the value map on the left answers the customer map on the right" style="max-width: 760px; margin: 28px auto;" caption="Figure 1.3.3: Value proposition fit. Each customer pain and gain is answered by a feature of FOD Hunter and FOD Argus." />

*Table 1.3.4: Need-to-feature mapping.*

| ID | Stakeholder need | Source | Feature |
| --- | --- | --- | --- |
| N1 | Release servicemen from routine FOD clearance | Appendices [A](#appendix-a) and [B](#appendix-b) | Autonomous detection and removal |
| N2 | Catch small hard FOD that sweepers miss | Appendices [A](#appendix-a) and [B](#appendix-b) | Close-range verification and vacuum pickup on FOD Hunter |
| N3 | Clear larger debris such as bird carcasses | Appendices [C](#appendix-c) and [D](#appendix-d) | Sweep box on FOD Hunter |
| N4 | Measurable thoroughness | Appendix [A](#appendix-a) | Logged detections and removals per run |
| N5 | Repeatable coverage | Appendix [A](#appendix-a) | Pre-planned survey path for FOD Argus |
| N6 | Faster checks and runway recovery | Appendix [C](#appendix-c) | Aerial survey cues ground removal in parallel |
| N7 | Operate within airspace restrictions | Appendices [B](#appendix-b) and [D](#appendix-d) | Drone flights limited to closure windows; ground-only fallback |

These seven needs, together with the insights from our primary research (the interviews) and secondary research (the literature and existing solutions), are the starting point for the design. In Chapter 2, they are developed into the features, requirements and specifications that FOD Hunter and FOD Argus must meet to answer each need, and each of these is traced back to the need and the evidence behind it.

</section>

<section class="rpt-chapter">

## Overview of Design {#overview-of-design}

In this chapter, we discuss how the seven stakeholder needs from Chapter 1 become the design of the system. We first describe the system concept, in which FOD Argus surveys the runway, an operator confirms each flag and FOD Hunter removes and logs each item. We then state the six features of FOD Hunter and FOD Argus working together and the ten features of FOD Hunter alone, each justified by the interviews and tied to the needs it answers. Next, we set out the requirements for FOD Hunter by subsystem, with each requirement addressing a feature and mapped to the specification that meets it, and we flag the values that still conflict between pages. Finally, we show how the work is divided between the team, so that any number in Chapters 3 to 5 can be traced back to a need, a feature and a person in charge.

<!--
ARCHIVED, previous Chapter 2 (the team's earlier lists, kept for reference and untouched on disk).
To bring one back, move its line below out of this comment and change "ARCHIVED-COMPOSE" to "@compose".
The anchor #list-of-features is kept on 2.2 so existing links still land in this chapter.

ARCHIVED-COMPOSE: ./report/design-overview/features.md{shift=1}
ARCHIVED-COMPOSE: ./report/design-overview/requirements.md{shift=1}
ARCHIVED-COMPOSE: ./report/design-overview/specifications.md{shift=1}
ARCHIVED-COMPOSE: ./report/design-overview/subsystem-division.md#division{shift=1}
-->

### System Concept {#system-concept}

FOD Argus is a drone that flies a pre-planned path over the runway during a closure window and flags candidate FOD with its location. It sends these flags to a ground station, where an operator confirms each one and filters out false positives such as bird droppings. FOD Hunter, the ground robot, then drives to each confirmed location, verifies the target at close range, removes it with the sweep box or the vacuum and logs the item with its location and time. When the run is complete, FOD Hunter returns to its base and FOD Argus lands on top of it (Figure 2.1.1).

<Figure src="./shared/assets/images/vps-render.jpg" alt="Concept render of FOD Hunter on a runway at sunset with FOD Argus flying above it" style="max-width: 760px; margin: 28px auto;" caption="Figure 2.1.1: FOD Hunter and FOD Argus working together (concept render, not the built prototype)." />

### Features {#list-of-features}

This section states the features of the system, where FOD Hunter and FOD Argus work together, and then the features of FOD Hunter alone. Each feature shows the stakeholder needs it answers (N1 to N7, Table 1.3.4) and a short justification from the interviews, cited as Appendix A (Mr Lim), Appendix B (the RSAF technician), Appendix C (the RSAF air traffic controller) and Appendix D (the CAAS officer).

#### Features of FOD Hunter × FOD Argus {#features-system .rpt-l3}

The system has six features, listed in Table 2.2.1.

*Table 2.2.1: The six features of FOD Hunter × FOD Argus.*

<div class="wrap-table">

| ID | Feature | Needs addressed | Justification |
| --- | --- | --- | --- |
| F1 | Drone scans the runway and highlights FOD | N5, N6 | A pre-planned flight path makes inspection faster and more frequent ([Appendix A](#appendix-a)). The drone check used today is only a visual look, which the air traffic controller called "quite crude" ([Appendix C](#appendix-c)). |
| F2 | FOD Hunter rover sweeps the runway and removes FOD | N1, N2, N3 | Crews walk about 4 km and the big sweeper misses the small pieces that cause damage ([Appendix B](#appendix-b)). Dead birds also have to be cleared ([Appendix D](#appendix-d)). |
| F3 | Drone sends FOD locations to the rover | N6 | Today a crew searches the runway by eye. Sending locations lets the rover go straight to each item ([Appendix A](#appendix-a), [Appendix D](#appendix-d)). |
| F4 | Drone lands on the rover to charge | N5 | A drone is limited by its weight and power, so it cannot cover 4 km on its own ([Appendix D](#appendix-d)). Charging on the rover extends its coverage. |
| F5 | Central command centre with operators monitoring the runway | N4, N7 | An operator confirms each alert and filters out false alarms ([Appendix D](#appendix-d), [Appendix A](#appendix-a)). The RSAF needs a measure of accuracy and thoroughness ([Appendix A](#appendix-a)). |
| F6 | Drone coverage area over the airfield | N5, N6 | The airstrip is about 6 km ([Appendix A](#appendix-a)) and the runway about 4 km ([Appendix B](#appendix-b)), and today there is no fixed route ([Appendix A](#appendix-a)). |

</div>

#### Features of FOD Hunter {#features-hunter .rpt-l3}

FOD Hunter has ten features, listed in Table 2.2.2.

*Table 2.2.2: The ten features of FOD Hunter.*

<div class="wrap-table">

| ID | Feature | Needs addressed | Justification |
| --- | --- | --- | --- |
| H1 | FOD Detection Confirmation | N2 | An operator has to confirm every alert, and false alarms are a struggle ([Appendix D](#appendix-d)). Bird droppings must be filtered out ([Appendix A](#appendix-a)). |
| H2 | FOD Remediation System | N2, N3 | The big sweeper misses small pieces such as rivets ([Appendix B](#appendix-b)). Items range from 2 cm metal pieces ([Appendix A](#appendix-a)) to dead birds ([Appendix D](#appendix-d)). |
| H3 | Autonomous Navigation | N1, N5 | There is no fixed route today. A pre-designed path is faster and releases servicemen for other roles ([Appendix A](#appendix-a)). |
| H4 | Long Range Communication | N6 | The runway is about 4 km ([Appendix B](#appendix-b)) and the airstrip about 6 km ([Appendix A](#appendix-a)), so the link must cover the whole airfield. |
| H5 | Compliant with aviation operating standards | N7 | Air base drones need special permission each flight ([Appendix B](#appendix-b)). Clearance has to be checked with CAAS ([Appendix A](#appendix-a)). |
| H6 | Operating speed of 15 km/hr | N6 | Vehicles today drive at about 40 km/h but must go slowly enough to see FOD by eye ([Appendix A](#appendix-a)). 15 km/h is a design value for camera detection. |
| H7 | Weight of 65 kg | Practical deployment | No interview evidence. Design value (Section 4.2.2). |
| H8 | Differential Drivetrain | Supports H3 | No interview evidence. Design choice (Section 4.5). |
| H9 | Robust Suspension System | Supports H1, H2 | Paya Lebar pavement is cracked and comes loose ([Appendix B](#appendix-b)). Potholes break up at Changi ([Appendix D](#appendix-d)). |
| H10 | Sized for easy transport | Practical deployment | No interview evidence. Design value. |

</div>

### Requirements and Specifications {#list-of-requirements}

This section covers FOD Hunter only. The requirements are split by subsystem. Each requirement names the feature it addresses (H1 to H10, Section 2.2.2), the specification that meets it, and a short justification. Where a specification is not yet defined, the table says so.

#### Communication and Navigation {#requirements-comm-nav .rpt-l3}

*Table 2.3.1: Requirements and specifications for communication and navigation.*

<div class="wrap-table">

| ID | Requirement | Feature addressed | Specification | Justification |
| --- | --- | --- | --- | --- |
| R1 | Airfield-scale connectivity | H4 | Operational range of 1 to 4 km | The runway is about 4 km ([Appendix B](#appendix-b)). |
| R2 | Singapore IMDA SRD regulatory compliance | H5 | Frequency of 917 to 925 MHz | The radio must be legal to use in Singapore. |
| R3 | Non-internet link | H4 | Radio link at 917 to 925 MHz | The airfield link cannot depend on the internet. |
| R4 | Asynchronous telemetry and waypoint streaming | H4, H3 | Throughput of at least 120 kbps; latency below 10 ms | Targets and telemetry must stream without waiting. |
| R5 | Autonomous waypoint tracking | H3 | Waypoint accuracy of ±2 cm; global planner Hybrid A*; local controller Regulated Pure Pursuit with curvature speed scaling | No fixed route is used today ([Appendix A](#appendix-a)). |
| R6 | Dynamic obstacle avoidance | H3 | Not yet specified (Section 3.2) | The robot shares the airfield with people and vehicles. |
| R7 | Geodetic to local coordinate frame transformation | H3 | Dual EKF fusing IMU, wheel encoders and GPS | Drone targets arrive as GPS coordinates. |
| R8 | Sensor fusion to handle wheel slip | H3 | Dual EKF fusing IMU, wheel encoders and GPS | Wheels slip on the runway, so odometry alone drifts. |
| R9 | Operating speed of 15 km/hr (from the feature list) | H6 | Cruising speed of 10 to 15 km/h; precision approach speed of 3 to 5 km/h | Fast transit between targets, slow approach for pickup. |

</div>

#### Mechanical {#requirements-mechanical .rpt-l3}

*Table 2.3.2: Requirements and specifications for the chassis, body and steering, the suspension and FOD remediation.*

<div class="wrap-table">

| ID | Requirement | Feature addressed | Specification | Justification |
| --- | --- | --- | --- | --- |
| R10 | House all electronics, vacuum and collection payloads | H2, H10 | Not yet specified | The chassis must carry the payloads. |
| R11 | Maintain ground clearance | H9 | Ground clearance of 180 mm | Runway surface defects must not catch the underside. |
| R12 | Zero mechanical fatigue | H7 | Not yet specified (FEA, Section 4.1) | The chassis sees repeated loading. |
| R13 | Agile heading alignment over small targets | H8 | 4-wheel drive | Skid steering turns on the spot to line up with small FOD. |
| R14 | Weight of 65 kg (from the feature list) | H7 | Gross vehicle weight of at most 60 kg | Keeps the robot light enough to handle and transport. |
| R15 | Sized for easy transport (from the feature list) | H10 | Not yet specified | The robot is carried to the airfield. |
| R16 | Natural frequency of below 10 Hz | H9 | Spring constant of 100 lbf/in | Wheel hop is near 15 Hz, so the suspension must sit well below it (Section 4.2.1). |
| R17 | Static sag of half the stroke length | H9 | Spring constant of 100 lbf/in; total mass of 65 kg | Leaves travel in both directions (Section 4.2.1). |
| R18 | Able to pick up FOD of varying size and weight, from screws up to a bird (3 cm to 18 cm, up to 300 g) | H2 | Vacuum motor of 2.2 kPa (2x required); FOD up to 5 inches in diameter | Items range from screws ([Appendix B](#appendix-b)) to dead birds ([Appendix D](#appendix-d)). |

</div>

#### FOD Detection {#requirements-detection .rpt-l3}

*Table 2.3.3: Requirements and specifications for FOD detection.*

<div class="wrap-table">

| ID | Requirement | Feature addressed | Specification | Justification |
| --- | --- | --- | --- | --- |
| R19 | Detect FOD from 3 cm to 18 cm | H1 | Recall rate above 90%; 5 classes; 32 × 32 px | Pieces as small as 2 cm are reported ([Appendix A](#appendix-a)). |
| R20 | Latency (frames per second to be added) | H1, H6 | Frames required for 15 km/h: to be confirmed | The robot moves while it detects. |

</div>

#### Electrical and Power {#requirements-electrical .rpt-l3}

*Table 2.3.4: Requirements and specifications for the microcontroller, computer and battery management system.*

<div class="wrap-table">

| ID | Requirement | Feature addressed | Specification | Justification |
| --- | --- | --- | --- | --- |
| R21 | Sufficient ports (microcontroller) | H3 | Clock speed of at least 34 MHz | The controller connects the motors and sensors. |
| R22 | Radio frequency has to be approved by the RSAF (computer) | H5 | Frequency of 917 to 925 MHz | Air bases control radio and airspace use ([Appendix B](#appendix-b)). |
| R23 | Computing power sufficient to run the AI models (computer) | H1 | Adequate computing power to run AI models | The detection models run on board. |
| R24 | 20 Ah (battery management system) | H3, H6 | 48 V, 100 A | Powers the drive, sensors and vacuum for a run. |

</div>


### Subsystem Division and Leadership {#subsystem-division}

The work is divided into three subsystems, each with a named person in charge of every part, as shown in Table 2.4.1. Hilbert Soh also oversees the mechanical system integration, and Gabriel Tan also oversees the electrical architecture.

*Table 2.4.1: Subsystem division and the person in charge.*

<div class="wrap-table">

| Subsystem | Sub-subsystem | Person in charge | Report section |
| --- | --- | --- | --- |
| Programming | Software and development environment | Hilbert Soh | 3.1 |
| Programming | Autonomous navigation | Hilbert Soh | 3.2 |
| Programming | UAV–UGV communications | Hilbert Soh | 3.3 |
| Programming | Simulation and validation | Hilbert Soh | 3.4 |
| Programming | Computer vision: sensor fusion, vision field-of-view calculations, vision research and YOLO model benchmarking | Gabriel Tan | 3.5 |
| Mechanical | Chassis: structural design, FEA simulation and material selection | Zacarias Ng | 4.1 |
| Mechanical | Suspension | Takeuchi Asuka | 4.2 |
| Mechanical | FOD remediation (vacuum pickup and sweep box) | Takeuchi Asuka | 4.3 |
| Mechanical | Motor and drivetrain sizing | Hilbert Soh | 4.4 |
| Mechanical | Steering kinematics | Hilbert Soh | 4.5 |
| Electrical | Electrical System Design: battery selection, load budget, power distribution and wiring | Bryan Ng | 5.1 |
| Electrical | Microcontrollers: STM32 hardware and firmware | Gabriel Tan | 5.2 |

</div>

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

### Motor Drivetrain Calculations {#motor-selection}

<!--@compose: ./report/lead/hilbert-lead.md-->

<!--@compose: ./report/members/hilbert/motor-drivetrain-calculation.md#report{shift=2,prefix=motor}-->

### Steering Kinematics {#steering}

<!--@compose: ./report/lead/hilbert-lead.md-->

<!--@compose: ./report/members/hilbert/steering-kinematics.md#report{shift=2,prefix=steer}-->


</section>

<section class="rpt-chapter">

## Electrical {#electrical}

<!--@compose: ./report/design-overview/subsystem-division.md#electrical-overview{shift=1}-->

### Electrical System Design {#electrical-system-design}

<!--@compose: ./report/lead/bryan-lead.md-->

<!--@compose: ./report/members/bryan/system-requirements.md{shift=1,prefix=system-req-}-->

#### Power Calculations & Battery Selection {#power-calculations .rpt-l3}

<!--@compose: ./report/members/bryan/power-calculations.md#report{shift=3,prefix=power-calc}-->

#### Power Distribution & Electrical Protection {#power-distribution .rpt-l3}

<!--@compose: ./report/lead/bryan-lead.md-->

<!--@compose: ./report/members/bryan/power-distribution.md#report{shift=3,prefix=power-distri} -->

<p class="ov-placeholder">*Section under development by Bryan Ng.*</p>

#### Components List {#components-list .rpt-l3}

<!--@compose: ./report/lead/bryan-lead.md-->

<!--@compose: ./report/members/bryan/components-list.md#report{shift=3,prefix=bom}-->

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

#### Appendix E: Who Carries the Problem {#appendix-e .rpt-l3}

<!--@compose: ./report/appendix/background.md#e-->

#### Appendix F: Competitive Analysis {#appendix-f .rpt-l3}

<!--@compose: ./report/appendix/background.md#f-->

#### Appendix G: Problem Statement and Scope {#appendix-g .rpt-l3}

<!--@compose: ./report/appendix/background.md#g-->

#### Appendix H: Why a Multi-Robot Approach {#appendix-h .rpt-l3}

<!--@compose: ./report/appendix/background.md#h-->

#### Appendix I: Proof of the Suspension Motion Ratio {#appendix-i .rpt-l3}

<!--@compose: ./report/appendix/derivations.md#i-->

</section>

</div>
</div>
