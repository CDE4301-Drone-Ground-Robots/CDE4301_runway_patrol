---
title: "Computer Vision Calculations & Camera Geometry"
description: "Kinematic speed constraints, global-shutter camera trade study, optical projection geometry, and input resolution scaling for small metallic fasteners."
owner: "Gabriel Tan"
outline: [2, 3]
---

# Computer Vision Calculations & Camera Geometry

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page documents the first-principles kinematic latency budget, optical camera selection trade study, and Ground Sample Distance (GSD) projection geometry. Semester 1 dataset acquisition used the UGREEN CM831 webcam as an accessible interim sensor; the Leopard Imaging LI-IMX568 global-shutter camera is selected for Semester 2 vehicle integration.

<!-- #region report -->

## 1. Speed Constraints & Compute Budget {#s1}

At the UGV's maximum design speed of **15.1 km/h** ($4.19\text{ m/s}$ at $400\text{ RPM}$), a forward-looking camera with a $1.65\text{ m}$ longitudinal ground field of view keeps a stationary piece of debris in frame for **0.39 s** (approximately 12 frames at 30 FPS). To guarantee multi-frame confirmation before braking or vacuum actuation, end-to-end perception latency must remain **below 33.3 ms per frame** ($\ge 30\text{ FPS}$).

Crucially, sweeping a full $3,000\text{ m} \times 45\text{ m}$ runway ($135,000\text{ m}^2$) with the UGV's $1.23\text{ m}$ lateral camera swath alone would require **$\approx 7.3\text{ hours}$** of continuous driving. This kinematic bottleneck directly motivates the **cooperative UAV–UGV architecture**, where an aerial drone performs rapid wide-area runway scanning and dispatches georeferenced target coordinates to the UGV for localized verification and high-suction remediation.

::: details Kinematic equations and compute budget breakdown

$$
v = \frac{\text{RPM} \times 2\pi r}{60} = \frac{400 \times 2\pi(0.1)}{60} = 4.19\text{ m/s} \approx 15.1\text{ km/h}
$$

$$
t_{\text{frame}} \le \frac{1}{\text{FPS}} = \frac{1}{30} \approx 33.3\text{ ms}
$$

**Table 1.1: Operational Speed & Coverage Constraints**

| Quantity | Working | Value | Engineering Implication |
| :--- | :--- | :--- | :--- |
| **Linear Cruise Velocity ($v$)** | $400\text{ RPM} \times 2\pi(0.10\text{ m}) \div 60$ | **$4.19\text{ m/s}$ ($15.1\text{ km/h}$)** | Sets motion-blur exposure ceiling ($\le 81\ \mu\text{s}$) and frame deadline. |
| **Per-Frame Compute Budget ($t_{\text{frame}}$)** | $1 \div 30\text{ FPS}$ | **$\le 33.3\text{ ms}$** | Maximum allowable latency for capture + inference + NMS. |
| **Target Time in View** | $1.65\text{ m} \div 4.19\text{ m/s}$ | **$0.39\text{ s}$ (~12 frames @ 30 FPS)** | Provides temporal window for multi-frame tracking confirmation. |
| **Solo UGV Runway Sweep Time** | $135,000\text{ m}^2 \div (1.23\text{ m} \times 4.19\text{ m/s})$ | **$\approx 7.3\text{ h}$** ($3\text{ km} \times 45\text{ m}$) | Explains why the UAV handles wide search while the UGV performs targeted pickup. |

:::

## 2. Camera Hardware Selection & Trade Study {#s2}

Operating at $15.1\text{ km/h}$ while resolving $30\text{ mm}$ metallic fasteners imposes two strict optical constraints: the sensor must use a **global shutter** to eliminate rolling-shutter motion skew during high-speed travel and chassis vibration, and the lens field of view must concentrate enough angular resolution onto the runway surface so that a $30\text{ mm}$ bolt spans **at least 16 pixels** after neural network input downscaling.

