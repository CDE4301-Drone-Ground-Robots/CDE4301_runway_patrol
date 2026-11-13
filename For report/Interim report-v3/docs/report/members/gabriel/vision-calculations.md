---
title: "Computer Vision Calculations & Camera Geometry"
description: "First-principles requirements, global-shutter camera selection (ELP-USBGS5MP01-L601), mounting tilt geometry, and pixel footprint scaling for 3 cm fasteners."
owner: "Gabriel Tan"
outline: [2, 3]
---

# Computer Vision Calculations & Camera Geometry

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page sets the requirements for the UGV computer vision subsystem before any hardware or model is chosen, then selects the camera (`ELP-USBGS5MP01-L601`) and mounting tilt (`33°`) against those requirements. Semester 1 training and testing used the `UGREEN CM831` webcam as the interim sensor; the ELP 5 MP global-shutter camera will be verified on the Jetson Orin Nano Super in Semester 2.

<!-- #region report -->

## 1. Requirements & Constraints {#s1}

The UGV camera sits $0.4\text{–}0.5\text{ m}$ above the ground and has to find small metal fasteners in real time on hardware that fits on the UGV. In our system, the UAV surveys the airfield and sends the UGV to candidate FOD spots; the UGV's camera then confirms the FOD up close so the UGV can collect it, which means the vision subsystem has to output **what the object is** and **where it is in the image**.

Table 3.5.1 lists the constraints, the working behind each one, and the requirement it sets. None of these depend on which camera we pick, so Section 2 can check candidate cameras directly against them.

