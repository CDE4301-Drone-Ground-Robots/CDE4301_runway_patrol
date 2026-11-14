---
title: "System Requirements"
owner: "Bryan Ng"
outline: [2,3]
---
### Introduction to Electrical Subsystem {#introduction-electrical}

<!-- #region summary1 -->

<Badge type="danger" text="Bryan" /> <Badge type="danger" text="Electrical Power &amp; Integration" />

The electrical subsystem of FOD Hunter is responsible for supplying and distributing power to the drivetrain, FOD collection mechanism, onboard computing system, sensors and auxiliary components. As these subsystems operate under different electrical loads and voltage requirements, the design must provide a compatible power supply while maintaining sufficient operating duration and electrical protection.

The main objective is to develop a centralised electrical architecture capable of supporting the UGV's runway patrol and FOD remediation operations. Particular consideration is given to the high-current demands of the drivetrain and vacuum system, the regulated power requirements of onboard electronics, and the need for electrical isolation during faults or emergencies.

In this chapter, I first establish the electrical requirements and estimate the power consumption under different operating conditions to determine the required battery capacity. I then compare battery chemistries and justify the selection of a 48 V 20 Ah LiFePO4 battery. Next, I present the power distribution and protection architecture, followed by the electrical components list and integration considerations. Finally, I discuss the limitations of the interim design and the work planned for Semester 2.

<!-- #endregion summary1 -->

### System Requirements

<!-- #region summary2 -->

The electrical design was developed around three primary requirements: component compatibility, operating duration and electrical safety. These requirements were established based on the power demands of the drivetrain, FOD collection mechanism and supporting electronics, together with the UGV's intended operating conditions.

| Requirement | Design specification | Engineering justification |
|---|---|---|
| **Component compatibility** | Supply the drivetrain and FOD collection system at their required operating voltages, with regulated 20 V, 12 V and 5 V rails for compatible onboard electronics. | The UGV contains high-power actuators and low-voltage electronic devices with different supply requirements. A centralised power architecture allows these components to operate from a common energy source. |
| **Minimum operating duration** | Achieve more than one hour of operation, with 1.5 hours adopted as the battery-sizing target. | Sufficient battery capacity is required to support runway patrol and intermittent FOD collection without frequent recharging. The longer design target provides additional operating margin beyond the minimum requirement. |
| **Electrical safety** | Incorporate battery monitoring, overcurrent protection, individual branch protection and emergency power isolation. | High-current loads and multiple electrical branches introduce risks of excessive current, short circuits and component damage. Dedicated protection devices are required to manage these conditions. |

*Table 5.1: Electrical Requirements.*

The 1.5-hour operating target was adopted for battery sizing, with an assumed usable battery capacity of 80% to account for a depth-of-discharge reserve. The electrical requirements provide the basis for the subsequent power calculations, battery selection and power distribution design. 

<!-- #endregion summary2 -->
