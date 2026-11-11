---
title: "YOLO Model Comparison, Dataset Engineering & Deployment"
description: "FOD-A data leakage fix, 6 hazard superclasses, YOLOv8-S vs. YOLO11-S vs. RT-DETR-L benchmark, custom tarmac fine-tuning (640 px vs. 1088 px), live POC, and Semester 2 plan."
owner: "Gabriel Tan"
outline: [2, 3]
---

# YOLO Model Comparison, Dataset Engineering & Deployment

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page documents the FOD-A data leakage audit, 6-superclass hazard grouping, multi-architecture benchmark (YOLOv8-S, YOLO11-S, RT-DETR-L) on NVIDIA A40 GPUs, two-stage transfer learning onto our custom 1,552-image outdoor tarmac dataset ($640\text{ px}$ vs. $1088\text{ px}$ across 3 seeds), and live webcam proof-of-concept testing. TensorRT export on the Jetson Orin Nano Super, ELP global-shutter camera integration, and wider cross-validated testing are Semester 2 work.

<!-- #region report -->

<span id="sec-4-4-2"></span>

## 1. Dataset Engineering: Fixing FOD-A Leakage & Custom Tarmac Data {#leakage-audit}

### 1.1 Data Leakage in FOD-A & Video-Level Split

**FOD-A** [\[4\]](./references.md#ref-4) consists of **33,793 frames** cut from continuous videos. If the frames are shuffled and split at random, one frame lands in training and the very next frame lands in testing. Because consecutive video frames are nearly identical pictures, the model has effectively already seen the test answer. In a random split, **7,924 test frames** sit immediately adjacent to a training frame. Trained on a random split, **YOLO11-S scored 99.42% mAP50**—measuring memorisation rather than detection.

We split by **whole video segments** instead and discarded the frames in the transition window at each scene boundary (**3,416 frames** removed in total) as a buffer so nothing in the test set has a near-twin in training. Of the 33,793 frames, **30,377 were kept**: **23,592 in train**, **2,472 in validation**, and **4,313 in test**. With this honest video-level split, **YOLO11-S scored 50.29% mAP50**. Every benchmark reported after this uses this leak-free split.

<Card title="Impact of Video-Level Splitting on FOD-A">

**99.42% → 50.29% Test mAP50**  
*Random frame shuffle (7,924 leaked adjacent test frames) vs. whole-video segment split (30,377 clean frames kept; 3,416 boundary transition frames discarded).*

</Card>

<YoloComparisonWidget2 />

::: details Six hazard superclasses, custom tarmac dataset, and leak-free split protocol

<YoloComparisonWidget3 />

**1.2 Six Hazard Superclasses**

FOD-A was converted from Pascal VOC format and contains 30+ fine-grained classes, many with only a few sparse examples. Because distinguishing an M6 bolt from an M8 bolt does not change the airfield remediation action, we grouped the 30+ classes into **6 hazard superclasses**, with **Metallic Fasteners** as our primary focus (high hazard, and the smallest and hardest items to detect):

| Superclass | Examples | Hazard Level |
| :--- | :--- | :--- |
| **Metallic Tools** | Wrenches, pliers | High |
| **Metallic Fasteners** | Bolts, nuts, washers, screws | High *(Primary Focus)* |
| **Mineral Stone** | Stone, pavement debris | Moderate |
| **Hazardous Chemical / Liquid** | Spills | Operational |
| **Polymer Rubber** | Tyre debris | Moderate |
| **Organic / Paper** | Paper, boxes, birds | Low |

**1.3 Custom Outdoor Tarmac Dataset (1,552 Images, 16 Videos)**

Because FOD-A was not filmed under the viewing geometry and surface conditions our UGV will encounter, we recorded our own dataset on outdoor tarmac: **1,552 images from 16 videos** covering **9 fastener types** (*hex bolt, hex cap screw, flathead Phillips screw, slotted screw, flat washer, spring washer, lock nut, long nail, and partial-thread Allen bolt*) across direct sun, shade, and overcast light. Frames were sampled at `1 FPS` and hand-labelled in Roboflow under a single class (`Metallic Fasteners`), split strictly by video to prevent frame leakage:

| Split | Videos | Images | Contents |
| :--- | :--- | :--- | :--- |
| **Train** | 12 | $1,305$ | Remaining fastener videos |
| **Validation** | 2 | $96$ | Spring washer; mixed scene |
| **Test** | 2 | $151$ | Slotted screw; lock nut |

*Methodological note:* The test videos were recorded on the same day and site as training at different times (under different sun angles), covering 2 of the 9 fastener types on one surface. The Section 3 results should be read with that boundary in mind.

:::

## 2. Architecture Benchmark & Model Selection {#benchmark-matrix}

We trained **YOLOv8-S**, **YOLO11-S**, and **RT-DETR-L** on the leak-free FOD-A split. All three started from COCO weights and trained for `30 epochs` at `640 px` input using AdamW and batch size `32` (`16` for RT-DETR-L) on NVIDIA A40 GPUs on the NUS HPC cluster (RT-DETR-L reached the cluster wall-time limit at epoch 27 of 30). Latency is measured per image at batch size 1 on the A40.

| Model | Params / GFLOPs | Precision | Recall | mAP50 | mAP50-95 | Training Time | Latency (A40) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **YOLOv8-S** | $11.1\text{M} / 28.7$ | $65.7\%$ | $42.3\%$ | $47.1\%$ | $34.6\%$ | $0.84\text{ h}$ | $3.0\text{ ms}$ |
| **YOLO11-S** | **$9.4\text{M} / 21.7$** | **$75.6\%$** | $42.5\%$ | $50.3\%$ | $39.6\%$ | $0.92\text{ h}$ | **$3.0\text{ ms}$** |
| **RT-DETR-L** | $32.0\text{M} / 105.4$ | $63.7\%$ | **$55.8\%$** | **$63.4\%$** | **$48.3\%$** | $3.91\text{ h}$ | $24.2\text{ ms}$ |

<YoloComparisonWidget1 />

**Why We Selected YOLO11-S:**
- **Outperforms YOLOv8-S:** Gains $+10\text{ pts}$ precision ($75.6\%$ vs. $65.7\%$) and $+5\text{ pts}$ mAP50-95 ($39.6\%$ vs. $34.6\%$) with fewer parameters ($9.4\text{M}$ vs. $11.1\text{M}$) at the exact same $3\text{ ms}$ latency.
- **8× Faster than RT-DETR-L:** Executes in $3\text{ ms}$ vs. $24.2\text{ ms}$ with $5\times$ fewer GFLOPs ($21.7$ vs. $105.4$), preserving compute headroom on the Jetson.
- **Headroom to Raise Resolution:** Even at $1088\text{ px}$ input, YOLO11-S requires less compute than RT-DETR-L at $640\text{ px}$.
- **4× Faster Training:** $0.92\text{ h}$ vs. $3.91\text{ h}$ per run, allowing multi-seed iterations.

*Trade-offs accepted:* RT-DETR-L achieved higher overall accuracy on FOD-A ($+13\text{ pts}$ mAP50, $+13\text{ pts}$ recall), and YOLOv8-S scored slightly higher on COCO small-object AP ($37.8\%$ vs. $35.1\%$ for objects under $32^2\text{ px}$). Domain fine-tuning and raising input resolution to $1088\text{ px}$ in Section 3 closed most of that gap for fasteners.

::: details Per-class YOLO11-S results on the leak-free FOD-A split

| Superclass | Test Instances | Precision | Recall | mAP50 | mAP50-95 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Metallic Tools** | $1,176$ | $59.1\%$ | $43.9\%$ | $50.7\%$ | $42.0\%$ |
| **Metallic Fasteners** | **$1,798$** | **$97.4\%$** | **$31.7\%$** | **$46.8\%$** | **$34.0\%$** |
| **Mineral Stone** | $38$ | $85.8\%$ | $94.7\%$ | $97.1\%$ | $66.8\%$ |
| **Hazardous Chemical** | $99$ | $96.2\%$ | $29.3\%$ | $44.2\%$ | $38.8\%$ |
| **Polymer Rubber** | $242$ | $65.5\%$ | $47.8\%$ | $51.9\%$ | $50.1\%$ |
| **Organic Paper** | $1,000$ | $49.7\%$ | $7.6\%$ | $11.0\%$ | $5.6\%$ |

For **Metallic Fasteners** ($1,798$ test instances), precision is high ($97.4\%$) but recall is only **$31.7\%$**—meaning the general FOD-A model misses roughly 2 in 3 fasteners. (Note that *Mineral Stone* has only 38 test instances, so its score is not statistically reliable.) This recall deficit directly motivated our two-stage fine-tuning on native tarmac fastener data below.

:::

## 3. Training Iterations & Multi-Seed Results on Tarmac {#domain-adaptation}

Each training iteration changes exactly one variable so the cause of each gain is isolated. Following Reis et al. [\[3\]](./references.md#ref-3), we use two-stage transfer learning: starting from the leak-free FOD-A YOLO11-S checkpoint, we fine-tune on our custom tarmac dataset at $640\text{ px}$ and then scale input resolution to $1088\text{ px}$.

| Iteration | Change | Input Size | Precision | Recall | mAP50 | mAP50-95 | Model Cycle (A40) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0 (Baseline)** | FOD-A model, zero-shot on tarmac | $640\text{ px}$ | $45.4\%$ | $10.6\%$ | $11.9\%$ | $4.6\%$ | $4.0\text{ ms}$ |
| **1 (Fine-Tuned)** | Fine-tuned on tarmac (3 seeds) | $640\text{ px}$ | $95.8 \pm 1.0\%$ | $81.5 \pm 0.7\%$ | $87.7 \pm 0.7\%$ | $54.8 \pm 1.2\%$ | $4.1\text{ ms}$ |
| **2 (High-Res)** | Input raised to $1088\text{ px}$ (3 seeds) | **$1088\text{ px}$** | **$98.6 \pm 1.3\%$** | **$92.7 \pm 3.2\%$** | **$97.0 \pm 1.4\%$** | **$69.1 \pm 2.2\%$** | **$8.0\text{ ms}$** |

- **Iteration 0 — Zero-Shot Baseline ($640\text{ px}$):** Running the leak-free FOD-A YOLO11-S model unchanged on our tarmac test set gave **$10.6\%$ recall** and **$11.9\%$ mAP50**—missing 9 in 10 fasteners because FOD-A was filmed with different cameras, heights, angles, ground textures, and lighting.
- **Iteration 1 — Fine-Tuning on Our Data ($640\text{ px}$):** Fine-tuning the same model on our $1,305$ tarmac training images raised mAP50 from $11.9\%$ to **$87.7 \pm 0.7\%$** and recall from $10.6\%$ to **$81.5 \pm 0.7\%$** (finding 4 in 5 fasteners). However, it still missed about 1 in 5 fasteners and produced loose boxes ($54.8\%$ mAP50-95) because at $640\text{ px}$ a fastener $2\text{ m}$ away is shrunk to only $\approx 9\text{ px}$ wide.
- **Iteration 2 — Raising Input Resolution ($1088\text{ px}$):** We chose $1088\text{ px}$ because it is a multiple of YOLO's $32\text{ px}$ stride and fits batch size 16 on the A40 GPU. The $2.9\times$ increase in pixel area ($1088^2 \div 640^2$) resulted in only a $1.95\times$ increase in measured model cycle time ($4.1 \rightarrow 8.0\text{ ms}$ on the A40), while boosting **mAP50 by $+9.3\text{ pts}$ to $97.0 \pm 1.4\%$**, **mAP50-95 by $+14.3\text{ pts}$ to $69.1 \pm 2.2\%$**, and **recall by $+11.2\text{ pts}$ to $92.7 \pm 3.2\%$**.

<YoloComparisonWidget4 />

<YoloComparisonWidget5 />

<YoloComparisonWidget6 />

::: details Training configuration, 3-seed validation table, and confidence threshold analysis

**Training Configuration Table**

| Setting | FOD-A Benchmark | Tarmac Fine-Tuning |
| :--- | :--- | :--- |
| **Initial Weights** | COCO-pretrained | Leak-free FOD-A YOLO11-S |
| **Epochs** | $30$ | $30$ |
| **Batch Size** | $32$ ($16$ for RT-DETR-L) | $16$ |
| **Input Size** | $640\text{ px}$ | $640\text{ px}$, then $1088\text{ px}$ |
| **Optimiser** | AdamW (auto) | AdamW, $\text{lr} = 0.002$ (Ultralytics auto: $0.002 \times 5/(4 + n_c)$, $n_c = 1$) |
| **Augmentation** | Mosaic $1.0$ (off last 10 epochs), flip $0.5$, scale $0.5$, translate $0.1$, HSV $0.015 / 0.7 / 0.4$ | Same |
| **Numeric Format** | Mixed FP16/FP32 (AMP) | Mixed FP16/FP32 (AMP) |

**Multi-Seed Validation ($640\text{ px}$ vs. $1088\text{ px}$ Across Seeds 0, 1, 2)**

Because a single training run can be lucky due to random image ordering, mosaic stitching, and layer initialization, each resolution was trained 3 times with different seeds on the exact same train/val/test split:

| Metric | $640\text{ px}$ (Seeds 0 / 1 / 2) | $640\text{ px}$ Mean ± SD | $1088\text{ px}$ (Seeds 0 / 1 / 2) | $1088\text{ px}$ Mean ± SD |
| :--- | :--- | :--- | :--- | :--- |
| **mAP50 (%)** | $88.3 / 86.9 / 88.0$ | **$87.7 \pm 0.7$** | $95.7 / 97.0 / 98.4$ | **$97.0 \pm 1.4$** |
| **mAP50-95 (%)** | $55.8 / 55.1 / 53.4$ | **$54.8 \pm 1.2$** | $69.4 / 66.8 / 71.2$ | **$69.1 \pm 2.2$** |
| **Precision (%)** | $96.8 / 95.6 / 94.9$ | **$95.8 \pm 1.0$** | $97.1 / 99.2 / 99.4$ | **$98.6 \pm 1.3$** |
| **Recall (%)** | $82.1 / 81.5 / 80.8$ | **$81.5 \pm 0.7$** | $89.2 / 93.4 / 95.4$ | **$92.7 \pm 3.2$** |

$1088\text{ px}$ outperforms $640\text{ px}$ on every single seed, and the gains ($+9.3\text{ pts}$ mAP50, $+14.3\text{ pts}$ mAP50-95, $+11.2\text{ pts}$ recall) are far larger than the seed-to-seed spread ($\pm 1\text{–}3\text{ pts}$).

**Error Analysis & Confidence Threshold Selection**

For the $1088\text{ px}$ model evaluated at Seed 0 with the default confidence threshold of `0.25`, the confusion matrix shows $89\%$ of test fasteners detected and $11\%$ missed, with $\approx 97\%$ precision ($\approx 3\%$ false detections). Because recall is our primary operational priority, the deployed confidence threshold will be chosen directly from the Precision–Recall (PR) curve in Semester 2 rather than relying on the `0.25` default.

:::

## 4. Inference, Live POC, Limitations & Semester 2 Plan {#future-work}

### 4.1 Offline Video Benchmark & Live Webcam POC

- **Offline Video Benchmark (NVIDIA A40):** Running the $1088\text{ px}$ YOLO11-S model on a recorded tarmac video on the A40 (PyTorch 2.6, FP16) required **$8.0\text{ ms}$ per frame** for the model ($1.2\text{ ms}$ pre-processing, $4.3\text{ ms}$ inference, and $2.5\text{ ms}$ post-processing). The complete end-to-end pipeline—including video decoding, bounding-box rendering, HUD overlay, and video writing—ran at **26.9 FPS** across $2,709$ frames.
- **Live Detection POC & Operator Triage HUD:** We tested the fine-tuned $1088\text{ px}$ YOLO11-S model live on a laptop webcam using our custom operator HUD (displaying object count, live FPS, adjustable confidence threshold, automatic snapshot logging, and three alert tiers: *High Critical* for tools, *Critical* for fasteners and stone, and *Low* for paper and rubber) over an indoor wooden floor never seen in training:
  - **Detection Accuracy:** All **7 / 7 fasteners** were detected and flagged `THREAT: CRITICAL` with steady $70\text{–}86\%$ confidence.
  - **Confidence Tuning:** At the default `0.25` threshold, floor grain triggered false boxes; raising the threshold to `0.70` eliminated every false positive while retaining all 7 fasteners.
  - **Throughput Limitation:** Running unoptimized on a laptop CPU achieved **3.6 FPS**, below our $4.7\text{ FPS}$ minimum ($10\text{ FPS}$ target), confirming the need for TensorRT acceleration on the Jetson GPU.

### 4.2 Key Takeaways & Current Limitations

1. **The leak changed everything:** A random split on FOD-A gave $99.42\%$ mAP50 vs. $50.29\%$ on the honest video split; any comparison on a leaky split measures memory, not detection.
2. **Domain data mattered more than model architecture:** Fine-tuning on $1,305$ tarmac images raised mAP50 by $\approx 76\text{ pts}$ ($11.9\% \rightarrow 87.7\%$), far outweighing architecture differences.
3. **Resolution sets detection range:** The optical pixel calculations and the $640 \rightarrow 1088\text{ px}$ training results agree that input resolution, camera geometry, and object size jointly determine how far ahead a fastener can be resolved.
4. **Current Scope Limitations:**
   - The held-out test set covers **2 of 9 fastener types** recorded at one site on one day.
   - The Semester 1 detector runs at $1088\text{ px}$ input, reaching $32\text{ px}$ width out to $\approx 0.8\text{ m}$ (whereas $1\text{ cm}$ objects only reach $32\text{ px}$ across out to $\approx 0.60\text{ m}$).
   - The fine-tuned tarmac model is single-class (`Metallic Fasteners`), so full three-tier hazard triage requires merging with the 6-class model or training a multi-class tarmac dataset.
   - Training footage came from a smartphone; transitioning to the ELP camera introduces a second optical domain shift that must be verified upon delivery.

::: details Semester 2 Computer Vision roadmap (5 work packages)

| Work Package | Scope & Engineering Action | Target Outcome |
| :--- | :--- | :--- |
| **1. Precision–Recall Tuning & TensorRT Performance** | Fine-tune further on hard cases, sweep confidence threshold and NMS IoU on the PR curve, export to TensorRT, and benchmark on the Jetson Orin Nano Super with the ELP camera. | **$\ge 10\text{ FPS}$** sustained real-time inference on the Jetson at the optimal PR operating point. |
| **2. Weather & Onboard Lighting** | Collect training data in rain, at night, and in harsh solar glare; design regulated onboard LED lighting so FOD looks consistent across ambient conditions, and test each condition separately. | Condition-isolated precision/recall benchmarks across day, night, rain, and glare. |
| **3. SAHI High-Resolution Tile Slicing** | Because the 5 MP camera captures much finer detail than a $1088\text{ px}$ input, slice each frame into overlapping native-resolution tiles to give small FOD **$\approx 2.4\times$ more pixels** (trading off $\approx 6\times$ inference cost per frame). | Extend the $32\text{ px}$ fastener detection range **past $0.8\text{ m}$** across the full GNSS look-ahead band. |
| **4. Monocular FOD Ground Localisation** | Convert detected bounding-box pixel coordinates into metric ground distance using calibrated camera height $h = 0.45\text{ m}$ and tilt $\theta = 33^\circ$, and publish target coordinates on a ROS 2 topic. | Closed-loop UGV terminal approach and vacuum alignment over detected FOD. |
| **5. Wider Cross-Validated Testing** | Evaluate across all **9 fastener types**, multiple tarmac/concrete surfaces, and separate days with rotated test videos (**cross-validation by video**). | Statistically grounded multi-video confidence intervals and empty-runway false-alarm rates. |

:::

<!-- #endregion report -->

<CardGrid :cols="2">

<Card>

← [Previous Documentation](./vision-calculations.md)

**Computer Vision Calculations & Camera Geometry**

</Card>

<Card>

[Next Documentation](./vision-research.md) →

**Computer Vision Research & Task Formulation**

</Card>

</CardGrid>
