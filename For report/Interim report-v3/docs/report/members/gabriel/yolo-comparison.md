---
title: "YOLO Model Comparison & Edge Benchmark"
description: "Quantitative architecture evaluation, public benchmark leakage audit, and native runway tarmac resolution scaling for small metallic fasteners."
owner: "Gabriel Tan"
outline: [2, 3]
---

# YOLO Model Comparison & Edge Benchmark

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page documents the temporal dataset leakage audit on the public FOD-A dataset, multi-architecture benchmarks on an NVIDIA A40 GPU, and multi-seed resolution scaling ($640$ vs. $1088$) on our own sun-lit tarmac footage ($1,552$ frames across $16$ videos). TensorRT quantization and live frame-rate benchmarking on the Jetson Orin with the global-shutter camera are scheduled for Semester 2.

<!-- #region report -->

<span id="sec-4-4-2"></span>

## 1. Dataset Leakage Audit (FOD-A vs. Leak-Free Split) {#leakage-audit}

Publicly available runway debris benchmarks such as **FOD-A** ($33,793$ annotated frames extracted from continuous video sequences) routinely report $\text{mAP@50}$ scores exceeding **99%**. Auditing the standard random frame-level split revealed severe **temporal data leakage**: shuffling consecutive video frames distributes nearly identical adjacent frames across training, validation, and test partitions, allowing models to achieve artificially high scores by memorizing static background asphalt textures rather than learning generalizable object representations.

To establish a rigorous scientific baseline, we developed an automated 5-step scene-isolation pipeline (`build_arch2_dataset.py`) that groups frames into contiguous video scenes, assigns whole scenes to partitions, and purges **15-frame temporal buffer zones** ($3,416$ discarded boundary frames) wherever a rare-class scene must be split chronologically. Enforcing scene-level separation reduced **YOLO11-S test $\text{mAP@50}$ from 99.42% to 50.29%**, exposing the true generalization baseline on unseen background scenes.

<Card title="Impact of Eliminating Temporal Frame Leakage on FOD-A">

**99.42% → 50.29% Test mAP@50**  
*YOLO11-S evaluated before (random frame shuffle) and after enforcing contiguous scene separation with 31-frame minimum train–test separation.*

</Card>

<YoloComparisonWidget2 />

::: details Automated 5-step leak-free dataset partitioning protocol

Use the interactive stepper below or review the summary table to inspect how `build_arch2_dataset.py` eliminates temporal frame leakage across all $33,793$ FOD-A frames:

<YoloComparisonWidget3 />

| Protocol Step | Operation | Verification Metric |
| :--- | :--- | :--- |
| **Step 1: Scene Grouping** | Sort all $33,793$ video frames chronologically and group into contiguous recording scenes per object instance. | $100\%$ of frames mapped to source video segments. |
| **Step 2: Scene-Level Assignment** | Classes recorded across $\ge 3$ independent scenes are assigned strictly at the whole-scene level into Train, Val, or Test. | Zero shared scenes across partitions for multi-scene classes. |
| **Step 3: Temporal Cut for Rare Classes** | Classes filmed in only $1\text{–}2$ scenes are partitioned chronologically: first $70\%$ Train, $8\%$ buffer discard, $10\%$ Val, $4\%$ buffer discard, final $8\%$ Test. | Preserves class coverage without random frame interleaving. |
| **Step 4: Boundary Buffer Purge** | Delete $15$ frames on each side of any partition boundary; **$3,416$ boundary frames** removed in total. | Eliminates overlapping camera fields of view at cut points. |
| **Step 5: Automated Leakage Audit** | Verify zero duplicate hashes and enforce minimum temporal separation across splits. | Closest Train and Test frames separated by **$\ge 31$ frames**. |

:::

## 2. Architecture Benchmarking & Selection Framework {#benchmark-matrix}

Using the leak-free FOD-A benchmark ($30$ epochs on an NVIDIA A40 GPU), we compared single-stage convolutional detectors (**YOLOv8-S** at $11.1\text{M}$ parameters and **YOLO11-S** at $9.4\text{M}$ parameters) against a hybrid vision transformer (**RT-DETR-L** at $32.8\text{M}$ parameters). Our selection rule is straightforward: **deploy the highest-recall architecture that executes within the 33.3 ms real-time frame budget on the target edge processor**.

