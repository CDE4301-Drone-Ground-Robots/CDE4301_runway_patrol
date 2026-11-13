---
title: "System Requirements"
owner: "Bryan Ng"
outline: [2,3]
---
### Introduction to Electrical Subsystem {#introduction-electrical}

<!-- #region summary1 -->

<Badge type="danger" text="Bryan" /> <Badge type="danger" text="Electrical Power &amp; Integration" />

In this chapter, I discuss the design of the FOD Hunter electrical subsystem, which supplies power to the drivetrain, FOD collection mechanism, onboard computing system, sensors and auxiliary components. I first establish the electrical requirements, focusing on component compatibility, a minimum operating duration of one hour and electrical safety. I then estimate the system's power consumption under different driving conditions, obtaining an average power demand of 611.36 W and a required battery capacity of 22.39 Ah for a 1.5-hour operating target. Based on a comparison of battery chemistries, I select a 48 V 20 Ah LiFePO4 battery, which provides an estimated operating duration of 1.34 hours under the current assumptions. Next, I present the centralised 48 V power distribution architecture, incorporating DC-DC converters, a Battery Management System (BMS), fuses and an emergency kill switch. Finally, I discuss the selection and placement of electrical components within the chassis, along with the remaining integration and testing work required to validate the design.

<!-- #endregion summary1 -->

### System Requirements

<!-- #region summary2 -->

The electrical design was developed around three main requirements: component compatibility, operating duration and electrical safety.

| Requirement | Design consideration | Proposed approach |
|---|---|---|
| High-power components | The drivetrain and FOD collection mechanism draw substantial power, so the supply must provide suitable voltage and current while remaining compatible with each component. | Use a centralised 48 V power supply for high-power loads and DC-DC converters to provide the required voltages for lower-power electronics. |
| Minimum 1-hour operating time | Battery capacity must support the estimated load for at least one hour of operation. | Use a 48 V, 20 Ah LiFePO4 battery. Based on the current power estimate, it is expected to provide approximately 1.34 hours of operation. |
| Electrical safety | Protect the battery, wiring and connected components from overcurrent and provide a way to stop power in an emergency. | Include a Battery Management System (BMS), appropriately rated fuses and an emergency kill switch in the power distribution system. |

*Table 5.1: Electrical Requirements.*

The 1.5-hour design baseline provides a more conservative target than the minimum operating-time requirement. Battery capacity was estimated using the expected mission power consumption and an assumed usable capacity of 80%.

<!-- #endregion summary2 -->
