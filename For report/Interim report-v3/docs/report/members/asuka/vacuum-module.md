---
title: "FOD Remediation Vacuum Module"
owner: "Takeuchi Asuka"
outline: [2,3]
---
# FOD Remediation Vacuum Module

## High-Flow Vacuum FOD Pickup Subsystem {#sec-4-1-7}

<!-- #region summary -->
In this chapter, I discuss the design of the FOD remediation subsystem, which removes debris from the runway once the FOD Hunter has located it. I first define the size range the subsystem must handle, from a 25 g nut to a 300 g bird carcass, based on user interviews. I then compare three clearing methods and select a vacuum, as it is the only option that handles metallic, non-metallic and animate FOD with a single mechanism. From a drag model of each limiting case, I size the vacuum at a minimum of 1.1 kW, then test an off-the-shelf unit, which picked up small screws but failed on larger ones because its measured airspeed (42.6 m/s) fell short of the 67.2 m/s required. Finally, I present an in-progress redesign in which a bounding box lifts the FOD mechanically and an inclined tube carries it into the bin, removing the need for more suction power above a tube angle of 26.6°.

<!-- #endregion summary -->

<!-- #region s1 -->
There is no single, agreed definition of FOD, and aviation authorities draw its boundaries differently [\[6, pp. 4–5\]](./references.md#ref-6). The FAA defines FOD as "any object, live or not, located in an inappropriate location in the airport environment that can injure airport or air carrier personnel and damage aircraft" [\[6, p. 4\]](./references.md#ref-6). EASA, by contrast, limits it to "an inanimate object within the movement area of an aerodrome which has no operational or aeronautical function" [\[6, p. 4\]](./references.md#ref-6). The distinction matters for this subsystem: under the EASA definition a bird carcass is not FOD, yet interviewees at both military and civilian airfields named birds among the items they clear most often. I therefore adopt the FAA definition, which covers both inanimate and animate debris (Figure 4.5.1.1).

<Figure src="./assets/images/fod-classification.png" alt="Classification of FOD into inanimate and animate categories" style="max-width: 520px; margin: 28px auto;" caption="Figure 4.5.1.1: Classification of FOD by animate and inanimate categories, adapted from [6, Fig. 1.3]." />

FOD can be further grouped by material into metal, stone, birds/bats and miscellaneous, or more simply into hard bodies such as fasteners and stones and soft bodies such as birds [\[6, p. 19\]](./references.md#ref-6). The Australasian Aviation Ground Safety Council lists the typical hard bodies explicitly: "metal (e.g., tools, nuts, bolts, and lock wire), wood, stones, pavement fragments, sand, plastic wrapping, and paper" [\[6, p. 4\]](./references.md#ref-6). This hard–soft split frames the requirements below, since a small, dense fastener and a large, soft carcass place very different demands on a pick-up mechanism.

To confirm which FOD types the subsystem must handle in Singapore, I interviewed four stakeholders across military and civilian airfields ([see interview transcripts](/report#appendix)). Table 4.5.1.2 summarises the FOD each interviewee reported.

*Table 4.5.1.2: FOD reported by interviewees.*

| Interviewee | Context | FOD reported |
| --- | --- | --- |
| **Mr Harry Lim** | Industry partner (IOI Inspire); observed an RSAF FOD run, 10 Sep 2026 | "a small metal piece, about 2 cm"; "nuts and bolts … or some scrap metal"; palm-sized plastic |
| **3SG(NS) Prady** | Air force technician, Paya Lebar Air Base; conducted FOD walks, 16 Sep 2026 | "Rocks, screws, rivets. Uh, actually, bones are quite common."; shattered glass |
| **LTA(NS) Elnathan** | Air force officer, Tengah Air Base, 16 Sep 2026 | plastic, wood, "dead birds"; "a nut this big, we don't really find that" |
| **Ms Cindy Koh** | CAAS; civil airfields (Changi and Seletar), 28 Sep 2026 | "a bird, uh which we get quite often"; "bolts and nuts quite often"; cloth, plastics, paper; loose runway premix |

Three FOD types recur across the interviews. The first is small metal fasteners: three of the four interviewees named nuts, bolts, screws or rivets, and Ms Koh confirmed that at Changi "we get bolts and nuts quite often". This agrees with a one-year airport study cited by El-Sayed, in which over 60% of collected FOD was metal and a typical item measured 25 mm × 25 mm or smaller [\[6, p. 19\]](./references.md#ref-6). The second is animal remains. Ms Koh explained that whole bird carcasses "are more common for us" than fragments, although a bird strike can leave "50 pieces of like small little droppings all around the runway". Prady described rat bones left behind after the remains were "roasted by the engine". The third is pavement fragments: Prady reported rocks breaking off after lightning cracked the runway, and Ms Koh described loose premix from potholes disintegrating under jet blast.

The interviews also set the expected volume and the gap the subsystem must fill. Both interviewees who gave an estimate described a small quantity per run: Mr Lim said "it's like one palm", and Prady said "maybe a handful", as "the sweepers take care of most of it". However, Prady stressed that "the big sweeper does not pick up the small pieces", and that it is "the smaller stuff, right, like rivets, the ones that can actually cause damage" that the sweeper misses. Small fasteners are therefore both the most frequent FOD and the type that existing equipment handles worst.

Not all accounts agree. Elnathan reported that at Tengah, "something the size of my fist or a nut this big, we don't really find that", which contrasts with the other three interviewees. This may reflect differences between air bases or between his role and Prady's hands-on FOD walks. I retain fasteners as a design case regardless, as CAAS confirms they are frequent at Changi and they are the items most likely to cause damage. Large sections of broken runway, such as the "piece of pavement this big" Prady carried off after a C-17 landing, were excluded from scope, as they require a works crew rather than a patrol vehicle.

From the definitions and interviews, I set two limiting design cases: a small metal fastener, representing hard, dense and frequent FOD, and a whole bird carcass, representing soft, bulky and heavy FOD. The subsystem must therefore pick up objects ranging from a nut or bolt (25 g) to a bird carcass (300 g, approximately 150 mm × 80 mm × 60 mm), and remove each detected item completely so that nothing is left on the runway after a pass.

<!-- #endregion s1 -->

<!-- #region s2 -->
I compared three clearing methods [\[6, Sec. 8.4.3\]](./references.md#ref-6), [\[7\]](./references.md#ref-7) against the three FOD categories identified above: non-metallic objects (stones, leaves), metallic objects (nuts, bolts) and animate objects (birds).

*Table 4.5.2.1: Comparison of FOD clearing methods.*

| Method | Non-metallic | Metallic | Animate | Remarks | Decision |
| --- | --- | --- | --- | --- | --- |
| **Vacuum** | Yes | Yes | Yes | Needs high suction; large objects need a large duct | Selected |
| **Robot gripper arm** | Yes | Yes | Yes | Mechanically complex; hard to aim; poor on small pieces | Reserve |
| **Magnetic bar** | No | Yes | No | Collects ferrous fasteners only | Rejected |

The magnetic bar was rejected as it cannot collect stones or animal remains, which together make up two of the three most common FOD types reported in interviews. The gripper arm can handle every category but requires vision-guided aiming and struggles with small fragments, adding complexity to the most uncertain part of the system. I selected the vacuum, as it handles all three categories with a single mechanism, and kept the gripper arm in reserve should the vacuum fail to collect larger objects. In the later part of the report, I eventually integrate the methods together as part of my future work.

<!-- #endregion s2 -->

<!-- #region s3 -->
To size the vacuum, I modelled pick-up from first principles as a vertical lift-off problem (Figure 4.5.3.1). Air drawn into the intake accelerates from rest around the nozzle mouth and flows up the tube past the object. The object leaves the ground when the upward aerodynamic drag exceeds its weight. The model rests on four assumptions: the object sits directly beneath the intake, it experiences the full tube velocity, lift and ground friction are neglected, and drag acts on the object's projected area normal to the flow.

<Figure src="./assets/diagrams/vacuum-pickup-model.svg" alt="Airflow drawn up a vertical intake tube lifting an object off the ground" style="max-width: 300px; margin: 28px auto;" caption="Figure 4.5.3.1: First-principles pick-up model. Airflow enters the intake from ground level and acts on the object as drag opposing its weight." />

The two forces acting on the object are the drag from the airflow and its weight [\[8\]](./references.md#ref-8):

$$F_{drag} = \tfrac{1}{2}\rho_{air}V^2 C_D A_{projected}, \qquad W_{object} = mg$$

At equilibrium the object hovers, with drag exactly balancing weight:

$$mg = \tfrac{1}{2}\rho_{air}V^2 C_D A_{projected}$$

For pick-up, drag must exceed weight, which gives the minimum airspeed the intake must achieve:

$$\tfrac{1}{2}\rho_{air}V^2 C_D A_{projected} > mg \quad\Rightarrow\quad V_{min} > \sqrt{\frac{2mg}{\rho_{air} C_D A_{projected}}}$$

The volumetric flow rate the vacuum must deliver follows from the tube cross-section:

$$Q = A_{tube}V_{pick\,up}$$

The vacuum must then sustain this flow against the pressure losses along the flow path. The electrical power required is the fluid power divided by the combined efficiency of the blower (fan) and the motor (electrical to shaft):

$$P_{elec} = \frac{P_{fluid}}{\eta_{total}} = \frac{Q\,\Delta P_{total}}{\eta_{blower}\,\eta_{motor}}$$

The total pressure the blower must generate is the dynamic pressure needed to accelerate the air from rest to $V$, plus the losses at the nozzle entry, along the duct, through the elbow and across the filter [\[8\]](./references.md#ref-8):

$$\Delta P_{total} = \tfrac{1}{2}\rho V^2 + \Delta P_{entry} + \Delta P_{friction} + \Delta P_{elbow} + \Delta P_{filter}$$

$$\Delta P_{entry} = K_{entry}\left(\tfrac{1}{2}\rho V^2\right), \quad \Delta P_{friction} = f\frac{L}{D}\left(\tfrac{1}{2}\rho V^2\right), \quad \Delta P_{elbow} = K_{bend}\left(\tfrac{1}{2}\rho V^2\right)$$

I took $\rho_{air}$ = 1.2 kg/m³, $C_D$ = 0.8, $K_{entry}$ = 0.35, $K_{bend}$ = 0.4, a friction factor $f$ = 0.022, a duct length of 0.4 m and an assumed filter loss of 300 Pa. I assumed a blower efficiency of 50% and a motor efficiency of 80%, giving $\eta_{total}$ = 40%.<!-- TODO: cite a source for both efficiencies, e.g. a blower or vacuum motor datasheet --> Table 4.5.3.2 applies the model to the two limiting cases set in Section 4.5.1.

*Table 4.5.3.2: Vacuum sizing for the two limiting cases (no safety factor applied).*

| Parameter | Case A: Nut/bolt | Case B: Bird carcass | Units |
| --- | --- | --- | --- |
| Mass | 0.025 | 0.300 | kg |
| Dimensions | Ø12 × 15 | 150 × 80 × 60 | mm |
| Projected area | 1.131 × 10⁻⁴ | 9.0 × 10⁻³ | m² |
| Duct diameter | 0.0381 (1.5 in) | 0.127 (5 in) | m |
| Required pick-up velocity | 67.2 | 26.1 | m/s |
| Required flow rate Q | 0.0766 | 0.3306 | m³/s |
| Total pressure loss | 5670 | 1044 | Pa |
| Fluid power | 434 | 345 | W |
| Estimated electrical power | 1086 | 863 | W |

The nut-and-bolt case is the more demanding of the two: its small projected area relative to its mass requires 67.2 m/s at the intake, driving a pressure loss of 5.7 kPa and an electrical power of about 1.1 kW. The bird carcass needs a lower velocity but a much larger duct and therefore a higher flow rate. On this basis, I bought an off-the-shelf vacuum rated at 19 kPa gauge pressure (approximately SGD 80) to begin testing, rather than designing a blower from scratch.

The model is optimistic in one important respect. It assumes the object experiences the full tube velocity, whereas an object resting on the ground sits outside the nozzle, where airspeed falls off rapidly with distance from the intake [\[10\]](./references.md#ref-10). The airspeed acting on the object is therefore lower than the tube velocity, so the values in Table 4.5.3.2 are lower bounds on the velocity the vacuum must reach.

The interactive calculator below changes the object and duct to show the required pickup velocity, pressure losses and motor power. The constants are $\rho = 1.2\ \text{kg/m}^3$, $K_{entry} = 0.35$, $f = 0.022$, $L = 0.4\ \text{m}$, $K_{bend} = 0.4$, $\Delta P_{Filter} = 300\ \text{Pa}$ and $\eta_{blower}\times\eta_{motor} = 0.5\times0.8$. Duct friction uses the selected duct diameter.

<VacuumModuleWidget1 />

*Figure 4.5.3.3: Interactive calculator for pickup velocity, pressure losses and motor power.*

Figures 4.5.3.4 and 4.5.3.5 show the first integration concepts. The vacuum canister sits on top of the chassis and doubles as the debris bin, with the 1.5 in hose routed down to a nozzle at the front of the vehicle. I considered two intake orientations: a side intake that sweeps debris in from the front, and a top-down nozzle positioned directly over the FOD.

<div class="fig-row" style="max-width: 620px; margin-left: auto; margin-right: auto;">

<Figure src="./assets/images/vacuum-design-iteration-1.png" alt="Side intake concept: vacuum module on the chassis with the hose lowered beside the wheel" caption="Figure 4.5.3.4: Iteration 1, side intake with a lowering path." />

<Figure src="./assets/images/vacuum-design-iteration-2.png" alt="Top-down UFO concept: intake hood lowered vertically onto the ground" caption="Figure 4.5.3.5: Iteration 2, top-down &quot;UFO&quot; concept." />

</div>

<!-- #endregion s3 -->

<!-- #region s4 -->
I measured the intake airspeed with an anemometer at 42.6 m/s for the 1.5 in intake (Figure 4.5.4.1). In bench tests, the vacuum picked up small screws reliably but could not lift larger screws unless I applied a "surge"<!-- TODO: one sentence defining the surge effect and how it was produced -->. Testing also showed that a top-down intake picked up FOD more reliably than a side intake, so I adopted the top-down orientation for integration.

<Figure src="./assets/images/vacuum-anemometer-test.png" alt="Kestrel anemometer reading 95.3 mph at the vacuum intake" style="max-width: 340px; margin: 28px auto;" caption="Figure 4.5.4.1: Anemometer measurement of the intake airspeed. The display reads 95.3 mph." />

The bench results agree with the model in Section 4.5.3: the measured 42.6 m/s is well below the 67.2 m/s predicted for the 25 g case. The vacuum also fell well short of its 19 kPa rating in operation. The measured airspeed corresponds to a dynamic pressure of about 1.09 kPa ($\tfrac{1}{2}\rho V^2$), roughly 6% of the rated value.

This shortfall should not be read as poor efficiency alone. Manufacturers quote suction as sealed (zero-flow) vacuum, whereas an open intake operates at the high-flow end of the fan curve, where pressure is far lower [\[9\]](./references.md#ref-9). A larger motor would move the operating point upwards but would add mass and draw more from the 48 V battery.

To validate the integrated subsystem, I mounted the vacuum on the FOD Hunter with a custom-made bin sized to fit the chassis, and recorded a pick-up trial using the top-down intake. The FOD Hunter collected M3–M4 screws under 10 g, confirming that the vacuum, intake and bin work as an integrated system on the rover (Figure 4.5.4.2). Larger fasteners remained on the ground, consistent with the bench results and the model in Section 4.5.3. The trial therefore realises the subsystem for light FOD, but shows that lifting heavier FOD by suction alone would require a disproportionately larger motor. This raised the question of whether more suction power is the right solution at all, which led to the redesign in Section 4.5.5.

<VideoClip src="./assets/videos/vacuum-rover-pickup-trial.mp4" caption="Figure 4.5.4.2: Pick-up trial on the FOD Hunter using the top-down intake." />

Rather than increasing suction, I changed the pick-up method so that the vacuum no longer has to lift the object off the ground. The redesigned mechanism uses a bounding box that opens and sweeps the FOD inside, elevates above the canister's intake, then turns on the vacuum to draw the contents down an inclined tube into the bin (Figure 4.5.4.3). Lifting is now done mechanically by the Z-lift, and the airflow only needs to move the object along the tube.

<div class="fig-eq">

<div class="fig-eq-l">

<Figure src="./assets/diagrams/vacuum-redesign-inclined-tube.svg" alt="Bounding box and inclined tube leading into the bin, with the object, airflow, tube angle theta, axes x and y, and the free body diagram of the object" caption="Figure 4.5.4.3: Redesigned pick-up mechanism. Airflow carries the object from the bounding box down the inclined tube into the bin, with the free body diagram of the object." />

</div>

<div class="fig-eq-r">

The force of drag is:

$$
F_D=\frac{1}{2}\rho C_D A v_{air}^2
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
\frac{1}{2}\rho C_D A v_{air}^2+W\sin\theta-\mu_sW\cos\theta>0
$$

The minimum pick-up velocity is therefore:

$$
v_{air}>\sqrt{\frac{2W(\mu_s\cos\theta-\sin\theta)}{\rho C_D A}}
$$

The object will be sucked in if:

$$
\frac{W}{C_D A}<\frac{\rho v_{air}^2}{2(\mu_s\cos\theta-\sin\theta)}
$$

</div>

</div>

*Table 4.5.4.4: Minimum air speed for the new set-up compared with the old set-up.*

| Parameter | Case A: Nut/bolt, 25 g | Case B: Bird carcass, 300 g | Units | Remarks |
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

In conclusion, changing to this new set-up allows a significantly lower pickup speed to remediate the FOD, which leads to a high success rate of FOD remediation. A caveat is that the new set-up has so far only been tried with the cardboard critical function prototype (Figure 4.5.5.1); a full-scale version is yet to be built and tested.

The interactive calculator below changes the tube angle $\theta$ and the friction coefficient $\mu_s$ to show the minimum air speed needed to move the object into the bin, compared with the 42.6 m/s measured from the off-the-shelf vacuum. It uses $\rho = 1.2\ \text{kg/m}^3$ and $C_D = 0.8$. The safety factor is not accounted for. Above the critical angle $\theta_c = \tan^{-1}\mu_s$, the object slides into the bin by gravity alone.

<VacuumModuleWidget2 />

*Figure 4.5.4.5: Interactive calculator for the minimum air speed of the new set-up.*


<!-- #endregion s4 -->

<!-- #region s6 -->
To validate the inclined-tube concept before committing to a full build, I built a critical function prototype from a cardboard bounding box with an opening, a tube at angle $\theta$ and a bin (Figure 4.5.5.1). The prototype tests whether FOD in the box clears into the bin across a range of tube angles, with and without the vacuum running.

<VideoClip src="./assets/videos/vacuum-critical-prototype-test.mp4" poster="./assets/images/vacuum-critical-prototype-test-poster.jpg" caption="Figure 4.5.5.1: Critical function prototype test." />

I redesigned the pick-up mechanism to lower the pick-up speed required. The redesign works in three steps: open and sweep, elevate to above the intake point, and turn on the vacuum to remediate the FOD.

The new design in CAD is shown below, with the sweep box, lift columns and vacuum bin on the robot.

<Figure src="./assets/images/vacuum-cad-new-2.png" alt="CAD isometric view of the robot with the new sweep box, lift columns and vacuum bin" style="max-width: 420px; margin: 28px auto;" caption="Figure 4.5.5.2: Full assembly on the robot (CAD)." />

One full pickup cycle is animated below: the box lowers to the asphalt while the scraper opens and the blade reaches out, the scraper sweeps the FOD up the ramp, the box lifts above the bin, and with the vacuum on the FOD slides down the 5" hose into the bin. The model can be dragged to orbit, scrolled to zoom, or scrubbed through the 10 phases of the cycle.

<VacuumModuleWidget3 />

*Figure 4.5.5.3: Animated model of the sweep box v2. The sweep box, top bridge and bin elbow follow the SolidWorks model; the chassis, wheels and bin are simplified stand-ins.*

In the vacation break and semester 2, I will work towards a detailed design and fabrication of this system. I also acknowledge that the animation shows an overly optimistic version of this box, where even the smaller parts are able to be swept up. In reality this may not be the case, especially due to the surface of the runway.

Therefore, my other objective is to make two types of FOD remediation "tools". One is dedicated to smaller inanimate objects like screws, bolts, smaller stones and such. The other is for bigger and bulkier items that can go up to the size of a bird carcass. The fact that a vacuum cannot realistically be a one-size-fits-all solution has already been demonstrated through my analysis. To conclude, the future version of the FOD Remediation system will feature two tools.

<!-- #endregion s6 -->
