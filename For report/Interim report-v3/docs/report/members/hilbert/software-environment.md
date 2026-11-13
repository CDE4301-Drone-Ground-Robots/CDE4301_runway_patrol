---
title: "Software & Development Environment"
description: "Software stack, ROS 2 selection and WSL2 development setup."
owner: "Hilbert Soh"
outline: [2, 3]
---

<!-- #region report -->

<Badge type="info" text="ROS 2 Jazzy Jalisco • Ubuntu 24.04 LTS • Gazebo Harmonic" />

The autonomous runway navigation and communications software was developed on **Ubuntu 24.04 LTS**, **ROS 2 Jazzy** [\[7\]](./references.md#ref-7), **Gazebo Harmonic**, **Nav2** [\[8\]](./references.md#ref-8), and **Eclipse CycloneDDS**. ROS 2 provides the middleware layer for data exchange across sensing, state estimation, path planning, and actuator control, while Gazebo Harmonic serves as the simulation environment prior to physical vehicle deployment.

#### 3.1.1 Why ROS 2 Jazzy? {#ros2-selection-rationale}

**ROS 2 Jazzy Jalisco** was selected based on three criteria:

1. **Lifecycle Stability:** As a Long-Term Support (LTS) release supported through May 2029 on Ubuntu 24.04 LTS, Jazzy provides binary stability throughout the project development cycle.
2. **Simulation Integration:** Native compatibility with Gazebo Harmonic via `ros_gz_bridge` enables transport of simulated sensor streams and motion setpoints without intermediate middleware bridges.
3. **Autonomy Tooling:** Full support for core Nav2 packages, specifically SmacPlannerHybrid [\[15\]](./references.md#ref-15) and Regulated Pure Pursuit [\[18\]](./references.md#ref-18).

Candidate distributions were evaluated against operational support windows and dependency stability (detailed in the comparison below).

#### 3.1.2 Development Setup (WSL2) {#wsl2-development-environment}

Ubuntu 24.04 LTS was hosted within **Windows Subsystem for Linux 2 (WSL2)**, leveraging hardware-accelerated rendering through WSLg (yielding an observed 45–60 FPS in Gazebo) to enable compilation and simulation on development hardware.

<Figure
  src="./assets/images/ros2-jazzy-wsl2-runtime.png"
  alt="ROS 2 Jazzy Development Environment in WSL2"
  caption="Figure 3.1.1: Terminal verification of Ubuntu 24.04 LTS, ROS 2 Jazzy, runway_sim_ws workspace, and core Nav2 packages in WSL2."
/>

Because default DDS multicast discovery failed across the virtualized Hyper-V network switch between the WSL2 environment and the external companion computer (Raspberry Pi 5), **Eclipse CycloneDDS was configured with static unicast peering** to bypass virtual network multicast filtering. Network architecture and verification tests are documented in [Communications](./communications.md).

::: details ROS 2 Distribution Comparison

The following summarizes the alternatives considered when the software baseline was chosen. Support windows follow the ROS 2 distribution release schedule.

<table class="data-table"><tbody>
<tr><th>ROS 2 Distribution</th><th>Support Window</th><th>Target OS</th><th>Assessment</th><th>Decision</th></tr>
<tr><td><img src="./assets/images/lyrical-small.png" alt="Lyrical Luth"> Lyrical Luth (LTS)</td><td>May 2026 – May 2031</td><td>Ubuntu 26.04 LTS</td><td>Newer LTS release, but changing the OS and checking driver compatibility would add migration work.</td><td><Badge type="info" text="Deferred" /></td></tr>
<tr><td><img src="./assets/images/kilted-small.png" alt="Kilted Kaiju"> Kilted Kaiju (STS)</td><td>May 2025 – Nov 2026</td><td>Ubuntu 24.04 LTS</td><td>Short-term release with a support window that ends during the project.</td><td><Badge type="info" text="Not selected" /></td></tr>
<tr><td><img src="./assets/images/jazzy-small.png" alt="Jazzy Jalisco"> Jazzy Jalisco (LTS)</td><td>May 2024 – May 2029</td><td>Ubuntu 24.04 LTS</td><td>Matches the development OS and Gazebo Harmonic setup; supports the Nav2 tools used in the project.</td><td><Badge type="info" text="Selected" /></td></tr>
<tr><td><img src="./assets/images/humble-small.png" alt="Humble Hawksbill"> Humble Hawksbill (LTS)</td><td>May 2022 – May 2027</td><td>Ubuntu 22.04 LTS</td><td>Would require an older Ubuntu baseline and offers a shorter remaining support period.</td><td><Badge type="info" text="Not selected" /></td></tr>
</tbody></table>

:::

<!-- #endregion report -->