Both CNN backbones execute roughly **$5\times$ faster** than RT-DETR-L (**$4.5\text{ ms}$** for YOLOv8-S and **$5.2\text{ ms}$** for YOLO11-S vs. **$24.2\text{ ms}$** for RT-DETR-L on the A40), while **YOLO11-S** improves precision by **+9.95 percentage points** ($75.63\%$ vs. $65.68\%$) and $\text{mAP@50-95}$ by **+5.02 pp** ($39.57\%$ vs. $34.55\%$) over YOLOv8-S with $15\%$ fewer parameters. Consequently, **YOLO11-S** was selected as our primary Semester 1 development architecture, training **$4.25\times$ faster** ($0.92\text{ h}$ vs. $3.91\text{ h}$ per run) to enable rapid multi-seed experimentation on our own runway dataset.

<YoloComparisonWidget1 />

::: details Complete architecture benchmark table and experimental analysis

**Table 2.1: Quantitative Model Comparison Across Leak-Free FOD-A and Native Runway Tarmac Splits (NVIDIA A40 GPU)**

| Model Architecture | Dataset & Input Resolution | Test mAP@50 (%) | Test mAP@50-95 (%) | Precision (%) | Recall (%) | A40 Latency (ms) | Parameters (M) | Training Time (30 ep) | Selection Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **YOLOv8-S (Small)** | Leak-Free FOD-A ($640\text{ px}$) | $47.4\%$ | $34.55\%$ | $65.68\%$ | $42.28\%$ | **$4.5\text{ ms}$** | $11.1\text{M}$ | $0.88\text{ h}$ | Superseded by YOLO11-S (+9.95 pp Precision) |
| **YOLO11-S (Small)** | Leak-Free FOD-A ($640\text{ px}$) | $50.29\%$ | $39.57\%$ | **$75.63\%$** | $42.50\%$ | $5.2\text{ ms}$ | **$9.4\text{M}$** | **$0.92\text{ h}$** | ✓ **Selected CNN Backbone** |
| **RT-DETR-L (Large)** | Leak-Free FOD-A ($640\text{ px}$) | **$67.8\%$** | **$51.82\%$** | $66.44\%$ | **$62.57\%$** | $24.2\text{ ms}$ | $32.8\text{M}$ | $3.91\text{ h}$ | High-Recall Candidate (Pending Orin TensorRT Test) |
| **YOLO11-S (Zero-Shot)** | Own Tarmac ($640\text{ px}$) | $11.91\%$ | $4.55\%$ | $45.42\%$ | $10.60\%$ | $5.2\text{ ms}$ | $9.4\text{M}$ | — | ✗ Fails under domain shift |
| **YOLO11-S (Fine-Tuned)** | Own Tarmac ($640\text{ px}$, 3 seeds) | $87.7 \pm 0.7\%$ | $54.8 \pm 1.2\%$ | $95.8 \pm 1.0\%$ | $81.5 \pm 0.7\%$ | $5.2\text{ ms}$ | $9.4\text{M}$ | $0.25\text{ h}$ | Baseline Native Model ($8.3$ false alarms) |
| **YOLO11-S (Fine-Tuned)** | Own Tarmac (**$1088\text{ px}$**, 3 seeds) | **$97.0 \pm 1.4\%$** | **$69.1 \pm 2.2\%$** | **$98.6 \pm 1.3\%$** | **$92.7 \pm 3.2\%$** | **$6.1\text{ ms}$** | **$9.4\text{M}$** | $0.45\text{ h}$ | ✓ **Selected Development Model ($1.0$ false alarm)** |

**Why fix model scale at 'S' and include RT-DETR-L?**  
Fixing the YOLO scale at Small (`S`) isolates network architecture (C2f in YOLOv8 vs. C3k2 + C2PSA spatial attention in YOLO11) as the sole experimental variable while representing the largest CNN scale guaranteed to fit comfortably inside the $33.3\text{ ms}$ edge deadline. RT-DETR-L ($32.8\text{M}$) is the smallest official real-time DETR variant in Ultralytics; while its global self-attention yields $+20.07\text{ pp}$ higher recall on FOD-A, it is $3.5\times$ larger and $4.7\times$ slower than YOLO11-S, requiring TensorRT quantization testing on the Jetson Orin in Semester 2 before deployment selection.