| Constraint | Calculation | Requirement |
| :--- | :--- | :--- |
| **Smallest FOD** | Fasteners ($3\text{ cm}$) are the smallest common hazardous FOD. COCO classes objects under $32 \times 32\text{ px}$ as "small", where detectors score worst [\[1\]](./references.md#ref-1), [\[2\]](./references.md#ref-2). | Following COCO's $32 \times 32\text{ px}$ small-object boundary, we require **at least $32\text{ px}$ across the fastener** (applied to object width, since front-to-back depth is foreshortened by the low viewing angle). |
| **Mounted at $0.4\text{–}0.5\text{ m}$** | Height is fixed by the chassis. We use $h = 0.45\text{ m}$ as the baseline until the chassis is built. | Tilt chosen so the view covers at least $1.5\text{ m}$ look-ahead (Section 3). |
| **Detection range $\ge 1.5\text{ m}$** | UM980 GNSS without RTK: $1.5\text{ m}$ horizontal error (RMS, datasheet [\[5\]](./references.md#ref-5)). | Look ahead **at least $1.5\text{ m}$** so the FOD enters the band despite UAV positioning error. |
| **Resolution** | Slant distance to far edge ($1.50\text{ m}$ ahead, $0.45\text{ m}$ height) $= \sqrt{1.50^2 + 0.45^2} = 1.57\text{ m}$. A $3\text{ cm}$ fastener covers $2 \times \arctan(0.015 / 1.57) = 1.10^\circ$. | **$\ge 32\text{ px}$** across a $3\text{ cm}$ fastener at $1.5\text{ m}$ ahead ($f \ge 1670\text{ px}$, **$\approx 29\text{ px/}^\circ$**). |
| **Field of view** | Near edge to far edge coverage over the ground band. | VFOV selected to cover at least $1.5\text{ m}$ look-ahead from mount height. |
| **Time in view** | 15 km/h (4.17 m/s) worst case. A point stays in a band of length Δx for Δx ÷ v. Planner slows the UGV near FOD (Sem 2). | Seen ≥ 2× → `f ≥ 2v / Δx` (number set in Section 3 once Δx is known). Target **10 FPS**. |
| **Motion** | A rolling shutter reads rows one after another (≈ 30 ms). At 4.17 m/s the UGV moves 12.5 cm in that time, which skews the image. | **Global shutter**. |
| **Latency budget** | Each frame has to finish before the next one: $1 \div 10\text{ FPS} = 100\text{ ms}$. | **$\le 100\text{ ms}$ per frame** on the Jetson Orin Nano Super. |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 3.5.1: Vision Subsystem Design Constraints and Derived Requirements.</p>

::: details Derivation of the 1.5 m GNSS look-ahead, frame rate, and 29 px/° angular resolution

- **Why $1.5\text{ m}$ look-ahead:** The $1.5\text{ m}$ requirement comes from the UM980 GNSS datasheet [\[5\]](./references.md#ref-5), which specifies $1.5\text{ m}$ horizontal accuracy (RMS) in single-point mode without RTK corrections. With RTK active, the error drops to about $1\text{ cm}$, so the required band can shrink once RTK is running. Because $1.5\text{ m}$ is RMS rather than a hard maximum and lateral coverage at $1.5\text{ m}$ ahead is about $\pm 0.85\text{ m}$, residual lateral error is handled by the path planner.
- **Why $\ge 29\text{ px/}^\circ$:** Pixels per degree measures how finely the camera slices its field of view. A $3\text{ cm}$ fastener at $1.57\text{ m}$ slant distance subtends $1.10^\circ$, and placing $32\text{ px}$ inside that angle requires:
  $$\text{px/}^\circ \ge \frac{32\text{ px}}{1.10^\circ} \approx 29\text{ px/}^\circ$$
  The $32\text{ px}$ target is our engineering design choice informed by COCO's evaluation boundary ($32 \times 32\text{ px}$), where object detectors exhibit their steepest drop in recall [\[1\]](./references.md#ref-1), [\[2\]](./references.md#ref-2).

:::

## 2. Design Methodology & Camera Selection {#s2}

### 2.1 Task Formulation & Sensing Modality {#task-and-sensor}

| Task | Output | Compute & Annotation Cost | Verdict |
| :--- | :--- | :--- | :--- |
| **Object Detection** | Bounding box + class | Low–moderate annotation; real-time | <Badge type="tip" text="Selected" /> Gives both location for pickup and class for triage |
| **Instance Segmentation** | Pixel mask + box + class | High annotation cost; slower inference | <Badge type="danger" text="Rejected" /> Pixel outline not needed for vacuum/sweep pickup |
| **Anomaly Detection** | Heatmap + score | Normal images only; high compute | <Badge type="danger" text="Rejected" /> No class label; cracks/paint/shadows trigger false alerts |

::: details Onboard sensing modality comparison for 3 cm fasteners

| Sensing Modality | Spatial Resolution at 1.5 m | Daylight Reliability | Small Fastener Classification (≤ 3 cm) | Role on UGV |
| :--- | :--- | :--- | :--- | :--- |
| **3D Multi-Layer LiDAR** | ≈ 55–65 mm ring spacing at 1.5 m (2°–2.5° between channels) | High | Insufficient (flat fasteners fall between laser rings) | <Badge type="info" text="Obstacle Avoidance & SLAM" /> |
| **Active IR Stereo RGB-D** | Depth noise ≥ 2–4% at 1.5 m | Poor (IR washed out by sunlight) | Depth fails on flat < 10 mm metallic items | <Badge type="danger" text="Rejected for Primary FOD" /> |
| **mmWave Radar** | Coarse angular resolution (1°–4°) | High | Cannot classify material or bounding box | <Badge type="danger" text="Rejected" /> |
| **5 MP Global-Shutter RGB (`ELP-USBGS5MP01-L601`)** | **45 px/° (46 px per 3 cm fastener at 1.5 m)** | **High (global shutter)** | **97.0 ± 1.4% mAP50 at 1088 px input** | <Badge type="tip" text="Selected Primary FOD Sensor" /> |

:::

### 2.2 Camera Selection

Each candidate camera is checked against Table 3.5.1: **≥ 29 px/°**, **≥ 10 FPS target**, **global shutter**, and native compatibility with the **Jetson Orin Nano Super**. Pixels per degree is the horizontal image width divided by the horizontal field of view (`W / HFOV`).

<table class="data-table"><tbody>
<tr><th>Camera</th><th>Resolution</th><th>HFOV / VFOV</th><th>px/°</th><th>Shutter (Max FPS)</th><th>Outcome</th></tr>
<tr><td><strong>UGREEN CM831</strong></td><td>1920 × 1080</td><td>62° / 37°</td><td>31</td><td>Rolling (60)</td><td><Badge type="warning" text="Interim (Sem 1)" /> Cheap and available for Sem 1 tests; rolling shutter fails at 15 km/h</td></tr>
<tr><td><strong>Leopard Imaging LI-IMX568-GMSL2-050H</strong></td><td>2472 × 2064</td><td>50° / 43°</td><td>49</td><td>Global (60)</td><td><Badge type="danger" text="Rejected" /> High cost; GMSL2 not supported natively on the Orin Nano Super</td></tr>
<tr><td><strong>e-con Systems e-CAM56_CUOAGX (IMX568)</strong></td><td>2472 × 2064</td><td>104.8° / 95°</td><td>24</td><td>Global (79)</td><td><Badge type="danger" text="Rejected" /> Wide 104.8° HFOV gives only 24 px/° (coarse GSD, below 29 px/°)</td></tr>
<tr><td><strong>ELP-USBGS5MP01-L601 (OX05B1S, 6 mm lens)</strong></td><td><strong>2592 × 1944</strong></td><td><strong>57° / 42°</strong></td><td><strong>45</strong></td><td><strong>Global (50)</strong></td><td><Badge type="tip" text="Selected" /> Meets every requirement at student-project cost (US$142 + US$35 shipping)</td></tr>
</tbody></table>

**Selection Rationale & Verification Plan:**  
We selected the **ELP-USBGS5MP01-L601** (OmniVision OX05B1S 5 MP sensor with a $6\text{ mm}$ M12 lens) because it is the only candidate that meets every requirement within a student project budget: **$45\text{ px/}^\circ \ge 29\text{ px/}^\circ$**, **$42^\circ\text{ VFOV}$**, **$50\text{ FPS} \ge 10\text{ FPS}$**, and a **global shutter**. The vendor confirmed that the $6\text{ mm}$ M12 lens provides approximately $57^\circ \times 42^\circ$ FOV with no vignetting and streams $2592 \times 1944$ at $50\text{ FPS}$ MJPEG as a standard plug-and-play UVC device.

One hardware check is scheduled on the Jetson Orin Nano Super upon delivery: confirm sustained full-resolution UVC capture on JetPack 6.2.

## 3. Mounting Geometry & Tilt {#s3}

Because the chassis is adjustable, downward tilt $\theta$ sets which band of ground the camera sees and how strongly objects are foreshortened front-to-back. With mounting height $h = 0.45\text{ m}$, tilt $\theta$ below horizontal, and $\text{VFOV} = 42^\circ$, the near and far edges of the ground footprint are:

$$x_{\text{near}} = \frac{h}{\tan(\theta + \text{VFOV}/2)}, \qquad x_{\text{far}} = \frac{h}{\tan(\theta - \text{VFOV}/2)}$$

With **$\theta = 33^\circ$**, the view spans from **$x_{\text{near}} = 0.33\text{ m}$** to **$x_{\text{far}} = 2.12\text{ m}$** ahead, giving a detection band length of **$\Delta x = 1.79\text{ m}$**. At $v = 15\text{ km/h}$ ($4.17\text{ m/s}$), an object remains in view for $1.79\text{ m} \div 4.17\text{ m/s} = 0.43\text{ s}$, requiring $f_{\min} = 2v / \Delta x \approx 4.7\text{ FPS}$ to observe each point twice—well within our $10\text{ FPS}$ target.

<Figure
  src="./assets/images/side-view-geometry.png"
  alt="Side view of camera mounting geometry at h = 0.45 m, tilt = 33°, VFOV = 42°, covering 0.33–2.12 m ahead"
  caption="Figure 3.5.0: Side view at h = 0.45 m, θ = 33°, VFOV 42°. View covers 0.33–2.12 m ahead; image centre lands 0.69 m ahead."
/>

| Tilt Below Horizontal ($\theta$) | Near Edge ($x_{\text{near}}$) | Image Centre | Far Edge ($x_{\text{far}}$) |
| :--- | :--- | :--- | :--- |
| **30°** | 0.36 m | 0.78 m | 2.84 m |
| **33° (Chosen)** | **0.33 m** | **0.69 m** | **2.12 m** |

<Figure
  src="./assets/diagrams/vision-tilt-tradeoff.svg"
  alt="Tilt analysis graphs showing front-to-back squash at image centre, pixels across a 3 cm and 1 cm object at image centre, and far-edge look-ahead across tilt angles"
  caption="Figure 3.5.1: Tilt trade-off at h = 0.40–0.50 m. Front-to-back squash at image centre, pixels across a 3 cm (solid) and 1 cm (dashed) object at image centre, and far-edge look-ahead. At 33°: 3 cm = 87 px, 1 cm = 29 px, look-ahead 2.12 m."
/>

Tilt also foreshortens objects along the direction of travel: pixels along the ground equal pixels across multiplied by `h/d` (the sine of the depression angle to the object). A 1 cm object reaches 32 px across only out to ≈ 0.6 m ahead (close range), whereas a **3 cm fastener** meets the 32 px width requirement across the full detection band at native camera resolution.

::: details Interactive optical geometry & FOV simulator

Use the interactive simulator below to explore how camera preset, mounting height $h$, downward tilt $\theta$, and target FOD size affect ground coverage and pixel dimensions:

<VisionCalculationsWidget1 />

<VisionCalculationsWidget2 />

<VisionCalculationsWidget3 />

<VisionCalculationsWidget4 />

:::

## 4. Pixel Coverage & Semester 2 Plan {#s4}

An object at ground distance $x$ sits at slant distance $d = \sqrt{x^2 + h^2}$ from the lens. With image width $W$ and horizontal field of view $\text{HFOV} = 57^\circ$, an object of physical width $L$ spans:

$$d = \sqrt{x^2 + h^2}, \qquad \text{px} = \frac{L \times W}{2 \times d \times \tan(\text{HFOV}/2)}$$

Table 3.5.2 applies this equation to a **$3\text{ cm}$ fastener** at the ELP camera's full $2592\text{ px}$ sensor width and after downscaling to the two neural network input sizes evaluated in [YOLO Model Comparison & Training](./yolo-comparison-and-training.md):

| Position | Ground (Slant Distance) | Camera Native ($2592\text{ px}$) | Model Input ($1088\text{ px}$) | Model Input ($640\text{ px}$) |
| :--- | :--- | :--- | :--- | :--- |
| **Near Edge** | $0.33\text{ m}$ ($0.56\text{ m}$) | $129\text{ px}$ | $54\text{ px}$ | $32\text{ px}$ |
| **Image Centre** | $0.69\text{ m}$ ($0.83\text{ m}$) | $87\text{ px}$ | $36\text{ px}$ | $21\text{ px}$ |
| **GNSS Look-Ahead** | $1.50\text{ m}$ ($1.57\text{ m}$) | $46\text{ px}$ | $19\text{ px}$ | $11\text{ px}$ |
| **2.0 m Standoff** | $2.00\text{ m}$ ($2.05\text{ m}$) | $35\text{ px}$ | $15\text{ px}$ | $9\text{ px}$ |
| **Far Edge** | $2.12\text{ m}$ ($2.16\text{ m}$) | $33\text{ px}$ | $14\text{ px}$ | $8\text{ px}$ |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 3.5.2: Look-Ahead Band Pixel Coverage for 3 cm Fastener Target.</p>

**32 px Reach Summary:**  
The $32\text{ px}$ width threshold is maintained out to **$\approx 2.2\text{ m}$ at full camera resolution ($2592\text{ px}$)**, **$0.83\text{ m}$ at $1088\text{ px}$ model input**, and **nowhere within the band beyond the near edge at $640\text{ px}$ input**. The camera optics themselves satisfy the requirement ($2592\text{ px}$ over $57^\circ = 45\text{ px/}^\circ$). Because the Semester 1 baseline detector runs at $1088\text{ px}$ input, it reaches $32\text{ px}$ out to $\approx 0.8\text{ m}$; Semester 2 will run full-resolution detection (via larger input resolution or **SAHI tile slicing**, giving $\approx 2.4\times$ more pixels) to extend the $32\text{ px}$ reach across the full look-ahead band.

<!-- #endregion report -->

<CardGrid :cols="1">

<Card>

[Next Documentation](./yolo-comparison-and-training.md) →

**YOLO Model Comparison & Training**

</Card>

</CardGrid>
