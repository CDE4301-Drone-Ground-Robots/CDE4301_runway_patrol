---
title: "Chassis Design"
description: "Structural chassis architecture, physical CAD layout, mounting points, and mechanical assembly specifications."
owner: "Zacarias Ng"
outline: [2, 3]
---

# Chassis Design

Structural chassis architecture, physical CAD layout, mounting points, and mechanical assembly specifications.

<!-- #region report -->

## 4.1.1.1 Objective & Requirements {#sec-4-1-1}

The chassis provides structural support for the UGV's battery, electronics, drivetrain, suspension and FOD collection system. During Semester 1, the main objective was to fabricate a functional chassis early to allow other subteams to proceed with component integration. The design therefore prioritized structural adequacy, modularity and ease of fabrication.

**Table 4.1.1: Chassis design requirements**

| Parameter | Requirement |
| :--- | :--- |
| Maximum vehicle mass | 65 kg |
| Minimum factor of safety (FOS) | 2.0 |
| Drive configuration | Four-wheel skid-steer |
| Target ground clearance | 180 mm |
| Wheelbase-to-track-width ratio ($L/B$) | 0.8–1.0 |
| Initial chassis footprint | 700 × 300 mm |
| Additional considerations | Component mounting, fabrication, accessibility and weight |

Following the convention in [Steering Kinematics](../hilbert/steering-kinematics.md), $L$ denotes wheelbase and $B$ denotes track width. The assumed wheelbase of 488.8 mm and track width of 575 mm give $L/B = 488.8/575 \approx 0.85$. These dimensions are design assumptions, not measurements of the physical chassis.

A conservative initial design was adopted, with detailed structural optimization carried out after the prototype was fabricated.

## 4.1.1.2 System Architecture {#chassis-architecture}

### 4.1.1.2.1 Chassis Concept Evaluation {#chassis-concepts}

Three chassis concepts were considered before prototype fabrication (Figure 4.1.1).

**Table 4.1.2: Comparison of initial chassis concepts**

| Concept | Advantages | Limitations |
| :--- | :--- | :--- |
| Sheet-metal monocoque | Compact, lightweight potential, fewer separate members | Requires custom bending and reinforcement; difficult to modify |
| Expanded extrusion frame | Additional mounting space for sensors and equipment | Unnecessary material, increased weight and cost |
| Compact rectangular extrusion frame | Modular, simple assembly, adjustable mounting | Additional brackets and fasteners; joint stiffness requires consideration |

The **compact rectangular extrusion frame** was selected because it provided sufficient component space while allowing mounting positions to be adjusted. This was important as several electrical and mechanical components had not yet been finalized.

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
  <img src="./assets/images/chassis-concept-sheet-metal-monocoque.png" alt="Figure 4.1.1(a): Sheet-metal monocoque concept" style="width: 220px; max-width: 100%; height: auto; flex: 1 1 220px; min-width: 0;">
  <img src="./assets/images/chassis-concept-expanded-extrusion.png" alt="Figure 4.1.1(b): Expanded aluminium extrusion frame concept" style="width: 220px; max-width: 100%; height: auto; flex: 1 1 220px; min-width: 0;">
  <img src="./assets/images/chassis-concept-compact-extrusion.png" alt="Figure 4.1.1(c): Compact rectangular extrusion frame concept" style="width: 220px; max-width: 100%; height: auto; flex: 1 1 220px; min-width: 0;">
</div>

*Figure 4.1.1: Preliminary chassis concepts: (a) sheet-metal monocoque, (b) expanded aluminium extrusion frame and (c) compact rectangular extrusion frame (left to right; top to bottom when wrapped).*

### 4.1.1.2.2 Selected Prototype Architecture {#chassis-prototype-architecture}

The initial chassis used **40 × 40 mm T-slot aluminium extrusions (PTP-4040-8)**, assembled into a rectangular frame using brackets and fasteners. The main members consisted of four 620 mm longitudinal beams, six 220 mm transverse beams and four 185 mm vertical supports.

A 3 mm aluminium 6061 mounting plate was installed to accommodate the battery and electronics. Two additional 220 mm transverse beams supported the plate from below, with a measured clear spacing of 165 mm between their nearest faces. The plate was also secured to the frame through mounting brackets.

