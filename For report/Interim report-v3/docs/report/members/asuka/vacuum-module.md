---
title: "FOD Remediation Vacuum Module"
owner: "Takeuchi Asuka"
outline: [2,3]
---
# FOD Remediation Vacuum Module
<!-- #region report -->

<!-- Report summary (the Report's section text). The detailed write-up follows. -->

## High-Flow Vacuum FOD Pickup Subsystem {#sec-4-1-7}

<Badge type="danger" text="Asuka" /> <Badge type="danger" text="Aerodynamic Suction" />

The FOD pickup subsystem addresses the limitations of manual runway FOD walks, sweepers, magnetic bars, and independent blowers by combining a ground-sealing intake interface with contained vacuum extraction. The design target covers ferrous and non-ferrous debris from approximately 4-20 cm and 4-300 g, including small fasteners through to a 300 g bird carcass. The documentation compares grippers, vacuum, magnetic bars, friction mats, and sweepers, then derives pickup velocity, duct flow rate, pressure losses, and estimated motor power for 25 g and 300 g cases. It also records two design iterations, side-entry and top-down testing, the observed blockage caused by corrugated hose, and the improved pickup achieved through a temporary nozzle seal and velocity surge.



## Literature Review: Why Runway FOD Retrieval Needs a New Approach

<Badge type="danger" text="Asuka" />

Foreign Object Debris (FOD) on movement surfaces is an operational and financial hazard to commercial and military aviation. Existing detection systems can localise millimetre-scale debris, but physical retrieval remains dependent on manual intervention and legacy sweeping equipment. Annual direct and indirect FOD damage is estimated at **\$12-\$14 billion**, with severe single-engine ingestion events exceeding **\$1 million** in direct repairs.

::: warning Operational bottleneck
A detection system only protects the runway when the debris is physically contained and removed. Manual dispatch cycles can take 10-27 minutes for one incident, while reported airports experience 200-240 minutes of monthly runway downtime.
:::

| Method | Mechanical limitation | Operational constraint |
| --- | --- | --- |
| **Rotary and vacuum sweepers** | High fuel or power draw; filters clog; leakage risk on tarmac. | Bulky footprint and slow active sweeping speed. |
| **Friction or mat sweepers** | Rubber squeegees wear rapidly and struggle with heavy or embedded items. | Requires towing and restricts manoeuvrability. |
| **Magnetic bars** | Cannot collect non-ferrous aluminium, titanium, rubber, plastic, or composite debris. | Cannot address biological hazards or non-magnetic hardware. |
| **Independent blowers** | Expel debris without containment. | Vortex, crosswinds, and jet blast can return debris to active pavement. |

Current detection deployments also leave an open-loop response: operators must notify ground teams and track vehicles across multi-kilometre paths. A coordinated multi-robot system can reduce this response bottleneck by allocating nearby tasks across localised debris clusters.

## FOD Types, Design Selection, and Project Scope

The pickup system is scoped to collect inanimate solid debris, including both ferrous and non-ferrous objects. The target range is approximately **4 cm to 20 cm** and **4 g to 300 g**, from a small screw or fastener through to a bird carcass.

| FOD type | Gripper | Vacuum | Magnet | Mat / sweeper |
| --- | --- | --- | --- | --- |
| Inanimate solid | Yes | Yes | No | Yes |
| Ferrous metal | Yes | Yes | Yes | Yes |
| Non-ferrous metal | Yes | Yes | No | Yes |
| Animate object | No | No | No | No |

<Figure src="./assets/images/wetndryvacuum.png" alt="Wet and dry vacuum used as a pickup-system reference" caption="Vacuum pickup reference used for the first concept." />

::: tip Selection decision
A vacuum is preferred because a sufficiently powerful motor can address different FOD sizes and material types. The first concept combines a sweeping or sealing interface with localised vacuum extraction rather than relying on a gripper, magnet, or passive mat alone.
:::

## FOD Remediation: Purpose and Requirements

::: info Purpose
1. Collect FOD of varying sizes.
2. Ensure 100% remediation of FOD.
:::

FOD

Inanimate

Solid stonesGoop RainsBaggage tags Food remainsVolcanic ash Snow, hailTrash Mechanic toolsFasteners DronesPersonal items Bomb fragmentsOthers

Animate

GrassInsectsWildlifeHumans

Ground animals

MammalsReptiles

Airborne

BirdsBats

Classification of foreign object debris by animate and inanimate categories (adapted from El-Sayed, *Foreign Object Debris and Damage in Aviation*, Figure 1.3).

::: info From our interviews, the common FOD in Singapore are
1. Nuts and bolts.
2. Bird carcasses, even bones.
3. Chips of the runway (stones).
4. "We usually get about a handful."
5. Special case: a big section of the runway.
:::

::: tip Requirements
1. Able to pick up objects as small as nuts and bolts, up to bird-sized FOD (up to 5" diameter, 300 g). Anything bigger cannot be picked up and is sent to the command centre for intervention.
:::

## Different Approaches

| Clearing method | Able to pick up non-metallic objects? (e.g. stones, leaves) | Able to pick up metallic objects? (e.g. nuts, bolts) | Able to pick up animate objects? (e.g. birds) | Remarks | Final decision |
| --- | --- | --- | --- | --- | --- |
| **Vacuum** | Yes | Yes | Yes | Vacuum must be strong enough. | **Select** |
| **Robot gripper arm** | Yes | Yes | Yes | Mechanically complex, difficult to aim, and will struggle with smaller pieces. | Reject for now; keep in case the vacuum doesn't work |
| **Magnetic bar** | No | Yes | No | Might be good for nuts and bolts, but definitely not for others. | Reject |

## Pickup Velocity and Motor Sizing

<Figure src="./assets/diagrams/vacuum-module-airflow-drawn-up-a-vertical-intake-tube-.svg" alt="Airflow drawn up a vertical intake tube lifting an object off the ground" />

$$
F_{Drag}=\frac{1}{2}\rho_{Air}V^2C_dA_{projected},\qquad W_{object}=mg
$$

In equilibrium:

$$
mg=\frac{1}{2}\rho_{Air}V^2C_dA_{projected}
$$

For pickup:

$$
\frac{1}{2}\rho_{Air}V^2C_dA_{projected}>mg
$$

$$
V_{min}>\sqrt{\frac{2mg}{\rho_{Air}C_dA_{projected}}}
$$

Flow rate:

$$
Q=A_{tube}V_{pick\,up}
$$

$$
\eta_{total}=\eta_{blower}\times\eta_{motor}
$$

- **Blower** efficiency refers to the efficiency of the fan itself (typically 50%).
- **Motor** efficiency refers to the electrical-to-shaft efficiency (typically 80%).

$$
P_{elec}=\frac{P_{fluid}}{\eta_{total}}=\frac{Q\times\Delta Pressure_{Total}}{\eta_{blower}\times\eta_{motor}}
$$

$$
\Delta Pressure_{Total}=\sum Pressure\ Losses=\Delta P_{Entry}+\Delta P_{Friction}+\Delta P_{Elbow\ Loss}+\Delta P_{Filter}
$$

$$
\Delta P_{Entry}=K_{entry}\left(\frac{1}{2}\rho V^2\right)
$$

$$
\Delta P_{Friction}=f\times\frac{L}{D}\times\left(\frac{1}{2}\rho V^2\right)
$$

$$
\Delta P_{Elbow}=K_{bend}\left(\frac{1}{2}\rho V^2\right)
$$

$$
\Delta P_{Filter}=300\ \text{Pa (assumed)}
$$

## Component Selection and Specification Calculation

| Parameter | Case A: Nut and bolts, 25 g | Case B: Bird carcass, 300 g | Units | Remarks |
| --- | --- | --- | --- | --- |
| Mass | 0.0250 | 0.3000 | kg |   |
| Dimensions | D = 12 mm, L = 15 mm | 150 mm × 80 mm × 60 mm | mm |   |
| Projected area | 0.0001131 | 0.0090 | m² |   |
| Minimum duct diameter | 0.0381 | 0.1270 | m | 1.5 inch tube for case A, 5 inch tube for case B |
| **Required pickup velocity** | **67.2129** | **26.1008** | m/s | Safety factor not accounted for |
| Duct area | 0.0011 | 0.0127 | m² |   |
| **Required flow rate Q** | **0.0766** | **0.3306** | m³/s |   |
| Required static pressure (gauge) | 5669.5089 | 1100.2810 | Pa | Safety factor not accounted for |
| Air power | 434.4481 | 363.7929 | W |   |
| **Estimated motor power** | **1086.1202** | **909.4822** | W | Safety factor not accounted for |

| Pressure loss | Case A: Nut and bolts, 25 g | Case B: Bird carcass, 300 g |
| --- | --- | --- |
| Dynamic pressure | 2710.54 Pa | 408.75 Pa |
| Nozzle entry loss | 948.69 Pa | 143.06 Pa |
| Duct friction loss (L = 0.4 m, d = 1.5 inches) | 626.06 Pa | 84.97 Pa |
| Elbow bend (k = 0.4) | 1084.22 Pa | 163.50 Pa |
| Pressure drop due to filter | 300.00 Pa | 300.00 Pa |
| **Total pressure loss** | **5669.51 Pa** | **1100.28 Pa** |

::: warning In conclusion
, I need a motor that can meet the minimum power rating of **1.1 kW**.
:::

Change the object and duct to see the required pickup velocity, pressure losses and motor power. Constants: $\rho = 1.2\ \text{kg/m}^3$, $K_{entry} = 0.35$, $f = 0.022$, $L = 0.4\ \text{m}$, $K_{bend} = 0.4$, $\Delta P_{Filter} = 300\ \text{Pa}$, $\eta_{blower}\times\eta_{motor} = 0.5\times0.8$. Duct friction uses the selected duct diameter.

<VacuumModuleWidget1 />

Safety factor not accounted for.

::: tip Decision made
buy a high-power vacuum off the shelf and start testing!
:::

::: info Selected vacuum
2800 W wet and dry vacuum, just over \$80 on Shopee, rated at 19 kPa gauge pressure.
:::

<!-- #endregion report -->

<!-- #region cfp-design -->

## Design and Iteration

<Figure src="./assets/images/vacuum-design-iteration-1.png" alt="Side intake concept: vacuum module on the chassis with the hose lowered beside the wheel" caption="**Iteration 1:** side intake with a lowering path." />

<Figure src="./assets/images/vacuum-design-iteration-2.png" alt="Top-down UFO concept: intake hood lowered vertically onto the ground" caption="**Iteration 2:** top-down &quot;UFO&quot; concept." />

## Initial Thoughts and Conclusions

1. The top-down approach works better than the side approach.
2. The off-the-shelf vacuum system's efficiency is very low (10% of rated gauge pressure).

::: warning Open question
is spending more money on a bigger (or more powerful) motor going to solve the issue?
:::

<!-- #endregion cfp-design -->

<!-- #region cfp-testing -->

## Testing and Evaluation

**Findings:**

1. Pickup speed was measured with an anemometer at **42.47 m/s** for a 1.5 inch diameter intake.
2. The vacuum was able to pick up many small-sized screws.
3. It was unable to pick up larger-sized screws unless the "surge" effect was applied.

<!-- #endregion cfp-testing -->

<!-- #region cfp-future-work -->

## Future Work: Redesigning the Pickup Mechanism

<Badge type="warning" text="In progress" />

### 10.1 Redesigning the pickup mechanism

The redesigned pickup mechanism works in three steps:

<Figure src="./assets/images/vacuum-redesign-open-sweep.png" alt="CAD render: sweep box lowered and open in front of the robot" caption="1Open and sweep" />

Image to be added

<Figure src="./assets/images/vacuum-redesign-elevate.png" alt="CAD render: sweep box raised above the intake point" caption="2Elevate to above the intake point" />

Image to be added

<Figure src="./assets/images/vacuum-redesign-vacuum-on.png" alt="CAD render: sweep box docked at the intake with the vacuum on" caption="3Turn on the vacuum and remediate FOD" />

Image to be added

### 10.2 Working out the maths

<Figure src="./assets/diagrams/vacuum-module-airflow-carries-the-object-from-the-boun.svg" alt="Airflow carries the object from the bounding box opening down a tube inclined at angle theta into the bin. Free body diagram: drag force along the tube, weight downwards, normal force perpendicular to the tube." />

The force of drag is:

$$
F_D=\frac{1}{2}\rho C_DA\left(v_{air}-v_{obj}\right)^2
$$

Given that the object starts from rest:

$$
v_{obj}=0\ \Rightarrow\ F_D=\frac{1}{2}\rho C_DA\,v_{air}^2
$$

In the $y$ direction, the object comes into contact with the tube:

$$
\sum F_y=0:\quad N-W\cos\theta=0\ \Rightarrow\ N=W\cos\theta
$$

In the $x$ direction, the object is accelerating:

$$
\sum F_x=ma_x:\quad F_D+W\sin\theta-\mu_sN=ma_x
$$

$$
F_D+W\sin\theta-\mu_sW\cos\theta=ma_x
$$

As long as the acceleration in the $x$ direction is greater than 0, the FOD will be sucked in:

$$
\frac{1}{2}\rho C_DA\,v_{air}^2+W\sin\theta-\mu_sW\cos\theta>0
$$

The minimum pickup velocity is therefore:

$$
v_{air}>\sqrt{\frac{2W\left(\mu_s\cos\theta-\sin\theta\right)}{\rho C_DA}}
$$

The object will be sucked in if:

$$
\frac{W}{C_DA}<\frac{\rho\,v_{air}^2}{2\left(\mu_s\cos\theta-\sin\theta\right)}
$$

The object does **not** come into contact with the tube:

$$
\sum F_y=0,\qquad \sum F_x=ma_x:\quad F_D+W\sin\theta=ma_x
$$

$$
a_x=\frac{\rho C_DA\left(v_{air}-v_{obj}\right)^2}{2m}+g\sin\theta
$$

::: tip
As long as $\theta>0$, objects that can fit in the tube will be sucked in: $a_x>0$ for all objects.
:::

| Parameter | Case A: Screw M8, 25 g | Case B: Bird carcass, 300 g | Units | Remarks |
| --- | --- | --- | --- | --- |
| Mass | 0.0250 | 0.3000 | kg |   |
| Dimensions | D = 12 mm, L = 15 mm | 150 mm × 80 mm × 60 mm | mm |   |
| Projected area | 0.0001131 | 0.0090 | m² |   |
| Minimum duct diameter | 0.0381 | 0.1270 | m | 1.5 inch tube for case A, 5 inch tube for case B |
| Required pickup velocity (old set-up) | **67.2129** | **26.1008** | m/s | Safety factor not accounted for |
| $W/(C_DA)$ | 2710.5 | 408.8 | N/m² | Assumptions: $C_D = 0.8$, $\mu_s = 0.5$ |
| Min. $v_{air}$, $\theta = 30°$ (new set-up) | **0** | **0** | m/s | $\mu_s\cos\theta-\sin\theta<0$, so the object slides by gravity |
| Min. $v_{air}$, $\theta = 0°$ (new set-up) | **47.5266** | **18.4560** | m/s |   |
| Limit, $\theta = 0°$ | 5421.1 | 817.5 | N/m² | $\rho v^2/2\mu_s$, with $v$ = 67.2 / 26.1 m/s |
| Picked up? | Yes | Yes |   | Yes, $W/(C_DA)$ &lt; limit |

::: tip Conclusion
changing to this new set-up allows a significantly lower pickup speed to remediate the FOD, which leads to a high success rate of FOD remediation.

*\* Caveat: the new set-up has not been tested yet; we will develop and test it as soon as we can.*
:::

Change the tube angle $\theta$ and the friction coefficient $\mu_s$ to see the minimum air speed needed to move the object into the bin, compared with the 42.47 m/s measured from the off-the-shelf vacuum. Uses $\rho = 1.2\ \text{kg/m}^3$ and $C_D = 0.8$.

<VacuumModuleWidget2 />

Safety factor not accounted for. Above the critical angle $\theta_c = \tan^{-1}\mu_s$, the object slides into the bin by gravity alone.

### 10.3 New design in CAD

<Figure src="./assets/images/vacuum-cad-new-2.png" alt="CAD isometric view of the robot with the new sweep box, lift columns and vacuum bin" caption="Full assembly on the robot" />

Image to be added

### 10.4 Animation: sweep box v2

One full pickup cycle: the box lowers to the asphalt while the scraper opens and the blade reaches out, the scraper sweeps the FOD up the ramp, the box lifts above the bin, and with the vacuum on the FOD slides down the 5" hose into the bin. Drag to orbit, scroll to zoom, tap a part for details, or scrub through the 8 phases.

<VacuumModuleWidget3 />

Animated model generated with Claude. The sweep box, top bridge and bin elbow follow the SolidWorks model; the chassis, wheels and bin are simplified stand-ins.

### 10.5 Testing: critical function prototype

A cardboard bounding box connected to the vacuum hose was used as a critical function prototype to test the new set-up.

<VideoClip src="./assets/videos/vacuum-critical-prototype-test.mp4" poster="./assets/images/vacuum-critical-prototype-test-poster.jpg" caption="Critical function prototype test." />

<!-- #endregion cfp-future-work -->

<!-- #region references -->

## References

<Badge type="info" text="Literature Review" />

1. Hilburn, B. G. and Pesmen, B. S., *Foreign Object Debris Detection System Cost-Benefit Analysis*, FAA Tech. Rep. DOT/FAA/TC-22/47, 2023.
2. El-Sayed, A. F., *Foreign Object Debris and Damage in Aviation*, CRC Press, 2022.
3. Jain, S., Prasad, M. S., and Gupta, R., “A Comparison of Manual and Automotive FOD Detection Systems at Airport Runways,” ICRITO, 2022.
4. Vidal, Y. L. S. et al., “A Systematic Review of Methods for Cleaning FOD on Runways,” EMES, 2023.
5. Yamamoto, H. et al., “Drone-enabled Foreign Object Debris Removal System in ad hoc Situations,” ACRP University Design Competition, 2016.
6. Ozturk, S. and Kuzucuoglu, A. E., “A multi-robot coordination approach for autonomous runway FOD clearance,” *Robotics and Autonomous Systems*, 2016.

<!-- #endregion references -->
