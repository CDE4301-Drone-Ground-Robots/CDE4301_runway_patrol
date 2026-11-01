<!-- Canonical report source. Edit here. -->

## List of Specifications {#list-of-specifications}

<Badge type="warning" text="Specifications" />

### List of specifications {#sec-specifications}

##### 1Communication

- Frequency: 917–925 MHz
- Operational range: 1–4 km
- Throughput: ≥ 120 kbps
- Latency: &lt; 10 ms

##### 2Navigation

- Cruising speed of 10–15 km/h
- Precision approach speed of 3–5 km/h
- Waypoint accuracy ±2 cm
- Global planner: Hybrid A\*
- Local controller: Regulated Pure Pursuit with curvature speed scaling
- Dual EKF fusing IMU, wheel encoders and GPS

##### 3Mechanical: chassis, body and steering

- 4-wheel drive
- Gross vehicle weight ≤ 60 kg
- Ground clearance of 180 mm

##### 4Mechanical: suspension

- Spring constant of 100 lbf/in
- Takes the weight of the structure

##### 5Mechanical: FOD remediation

- Vacuum motor of 2.2 kPa

##### 6FOD detection

- Recall rate &gt; 90%
- 5 classes
- 32 × 32 px
- Frames required at 15 km/h: to be confirmed

##### 7Electrical: microcontroller

- Clock speed of at least 34 MHz

##### 8Electrical: computer

- Adequate computing power to run AI models

##### 9Battery management system

- 48 V, 100 A

### 📐 Operational Constraints & Engineering Specifications (Phase 1)

<Badge type="tip" text="Phase 1 Target" />

To achieve full Phase 1 validation and de-risk outdoor physical deployment, our project establishes strict engineering specifications benchmarked at the **NUS SDE3** testing site:

| Category | Design Requirement | Engineering Specification (Phase 1 Target) | Technical Justification & Standard |
| --- | --- | --- | --- |
| **Testing Site** | Phase 1 Proving Ground | `NUS SDE3` Test Corridor & Outdoor Ramp Area | Realistic tarmac roughness, concrete slopes, and structured obstacle corridors. |
| **Vehicle Speed** | Transit & Macro Sweep | UGV: $\ge 10\text{ km/h}$ \| Simulated UAV: $30\text{--}40\text{ km/h}$ | Satisfies strict Runway Occupancy Time (ROT) reduction thresholds. |
| **Communications** | Local Network Datalink | Private Wi-Fi Router Subnet (`192.168.1.0/24`) + CycloneDDS Unicast | Simulated UAV on Raspberry Pi 5 / Charan's Laptop → UGV PC (Hilbert's Laptop); sub-15 ms latency. |
| **Coordinate Systems** | Georeferencing & Transit | WGS84 Geodetic $\rightarrow$ Local Metric (`map` / `odom` / `base_link`) | `navsat_transform_node` with dual EKF sensor fusion (Wheel Odometry + IMU). |
| **Navigation Stack** | Autonomous Path Planning | ROS 2 Jazzy on Ubuntu 24.04 LTS, Nav2 (`SmacPlanner2D` + `RegulatedPurePursuit`) | Deterministic runway path following ≥10 km/h with dynamic obstacle clearance; executes on Hilbert's Laptop. |
| **FOD Remediation** | Extraction Capacity | High-flow 2800W industrial vacuum suction system + intake nozzle | Picks up fasteners, 580g steel bolts, rocks, and rubber debris at calculated clearance. |
| **Power & Control** | Battery & Voltage Bus | 48V 20Ah LiFePO4 primary bus; STM32 F446RE for motor actuation | Powers ZLAC8015D driver & 2800W vacuum. Hilbert's laptop operates on internal battery (isolated from 48V). |
| **Safety System** | Fail-Safe Loss Protocols | Automated deceleration to 0 RPM upon 5.0 s heartbeat loss | Prevents runaway vehicles; buffers active tasks during momentary shadowing. |
