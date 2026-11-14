---
title: "Software & Development Environment"
description: "Software stack, ROS 2 selection and WSL2 development setup."
owner: "Hilbert Soh"
outline: [2, 3]
---

<!-- #region report -->

<Badge type="info" text="ROS 2 Jazzy Jalisco • Ubuntu 24.04 LTS • Gazebo Harmonic" />

The autonomous runway navigation and communications software was developed on **Ubuntu 24.04 LTS**, **ROS 2 Jazzy** [\[7\]](./references.md#ref-7), **Gazebo Harmonic**, **Nav2** [\[8\]](./references.md#ref-8), and **Eclipse CycloneDDS**. ROS 2 handles data exchange between sensing, state estimation, path planning, and actuator control, and Gazebo Harmonic is used for simulation before the physical vehicle is deployed.

#### 3.1.1 Why ROS 2 Jazzy? {#ros2-selection-rationale}

**ROS 2 Jazzy Jalisco** was selected for three reasons:

1. **Lifecycle Stability:** Jazzy is a Long-Term Support (LTS) release supported until May 2029 on Ubuntu 24.04 LTS, so its binaries stay stable for the whole project.
2. **Simulation Integration:** Jazzy works natively with Gazebo Harmonic through `ros_gz_bridge`, which carries simulated sensor data and motion setpoints without additional middleware bridges.
3. **Autonomy Tooling:** Full support for the core Nav2 packages used in this project: SmacPlannerHybrid [\[15\]](./references.md#ref-15) and Regulated Pure Pursuit [\[18\]](./references.md#ref-18).

The candidate distributions were compared on support window and dependency stability (see the comparison below).

#### 3.1.2 Development Setup (WSL2) {#wsl2-development-environment}

Ubuntu 24.04 LTS ran inside **Windows Subsystem for Linux 2 (WSL2)**. WSLg provides hardware-accelerated rendering (45–60 FPS observed in Gazebo), which made it possible to compile and run the simulation on the development hardware.

<Figure
  src="./assets/images/ros2-jazzy-wsl2-runtime.png"
  alt="ROS 2 Jazzy Development Environment in WSL2"
  caption="Figure 3.1.1: Terminal verification of Ubuntu 24.04 LTS, ROS 2 Jazzy, runway_sim_ws workspace, and core Nav2 packages in WSL2."
/>

Default DDS multicast discovery failed across the virtualized Hyper-V network switch between WSL2 and the external companion computer (Raspberry Pi 5), so **Eclipse CycloneDDS was configured with static unicast peering** to get around the multicast filtering. The network setup and verification tests are described in [Communications](./communications.md).

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