**Why is validation mAP (85–93%) higher than clean test mAP (47–68%) on FOD-A?**  
Validation mAP remains higher than clean test mAP due to overfitting that accelerates after mosaic augmentation disables at epoch 20, compounded by severe cross-category appearance shifts in unseen test scenes (for instance, *Hazardous Chemical* achieves only $31\%$ test recall because $49\%$ of instances are misclassified as *Metallic Tools*, and *Mineral Stone* experiences $30\%$ missed background detections).

:::

## 3. Runway Adaptation & Small-Fastener Resolution Scaling {#domain-adaptation}

Evaluated **zero-shot** (applying public FOD-A weights directly to our own runway footage without native fine-tuning), the baseline model barely recognises metallic fasteners on local tarmac, achieving just **11.91% $\text{mAP@50}$** and **10.60% recall** due to differences in camera optics, grazing angle, solar glare, and aggregate texture. We resolved this domain gap in two sequential stages:
1. **Domain Fine-Tuning ($640 \times 640$):** Retraining YOLO11-S on $1,305$ frames of our own sun-lit tarmac footage across 3 random seeds ($0, 1, 2$) raised test $\text{mAP@50}$ from **11.91% to 87.7 ± 0.7%** and recall to **81.5 ± 0.7%**.
2. **High-Resolution Scaling ($1088 \times 1088$):** Increasing input resolution from $640$ to $1088$ reduced frame downsampling from $3.0\times$ to $1.76\times$ (preserving $\approx 14\text{ px}$ vs. $\approx 8\text{ px}$ fastener width), boosting test $\text{mAP@50}$ to **97.0 ± 1.4%**, strict $\text{mAP@50-95}$ to **69.1 ± 2.2%** (+14.3 pp), and recall to **92.7 ± 3.2%** while cutting false positives by **88%** ($8.3 \to 1.0$ false alarms across all $151$ test images) for only **$+0.9\text{ ms}$** additional latency on the A40 GPU.

Use the interactive seed selector and table below to inspect individual seed runs ($0, 1, 2$) alongside the 3-seed mean:

<YoloComparisonWidget4 />

<YoloComparisonWidget5 />

<YoloComparisonWidget6 />

<CardGrid :cols="2">

<Card title="640 × 640 Input: 8.3 False Alarms" accent="amber">

- **Mean False Positives (151 test frames):** **8.3** (individual runs: `15`, `5`, `5`)
- **Failure Mechanism:** At $3\times$ downsampling, a $24\text{ px}$ screw shrinks to $\approx 8\text{ px}$ (fitting inside a single $8 \times 8\text{ px}$ stride-8 feature block), making metallic fasteners indistinguishable from coarse asphalt aggregate and pavement cracks.

</Card>

<Card title="1088 × 1088 Input: 1.0 False Alarm (−88%)" accent="emerald">

- **Mean False Positives (151 test frames):** **1.0** (individual runs: `2`, `1`, `0`)
- ** Operational Impact:** Preserving $\approx 14\text{ px}$ across the fastener head retains edge and slot geometry, eliminating **88% of false UGV stops** at an incremental cost of just **~0.9 ms per frame** on the A40 GPU.

</Card>

</CardGrid>

::: details Video-level dataset partition and methodological boundaries

To prevent the temporal leakage diagnosed in Section 1, our native tarmac dataset ($1,552$ annotated frames across $16$ videos recorded in two sessions) was partitioned strictly **by video file**—no video appears in more than one split:

**Table 3.1: Native Runway Fastener Dataset Partition (Strict Video-Level Split)**

| Partition | Source Videos | Frame Count | Experimental Role |
| :--- | :--- | :--- | :--- |
| **Train** | 13 videos (6 from Session 1 + all 7 from Session 2) | $1,305$ | Sun-lit tarmac & 2 indoor lab sequences for weight optimization |
| **Validation** | 1 video (`spring washer sun`, Session 1) | $96$ | Early stopping & best-checkpoint selection |
| **Test** | 2 videos (`slotted screw sun`, `top big lock nut sun`, Session 1) | **$151$** | **Held-out evaluation (scored once, never seen during training)** |

**Why we trust this improvement:** Every configuration was trained three times with independent random seeds (`0`, `1`, `2`), and the worst $1088$ run ($95.7\%\text{ mAP@50}$, Seed 0) still outperformed the best $640$ run ($88.3\%\text{ mAP@50}$, Seed 0) by $+7.4\text{ percentage points}$.

