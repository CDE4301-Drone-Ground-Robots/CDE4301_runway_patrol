---
title: "FEA Simulation"
description: "Finite element stress analysis, deformation modelling, safety factor validation, and dynamic load simulations for the UGV chassis."
owner: "Zacarias Ng"
outline: [2,3]
---
# FEA Simulation — Chassis Structural Assessment

<!-- #region report -->

<!-- Converted from the supplied FEA Simulation.docx; final numerical corrections and selected-member maxima confirmed by the author. -->

## 4.1.2.1 Objectives & Requirements {#fea-4-1-2-1}

Finite Element Analysis (FEA) was conducted to evaluate the structural suitability of the Unmanned Ground Vehicle (UGV) chassis under the expected operating conditions.

The initial chassis design used 40 × 40 mm aluminium T-slot extrusions (4040), selected conservatively for their stiffness, structural capacity and ease of assembly. Following the initial static assessment, a lighter 30 × 30 × 2 mm aluminium square-tube chassis (3030) was investigated to reduce structural mass.

The analysis focused on assessing the initial 4040 chassis under the maximum vehicle design load, evaluating the proposed 3030 chassis under static, skid-steering and uneven-ground conditions, and determining whether the primary chassis members satisfy the required factor of safety (FOS).

**Table 4.1.2.1. Structural analysis requirements**

| Parameter | Requirement |
| --- | --- |
| Maximum vehicle mass | 65 kg |
| Minimum factor of safety | 2.0 |
| Initial chassis section | 40 × 40 mm T-slot extrusion |
| Proposed chassis section | 30 × 30 × 2 mm square tube |
| Structural material | Aluminium alloy |
| Operating conditions | Static loading, skid steering and uneven ground |
| Analysis software | SOLIDWORKS Simulation |

The assessment focuses on the primary load-bearing chassis members. Suspension mounting connections were included to represent the load-transfer arrangement, with their local stresses evaluated separately.

## 4.1.2.2 Simulation Architecture {#fea-4-1-2-2}

The chassis assemblies were analysed using linear static studies in SOLIDWORKS Simulation. The models included the chassis frame, mounting plate and relevant suspension brackets required to represent the structural load paths.

The generic SOLIDWORKS 6061 Alloy material was assigned to the evaluated chassis members, with a yield strength of 55.15 MPa and an elastic modulus of approximately 69 GPa.

Gravity and equivalent component loads were applied to represent the maximum vehicle mass of 65 kg. The simulations used simplified connections and reference-geometry fixtures at the suspension mounting interfaces.

The 4040 chassis was assessed under static loading, while the 3030 chassis was evaluated under static, skid-steering and uneven-ground conditions.

<span id="fea-figure-1"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-4040-simulation-assembly.png" alt="(a) 4040 simulation assembly." caption="(a) 4040 simulation assembly." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-simulation-assembly.png" alt="(b) 3030 simulation assembly." caption="(b) 3030 simulation assembly." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

*Figure 4.1.2.1. Simulation assembly CAD views: (a) 4040 extrusion assembly; (b) 3030 square-tube assembly.*

### 4.1.2.2.1 Boundary Conditions and Modelling Assumptions {#fea-4-1-2-2-1}

The original modelling approach considered detailed assembly connections, including bolt-based mounting restraints. However, the increased complexity resulted in long computation times and unsuccessful simulation runs, including difficulties associated with insufficient constraints.

As the primary objective was to assess the chassis structure, simplified reference-geometry fixtures were adopted. These restrained the required displacement directions at selected mounting locations while maintaining a solvable static model.

