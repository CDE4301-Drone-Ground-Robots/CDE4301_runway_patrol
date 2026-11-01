---
title: "Software & Development Environment"
description: "Core robotics software stack, ROS 2 Jazzy selection rationale, and Semester 1 WSL2 SIL environment."
owner: "Hilbert Soh"
outline: [2, 3]
---

<!-- #region report -->

<Badge type="info" text="ROS 2 Jazzy Jalisco • Ubuntu 24.04 LTS • Gazebo Harmonic" />

The autonomous runway inspection UGV requires a robust, long-term computational middleware stack to orchestrate real-time sensor processing, state estimation, path planning, and inter-agent command-and-control (C2) communications. For Semester 1 development, the software stack was standardized on **Ubuntu 24.04 LTS (Noble Numbat)**, **ROS 2 Jazzy Jalisco** ([\[7\]](./references.md#ref-7)), **Gazebo Harmonic (GZ 8.x)**, the **Nav2** autonomous navigation stack ([\[8\]](./references.md#ref-8)), and **Eclipse CycloneDDS**.

#### Middleware Selection Rationale {#ros2-selection-rationale}

Architectural selection follows a five-tier engineering dependency chain:

<div class="dependency-chain">

**ROS 2 Jazzy (LTS)** → **Ubuntu 24.04 LTS** → **Gazebo Harmonic (GZ 8.x)** → **Nav2 Stack Maturity** → **Hardware Drivers & micro-ROS**

</div>

ROS 2 Jazzy was selected as the foundational baseline over alternative releases based on multi-criteria engineering evaluation:

1. **LTS Longevity & Kernel Alignment:** Released in May 2024 with official support through May 2029, Jazzy aligns natively with Ubuntu 24.04 LTS and Linux Kernel 6.8+, guaranteeing five years of upstream security patches and API stability for multi-year capstone continuity.
2. **First-Party Simulation Integration:** Jazzy is the native LTS pairing for Gazebo Harmonic via `ros_gz_bridge`, eliminating the fragile dependency shims and deprecated transport layers of legacy Gazebo Classic.
3. **Ecosystem & Driver Maturity:** Nav2's Smac Planner ([\[19\]](./references.md#ref-19)) and Regulated Pure Pursuit (RPP) controllers ([\[22\]](./references.md#ref-22)) are fully validated on Jazzy binaries, alongside stable micro-ROS firmware bridges and RTK-GNSS sensor interfaces.

#### Development Environment (WSL2 SIL) {#wsl2-development-environment}

During Semester 1, software-in-the-loop (SIL) development and high-fidelity simulation were hosted on an engineering workstation running Ubuntu 24.04 LTS inside **Windows Subsystem for Linux (WSL2)**. Graphics-intensive Gazebo Harmonic simulation achieves 45–60 FPS rendering via WSLg DirectX D3D12 GPU paravirtualization without CPU bottlenecking. Virtualized NAT limitations on standard DDS multicast were resolved by configuring Eclipse CycloneDDS static unicast peering, establishing deterministic inter-process communication between simulation nodes and the UAV companion computer.

::: details ROS 2 Distribution Comparison

<table class="data-table"><tbody>
<tr><th>ROS 2 Distribution</th><th>Support Window</th><th>Target OS & Kernel</th><th>Simulation & Nav2 Integration</th><th>Selection Evaluation</th></tr>
<tr><td><img src="./assets/images/lyrical-small.png" alt="Lyrical Luth"> Lyrical Luth (LTS) Released May 2026 LTS</td><td>May 2026 – May 2031</td><td>Ubuntu 26.04 LTS (Kernel 6.14+)</td><td>Unreleased during baseline architecture; vendor hardware drivers and micro-ROS packages remain unported to Ubuntu 26.04. Migrating mid-project introduces critical driver instability ("ecosystem lag").</td><td><Badge type="info" text="Deferred (Ecosystem Stability)" /></td></tr>
<tr><td><img src="./assets/images/kilted-small.png" alt="Kilted Kaiju"> Kilted Kaiju (STS) Short-Term Support</td><td>May 2025 – Nov 2026</td><td>Ubuntu 24.04 LTS (Kernel 6.8+)</td><td>Non-LTS stepping stone; 18-month lifecycle reaches EOL during the project timeline. Lacks vendor long-term maintenance.</td><td><Badge type="info" text="Rejected (18-Month STS)" /></td></tr>
<tr><td><img src="./assets/images/jazzy-small.png" alt="Jazzy Jalisco"> Jazzy Jalisco (LTS) Current Capstone Baseline</td><td>May 2024 – May 2029</td><td>Ubuntu 24.04 LTS (Kernel 6.8+)</td><td>Official LTS pairing with Gazebo Harmonic (GZ 8.x) via <code>ros_gz_bridge</code>; mature Nav2 Smac & RPP binaries; validated micro-ROS and RTK sensor drivers.</td><td><Badge type="info" text="SELECTED (Capstone Baseline)" /></td></tr>
<tr><td><img src="./assets/images/humble-small.png" alt="Humble Hawksbill"> Humble Hawksbill (LTS) Legacy LTS</td><td>May 2022 – May 2027</td><td>Ubuntu 22.04 LTS (Kernel 5.15)</td><td>Paired with deprecated Gazebo Classic 11 / Fortress; nearing EOL.</td><td><Badge type="info" text="Evaluated &amp; Superseded" /></td></tr>
</tbody></table>

:::

<!-- #endregion report -->