We evaluated three candidate cameras against these constraints. The **Leopard Imaging LI-IMX568** ($2472 \times 2064\text{ px}$, 5.1 MP Sony Pregius S global-shutter sensor with a $50.0^\circ \times 42.5^\circ$ lens) was selected for the final platform: it freezes motion at $4.19\text{ m/s}$, projects a $30\text{ mm}$ bolt across **27 px** at $1088 \times 1088$ network input ($60\text{ px}$ native), and keeps **97% of its vertical sensor rows below the horizon**. Due to Semester 1 budget and lead-time constraints, the **UGREEN CM831** 1080p USB webcam ($62.0^\circ \times 37.4^\circ$ FOV) was used as an interim sensor for static tarmac dataset collection.

::: details Candidate camera trade study and hardware role comparison

**Table 2.1: Candidate Camera Specification & Requirement Matrix**

| Specification / Requirement | Leopard LI-IMX568 | e-con Systems e-CAM56 | UGREEN CM831 Webcam |
| :--- | :--- | :--- | :--- |
| **Sensor Resolution & Pixel Pitch** | $2472 \times 2064\text{ px}$ (5.1 MP), $2.74\ \mu\text{m}$ | $2472 \times 2064\text{ px}$ (5.1 MP), $2.74\ \mu\text{m}$ | $1920 \times 1080\text{ px}$ (2.1 MP), n/a |
| **Shutter Mechanism (at 15.1 km/h)** | ✓ **Global shutter** (zero skew) | ✓ **Global shutter** (zero skew) | ✗ **Rolling shutter** (motion skew) |
| **Lens Field of View ($H \times V$)** | $50.0^\circ \times 42.5^\circ$ | $104.8^\circ \times 94.6^\circ$ | $62.0^\circ \times 37.4^\circ$ |
| **30 mm Bolt Width at 1088 Input** (need $\ge 16\text{ px}$) | ✓ **27 px** ($60\text{ px}$ native) | ✗ **10 px** ($22\text{ px}$ native) | ✓ **21 px** ($36\text{ px}$ native) |
| **Ground Coverage ($H=0.45\text{ m}, \theta=20^\circ$)** | ✓ Nearest: $0.51\text{ m}$; only 3% of rows (67 / 2064) above horizon (tilting to $\ge 21.3^\circ$ eliminates sky) | ✗ Nearest: $0.19\text{ m}$; 33% of image rows wasted above horizon on sky | ✓ Nearest: $0.56\text{ m}$; 0% of rows above horizon |
| **Frame Rate ($\ge 30\text{ FPS}$)** | ✓ $60\text{ FPS}$ | ✓ $79\text{ FPS}$ | ✓ $60\text{ FPS}$ |
| **Host Interface** | ~ **GMSL2 coaxial** (noise-immune automotive link; requires GMSL2 deserialiser board) | ✓ MIPI CSI-2 direct | ✓ USB 2.0 plug-and-play |
| **Selection Verdict** | <Badge type="tip" text="Selected for Final Platform" /> | <Badge type="danger" text="Rejected (Wide FOV Dilutes GSD)" /> | <Badge type="warning" text="Interim (Sem 1 Dataset Capture)" /> |

*Note: Pixel counts use each camera's listed field of view. Even if the e-CAM56's $104.8^\circ$ figure represents diagonal FOV rather than horizontal FOV, its wide-angle optics still yield far fewer pixels per bolt than the $50^\circ$ LI-IMX568.*

<CardGrid :cols="2">

<Card title="Selected Platform Sensor: Leopard LI-IMX568" accent="emerald">

<Badge type="tip" text="SELECTED CAMERA" />

Although its automotive **GMSL2** interface requires a coaxial deserialiser board to interface with the companion computer, the **LI-IMX568** is the only candidate that simultaneously satisfies global-shutter motion freeze at $4.19\text{ m/s}$, delivers $27\text{ px}$ per $30\text{ mm}$ bolt at $1088$ input, and concentrates $97\%$ of its $5.1\text{ MP}$ array on the tarmac ahead.