This arrangement provided multiple load paths from the plate to the surrounding structure and allowed components to be repositioned during integration (Figure 4.1.2).

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
  <img src="./assets/images/chassis-4040-isometric-cad.png" alt="Isometric CAD view of the 4040 chassis and mounting plate" style="width: 280px; max-width: 100%; height: auto; flex: 1 1 280px; min-width: 0;">
  <img src="./assets/images/chassis-4040-underside-cad.png" alt="Underside CAD view showing the mounting plate and transverse support beams" style="width: 280px; max-width: 100%; height: auto; flex: 1 1 280px; min-width: 0;">
</div>

*Figure 4.1.2: Isometric and underside CAD views showing the 4040 chassis, mounting plate and additional support beams.*

### 4.1.1.2.3 Component Placement and Centre of Mass {#chassis-centre-of-mass}

The battery was positioned toward the front of the chassis, while the vacuum module was positioned toward the rear. This arrangement was intended to distribute the major component masses more evenly along the vehicle.

A preliminary centre-of-mass check was performed in SolidWorks using the assembled chassis and major components. The battery was assigned its actual mass of 6.8 kg, while a simplified vacuum placeholder with an estimated mass of 7 kg was included.

**Table 4.1.3: SolidWorks centre-of-mass results**

| Parameter | Result |
| :--- | ---: |
| Estimated assembly mass | 29.648 kg |
| CG X-coordinate | 0.15 mm |
| CG Y-coordinate | 270.50 mm |
| CG Z-coordinate | −4.58 mm |

The coordinates are referenced to the default assembly coordinate system. The top-view model showed the CG located approximately within the central region of the vehicle, supporting the selected front-to-rear component arrangement (Figure 4.1.3).

<img src="./assets/images/chassis-assembly-centre-of-mass.png" alt="SolidWorks top-view assembly with the calculated centre-of-mass marker" style="display: block; width: 360px; max-width: 100%; height: auto; margin: 16px auto;">

*Figure 4.1.3: SolidWorks top-view assembly showing the calculated centre of mass.*

## 4.1.1.3 Design Methodology & Selection {#chassis-methodology}

### 4.1.1.3.1 Preliminary Structural Calculations {#chassis-calculations}

Before fabricating the prototype, simplified calculations were performed to assess the feasibility of the selected 4040 members supporting the electronics mounting plate. The preliminary loading assumptions included a 12 kg battery allowance and 7 kg for electrical components, giving a total load of:

$$
W = mg = (12 + 7)(9.81) = 186.39\text{ N}
$$

These values were conservative design allowances rather than the actual component masses used in the centre-of-mass calculation.

**4040 support-beam bending.** For a simplified conservative member check, one of the two additional 220 mm transverse beams was assumed to carry the entire 186.39 N load at its midpoint. The simply supported model gives a nominal bending stress of **2.19 MPa** and a provisional **FOS of 25.2**. This indicates low nominal bending stress under the idealized loading condition. The reference yield strength of 55.15 MPa is not a verified material certificate value for the supplied extrusion.

:::: details Preliminary 4040 support-beam bending calculation

The beam was modelled as simply supported over $L = 220\text{ mm}$, with a midpoint load $P = 186.39\text{ N}$, as shown in Figure 4.1.4(a). The manufacturer's section modulus for the PTP-4040-8 profile is $Z = 4690\text{ mm}^3$ ([1](#chassis-ref-1)).

$$
M_{\max} = \frac{PL}{4}
= \frac{186.39(220)}{4}
= 10{,}251.45\text{ N}\cdot\text{mm}
$$

$$
\sigma_{\max} = \frac{M_{\max}}{Z}
= \frac{10{,}251.45}{4690}
= \boxed{2.19\text{ MPa}}
$$

Using the provisional reference yield strength of 55.15 MPa adopted in the initial simulation:

$$
\mathrm{FOS} = \frac{55.15}{2.19} = \boxed{25.2}
$$

::::

**Electronics mounting-plate support arrangement.** The 3 mm aluminium 6061 mounting plate was supported by two additional 220 mm transverse 4040 beams and mounting brackets connected to the surrounding chassis. The clear spacing between the two transverse beams was measured as **165 mm**, as shown in Figure 4.1.4(b).

