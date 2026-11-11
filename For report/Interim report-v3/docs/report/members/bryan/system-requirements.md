---
title: "System Requirements"
owner: "Bryan Ng"
outline: [2,3]
---
### Introduction to Electrical Subsystem {#introduction-electrical}

<!-- #region summary -->

<Badge type="danger" text="Bryan" /> <Badge type="danger" text="Electrical Design &amp; Dynamics" />

In this chapter, I discuss the design of the FOD Hunter electrical subsystem, which supplies power to the drivetrain, FOD collection mechanism, onboard computing system, sensors and auxiliary components. I first establish the electrical requirements, focusing on component compatibility, a minimum operating duration of one hour and electrical safety. I then estimate the system's power consumption under different driving conditions, obtaining an average power demand of 611.36 W and a required battery capacity of 22.39 Ah for a 1.5-hour operating target. Based on a comparison of battery chemistries, I select a 48 V 20 Ah LiFePO4 battery, which provides an estimated operating duration of 1.34 hours under the current assumptions. Next, I present the centralised 48 V power distribution architecture, incorporating DC-DC converters, a Battery Management System (BMS), fuses and an emergency kill switch. Finally, I discuss the selection and placement of electrical components within the chassis, along with the remaining integration and testing work required to validate the design.

### System Requirements {#sec-system-requirements}

<!-- #region summary -->
<Badge type="tip" text="System Definition &amp; Traceability" />