</Card>

<Card title="Semester 1 Interim Sensor: UGREEN CM831" accent="amber">

<Badge type="warning" text="INTERIM HARDWARE" />

Adopted during Semester 1 for static and low-speed runway dataset collection due to immediate USB 2.0 availability and zero lead time. Its $62^\circ$ lens provides a usable $21\text{ px}$ bolt width at $1088$ input, but its rolling shutter causes jello distortion and motion skew under high-speed driving.

</Card>

</CardGrid>

:::

## 3. Camera Mounting & Optical FOV Geometry {#s3}

To balance look-ahead stopping distance against spatial resolution (Ground Sample Distance, GSD), the forward perception camera is mounted at height $H = 0.45\text{ m}$ (adjustable between $0.40\text{ m}$ and $0.50\text{ m}$) with a downward pitch angle of $\theta = 20^\circ\text{–}28^\circ$ via a custom 3D-printed adjustable tilt bracket. At the baseline $H = 0.45\text{ m}$ and $\theta = 20^\circ$ configuration, the optical boresight intersects the runway **$1.24\text{ m}$ ahead**, achieving a transverse resolution of **$\text{GSD}_{\text{across}} = 0.50\text{ mm/px}$** and longitudinal resolution of **$\text{GSD}_{\text{along}} = 1.45\text{ mm/px}$** on the LI-IMX568.

Use the interactive simulator below to inspect how camera preset, mounting height $H$, downward tilt angle $\theta$, and target debris size affect the ground footprint and neural network pixel dimensions in real time.

### Optical Geometry & FOV Simulator {#fov-simulator}

<VisionCalculationsWidget1 />

<VisionCalculationsWidget2 />

<VisionCalculationsWidget3 />

<VisionCalculationsWidget4 />

<Card title="Key Takeaway">

💡 At **$H = 0.45\text{ m}$** and **$\theta = 20^\circ$ tilt**, the image centre lands **$1.24\text{ m}$ ahead** (monitoring usable ground from $0.51\text{ m}$ to $2.16\text{ m}$). A **$30\text{ mm}$ fastener** spans **$60 \times 21\text{ px}$** native on the IMX568, **$16 \times 5\text{ px}$** at $640$ input, and **$27 \times 9\text{ px}$** at $1088$ input—keeping the target width ($27\text{ px}$) close to the $32\text{ px}$ small-object benchmark threshold.

</Card>

::: details Pinhole optical model and Ground Sample Distance (GSD) derivations

**3.1 Focal Length in Pixels ($f_x, f_y$)**

The pinhole camera model converts physical field-of-view angles into discrete sensor pixel dimensions. For a sensor of width $W_{\text{sensor}}$ and height $H_{\text{sensor}}$, the pixel focal lengths scale inversely with the tangent of half the angular field of view. Because pixels on our sensors are square, $f_x$ and $f_y$ share the same value:

$$
f_x = \frac{W_{\text{sensor}}}{2 \cdot \tan\left(\frac{\text{HFOV}}{2}\right)}, \qquad f_y = \frac{H_{\text{sensor}}}{2 \cdot \tan\left(\frac{\text{VFOV}}{2}\right)}
$$

*In plain words:* How many pixels represent the lens's optical focal length; a higher value means greater optical zoom.

**3.2 Oblique Slant Range & Ground Incidence**

Because the camera sits $H = 0.45\text{ m}$ above the tarmac and points $\theta = 20^\circ$ downward, it views the runway surface obliquely. The true line-of-sight slant range $R$ to a ground point at horizontal distance $d$ ahead of the lens follows the Pythagorean theorem, while the grazing incidence angle $\psi$ defines how steeply the optical ray strikes the flat pavement:

$$
R = \sqrt{H^2 + d^2}, \qquad \psi = \arctan\left(\frac{H}{d}\right)
$$

*In plain words:* True line-of-sight distance to the ground and how steeply the camera looks down at it.

