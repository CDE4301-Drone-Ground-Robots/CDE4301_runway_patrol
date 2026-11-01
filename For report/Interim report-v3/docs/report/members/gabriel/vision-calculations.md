---
title: "Computer Vision Calculations & Camera Geometry"
description: "How fast the robot drives, where the camera points, and how many pixels a fastener gets: the numbers behind the camera and model choices."
owner: "Gabriel Tan"
outline: [2,3]
---
# Computer Vision Calculations & Camera Geometry

<Badge type="info" text="DRONE & VISION SUBSYSTEM • GABRIEL" />

How fast the robot drives, where the camera points, and how many pixels a fastener gets: the numbers behind the camera and model choices.

<!-- #region report -->

## Speed Constraints {#s1}

<Badge type="info" text="Kinematics &amp; Compute Budget" />

$$
v = \frac{\text{RPM} \times 2\pi r}{60} = \frac{400 \times 2\pi(0.1)}{60} = 4.19\text{ m/s} \approx 15.1\text{ km/h}
$$

$$
t_{\text{frame}} \le \frac{1}{\text{FPS}} = \frac{1}{30} \approx 33.3\text{ ms}
$$

| Quantity | Working | Value | Why it matters |
| --- | --- | --- | --- |
| **Time in view** | $1.65\text{ m} \div 4.19\text{ m/s}$ | **0.39 s** (~12 frames at 30 fps) | Room for multi-frame confirmation |
| **Runway sweep, UGV alone** | $135,000\text{ m}^2 \div (1.23\text{ m} \times 4.19\text{ m/s})$ | **≈ 7.3 h** for 3 km × 45 m | Why the drone does the wide search |

Driving at 15.1 km/h means total pipeline latency must be **below 33 ms** per frame (≥ 30 fps).

## Camera Selection {#s2}

<Badge type="info" text="Hardware Selection" />

**Why it matters:** Driving at 15.1 km/h and needing real-time small-debris detection set hard constraints. This section checks every camera against them.

| Specification / Requirement | Leopard LI-IMX568 | e-con Systems e-CAM56 | UGREEN CM831 Webcam |
| --- | --- | --- | --- |
| **Sensor Resolution & Pitch** | $2472 \times 2064\text{ px}$ (5.1 MP), $2.74\ \mu\text{m}$ | $2472 \times 2064\text{ px}$ (5.1 MP), $2.74\ \mu\text{m}$ | $1920 \times 1080\text{ px}$ (2.1 MP), n/a |
| **Shutter Mechanism (Freezes motion at 15.1 km/h)** | ✓ Global shutter | ✓ Global shutter | ✗ Rolling shutter (image skew) |
| **Lens Field of View ($H \times V$)** | 50.0° × 42.5° | 104.8° × 94.6° | 62.0° × 37.4° |
| **Bolt width at 1088 input, image centre** (need ≥16 px) | ✓ 27 px ($60\text{ px}$ native) | ✗ 10 px ($22\text{ px}$ native) | ✓ 21 px ($36\text{ px}$ native) |
| **Ground Coverage ($H=0.45\text{ m}, \theta=20^\circ$)** | ✓ Nearest: 0.51 m; only 3% of image rows (67 of 2064) above the horizon — negligible (tilt to ≥21.3° removes it) | ✗ Nearest: 0.19 m; 33% of image rows above the horizon (wasted on sky) | ✓ Nearest: 0.56 m; no rows above the horizon |
| **Frame rate ≥ 30 fps** | ✓ 60 fps | ✓ 79 fps | ✓ 60 fps |
| **Connects to Jetson** | ~ GMSL2: long, noise-resistant cable; needs a GMSL2 adapter | ✓ MIPI CSI-2 direct | ✓ USB 2.0 |
| **Role & Status** | <Badge type="tip" text="Selected for Semester 2" /> | <Badge type="danger" text="Rejected" /> | <Badge type="warning" text="Interim: used for Semester 1 data collection" /> |

Note: Pixel counts use each camera's listed field of view. The e-CAM56's 104.8° may be a diagonal figure; if so its horizontal view is narrower, but it would still give far fewer pixels per bolt than the IMX568.

<Badge type="tip" text="SELECTED CAMERA" />

#### Leopard LI-IMX568

While needing a serial adapter

<Badge type="warning" text="INTERIM HARDWARE" />

#### Interim: UGREEN CM831

Due to initial budget constraints, UGREEN CM831 was adopted as an accessible interim solution for Semester 1 training dataset acquisition. However, because its rolling shutter induces distortion and image skew at operational driving speeds, it is unsuitable for the final robot platform.

**Summary:** Selected: **Leopard Imaging LI-IMX568**, a 5.1 MP global-shutter camera with a 50° lens. It is the only option that freezes motion at 4.19 m/s, gives a 30 mm bolt enough pixels at 1088 input, and keeps almost all of its view on the ground.