The fixtures represented the suspension support arrangement rather than every physical detail of the bolted connections. The implications of these simplifications are discussed in [Section 4.1.2.6.2](#fea-4-1-2-6-2).

:::: details Material Properties and Modelling Assumptions

The following assumptions were adopted:

- Linear static analysis using SOLIDWORKS Simulation.

- Generic 6061 Alloy assigned to the assessed chassis members.

- Yield strength: 55.15 MPa.

- Young's modulus: approximately 69 GPa.

- Gravitational acceleration: 9.81 m/s².

- Maximum equivalent vehicle loading: 65 kg.

- Idealised bonded connections in the simplified assembly models.

- Reference-geometry displacement constraints representing suspension support conditions.

- Von Mises stress used for structural strength evaluation.

- Resultant displacement used to assess chassis deformation.

The material properties are taken from the SOLIDWORKS material model and do not establish the certified properties of the final purchased aluminium.

::::

## 4.1.2.3 Design Methodology & Selection {#fea-4-1-2-3}

### 4.1.2.3.1 Initial 4040 Chassis Assessment {#fea-4-1-2-3-1}

The initial chassis employed 4040 aluminium T-slot extrusions, selected to provide a conservative structural design while allowing straightforward fabrication and component installation.

A static FEA was conducted under an equivalent maximum vehicle mass of 65 kg.

The simulation produced a global maximum von Mises stress of 13.84 MPa and a maximum resultant displacement of 0.03672 mm. The maximum stress within the primary 4040 chassis members was 5.254 MPa.

Using the assigned yield strength of 55.15 MPa, the calculated chassis-member FOS was:

$$
FOS_{4040}=\frac{55.15}{5.254}=\boxed{10.50}
$$

This exceeded the required FOS of 2.0 and indicated substantial structural capacity in the original members under static loading.

### 4.1.2.3.2 Transition to 3030 Square Tubes {#fea-4-1-2-3-2}

The initial results suggested that the original 4040 members could be reduced in size while maintaining the required strength. A 3030 square-tube chassis was therefore developed as a lighter alternative.

**Table 4.1.2.2. Comparison of chassis configurations**

| Parameter | 4040 chassis | 3030 chassis |
| --- | --- | --- |
| Main structural section | 40 × 40 mm T-slot | 30 × 30 × 2 mm hollow tube |
| Estimated structural mass | 11.00 kg | 5.15 kg |
| Maximum evaluated vehicle mass | 65 kg | 65 kg |
| Static chassis-member FOS | 10.50 | 4.77 |

The estimated structural mass reduction was:

$$
\text{Mass reduction}=\frac{11.0043-5.15}{11.0043}\times100=\boxed{53.2\%}
$$

The 3030 design was therefore selected for further analysis under additional operating conditions.

Although the lighter structure reduces the estimated assembled vehicle mass, the simulations retained the 65 kg maximum design load for a consistent assessment.

## 4.1.2.4 Implementation & Prototype {#fea-4-1-2-4}

The 4040 chassis was developed as the initial physical prototype, while the 3030 design was evaluated as a lighter CAD alternative.

Four FEA studies were conducted to assess the structural behaviour of the chassis under different operating conditions.

### 4.1.2.4.1 4040 Static Study {#fea-4-1-2-4-1}

The initial 4040 chassis was evaluated under the maximum vehicle design load.

Downward forces were applied to represent the battery, electronics, vacuum assembly and additional vehicle loads. Gravity was included to account for the structural self-weight.

The additional loads represented the remaining mass allowance up to the maximum vehicle mass of 65 kg. A greater proportion was assigned to the lower frame to represent the expected equipment and payload distribution.

Vertical displacement was restrained at selected suspension-bracket mounting faces. Additional reference-geometry fixtures restricted in-plane movement to prevent rigid-body motion.

:::: details 4040 static study — loads and fixtures (Figure 4.1.2.2)

<span id="fea-figure-2"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-4040-static-vertical-fixtures.png" alt="(a) Vertical displacement restraints normal to the Top Plane." caption="(a) Vertical displacement restraints normal to the Top Plane." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-4040-static-in-plane-fixture-1.png" alt="(b) In-plane restraint in directions 1 and 2." caption="(b) In-plane restraint in directions 1 and 2." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-4040-static-in-plane-fixture-2.png" alt="(c) Additional in-plane restraint in direction 1." caption="(c) Additional in-plane restraint in direction 1." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-4040-static-gravity.png" alt="(d) Gravity: 9.81 m/s²." caption="(d) Gravity: 9.81 m/s²." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-4040-static-battery-load.png" alt="(e) Battery load: 117.72 N." caption="(e) Battery load: 117.72 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-4040-static-electronics-load.png" alt="(f) Electronics load: 68.67 N." caption="(f) Electronics load: 68.67 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-4040-static-vacuum-load.png" alt="(g) Vacuum load: 98.1 N." caption="(g) Vacuum load: 98.1 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-4040-static-lower-frame-load.png" alt="(h) Additional lower-frame load: 163.47 N." caption="(h) Additional lower-frame load: 163.47 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-4040-static-upper-frame-load.png" alt="(i) Additional upper-frame load: 81.74 N." caption="(i) Additional upper-frame load: 81.74 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

*Figure 4.1.2.2. 4040 static study: (a–c) reference-geometry fixtures; (d) gravity; (e–i) component and additional frame loads.*

::::

:::: details 4040 Static Load Calculations

| Load | Applied force |
| --- | --- |
| Battery | 117.72 N |
| Electronics | 68.67 N |
| Vacuum | 98.10 N |
| Additional lower-frame load | 163.47 N |
| Additional upper-frame load | 81.74 N |
| Structural self-weight | Approximately 107.95 N |
| Total | Approximately 637.65 N |

The total applied loading corresponds to:

$$
W=65(9.81)=637.65\text{ N}
$$

The fixtures consisted of vertical displacement restraints normal to the Top Plane at selected bracket mounting faces, together with two additional in-plane reference-geometry restraints at selected bracket vertices.

::::

### 4.1.2.4.2 3030 Static Study {#fea-4-1-2-4-2}

The proposed 3030 chassis was evaluated using an equivalent maximum vehicle loading of 65 kg.

The battery, electronics and vacuum loads were retained from the 4040 assessment. However, because the 3030 chassis had a lower structural mass, additional downward loads were applied to represent the remaining mass allowance.

The additional loads were distributed between the upper and lower frame members, with approximately two-thirds assigned to the lower frame.

Vertical support restraints were applied at selected chassis faces using the Top Plane as reference geometry. Additional in-plane restraints were introduced to prevent rigid-body motion.

:::: details 3030 static study — loads and fixtures (Figure 4.1.2.3)

<span id="fea-figure-3"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-3030-static-vertical-fixtures.png" alt="(a) Vertical displacement restraints normal to the Top Plane." caption="(a) Vertical displacement restraints normal to the Top Plane." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-static-in-plane-fixture-1.png" alt="(b) In-plane restraint in directions 1 and 2." caption="(b) In-plane restraint in directions 1 and 2." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-static-in-plane-fixture-2.png" alt="(c) Additional in-plane restraint in direction 1." caption="(c) Additional in-plane restraint in direction 1." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-static-gravity.png" alt="(d) Gravity: 9.81 m/s²." caption="(d) Gravity: 9.81 m/s²." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-static-battery-load.png" alt="(e) Battery load: 117.72 N." caption="(e) Battery load: 117.72 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-static-electronics-load.png" alt="(f) Electronics load: 68.67 N." caption="(f) Electronics load: 68.67 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-static-vacuum-load.png" alt="(g) Vacuum load: 98.1 N." caption="(g) Vacuum load: 98.1 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-static-lower-frame-load.png" alt="(h) Additional lower-frame load: 204.59 N." caption="(h) Additional lower-frame load: 204.59 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-static-upper-frame-load.png" alt="(i) Additional upper-frame load: 98.1 N." caption="(i) Additional upper-frame load: 98.1 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

*Figure 4.1.2.3. 3030 static study: (a–c) reference-geometry fixtures; (d) gravity; (e–i) component and additional frame loads.*

::::

:::: details 3030 Static Load Calculations

| Load | Applied force |
| --- | --- |
| Battery | 117.72 N |
| Electronics | 68.67 N |
| Vacuum | 98.10 N |
| Additional lower-frame load | 204.59 N |
| Additional upper-frame load | 98.10 N |
| Structural self-weight | Approximately 50.52 N |
| Total | Approximately 637.70 N |

The resulting vertical loading approximates the maximum design requirement of 637.65 N.

The additional 302.69 N load represents the remaining vehicle mass allowance and ensures that the lighter 3030 chassis is assessed against the same 65 kg design requirement as the original 4040 chassis.

::::

### 4.1.2.4.3 3030 Skid-Steering Study {#fea-4-1-2-4-3}

The skid-steering study considered the horizontal forces transmitted through the suspension mounting interfaces during turning.

The existing vertical equipment and gravitational loads were retained. Additional horizontal forces were applied at the four wheel locations using remote loads.

The forces were estimated using the friction-based approach established in the team's Motor & Drivetrain Calculations. A tyre–ground friction coefficient of 0.80 was adopted.

The calculated force components were approximately 91.4 N laterally and 88.9 N longitudinally per wheel, with their directions arranged to represent the skid-steering condition.

Remote forces were transferred through the suspension mounting brackets. The rear mounting regions were restrained, while the front support arrangement allowed selected in-plane displacement.

This configuration represented a constrained chassis-racking condition rather than a complete dynamic vehicle turn.

:::: details 3030 skid-steering study — fixtures and remote forces (Figure 4.1.2.4)

<span id="fea-figure-4"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-3030-skid-fixed-fixtures.png" alt="(a) Fixed-geometry restraint at the mounting regions." caption="(a) Fixed-geometry restraint at the mounting regions." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-skid-vertical-fixtures.png" alt="(b) Reference-geometry vertical restraint." caption="(b) Reference-geometry vertical restraint." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-skid-remote-load-1.png" alt="(c) Remote force 1: X = −91.4 N; Z = 88.9 N." caption="(c) Remote force 1: X = −91.4 N; Z = 88.9 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-skid-remote-load-2.png" alt="(d) Remote force 2: X = −91.4 N; Z = −88.9 N." caption="(d) Remote force 2: X = −91.4 N; Z = −88.9 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-skid-remote-load-3.png" alt="(e) Remote force 3: X = 91.4 N; Z = 88.9 N." caption="(e) Remote force 3: X = 91.4 N; Z = 88.9 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-skid-remote-load-4.png" alt="(f) Remote force 4: X = 91.4 N; Z = −88.9 N." caption="(f) Remote force 4: X = 91.4 N; Z = −88.9 N." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

*Figure 4.1.2.4. 3030 skid-steering study: (a–b) suspension mounting fixtures; (c–f) the four remote-force definitions, including signed components and coordinates.*

::::

:::: details Skid-Steering Force Derivation

Assuming equal vertical loading across four wheels:

$$
N_w=\frac{65(9.81)}4=159.41\text{ N}
$$

Using a tyre–ground friction coefficient of 0.80:

$$
F_w=\mu N_w=0.80(159.41)=127.53\text{ N}
$$

With wheel-location spacings of 580 mm longitudinally and 564.24 mm laterally:

$$
|F_X|=127.53\frac{580}{\sqrt{580^2+564.24^2}}=91.41\text{ N}
$$

$$
|F_Z|=127.53\frac{564.24}{\sqrt{580^2+564.24^2}}=88.93\text{ N}
$$

The values were rounded to 91.4 N and 88.9 N and applied at the four wheel locations using the appropriate force directions.

These values represent an assumed friction-limited turning condition rather than measured tyre forces.

::::

### 4.1.2.4.4 3030 Uneven-Ground Study {#fea-4-1-2-4-4}

The uneven-ground study represented a condition in which one wheel was unsupported, introducing asymmetric chassis loading.

The support restraints associated with the unsupported wheel were removed, leaving three supported corners.

The original vertical vehicle loads were retained. The remaining support regions were constrained vertically, with additional in-plane restraints used to prevent rigid-body motion.

This arrangement was used to investigate the chassis stress distribution and deformation under uneven support conditions.

:::: details 3030 uneven-ground study — support configuration (Figure 4.1.2.5)

<span id="fea-figure-5"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-3030-uneven-vertical-fixtures.png" alt="(a) Vertical restraints for the uneven-ground study." caption="(a) Vertical restraints for the uneven-ground study." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-uneven-in-plane-fixture-1.png" alt="(b) In-plane restraint in directions 1 and 2." caption="(b) In-plane restraint in directions 1 and 2." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-uneven-in-plane-fixture-2.png" alt="(c) Additional in-plane restraint in direction 1." caption="(c) Additional in-plane restraint in direction 1." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

*Figure 4.1.2.5. 3030 uneven-ground reference-geometry fixtures: (a) vertical support selections; (b–c) in-plane restraints. The text describes three supported corners and one unsupported wheel.*

::::

:::: details Meshing Configuration

The 3030 studies used high-quality solid-element meshes.

The mesh settings were progressively refined, with representative maximum/minimum element sizes of:

| Mesh setting | Maximum element size | Minimum element size |
| --- | --- | --- |
| Initial | 20 mm | 2 mm |
| Intermediate | 15 mm | 1.5 mm |
| Refined | 10 mm | 1 mm |

These refinements supported the numerical evaluation but were not treated as evidence of complete mesh independence. The highest local mounting stresses remain sensitive to the modelling of connection geometry, load application and restraints.

::::

## 4.1.2.5 Testing & Results {#fea-4-1-2-5}

The structural assessment was conducted entirely using SOLIDWORKS Simulation. No physical load testing or experimental validation was carried out during Semester 1.

The numerical results were evaluated using von Mises stress, resultant displacement and chassis-member FOS.

The chassis-member FOS was calculated using:

$$
FOS=\frac{\sigma_y}{\sigma_{\mathrm{vM,max}}}
$$

where the assigned material yield strength was 55.15 MPa.

### 4.1.2.5.1 Comparative Results {#fea-4-1-2-5-1}

**Table 4.1.2.3. Comparison of FEA results**

| Study | Chassis-member stress (MPa) | Member FOS | Global peak stress (MPa) | Maximum displacement (mm) |
| --- | --- | --- | --- | --- |
| 4040 Static | 5.254 | 10.50 | 13.84 | 0.03672 |
| 3030 Static | 11.55 | 4.77 | 67.53 | 0.2924 |
| 3030 Skid Steering | 17.52 | 3.15 | 198.0 | 0.5090 |
| 3030 Uneven Ground | 21.39 | 2.58 | 79.44 | 0.7338 |

The chassis-member stresses are the confirmed maximum evaluated stresses within the selected chassis-member regions. They were evaluated separately from the global assembly stresses, which include suspension mounting brackets and connection regions. The Probe screenshots show the reported stress values at the identified locations.

The skid-steering member stress was obtained from a numerical probe over selected chassis tube faces. The listed displacement values represent maximum resultant displacement across each simulated assembly.

### 4.1.2.5.2 4040 Static Results {#fea-4-1-2-5-2}

The 4040 static study produced a global maximum von Mises stress of 13.84 MPa and a maximum resultant displacement of 0.03672 mm.

The maximum evaluated stress within the primary chassis members was 5.254 MPa, corresponding to an FOS of 10.50.

The results indicated substantial structural capacity within the original 4040 members under static loading, supporting the investigation of a lighter structural section.

<span id="fea-figure-6"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-4040-static-stress.png" alt="(a) General von Mises stress distribution (N/m²)." caption="(a) General von Mises stress distribution (N/m²)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-4040-static-displacement.png" alt="(b) Resultant displacement distribution (mm)." caption="(b) Resultant displacement distribution (mm)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

<Figure src="./assets/images/fea-4040-static-probe.png" alt="(c) SOLIDWORKS Probe — Selected node 241081: 5.254 MPa (5.254 × 10⁶ N/m²)." caption="(c) SOLIDWORKS Probe — Selected node 241081: 5.254 MPa (5.254 × 10⁶ N/m²)." style="width: 100%; max-width: 760px; margin: 0 auto;" />

*Figure 4.1.2.6. 4040 Static FEA Results — (a) von Mises stress distribution, (b) resultant displacement, and (c) chassis-member stress Probe results at the identified locations.*

### 4.1.2.5.3 3030 Static Results {#fea-4-1-2-5-3}

The 3030 static study produced a maximum evaluated chassis-member stress of 11.55 MPa.

The corresponding FOS was:

$$
FOS_{\mathrm{static}}=\frac{55.15}{11.55}=\boxed{4.77}
$$

The global maximum stress was 67.53 MPa, while the maximum resultant displacement was 0.2924 mm.

The member FOS exceeded the required minimum of 2.0, indicating adequate strength in the evaluated chassis members under the assumed maximum static vehicle loading.

<span id="fea-figure-7"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-3030-static-stress.png" alt="(a) General von Mises stress distribution (N/m²)." caption="(a) General von Mises stress distribution (N/m²)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-static-displacement.png" alt="(b) Resultant displacement distribution (mm)." caption="(b) Resultant displacement distribution (mm)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

<Figure src="./assets/images/fea-3030-static-probe.png" alt="(c) SOLIDWORKS Probe — Selected node 37370: 11.55 MPa (1.155 × 10⁷ N/m²)." caption="(c) SOLIDWORKS Probe — Selected node 37370: 11.55 MPa (1.155 × 10⁷ N/m²)." style="width: 100%; max-width: 760px; margin: 0 auto;" />

*Figure 4.1.2.7. 3030 Static FEA Results — (a) von Mises stress distribution, (b) resultant displacement, and (c) chassis-member stress Probe results at the identified locations.*

### 4.1.2.5.4 3030 Skid-Steering Results {#fea-4-1-2-5-4}

The skid-steering study produced a maximum evaluated chassis-member stress of 17.52 MPa across the selected chassis tube faces.

The corresponding FOS was:

$$
FOS_{\mathrm{skid}}=\frac{55.15}{17.52}=\boxed{3.15}
$$

The study produced a global maximum stress of approximately 198.0 MPa at a suspension-bracket bend. This location was outside the selected chassis tube regions used for the member FOS calculation.

The maximum resultant displacement was 0.5090 mm.

The evaluated chassis members satisfied the required FOS under the assumed skid-steering loading. The higher bracket stress was retained for further consideration of the mounting arrangement.

<span id="fea-figure-8"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-3030-skid-stress.png" alt="(a) General von Mises stress distribution (N/m²)." caption="(a) General von Mises stress distribution (N/m²)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-skid-displacement.png" alt="(b) Resultant displacement distribution (mm)." caption="(b) Resultant displacement distribution (mm)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

<Figure src="./assets/images/fea-3030-skid-probe.jpg" alt="(c) SOLIDWORKS Probe — Node 18976: 17.52 MPa (1.752 × 10⁷ N/m²)." caption="(c) SOLIDWORKS Probe — Node 18976: 17.52 MPa (1.752 × 10⁷ N/m²)." style="width: 100%; max-width: 760px; margin: 0 auto;" />

*Figure 4.1.2.8. 3030 Skid-Steering FEA Results — (a) von Mises stress distribution, (b) resultant displacement, and (c) chassis-member stress Probe results at the identified locations.*

:::: details Supplementary skid-steering mounting-bracket hotspot

<Figure src="./assets/images/fea-3030-skid-bracket-hotspot.png" alt="Supplement to Figure 4.1.2.8(a): mounting-bracket hotspot, 1.980 × 10⁸ N/m² (198.0 MPa) displayed." caption="Supplement to Figure 4.1.2.8(a): mounting-bracket hotspot, 1.980 × 10⁸ N/m² (198.0 MPa) displayed." style="width: 100%; max-width: 760px; margin: 0 auto;" />

The bracket hotspot belongs to the global assembly result and is not the chassis-member stress used in the FOS calculation.

::::

### 4.1.2.5.5 3030 Uneven-Ground Results {#fea-4-1-2-5-5}

The uneven-ground study produced a maximum evaluated chassis-member stress of 21.39 MPa.

The corresponding FOS was:

$$
FOS_{\mathrm{uneven}}=\frac{55.15}{21.39}=\boxed{2.58}
$$

The global maximum stress was 79.44 MPa, while the maximum resultant displacement was 0.7338 mm.

Among the three 3030 loading conditions, uneven-ground loading produced the highest evaluated chassis-member stress and the largest displacement.

The member FOS remained above the required minimum of 2.0.

<span id="fea-figure-9"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-3030-uneven-stress.png" alt="(a) General von Mises stress distribution (N/m²)." caption="(a) General von Mises stress distribution (N/m²)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-uneven-displacement.png" alt="(b) Resultant displacement distribution (mm)." caption="(b) Resultant displacement distribution (mm)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

<Figure src="./assets/images/fea-3030-uneven-probe.png" alt="(c) SOLIDWORKS Probe — Selected node 37360: 21.39 MPa (2.139 × 10⁷ N/m²)." caption="(c) SOLIDWORKS Probe — Selected node 37360: 21.39 MPa (2.139 × 10⁷ N/m²)." style="width: 100%; max-width: 760px; margin: 0 auto;" />

*Figure 4.1.2.9. 3030 Uneven-Ground FEA Results — (a) von Mises stress distribution, (b) resultant displacement, and (c) chassis-member stress Probe results at the identified locations.*

:::: details Factor of Safety Calculations

The allowable stress for the required FOS of 2.0 was:

$$
\sigma_{\mathrm{allow}}=\frac{55.15}{2.0}=\boxed{27.575\text{ MPa}}
$$

The evaluated member factors of safety were:

$$
FOS_{\mathrm{4040,static}}=\frac{55.15}{5.254}=10.50
$$

$$
FOS_{\mathrm{3030,static}}=\frac{55.15}{11.55}=4.77
$$

$$
FOS_{\mathrm{3030,skid}}=\frac{55.15}{17.52}=3.15
$$

$$
FOS_{\mathrm{3030,uneven}}=\frac{55.15}{21.39}=2.58
$$

These calculations assess the identified chassis-member stresses and do not represent minimum factors of safety for every component in the complete assembly.

::::

## 4.1.2.6 Engineering Discussion {#fea-4-1-2-6}

### 4.1.2.6.1 Structural Weight Reduction {#fea-4-1-2-6-1}

The results indicate that replacing the 4040 extrusion chassis with 3030 square tubes can reduce the estimated chassis structural mass by approximately 53.2%.

Although the smaller section produces higher stresses and displacements, the evaluated 3030 chassis members maintain an FOS above 2.0 under the three simulated loading conditions.

This supports retaining the 3030 section as the preferred chassis design, subject to verification of the mounting connections and final material specifications.

### 4.1.2.6.2 Influence of Simplified Boundary Conditions {#fea-4-1-2-6-2}

The simulations identified localised high-stress regions near suspension mounting holes and bracket interfaces.

The initial modelling approach attempted to include more detailed bolt connections and suspension mounting restraints. However, the increased computational complexity resulted in long solution times and unsuccessful runs. Simplified reference-geometry fixtures were subsequently adopted to enable assessment of the primary chassis structure.

SimScale [\[2\]](./references.md#ref-2) explains that idealised fixed supports can produce high stress gradients near constrained surfaces. The documentation also discusses Saint-Venant's principle, under which local stress distributions depend on the manner in which loads and restraints are applied, even when their overall resultant loading is equivalent.

Although the fixtures in this study were not all fully fixed supports, they similarly idealised the physical mounting conditions. Therefore, the local stress magnitudes near the suspension interfaces may be influenced by the simplified restraint and load-transfer representations.

The skid-steering study demonstrated sensitivity to the load-transfer arrangement. An earlier model transferred remote loads through two mounting holes on the chassis and produced a global peak of approximately 1,000 MPa. Revising the remote-load application to six cylindrical hole surfaces on the suspension bracket reduced the reported global peak to approximately 198.0 MPa.

The difference indicated that the predicted local stresses were strongly influenced by the connection modelling approach.

For chassis section selection, the primary tube-member stresses were assessed separately from the mounting-bracket stresses. The higher local connection stresses were retained as findings requiring further connection-level validation, rather than being used directly to calculate the tube-member FOS.

<span id="fea-figure-10"></span>

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start; max-width: 960px; margin: 20px auto;">
<Figure src="./assets/images/fea-3030-skid-original-stress.png" alt="(a) Original-model global peak: 1.092 × 10⁹ N/m² (1092 MPa)." caption="(a) Original-model global peak: 1.092 × 10⁹ N/m² (1092 MPa)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
<Figure src="./assets/images/fea-3030-skid-stress.png" alt="(b) Revised-model global peak: 1.980 × 10⁸ N/m² (198.0 MPa)." caption="(b) Revised-model global peak: 1.980 × 10⁸ N/m² (198.0 MPa)." style="flex: 1 1 420px; min-width: 0; max-width: 600px; margin: 0 auto;" />
</div>

*Figure 4.1.2.10. Skid-steering stress-contour comparison supplied for the original and revised models: (a) original-model peak; (b) revised-model contour shown in Figure 4.1.2.8(a). These are result plots, not remote-load definition screenshots.*

The original plot displays a global peak of 1092 MPa, consistent in scale with the approximate 1,000 MPa description. The revised plot displays 198.0 MPa. Figure 4.1.2.10 compares the stress distributions; the revised remote-force views are available in [Figure 4.1.2.4](#fea-figure-4).

### 4.1.2.6.3 Design Assessment {#fea-4-1-2-6-3}

The comparison indicates that the 3030 chassis provides a substantial reduction in estimated structural mass while maintaining adequate strength in the evaluated tube regions under the modelled conditions.

The results also identify the suspension mounting interfaces as important areas for further structural verification.

Accordingly, the 3030 square-tube chassis is retained as the preferred structural design for subsequent development, while the mounting connections are treated as a separate design and validation requirement.

## 4.1.2.7 Limitations & Semester 2 Plan {#fea-4-1-2-7}

### 4.1.2.7.1 Simulation Limitations {#fea-4-1-2-7-1}

The completed studies provide a numerical structural assessment of the chassis under the selected loading conditions.

The simulations used simplified suspension support conditions and bonded assembly connections. Horizontal wheel forces were estimated using an idealised friction model rather than measured tyre–ground interaction.

The studies employed linear static analysis and did not represent transient suspension or drivetrain dynamics.

Furthermore, the local mounting stresses remain sensitive to the connection representation, while the assigned generic 6061 Alloy properties require confirmation against the final purchased material.

No physical load tests were conducted during Semester 1; therefore, the numerical predictions have not yet been experimentally validated.

### 4.1.2.7.2 Mounting Connection and Material Verification {#fea-4-1-2-7-2}

During Semester 2, the suspension mounting brackets, bolt arrangements and load-transfer interfaces will be reviewed as part of the final chassis integration.

Local reinforcement, changes to the mounting method or adjustments to the 3030 tube wall thickness will be considered where necessary.

The final purchased aluminium alloy and temper will also be verified to establish the appropriate material properties for structural assessment.

### 4.1.2.7.3 Physical Testing and Further Analysis {#fea-4-1-2-7-3}

The completed chassis will undergo representative loading and deformation tests to compare its physical behaviour with the FEA predictions.

Additional analysis will consider dynamic effects associated with skid steering, vibration and uneven-ground traversal, where applicable.

The final CAD and simulation models will be updated to reflect the fabricated assembly, including the mounting details and component interfaces.

These studies will be used to verify the complete chassis and suspension mounting arrangement against the structural design requirements.

The current analysis supports the selection of the lighter 3030 chassis members for continued development. The next stage will focus on validating the assembled structure, particularly the suspension mounting interfaces and their load-transfer behaviour.

<!-- #endregion report -->