These additional supports were included to reduce the unsupported regions of the plate and distribute component loads into the chassis. Due to the multiple support locations and non-uniform component loading, a simplified single-span bending calculation was not considered representative of the complete plate. The final plate and mounting connections require assessment under their actual loading and support conditions.

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: start;">
  <figure style="flex: 1 1 400px; min-width: 0; margin: 0;">
    <img src="./assets/images/chassis-4040-support-beam-fbd.svg" alt="Figure 4.1.4(a): Simplified free-body diagram of the 220 mm transverse 4040 support beam" style="display: block; width: 100%; height: auto; background: white; color-scheme: light;">
    <figcaption>(a) 220 mm transverse 4040 support-beam free-body diagram.</figcaption>
  </figure>
  <figure style="flex: 1 1 400px; min-width: 0; margin: 0;">
    <img src="./assets/images/chassis-mounting-plate-support-arrangement.svg" alt="Figure 4.1.4(b): Electronics mounting plate supported by two transverse beams with 165 mm clear spacing" style="display: block; width: 100%; height: auto; background: white; color-scheme: light;">
    <figcaption>(b) Mounting-plate support arrangement with 165 mm clear spacing.</figcaption>
  </figure>
</div>

*Figure 4.1.4: (a) Simplified free-body diagram of the 220 mm transverse 4040 support beam; (b) electronics mounting-plate support arrangement showing the two transverse beams and their 165 mm clear spacing.*

### 4.1.1.3.2 Decision to Fabricate the 4040 Prototype {#chassis-fabrication-decision}

The 4040 extrusion frame was selected and fabricated as a conservative initial prototype because it offered adequate preliminary strength, material availability, ease of fabrication and adjustable mounting interfaces. Completing fabrication early allowed the electrical and mechanical teams to install their components while detailed structural evaluation continued.

After fabrication, the structural capacity of the 4040 configuration and opportunities for weight reduction were investigated using SolidWorks FEA.

### 4.1.1.3.3 Material Selection & Justification {#chassis-material-selection}

**Material Comparison & Property Evaluation**

Material selection for the UGV chassis considered structural strength, stiffness, weight, component mounting, material availability and fabrication requirements.

Three main material categories were evaluated: aluminium alloys, structural steel and carbon-fibre-reinforced polymer (CFRP).

**Table 4.1.4: Qualitative comparison of candidate chassis materials.**

| Material | Advantages | Disadvantages |
|---|---|---|
| Aluminium alloys | Low density, good corrosion resistance, readily available profiles, easy machining and mechanical assembly | Lower elastic stiffness than steel for equivalent geometry |
| Structural steel | High elastic stiffness, relatively low material cost, widespread availability | Higher density increases chassis weight; corrosion protection may be required |
| Carbon-fibre composite (CFRP) | High potential specific strength and stiffness; suitable for lightweight load-bearing composite structures | Higher material and fabrication costs, specialised manufacturing processes and more complex mounting interfaces |

