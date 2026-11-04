---
title: "Software & Development Environment"
description: "Software stack, ROS 2 selection and WSL2 development setup."
owner: "Hilbert Soh"
outline: [2, 3]
---

<!-- #region report -->

<Badge type="info" text="ROS 2 Jazzy Jalisco • Ubuntu 24.04 LTS • Gazebo Harmonic" />

We used **Ubuntu 24.04 LTS**, **ROS 2 Jazzy** ([\[7\]](./references.md#ref-7)), **Gazebo Harmonic**, **Nav2** ([\[8\]](./references.md#ref-8)) and **CycloneDDS** to develop the UGV navigation and UAV–UGV communication software. ROS 2 handles data exchange between sensors, localization, planning and control nodes. Gazebo provides the simulation environment used before physical UGV integration.

#### Why ROS 2 Jazzy? {#ros2-selection-rationale}

We selected **ROS 2 Jazzy** for three reasons:

1. **Long-term support:** Jazzy is an LTS release supported through May 2029. It runs on Ubuntu 24.04 LTS, providing a stable development baseline.
2. **Simulation compatibility:** Jazzy integrates with Gazebo Harmonic through `ros_gz_bridge`, allowing simulated sensors and robot commands to communicate with ROS 2 nodes.
3. **Navigation tools:** Jazzy supports the Nav2 planners and controllers used in our work, including Smac Planner ([\[19\]](./references.md#ref-19)) and Regulated Pure Pursuit ([\[22\]](./references.md#ref-22)).

We considered other ROS 2 releases, but chose Jazzy to avoid changing the operating system and software dependencies during development. The comparison is available below.

#### Development Setup (WSL2) {#wsl2-development-environment}

We ran Ubuntu 24.04 inside **Windows Subsystem for Linux 2 (WSL2)** on the development laptop. This allowed us to develop ROS 2 packages and run Gazebo Harmonic without a separate Linux computer. The original setup notes report approximately **45–60 FPS** for Gazebo rendering through WSLg; this is a reported observation, not a standardized performance benchmark.

We encountered a networking issue when connecting ROS 2 nodes in WSL2 to the external Raspberry Pi 5: DDS multicast discovery did not work reliably across the virtualized network. We configured **CycloneDDS static unicast peers** so the machines could discover each other using known addresses. The configuration and tests are documented in [Communications](./communications.md).

::: details ROS 2 Distribution Comparison

The following summarizes the alternatives considered when the software baseline was chosen. Support dates and compatibility statements reflect the original project comparison and should be checked against official release documentation before submission.

<table class="data-table"><tbody>
<tr><th>ROS 2 Distribution</th><th>Support Window</th><th>Target OS</th><th>Assessment</th><th>Decision</th></tr>
<tr><td><img src="./assets/images/lyrical-small.png" alt="Lyrical Luth"> Lyrical Luth (LTS)</td><td>May 2026 – May 2031</td><td>Ubuntu 26.04 LTS</td><td>Newer LTS release, but changing the OS and checking driver compatibility would add migration work.</td><td><Badge type="info" text="Deferred" /></td></tr>
<tr><td><img src="./assets/images/kilted-small.png" alt="Kilted Kaiju"> Kilted Kaiju (STS)</td><td>May 2025 – Nov 2026</td><td>Ubuntu 24.04 LTS</td><td>Short-term release with a support window that ends during the project.</td><td><Badge type="info" text="Not selected" /></td></tr>
<tr><td><img src="./assets/images/jazzy-small.png" alt="Jazzy Jalisco"> Jazzy Jalisco (LTS)</td><td>May 2024 – May 2029</td><td>Ubuntu 24.04 LTS</td><td>Matches our development OS and Gazebo Harmonic setup; supports the Nav2 tools used in the project.</td><td><Badge type="info" text="Selected" /></td></tr>
<tr><td><img src="./assets/images/humble-small.png" alt="Humble Hawksbill"> Humble Hawksbill (LTS)</td><td>May 2022 – May 2027</td><td>Ubuntu 22.04 LTS</td><td>Would require an older Ubuntu baseline and offers a shorter remaining support period.</td><td><Badge type="info" text="Not selected" /></td></tr>
</tbody></table>

:::

<!-- #endregion report -->