## Camera Mounting and FOV Calculations {#s3}

<Badge type="tip" text="Optics &amp; Projection" /> <Badge type="info" text="INTERACTIVE SIMULATOR" />

### Optical Geometry & FOV Simulator {#fov-simulator}

Speed constant $v = 4.19\text{ m/s}$ (400 RPM)

<VisionCalculationsWidget1 />

<VisionCalculationsWidget2 />

<VisionCalculationsWidget3 />

<VisionCalculationsWidget4 />

<Card title="Key Takeaway:">

💡 At 0.45 m and 20° tilt, the image centre lands 1.24 m ahead. A 30 mm fastener gets 60 × 21 px native on the IMX568, 16 × 5 px at 640 input, and 27 × 9 px at 1088 input. Notice that 1088 keeps the item's width (27 px) closer to the 32 px rule used in our sizing sheet.

</Card>

::: details Show the working

**3.1 Focal Length in Pixels ($f_x, f_y$)**

The pinhole camera model converts physical field-of-view angles into discrete sensor pixel dimensions. For a sensor of width $W_{\text{sensor}}$ and height $H_{\text{sensor}}$, the pixel focal lengths scale inversely with the tangent of half the angular field of view. Because pixels on our sensors are square, $f_x$ and $f_y$ share the same value.

$$
f_x = \frac{W_{\text{sensor}}}{2 \cdot \tan\left(\frac{\text{HFOV}}{2}\right)}, \quad f_y = \frac{H_{\text{sensor}}}{2 \cdot \tan\left(\frac{\text{VFOV}}{2}\right)}
$$

In plain words: how many pixels represent the lens's optical focal length; higher means more zoom.

**3.2 Oblique Slant Range & Ground Incidence**

Because the camera sits $0.45\text{ m}$ off the ground and points $20^\circ$ downward, it views the tarmac at an angle. The true line-of-sight distance $R$ to any runway point $d$ ahead of the lens follows the Pythagorean theorem. The incidence angle $\psi$ tells us how steeply that line of sight strikes the flat runway.

$$
R = \sqrt{H^2 + d^2}, \qquad \psi = \arctan\left(\frac{H}{d}\right)
$$

In plain words: true line-of-sight distance to the ground and how steeply the camera looks down at it.

**3.3 Ground Sample Distance (GSD)**

Ground Sample Distance measures how many millimetres of runway one pixel covers. Looking forward at a shallow angle stretches the vertical footprint along the driving direction by $1 / \sin\psi$. Across the direction of travel, resolution stays sharper because horizontal ray geometry is not foreshortened.

$$
\text{GSD}_{\text{across}} = \frac{R \cdot 1000}{f_x}\ (\text{mm/px}), \qquad \text{GSD}_{\text{along}} = \frac{\text{GSD}_{\text{across}}}{\sin(\psi)}\ (\text{mm/px})
$$

In plain words: how many millimetres of runway one pixel covers; smaller is sharper.

For any image row at vertical angle $\alpha$ relative to the optical centre ($\alpha > 0$ downwards towards the near ground):

$$
\text{GSD}_{\text{along}}(\alpha) = \frac{H \cdot \cos^2\alpha}{f \cdot \sin^2(\theta + \alpha)} \cdot 1000\ (\text{mm/px}), \qquad \text{GSD}_{\text{across}}(\alpha) = \frac{H \cdot \cos\alpha}{f \cdot \sin(\theta + \alpha)} \cdot 1000\ (\text{mm/px})
$$

At the image centre ($\alpha = 0$) this matches the simpler formula above; away from the centre the $\cos^2\alpha$ term matters.

:::

::: info Camera Mounting
The mounting height will be 0.4 – 0.5 m at 22° – 28°. To solve this, we will 3D model an adjustable camera mount.
:::

## Resolution Selection {#s4}

<Badge type="warning" text="Input Resolution Scaling" />

| Camera | Native ($W \times L\text{ px}$) | at 640 input | at 1088 input |
| --- | --- | --- | --- |
| **IMX568** | **60 × 21** | 16 × 5 | **27 × 9** |
| **UGREEN** | 36 × 12 | 12 × 4 | 21 × 7 |
| **e-CAM56** | 22 × 7 | 6 × 2 | 10 × 3 |

While having a higher resolution exponentially increases the number of parameters and slows the latency, we aim to push resolution as far as hardware permits while being under the 33 ms limit.

**Why it matters:** Too few pixels and the model can't see the shape. That's why we run the model at 1088 (87.7% → 97.0% mAP@50 on our test videos, see [YOLO model comparison page](./yolo-comparison.md)).

<!-- #endregion report -->

[Next Page →](./yolo-comparison.md)

YOLO Model Comparison

Quantitative benchmarks, leak-free dataset split & edge latency

→