Carbon-fibre composites were considered because of their potential for high strength-to-weight and stiffness-to-weight performance. They are used as load-bearing chassis structures in specialised automotive applications, including Formula Student monocoque chassis [\[7\]](./references.md#ref-7).

However, CFRP would require a substantially different manufacturing approach, including laminate design, composite fabrication and reinforced mounting interfaces. These requirements would increase fabrication complexity, cost and dependence on specialised facilities.

Given the project's emphasis on rapid prototyping, modular assembly and reuse of existing components, aluminium was selected as the more practical material for the UGV chassis.

For a more detailed quantitative comparison, two representative aluminium alloys and structural steel S235 were evaluated.

**Table 4.1.5: Representative mechanical properties of candidate metallic materials [\[3\]](./references.md#ref-3)–[\[5\]](./references.md#ref-5).**

| Property | Al 6063-T5 [\[3\]](./references.md#ref-3) | Al 6061-T6 [\[4\]](./references.md#ref-4) | Steel S235 [\[5\]](./references.md#ref-5) |
|---|---:|---:|---:|
| Density (kg/m³) | 2,700 | 2,700 | 7,850 |
| Young's modulus (GPa) | 68.9 | 68.9 | 210 |
| Yield strength (MPa) | 145 | 276 | 235 |
| Specific yield strength (kN·m/kg) | 53.7 | 102.2 | 29.9 |

These are representative material properties rather than certified properties of the final manufactured products. The S235 reference yield strength applies to material thicknesses up to 16 mm.

CFRP is deliberately excluded from this numerical table because its mechanical properties depend strongly on fibre orientation, resin system, laminate stacking and manufacturing method. It does not have a single isotropic yield-strength value directly comparable with the metallic materials.

Both aluminium alloys offer substantially lower density than structural steel. Although steel provides greater elastic stiffness for the same geometry, its higher density increases the mass supported by the vehicle's drivetrain and suspension.

Aluminium 6061-T6 offers greater yield strength than 6063-T5, while both have similar elastic moduli and densities. For the initial prototype, material selection also prioritised the availability and suitability of commercially manufactured profiles, rather than maximum yield strength alone.

**Extrusion Profiles, Plates & Fasteners**

The initial chassis was fabricated using Prestech PTP-4040-8 aluminium extrusions, which the manufacturer specifies as 6063-T5 aluminium [\[1\]](./references.md#ref-1). The profile has a nominal mass of 1.86 kg/m and a section modulus of 4.69 cm³.

The 4040 T-slot profile was selected for its standardised mounting interfaces, suitable preliminary structural capacity and ease of assembly. Compatible brackets, M6 fasteners and T-slot nuts allowed the chassis to be fabricated without welding and enabled adjustments during subsystem integration.

The prototype electronics mounting plate was manufactured from 3 mm aluminium 6061 and supported by transverse extrusion members and mechanical brackets. Changes to the electrical subsystem, including an increase in the number of components, motivated a revised mounting-plate layout for the subsequent chassis development stage.

Following the structural assessment, a lighter 30 × 30 × 2 mm aluminium square-tube configuration was selected for further development.

The nominal cross-sectional area of this tube is:

$$
A = 30^2 - 26^2 = 224\text{ mm}^2
$$

Using an aluminium density of 2,700 kg/m³:

$$
m = 2700 \times 224 \times 10^{-6} = 0.605\text{ kg/m}
$$

This represents approximately 67.5% less nominal mass per metre than the original PTP-4040-8 profile. The calculation assumes ideal square corners; actual manufactured tube mass may differ slightly.

The previously determined 53.2% overall structural mass reduction is based on the respective chassis CAD assemblies and includes differences in the complete structural arrangements.

Mechanical brackets and bolts were chosen as the preferred joining approach for the 3030 development because they allow reuse of suitable existing project hardware, avoid dependence on outsourced welding services and simplify assembly logistics.

The closed square-tube geometry requires its own mounting-hole and connection arrangement. Existing T-slot nuts are not assumed to be directly compatible with the hollow square-tube sections.

Detailed mounting and connection design forms part of the Semester 2 development.

**Environmental, Weather & Corrosion Resistance**

Aluminium was also selected for its resistance to general atmospheric corrosion. The naturally occurring oxide layer provides a degree of environmental protection without the immediate need for additional surface treatment.

The prototype uses untreated aluminium. Outdoor runway conditions may expose the chassis to moisture and contaminants. Galvanic corrosion is also possible at connections involving dissimilar metals when an electrolyte is present [\[6\]](./references.md#ref-6).

The mechanically fastened structure facilitates inspection, maintenance and replacement of individual components. Further environmental protection and connection-level precautions will be incorporated into the Semester 2 chassis development.

**Material Selection Summary**

The PTP-4040-8 aluminium extrusion was selected for the Semester 1 prototype because its structural properties, commercial availability and modular fastening system provided a suitable foundation for early subsystem integration.

Although steel and CFRP offer potential structural advantages, their respective mass and manufacturing considerations made them less suitable for the project's prototype development requirements.

The subsequent mass and structural evaluations supported the selection of a lighter 3030 aluminium square-tube configuration for continued development.

The structural FEA used a generic SOLIDWORKS 6061 Alloy model with an assigned yield strength of 55.15 MPa. The reported safety factors remain based on that simulation input and must not be recalculated using the higher reference yield strengths of other aluminium grades or tempers.

## 4.1.1.4 Implementation & Prototype {#chassis-implementation}

The 4040 aluminium extrusion chassis was fabricated using the selected 4040 profiles. The frame was assembled using mechanical brackets, T-slot nuts and fasteners. The electronics mounting plate was installed using brackets with central mounting holes and the two additional transverse support beams.

The assembled prototype has since been fitted with the wheel and suspension assemblies and major electrical components, allowing subsystem integration to proceed. The modular construction proved useful during this stage, as mounting arrangements could be adjusted without modifying the main frame.

<!-- TODO: Add the physical prototype photograph to ./assets/images/ when available, then assign a figure number and caption. Do not substitute a CAD image. -->

## 4.1.1.5 Testing & Results {#chassis-results}

### 4.1.1.5.1 Evaluation of the 4040 Prototype {#chassis-4040-evaluation}

Following fabrication, a static FEA study was conducted to assess whether the 4040 extrusion chassis was suitable as the final design. The analysis indicated a substantial structural reserve in the assessed chassis members, suggesting that the initial configuration could be optimized to reduce weight. This motivated the investigation of a lighter alternative using **30 × 30 mm hollow aluminium square tubes with a nominal wall thickness of 2 mm**.

### 4.1.1.5.2 Selection of the 3030 Square-Tube Chassis {#chassis-3030-selection}

The 3030 configuration was evaluated under static, skid-steering and uneven-ground loading. The preliminary member-level results indicated acceptable factors of safety under the investigated conditions, although localized stress concentrations require further verification.

The estimated structural mass decreased from **11.00 kg** for the 4040 chassis to **5.15 kg** for the 3030 chassis:

$$
\text{Mass reduction} = \frac{11.0043 - 5.15}{11.0043}\times 100\%
= \boxed{53.2\%}
$$

Based on the estimated mass reduction and preliminary structural evaluation, the **30 × 30 × 2 mm square-tube configuration** was selected as the design direction for further development (Figure 4.1.5). Detailed FEA methodology, loading assumptions, stress distributions and numerical results belong in the separate [FEA Simulation report (Section 4.1.2)](./fea-simulation.md).

<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
  <img src="./assets/images/chassis-comparison-4040-extrusion.png" alt="4040 extrusion chassis CAD model" style="width: 280px; max-width: 100%; height: auto; flex: 1 1 280px; min-width: 0;">
  <img src="./assets/images/chassis-comparison-3030-square-tube.png" alt="Selected 3030 square-tube chassis CAD model" style="width: 280px; max-width: 100%; height: auto; flex: 1 1 280px; min-width: 0;">
</div>

*Figure 4.1.5: Side-by-side CAD comparison of the 4040 extrusion chassis (left) and selected 3030 square-tube chassis (right; below when wrapped).*

## 4.1.1.6 Engineering Discussion {#chassis-discussion}

The initial 4040 extrusion chassis prioritized rapid fabrication and mounting flexibility, allowing subsystem integration to proceed before the final component arrangement was established.

Subsequent structural evaluation showed that the initial configuration had considerable potential for weight reduction. The selected 3030 square-tube design reduces the estimated structural mass by 53.2%, with bolted connections chosen to support reuse of existing hardware and practical assembly.

The main trade-off is reduced mounting flexibility in exchange for lower structural mass. The selected 3030 design therefore provides a suitable baseline for the final chassis, subject to verification of critical structural connections and local stresses.

## 4.1.1.7 Limitations & Semester 2 Plan {#chassis-limitations}

The main remaining tasks are detailed 3030 square-tube mounting and bolted-connection design, supplier confirmation of the final tube alloy and temper, structural verification of the connections, and fabrication and physical testing of the revised chassis. The electronics mounting plate will also be redesigned to accommodate the increased component count.

The initial FEA used an aluminium 6061 material model with an assigned yield strength of 55.15 MPa. The final square-tube alloy and temper must be confirmed so that the simulations use the actual material properties. The material-selection rationale is documented in [Section 4.1.1.3.3](#chassis-material-selection); the existing reported safety factors remain based on the assigned simulation properties.

Localized stress concentrations will be investigated through targeted mesh refinement, convergence checks and improved modelling of mounting holes, contacts and fasteners. Local reinforcement or changes to the 2 mm wall thickness will be considered if the verified stresses exceed the allowable limits. The completed chassis will also be reassessed against the full **65 kg design-load requirement** before fabrication.

Following verification, the final chassis CAD will be updated with the required mounting holes, protective-shell interfaces and component arrangements. The optimized structure will then be fabricated and tested under representative static and operational loads. Physical testing will include deformation measurements and inspection of structural connections, with results compared against the numerical predictions.

Additional Semester 2 mechanical work includes environmental protection and connection-level corrosion precautions, waterproofing and protective-shell development, as well as coordination of chassis interfaces for the proposed charging dock and hot-swappable battery system.

**Reference**

<span id="chassis-ref-1"></span>

[1] Prestech Industrial Automation, *PTP-4040-8 Aluminium Profile Specifications*. Available: [Prestech PTP-4040-8](https://www.prestech.com.sg/house-products/aluminium-profiles/40series/product/product/33-PTP-4040-8).

<!-- #endregion report -->
