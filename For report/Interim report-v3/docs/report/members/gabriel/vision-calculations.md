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

The UGV camera sits 0.4–0.5 m above the ground and has to find small metal fasteners in real time on hardware that fits on the UGV. In the team's system, the UAV surveys the airfield and sends the UGV to candidate FOD spots; the UGV's camera then confirms the FOD up close so the UGV can collect it, which means the vision subsystem has to output **what the object is** and **where it is in the image**.

Table 3.5.1 lists the constraints, the working behind each one, and the requirement it sets. None of these depend on which camera I pick, so Section 2 can check candidate cameras directly against them.

| Constraint | Calculation | Requirement |
| :--- | :--- | :--- |
| **Smallest FOD** | Fasteners (3 cm) are the smallest common hazardous FOD. COCO classes objects under 32 × 32 px as "small", where detectors score worst [\[1\]](./references.md#ref-1), [\[2\]](./references.md#ref-2). | Following COCO's 32 × 32 px small-object boundary, I require **at least 32 px across the fastener** (applied to object width, since front-to-back depth is foreshortened by the low viewing angle). |
| **Mounted at 0.4–0.5 m** | Height is fixed by the chassis. I use h = 0.45 m as the baseline until the chassis is built. | Tilt chosen so the view covers at least 1.5 m look-ahead (Section 3). |
| **Detection range ≥ 1.5 m** | UM980 GNSS without RTK: 1.5 m horizontal error (RMS, datasheet [\[5\]](./references.md#ref-5)). | Look ahead **at least 1.5 m** so the FOD enters the band despite UAV positioning error. |
| **Resolution** | Slant distance to far edge (1.50 m ahead, 0.45 m height) = √1.50² + 0.45² = 1.57 m. A 3 cm fastener covers 2 × arctan(0.015 / 1.57) = 1.10°. | **≥ 32 px** across a 3 cm fastener at 1.5 m ahead (f ≥ 1670 px, **≈ 29 px/°**). |
| **Field of view** | Near edge to far edge coverage over the ground band. | VFOV selected to cover at least 1.5 m look-ahead from mount height. |
| **Time in view** | 15 km/h (4.17 m/s) worst case. A point stays in a band of length Δx for Δx ÷ v. Planner slows the UGV near FOD (Sem 2). | Seen ≥ 2× → `f ≥ 2v / Δx` (number set in Section 3 once Δx is known). Target **10 FPS**. |
| **Motion** | A rolling shutter reads rows one after another (≈ 30 ms). At 4.17 m/s the UGV moves 12.5 cm in that time, which skews the image. | **Global shutter**. |
| **Latency budget** | Each frame has to finish before the next one: 1 ÷ 10 FPS = 100 ms. | **≤ 100 ms per frame** on the Jetson Orin Nano Super. |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 3.5.1: Vision Subsystem Design Constraints and Derived Requirements.</p>

::: details Derivation of the 1.5 m GNSS look-ahead, frame rate, and 29 px/° angular resolution

- **Why 1.5 m look-ahead:** The 1.5 m requirement comes from the UM980 GNSS datasheet [\[5\]](./references.md#ref-5), which specifies 1.5 m horizontal accuracy (RMS) in single-point mode without RTK corrections. With RTK active, the error drops to about 1 cm, so the required band can shrink once RTK is running. Because 1.5 m is RMS rather than a hard maximum and lateral coverage at 1.5 m ahead is about ± 0.85 m, residual lateral error is handled by the path planner.
- **Why ≥ 29 px/°:** Pixels per degree measures how finely the camera slices its field of view. A 3 cm fastener at 1.57 m slant distance subtends 1.10°, and placing 32 px inside that angle requires:
  $$\text{px/}^\circ \ge \frac{32\text{ px}}{1.10^\circ} \approx 29\text{ px/}^\circ$$
  The 32 px target is my engineering design choice informed by COCO's evaluation boundary (32 × 32 px), where object detectors exhibit their steepest drop in recall [\[1\]](./references.md#ref-1), [\[2\]](./references.md#ref-2).

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
<tr><td><strong>ELP-USBGS5MP01-L601 (OX05B1S, 6 mm lens)</strong></td><td><strong>2592 × 1944</strong></td><td><strong>57° / 42°</strong></td><td><strong>45</strong></td><td><strong>Global (50)</strong></td><td><Badge type="tip" text="Selected" /> Meets every requirement at student-project cost (US142 + US35 shipping)</td></tr>
</tbody></table>

**Selection Rationale & Verification Plan:**  
I selected the **ELP-USBGS5MP01-L601** (OmniVision OX05B1S 5 MP sensor with a 6 mm M12 lens) because it is the only candidate that meets every requirement within a student project budget: **45 px/° ≥ 29 px/°**, **42° VFOV**, **50 FPS ≥ 10 FPS**, and a **global shutter**. The vendor confirmed that the 6 mm M12 lens provides approximately 57° × 42° FOV with no vignetting and streams 2592 × 1944 at 50 FPS MJPEG as a standard plug-and-play UVC device.

One hardware check is scheduled on the Jetson Orin Nano Super upon delivery: confirm sustained full-resolution UVC capture on JetPack 6.2.

## 3. Mounting Geometry & Tilt {#s3}

Because the chassis is adjustable, downward tilt θ sets which band of ground the camera sees and how strongly objects are foreshortened front-to-back. With mounting height h = 0.45 m, tilt θ below horizontal, and VFOV = 42°, the near and far edges of the ground footprint are:

$$x_{\text{near}} = \frac{h}{\tan(\theta + \text{VFOV}/2)}, \qquad x_{\text{far}} = \frac{h}{\tan(\theta - \text{VFOV}/2)}$$

With **θ = 33°**, the view spans from **x_near = 0.33 m** to **x_far = 2.12 m** ahead, giving a detection band length of **Δx = 1.79 m**. At v = 15 km/h (4.17 m/s), an object remains in view for 1.79 m ÷ 4.17 m/s = 0.43 s, requiring f_\min = 2v / Δx ≈ 4.7 FPS to observe each point twice—well within my 10 FPS target.

| Tilt Below Horizontal (θ) | Near Edge (x_near) | Image Centre | Far Edge (x_far) |
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

Use the interactive simulator below to explore how camera preset, mounting height h, downward tilt θ, and target FOD size affect ground coverage and pixel dimensions:

<VisionCalculationsWidget1 />

<VisionCalculationsWidget2 />

<VisionCalculationsWidget3 />

<VisionCalculationsWidget4 />

:::

## 4. Pixel Coverage & Semester 2 Plan {#s4}

An object at ground distance x sits at slant distance d = √x² + h² from the lens. With image width W and horizontal field of view HFOV = 57°, an object of physical width L spans:

$$d = \sqrt{x^2 + h^2}, \qquad \text{px} = \frac{L \times W}{2 \times d \times \tan(\text{HFOV}/2)}$$

Table 3.5.2 applies this equation to a **3 cm fastener** at the ELP camera's full 2592 px sensor width and after downscaling to the two neural network input sizes evaluated in [YOLO Model Comparison & Training](./yolo-comparison-and-training.md):

| Position | Ground (Slant Distance) | Camera Native (2592 px) | Model Input (1088 px) | Model Input (640 px) |
| :--- | :--- | :--- | :--- | :--- |
| **Near Edge** | 0.33 m (0.56 m) | 129 px | 54 px | 32 px |
| **Image Centre** | 0.69 m (0.83 m) | 87 px | 36 px | 21 px |
| **GNSS Look-Ahead** | 1.50 m (1.57 m) | 46 px | 19 px | 11 px |
| **2.0 m Standoff** | 2.00 m (2.05 m) | 35 px | 15 px | 9 px |
| **Far Edge** | 2.12 m (2.16 m) | 33 px | 14 px | 8 px |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 3.5.2: Look-Ahead Band Pixel Coverage for 3 cm Fastener Target.</p>

**32 px Reach Summary:**  
The 32 px width threshold is maintained out to **≈ 2.2 m at full camera resolution (2592 px)**, **0.83 m at 1088 px model input**, and **nowhere within the band beyond the near edge at 640 px input**. The camera optics themselves satisfy the requirement (2592 px over 57° = 45 px/°). Because the Semester 1 baseline detector runs at 1088 px input, it reaches 32 px out to ≈ 0.8 m; Semester 2 will run full-resolution detection (via larger input resolution or **SAHI tile slicing**, giving ≈ 2.4× more pixels) to extend the 32 px reach across the full look-ahead band.

<!-- #endregion report -->

<CardGrid :cols="1">

<Card>

[Next Documentation](./yolo-comparison-and-training.md) →

**YOLO Model Comparison & Training**

</Card>

</CardGrid>
