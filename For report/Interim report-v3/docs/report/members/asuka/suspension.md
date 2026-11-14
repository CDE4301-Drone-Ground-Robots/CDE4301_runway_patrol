---
title: "Suspension Design and Calculations"
owner: "Takeuchi Asuka"
outline: [2,3]
---
# Suspension Design and Calculations



## Suspension Subsystem Architecture {#sec-4-1-6}

<!-- #region summary -->
<Badge type="danger" text="Asuka" /> <Badge type="danger" text="Terrain Compliance &amp; Dynamics" />

In this chapter, I discuss the design of the suspension subsystem, which keeps the FOD Hunter’s wheels in contact with the ground and limits the vibration reaching the camera and onboard electronics. I first model a single corner of the robot as a spring–damper system, assuming the load is evenly distributed across all four wheels. From this model, I derive the transfer function and analyse the step response to select a spring rate of 100 lbf/in, the only option that meets both the static sag and natural frequency criteria. I then compare three suspension types and select the double wishbone, keeping the trailing arm as a back-up in case the chassis width becomes a constraint. Finally, a video of the assembled prototype shows all four wheels staying in contact with the ground over undulating terrain (simulated by obstacles).

<!-- #endregion summary -->

### 4.2.1 Introduction and System Requirements

<!-- #region s1 -->
Before committing to a suspension design, I carried out a qualitative comparison between active and passive suspension. An active suspension introduces an independent force or torque between the unsprung mass (the wheels) and the sprung mass (the chassis), adjusting the suspension behavior to suit road conditions and the driver’s steering inputs [\[1\]](./references.md#ref-1). Such systems are found mainly in luxury and passenger vehicles, where ride comfort justifies their cost. The FOD Hunter, however, is an autonomous vehicle with no passengers, so ride comfort carries little weight. An active system would also require dynamic modelling, a dedicated controller, and additional sensors and actuators, adding complexity without a matching benefit. I therefore selected a passive suspension.

The passive suspension acts as a mechanical low-pass filter against vibration from the runway surface. Runways built to FAA standards are cut with transverse grooves at fixed intervals to reduce the risk of aquaplaning during aircraft landing [\[2\]](./references.md#ref-2). At operating speed, these grooves excite the FOD Hunter at high frequency, and the suspension must attenuate this vibration before it reaches the hardware housed in the chassis.

The spacing of the grooves at its lowest tolerance is 1 3/8 inch, which is 34.9 mm. Travelling at an operating speed of 10–15 km/h therefore gives an excitation frequency of 79.6 to 119.3 Hz. Using the condition $\omega/\omega_n > \sqrt{2}$, transmissibility at these frequencies is near zero. Choosing an appropriate value for the natural frequency is therefore important.

Wheel hop must also be considered. For passenger vehicles, the wheel hop resonant frequency is around 15 Hz [\[3\]](./references.md#ref-3). Equivalent data for small mobile robots is scarce, as most use simple passive mass-spring-damper suspensions or none at all [\[4\]](./references.md#ref-4). In the absence of robot-specific data, I adopted the passenger vehicle value as a reference. A suspension only attenuates vibration when the ratio of excitation frequency to natural frequency exceeds $\sqrt{2}$. With a 15 Hz excitation, the natural frequency must be below approximately 10.6 Hz, so I set a design limit of 10 Hz.

Lastly, I set the static sag at 40–60% of stroke length. Motorcycles and similar systems typically run a static sag of 25–35% of total stroke [\[5\]](./references.md#ref-5), as they must reserve travel for heavy external loads. The FOD Hunter does not face loads of this kind, as user interviews indicated that it would carry no more than a handful of FOD at a time (See appendix).

<!-- #endregion s1 -->

### 4.2.2 First Principles Modelling

<!-- #region s2 -->
Each corner is modelled as a corner mass supported by a spring and a dampener in parallel, sitting on a wheel assumed to be 100% rigid as the wheels of the motor are a solid piece of dense rubber. To describe the physical relationship between the input (road profile) and the output (position of the chassis), we find the transfer function.

<div class="fig-row">

<Figure src="./assets/diagrams/suspension-corner-mass-on-spring-and-dampener-above.svg" alt="Corner mass on spring and dampener above a rigid wheel" caption="Figure 4.2.1: Single-corner model of the suspension." />

<Figure src="./assets/diagrams/suspension-free-body-diagram-with-road-profile-inpu.svg" alt="Free body diagram with road profile input x(t) and chassis displacement output y(t)" caption="Figure 4.2.2: Free body diagram of the corner mass with road profile input x(t) and chassis displacement output y(t)." />

</div>

<div class="eq-grid">

<div class="eq-cell">

Initial conditions: velocity = 0 and system acceleration = 0. Considering the vertical direction only:

$$
\sum F_y = m a_y
$$

$$
F_{weight}+F_{spring}+F_{dampener}=F_{acceleration}
$$

This reduces to the following, also known as the static sag:

$$
F_{weight}=-F_{spring}
$$

</div>

<div class="eq-cell">

Input road profile = $x(t)$, output chassis displacement = $y(t)$. Using $F = ma$, at equilibrium $\sum F = 0$ after static sag:

$$
-m\ddot{y}-k\big(y(t)-x(t)\big)-b\big(\dot{y}(t)-\dot{x}(t)\big)=0
$$

$$
m\ddot{y}(t)=-k\big(y(t)-x(t)\big)-b\big(\dot{y}(t)-\dot{x}(t)\big)
$$

Taking the Laplace transform of all terms:

$$
ms^2Y(s)=-k\big(Y(s)-X(s)\big)-b\big(sY(s)-sX(s)\big)
$$

Expanding all terms:

$$
ms^2Y(s)=-kY(s)+kX(s)-bsY(s)+bsX(s)
$$

Regrouping into $X(s)$ and $Y(s)$:

$$
ms^2Y(s)+kY(s)+bsY(s)=kX(s)+bsX(s)
$$

$$
Y(s)\big(ms^2+k+bs\big)=X(s)\big(k+bs\big)
$$

Obtaining the transfer function:

$$
\frac{Y(s)}{X(s)}=\frac{bs+k}{ms^2+bs+k}
$$

This is a second order system.

</div>

</div>

<div class="eq-grid">

<div class="eq-cell">

For a unit step response, $X(s)=\frac{1}{s}$:

$$
Y(s)=\frac{bs+k}{s\big(ms^2+bs+k\big)}=\frac{\frac{b}{m}s+\frac{k}{m}}{s\left(s^2+\frac{b}{m}s+\frac{k}{m}\right)}
$$

Let $\omega_n^2=\frac{k}{m}$ and $2a=\frac{b}{m}$, for completing the square in later steps:

$$
Y(s)=\frac{2as+\omega_n^2}{s\big(s^2+2as+\omega_n^2\big)}
$$

Using partial fractions to simplify:

$$
\frac{2as+\omega_n^2}{s\big(s^2+2as+\omega_n^2\big)}=\frac{A}{s}+\frac{Bs+C}{s^2+2as+\omega_n^2}
$$

$$
2as+\omega_n^2=A\big(s^2+2as+\omega_n^2\big)+s\big(Bs+C\big)
$$

$$
2as+\omega_n^2=As^2+2Aas+A\omega_n^2+Bs^2+Cs
$$

Comparing coefficients, $A+B=0$, $A=1$, $C=0$:

$$
\frac{2as+\omega_n^2}{s\big(s^2+2as+\omega_n^2\big)}=\frac{1}{s}-\frac{s}{s^2+2as+\omega_n^2}
$$

</div>

<div class="eq-cell">

Completing the square:

$$
\frac{1}{s}-\frac{s}{s^2+2as+\omega_n^2}=\frac{1}{s}-\frac{s}{(s+a)^2+\omega_n^2-a^2}
$$

Let $\omega_n^2-a^2=p^2$:

$$
Y(s)=\frac{1}{s}-\frac{s}{(s+a)^2+p^2}
$$

$$
Y(s)=\frac{1}{s}-\frac{s+a}{(s+a)^2+p^2}+\frac{a}{(s+a)^2+p^2}
$$

$$
Y(s)=\frac{1}{s}-\frac{s+a}{(s+a)^2+p^2}+\frac{\frac{a}{p}\,p}{(s+a)^2+p^2}
$$

Taking the inverse Laplace transform of both sides:

$$
y(t)=1-e^{-at}\cos pt+\frac{a}{p}e^{-at}\sin pt
$$

Given a unit step input, the response $y(t)$ is characterised by this equation, where:

$$
\omega_n^2=\frac{k}{m},\qquad a=\frac{b}{2m},\qquad p=\sqrt{\omega_n^2-a^2}
$$

From the second-order equation, $2\xi\omega_n=2a$, so the damping ratio is:

$$
\xi=\frac{a}{\omega_n}=\frac{b}{2\sqrt{km}}
$$

</div>

</div>

After obtaining the transfer function in the s-domain and converting it to the time domain, I can perform time-domain analysis using the unit step response:

$$
y(t)=1-e^{-at}\cos pt+\frac{a}{p}e^{-at}\sin pt,\qquad a=\frac{b}{2m},\quad p=\sqrt{\omega_n^2-a^2}
$$

The value of $b$ has to be an assumed value, as manufacturers do not usually tell consumers the damping constant. I searched online and asked Gemini AI to estimate the closest value, and eventually settled on $b = 400\ \text{Ns/m}$. I acknowledge that it may not be best practice to use a rough number for something as important as the suspension system. However, this value can be verified in testing when I perform a frequency response analysis.

System mass = 65 kg, corner mass = 16.25 kg, $F_{corner}$ = 159.4125 N. Angle of installation = 25°, motion ratio = 0.821 ($K_w = K_s \times 0.821$; see [Appendix I](/report#appendix-i) for the proof), stroke length = 20 mm (a commercially available length).

<div class="compact-table">

*Table 4.2.1: Spring rate evaluation against the natural frequency and static sag criteria.*

| Spring rate (lbf/in) | K<sub>s</sub> (N/m) | K<sub>w</sub> (N/m) | K<sub>w</sub> (N/mm) | Sag (mm) | ω<sub>n</sub> (rad/s) | f<sub>n</sub> (Hz) | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 30 | 5253.803 | 4313.372 | 4.313 | 36.958 | 16.292 | 2.593 | ❌ Static sag |
| 50 | 8756.338 | 7188.954 | 7.189 | 22.175 | 21.033 | 3.348 | ❌ Static sag |
| **100** | 17512.677 | 14377.908 | 14.378 | **11.087** | 29.745 | **4.734** | ✅ Both met |
| 150 | 26269.015 | 21566.862 | 21.567 | 7.392 | 36.431 | 5.798 | ❌ Static sag |
| 200 | 35025.354 | 28755.816 | 28.756 | 5.544 | 42.066 | 6.695 | ❌ Static sag |
| 300 | 52538.031 | 43133.723 | 43.134 | 3.696 | 51.521 | 8.200 | ❌ Static sag |
| 400 | 70050.708 | 57511.631 | 57.512 | 2.772 | 59.491 | 9.468 | ❌ Static sag |
| 500 | 87563.385 | 71889.539 | 71.890 | 2.217 | 66.513 | 10.586 | ❌ Natural freq. |
| 550 | 96319.723 | 79078.493 | 79.078 | 2.016 | 69.759 | 11.103 | ❌ Natural freq. |
| 600 | 105076.062 | 86267.447 | 86.267 | 1.848 | 72.861 | 11.596 | ❌ Natural freq. |
| 650 | 113832.400 | 93456.401 | 93.456 | 1.706 | 75.836 | 12.070 | ❌ Natural freq. |
| 700 | 122588.739 | 100645.355 | 100.645 | 1.584 | 78.699 | 12.525 | ❌ Natural freq. |
| 750 | 131345.077 | 107834.309 | 107.834 | 1.478 | 81.461 | 12.965 | ❌ Natural freq. |

</div>

Table 4.2.1 evaluates commercially available spring rates from 30 lbf/in to 750 lbf/in against two criteria: a natural frequency below 10 Hz and a static sag of 40–60% of stroke. The options from 30 lbf/in to 400 lbf/in meet the natural frequency criterion, whereas the only spring that meets the 40–60% static sag criterion is 100 lbf/in. The 150 lbf/in and 200 lbf/in springs have static sag percentages of 37.0% and 27.7% respectively. These stiffer springs reduce static sag and leave more compression travel. Should testing show that the suspension bottoms out or lacks headroom, I will swap to one of these stiffer springs. Below, I have prepared an interactive slider (Figure 4.2.3) that compares two springs of choice. It shows the time-domain response to a unit step input for comparison. I went ahead with the purchase of the 100 lbf/in spring.

<SuspensionWidget1 />

*Figure 4.2.3: Unit step response of the 100 lbf/in and 400 lbf/in springs for adjustable m, k and b.*

<!-- #endregion s2 -->

### 4.2.3 Suspension Design Evaluation

<!-- #region s3 -->
*Table 4.2.2: Comparison of candidate suspension types.*

<table class="data-table fit-table"><tbody>
<tr><th></th><th>Suspension type</th><th>Advantages</th><th>Disadvantages</th><th>Remarks</th><th>Final decision</th></tr>
<tr><td><Figure src="./assets/images/suspension-trailing-arm-v2.jpg" alt="Trailing arm suspension CAD" /></td><td><strong>Trailing arm</strong></td><td>Constant track width and zero camber change.<br>Most compact layout, keeping the track to a minimum.<br>Low vertical profile.</td><td>Resists the lateral load of skid steering through a single pivot, concentrating transverse bending on the main pivot shaft.</td><td>Used as rear suspension on vehicles; suits the FOD Hunter if width is constrained.</td><td>Back-up plan if width is an issue</td></tr>
<tr><td><Figure src="./assets/images/suspension-macpherson-strut.jpg" alt="MacPherson strut suspension CAD" /></td><td><strong>MacPherson strut</strong></td><td>Lower part count.<br>Leaves space at the upper arm assembly.</td><td>Its key advantage, integrating the steering pivot into the strut, only benefits Ackermann axles.<br>Adds strut height and tends to bind under side load.</td><td>Usually used on Ackermann-steered vehicles, which the FOD Hunter is not.</td><td>Reject</td></tr>
<tr><td><Figure src="./assets/images/suspension-double-wishbone.jpg" alt="Double wishbone suspension CAD" /></td><td><strong>Double wishbone</strong></td><td>Shares the lateral load of skid-steer turns between the upper and lower arms.<br>Maintains a stable tyre contact patch across the full stroke.</td><td>Extends the track, so the wheelbase-to-track-width ratio must stay within 0.8–1.<br>Mechanically complex.</td><td>Typically used in performance vehicles; the chassis can be re-made to fit it.</td><td><strong>Selected</strong></td></tr>
</tbody></table>

I selected the double wishbone for its two-arm layout. Skid steering drags the wheels sideways during turns, placing a large lateral load on the suspension. The double wishbone shares this load between the upper and lower arms, whereas the trailing arm resists it through a single pivot. I rejected the MacPherson strut because its key advantage, integrating the steering pivot into the strut, only benefits Ackermann-steered axles. The FOD Hunter uses skid steering, so it would gain nothing from this whilst still incurring the strut’s height and its tendency to bind under side load.

The drawback of the double wishbone is width: it extends the track, and the wheelbase-to-track-width ratio must stay within 0.8–1, as established in the Steering Kinematics chapter. The current chassis (wheelbase 488.8 mm, track width 575 mm) has a ratio of 0.85, so the track can only grow by about 36 mm before the ratio falls below 0.8. Should the chassis be unable to accommodate the extra width, I will fall back to the trailing arm, the most compact of the three layouts. Alternatively, the future chassis will be re-made to accommodate the double wishbone geometry.

<!-- #endregion s3 -->

### 4.2.4 Prototype and Realisation

<!-- #region s4 -->
For the prototype, the 100 lbf/in spring was purchased and integrated with the design of the suspension system. Sheet metal was chosen as the prototype material as it is cheap to manufacture and it is able to demonstrate the benefit of the dual-arm set-up during skid steering. It is imperative to keep all four wheels on the ground at all times to prevent any current spike in the motors, so that the electrical system is protected. Fewer wheels in contact means that the torque on each wheel for the same function will be greatly increased. This is hazardous and might cause the current to surge.

<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:24px">

<div style="flex:0 0 230px;max-width:230px">

<Figure src="./assets/images/suspension-prototype-photo.png" alt="Hand holding the sheet metal suspension prototype, showing the spring and damper, the dual arms and the mounting bracket" caption="Figure 4.2.4: Sheet metal prototype of the suspension." />

</div>

<div style="flex:1 1 320px;min-width:0">

<ModelViewer src="./assets/models/suspension-v2.glb" :height="380" alt="Interactive CAD model of the double wishbone suspension assembly" caption="Figure 4.2.5: CAD model of the double wishbone suspension assembly (interactive)." />

</div>

</div>

<!-- #endregion s4 -->

### 4.2.5 Testing and Analysis

<!-- #region s5 -->
<!-- TODO: add the real-life test (video analysis of all four wheels staying in contact over obstacles) and the bounce test results. -->
Attached here is a video demonstration of the suspension system working over extremely undulating terrain.

<VideoClip src="./assets/videos/suspension-terrain-test.mp4" poster="./assets/images/suspension-terrain-test-poster.jpg" caption="Video 4.2.1: Suspension prototype over undulating terrain." />

As clearly shown in this video, even over exaggerated undulating terrain, FOD Hunter maintains contact with the ground with all four wheels, allowing it to overcome challenging terrain.

In an engineering control theory class (that I am reading this semester), I learned that a second order system is critically damped when the damping ratio $\xi$ becomes 1. For my transfer function, the numerator contains a zero due to the term $bs$, so critical damping for this transfer function still has a percentage overshoot of 13.5%. It requires the wheel rate, $K_w$, to be 14378 N/m and the dampener value $b$ to be 967 Ns/m.

<SuspensionWidget2 />

*Figure 4.2.6: Unit step response with adjustable natural frequency and damping ratio, set to critical damping by default.*

However, achieving this in real life may be extremely costly. The difference between cheap and expensive shock absorbers is the adjustability, the range of adjustability and the precision of the damping value. The orifices inside a shock absorber allow the damping constant to change, giving some degree of adjustability in the damping value. However, such components are extremely costly and can cost up to \$980 per shock absorber, while I could find non-adjustable ones at a significantly cheaper price of \$2.50 each. Therefore, I decided to purchase the lower-end shock absorber and focus the budget on the key function of the FOD Hunter, which is FOD remediation.

<!-- #endregion s5 -->

### 4.2.6 Future Work

<!-- #region s6 -->
For future work, I plan to do a frequency response analysis to verify the transfer function that I derived in section 4.2.2. I also plan to remake the double wishbone geometry for manufacture by CNC machining, using relevant bearings and rubber dampers to minimise vibration transfer to the chassis. The details of this timeline will be elaborated in the Gantt chart at the end of the report.

<!-- #endregion s6 -->