**Current scope boundaries (to be addressed in Semester 2):**
1. *Unseen videos vs. unseen fastener classes:* Slotted screws and lock nuts also appear in Session 2 training videos recorded on different tarmac sections; thus, this benchmark validates generalization to **unseen videos and lighting angles**, rather than unseen fastener geometries.
2. *Empty-tarmac false-positive rate:* The held-out test set comprises $151$ frames across 2 videos where each frame contains a target fastener; false-alarm rates over long stretches of empty tarmac remain to be quantified.
3. *Camera shutter dynamics:* Semester 1 videos were captured using the interim UGREEN CM831 rolling-shutter webcam rather than at $15.1\text{ km/h}$ cruise speed with the global-shutter sensor.

:::

## 4. Future Work: Semester 2 Deployment Plan {#future-work}

With **YOLO11-S @ 1088 input** established as our current development baseline ($97.0\%\text{ mAP@50}$, $92.7\%$ recall, $1.0$ false alarm, $9.4\text{M}$ parameters), Semester 2 focuses on transitioning from offline GPU evaluation to closed-loop, real-time onboard perception and 3D ground localisation on the physical UGV.

<Card title="Current Development Baseline & Final Deployment Rule" accent="blue">

<Badge type="info" text="CURRENT DEVELOPMENT MODEL: YOLO11-S @ 1088 INPUT" />

**97.0% mAP@50 · 92.7% Recall · 1.0 False Alarm · 9.4M Parameters**  
**Final Deployment Rule:** Export both YOLO11-S and RT-DETR-L ($1088$ input) to TensorRT (FP16/INT8) on the Jetson companion computer and select the model that achieves the **highest recall within the $\le 33.3\text{ ms}$ ($\ge 10\text{–}30\text{ FPS}$) real-time budget** while leaving compute headroom for ROS 2 navigation.

</Card>

::: details Semester 2 Computer Vision engineering roadmap (5 core work packages)

| Work Package | Technical Scope & Implementation Plan | Target Deliverable |
| :--- | :--- | :--- |
| **1. Precision-Recall Tuning & Edge Performance** | Fine-tune further on hard negative cases (asphalt spalls, Aggregate cracks), sweep confidence threshold and NMS IoU to lock in the optimal F1 operating point, export weights to **TensorRT (FP16/INT8)**, and achieve **$\ge 10\text{ FPS}$ sustained real-time inference** on the Jetson with the ELP / global-shutter camera. | TensorRT engine + calibrated confidence/NMS operating point on Jetson. |
| **2. Weather & Onboard Lighting Robustness** | Collect multi-condition training data in **rain, night-time, and harsh solar glare**; design controlled **12 V onboard LED floodlighting** so FOD appearance remains invariant across ambient conditions, and benchmark each weather condition separately. | Controlled illumination rig + condition-stratified test metrics. |
| **3. SAHI Sliced Inference Evaluation** | Because a $5\text{ MP}$ sensor captures far more detail than a single $1088\text{ px}$ resize preserves, evaluate **Slicing Aided Hyper Inference (SAHI)**: slicing each frame into overlapping full-resolution tiles gives small FOD **$\approx 2.4\times$ more pixels**, extending the $32\text{ px}$ detection range **past $0.8\text{ m}$** (evaluating the $\approx 6\times$ per-frame inference cost trade-off, e.g., for stationary verification). | Range-extension vs. latency trade-off benchmark ($>0.8\text{ m}$ detection). |
| **4. Monocular FOD Ground Localisation** | Convert 2D bounding-box pixel coordinates $(u, v)$ into **real 3D ground distance $(X, Y)$** in the `base_link` frame using calibrated camera mounting height $H$, downward tilt $\theta$, and intrinsic matrix $K$, enabling the UGV to drive directly up to detected FOD for vacuum remediation. | ROS 2 pixel-to-ground homography node publishing 3D target poses. |
| **5. Wider Cross-Validated Field Testing** | Expand evaluation across **all 9 metallic fastener types**, multiple pavement surfaces, and separate recording days using **leave-one-video-out cross-validation** plus dedicated empty-tarmac false-alarm sweeps. | 9-class cross-validated confusion matrix + empty-runway false-alarm rate. |

:::

<!-- #endregion report -->

<CardGrid :cols="2">

<Card>

← [Previous Documentation](./vision-calculations.md)

**Computer Vision Calculations & Camera Geometry**

</Card>

<Card>

[Next Documentation](./vision-research.md) →

**Computer Vision Research & Sensor Modalities**

</Card>

</CardGrid>