**3.3 Ground Sample Distance (GSD)**

Ground Sample Distance measures how many millimetres of runway a single pixel covers. Viewing forward at a shallow grazing angle $\psi$ foreshortens the vertical pixel footprint along the driving direction by $1 / \sin\psi$, whereas horizontal resolution across the direction of travel remains unstretched:

$$
\text{GSD}_{\text{across}} = \frac{R \cdot 1000}{f_x}\ (\text{mm/px}), \qquad \text{GSD}_{\text{along}} = \frac{\text{GSD}_{\text{across}}}{\sin(\psi)}\ (\text{mm/px})
$$

For any off-centre image row at vertical angle $\alpha$ relative to the optical axis ($\alpha > 0$ downwards toward the near ground):

$$
\text{GSD}_{\text{along}}(\alpha) = \frac{H \cdot \cos^2\alpha}{f \cdot \sin^2(\theta + \alpha)} \cdot 1000\ (\text{mm/px}), \qquad \text{GSD}_{\text{across}}(\alpha) = \frac{H \cdot \cos\alpha}{f \cdot \sin(\theta + \alpha)} \cdot 1000\ (\text{mm/px})
$$

At the image centre ($\alpha = 0$), this reduces exactly to the boresight formula above; away from the centre, the $\cos^2\alpha$ factor accounts for off-axis projection.

:::

## 4. Input Resolution Scaling & Target Footprint {#s4}

Single-stage object detectors resize incoming camera frames to a square tensor before convolutional feature extraction. Standard $640 \times 640$ downsampling shrinks a $2472\text{ px}$ IMX568 frame by $3.86\times$, compressing a $30\text{ mm}$ fastener at $1.24\text{ m}$ range to just **$16 \times 5\text{ px}$**—on the brink of vanishing inside YOLO's $8 \times 8\text{ px}$ stride-8 feature cells.

Raising the inference resolution to **$1088 \times 1088$** preserves **$27 \times 9\text{ px}$** on the LI-IMX568 (and **$21 \times 7\text{ px}$** on the interim UGREEN CM831). Although higher input resolution scales compute quadratically, our empirical benchmarks in [YOLO Model Comparison →](./yolo-comparison.md#domain-adaptation) confirm that $1088$ input remains well within the $33.3\text{ ms}$ real-time budget while boosting test $\text{mAP@50}$ on held-out runway videos from **87.7% to 97.0%**.

::: details Fastener pixel footprint across cameras and input resolutions

**Table 4.1: Projected Pixel Dimensions ($W \times L\text{ px}$) of a 30 mm Fastener at Boresight ($d = 1.24\text{ m}$)**

| Camera Candidate | Native Sensor Footprint ($W \times L\text{ px}$) | At $640 \times 640$ Input | At $1088 \times 1088$ Input | Viability at $1088$ Input |
| :--- | :--- | :--- | :--- | :--- |
| **Leopard LI-IMX568** | **$60 \times 21\text{ px}$** | $16 \times 5\text{ px}$ (Marginal/Fail) | **$27 \times 9\text{ px}$** | ✓ **Pass** ($\ge 16\text{ px}$ width) |
| **UGREEN CM831 (Interim)** | $36 \times 12\text{ px}$ | $12 \times 4\text{ px}$ (Fail) | **$21 \times 7\text{ px}$** | ✓ **Pass** ($\ge 16\text{ px}$ width) |
| **e-con e-CAM56** | $22 \times 7\text{ px}$ | $6 \times 2\text{ px}$ (Fail) | $10 \times 3\text{ px}$ (Fail) | ✗ **Fail** ($< 16\text{ px}$ width) |

:::

<!-- #endregion report -->

<CardGrid :cols="2">

<Card>

← [Previous Documentation](./vision-research.md)

**Computer Vision Research**

</Card>

<Card>

[Next Documentation](./yolo-comparison.md) →

**YOLO Model Comparison & Benchmark**

</Card>

</CardGrid>
