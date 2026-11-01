---
title: "YOLO Model Comparison & Edge Benchmark"
description: "Quantitative architecture evaluation, public benchmark leakage audit, and native runway tarmac resolution scaling for small metallic fasteners."
owner: "Gabriel Tan"
outline: [2,3]
---
# YOLO Model Comparison & Edge Benchmark

Quantitative architecture evaluation, public benchmark leakage audit, and native runway tarmac resolution scaling for small metallic fasteners.

<!-- #region report -->

<!-- Report summary (the Report's section text). The detailed write-up follows. -->

## 🔍 YOLO Model Comparison & Benchmarking {#sec-4-4-2}

<Badge type="tip" text="Model Evaluation" />

A comparative evaluation of candidate YOLO architectures across accuracy (mAP50-95), inference latency on target hardware, parameter size, and edge deployment feasibility:

| Model Architecture | mAP@50 (%) | mAP@50-95 (%) | Inference Latency (ms) | Parameters (M) | Model Size (MB) | Selection Status |
| --- | --- | --- | --- | --- | --- | --- |
| **YOLOv8n (Nano)** | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] |
| **YOLOv8s (Small)** | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] |
| **YOLOv8m (Medium)** | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] |
| **YOLOv11n (Nano)** | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] |
| **YOLOv11s (Small)** | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] | \[To be filled in\] |


## Dataset Leakage Audit {#leakage-audit}

<Badge type="danger" text="Methodological Finding" />

<Card>

99.42% → 50.29%

YOLO11-S test mAP@50 before and after fixing the split

</Card>

The public FOD-A dataset was extracted from a continuous video. Random frame shuffling distributed temporally adjacent frames across train and test sets, inflating reported mAP@50 to ~99% through background asphalt memorization. Enforcing scene-level separation with temporal buffer gaps eliminates visual leakage, revealing the true generalisation baseline.

<YoloComparisonWidget2 />

<YoloComparisonWidget3 />

## Model Performance Benchmarks {#benchmark-matrix}

<Badge type="tip" text="NVIDIA A40 • 30 Epochs" />

<YoloComparisonWidget1 />

<Badge type="info" text="SELECTION FRAMEWORK" />

### Decision rule: highest-recall model that runs within 33 ms on the Jetson Orin

- **Architecture Trade-off:** RT-DETR-L has +20.1 pp recall on FOD-A but is 3.5x larger (32.8M vs 9.4M parameters); whether it fits the 33 ms Orin latency budget is untested.
- **Why YOLO11-S is the Development Model:** YOLO11-S is the development model because it trains ~4x faster (0.92 h vs 3.91 h per run on an A40). This dramatic turnaround made iterating on own-data multi-seed experiments practical under capstone compute constraints.
- **Semester 2 Plan:** Fine-tune RT-DETR-L on the same fastener split at 1088, then benchmark both models on the Orin with TensorRT. The decision rule will then pick the final model.

::: details Why use these specific models?

Fixing model scale at 'S' isolates architecture as the sole experimental variable. 'S' is also the largest size class likely to fit within the 33 ms real-time inference deadline on the Jetson Orin. In addition, RT-DETR-L (32.8M) is the smallest official RT-DETR variant available in Ultralytics.

:::

::: details Why is val so much higher than test?

Validation mAP (85–93%) is substantially higher than clean test mAP (47–68%) due to overfitting that occurs after mosaic data augmentation switches off at epoch 20. On the clean test partition, specific classes suffer from cross-category confusion: Hazardous Chemical is only 31% correct (49% predicted as Metallic Tools), and Mineral Stone has 30% missed detections.

:::

## Runway Adaptation & Small Fastener Resolution Scaling {#domain-adaptation}

<Badge type="info" text="Own runway footage • 3 seeds • 151 test fasteners" />

Zero-shotEvaluating public dataset model weights directly on runway footage without native fine-tuning., the FOD-A model barely recognises fasteners on our own tarmac: 11.91% mAP@50 and 10.60% recall. Our camera, viewing angle, lighting and asphalt differ from FOD-A. We fixed this in two steps: retraining YOLO11-S on our own UGREEN 1080p videos, then raising the input size from 640 to 1088 so small fasteners keep more pixels.

What this shows: How well each version finds the fasteners in two test videos it never trained on. Higher is better in every column.

<YoloComparisonWidget4 />

<YoloComparisonWidget5 />

Each setting was trained 3 times with different random seeds to check the result isn't luck. Precision and recall at Ultralytics' best-F1 threshold.

<YoloComparisonWidget6 />

🎯 Fewer false alarms

What this shows: A false alarm is when the model draws a box on something that isn't a fastener, such as a stone or a crack in the asphalt. Each one would make the robot stop for nothing. We counted them across all 151 test images.

8.3

at 640 input

(average of 3 runs: 15, 5, 5)

→

1.0

at 1088 input

(2, 1, 0)

<Card accent="emerald">

Higher input size cuts false alarms by about 88%, for roughly 0.9 ms more per frame on the A40 GPU.

</Card>

Video-Level Dataset Partition

What this shows: Which videos were used for what. No video appears in more than one row, so the test is on footage the model has never seen.

| Partition | Videos | Frames | Role |
| --- | --- | --- | --- |
| **Train** | 13 videos: 6 from session 1 + all 7 from session 2 | 1,305 | Sun-lit tarmac + 2 lab videos |
| **Val** | spring washer sun (S1) | 96 | Picking the best training epoch |
| **Test** | slotted screw sun, top big lock nut sun (S1) | **151** | **Scored once, never trained on** |

Why we trust this: no test video was seen in training, and each setting was trained three times. The worst 1088 run (95.7% mAP@50) still beat the best 640 run (88.3%).

::: details Limits of this result

Slotted screws and lock nuts also appear in session 2 training videos, so this tests unseen videos, not unseen fastener types. The test set is small (151 fasteners, 2 videos) and every test frame contains a fastener, so false alarms on empty tarmac are not yet measured. The footage was shot with a rolling-shutter webcam, not at driving speed.

:::

## Future Work: Semester 2 Deployment Plan {#future-work}

<Badge type="info" text="Semester 2" />

The model works on our footage. These steps decide which model goes on the robot and prove it works in real conditions.

Deployment decision

<Badge type="info" text="CURRENT DEVELOPMENT MODEL" />

### YOLO11-S @ 1088 input

97.0% mAP@50, 92.7% recall and 1.0 false alarm on our held-out videos. At 9.4M parameters it is the lighter option; whether it leaves headroom on the Jetson for navigation and control is still to be measured.

Rule: pick the model with the highest recall that runs within 33 ms per frame on the Jetson Orin.

Semester 2 Action Plan

Edge optimisation

⚙️

**TensorRT on the Jetson:** convert both models to FP16 and INT8; measure p95 latency and power.

📐

**Model size tuning:** try other models if latency headroom allows.

Data

📷

**Record with the IMX568 global-shutter camera** at driving speed to feed the model for better fine tuning.

🌪️

**Weather conditions:** add data with different weathering conditions to improve robustness.

Validation

🔍

**Empty-tarmac test:** count false alarms on footage with no fasteners.

<!-- #endregion report -->

<CardGrid :cols="2">

<Card>

←

[Previous](./vision-calculations.md)

Computer Vision Calculations

</Card>

<Card>

[Next Page](./vision-research.md)

Computer Vision Research →

</Card>

</CardGrid>
