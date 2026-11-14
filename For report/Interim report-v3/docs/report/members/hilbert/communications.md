---
title: "UAV–UGV Communications & Command Integration"
owner: "Hilbert Soh"
outline: [2, 3]
---

# UAV–UGV Communications & Command Integration

_Semester 1: ROS 2 communication, waypoint dispatch and proposed radio link._

<!-- #region report -->

## 3.3.1 Objectives & Requirements {#com-objectives}

The multi-agent communications pipeline coordinates reconnaissance data transfer between the autonomous aerial reconnaissance drone (FOD Argus) and the ground remediation platform (FOD Hunter) via asynchronous ROS 2 interfaces [\[5\]](./references.md#ref-5), [\[6\]](./references.md#ref-6), [\[11\]](./references.md#ref-11), [\[12\]](./references.md#ref-12). The UAV companion computer transmits detected debris target coordinates without directly asserting low-level motor actuation. In Semester 1 development, the UGV communications bridge parses incoming JSON target alerts, maintains an asynchronous FIFO waypoint queue, dispatches trajectory goals to Nav2, and returns vehicle telemetry and link heartbeats to the C2 terminal.

Semester 1 verification was conducted across a **heterogeneous multi-machine testbed over an isolated local network**, interfacing an ARM64 companion computer with an x86_64 autonomy workstation executing Gazebo Harmonic SIL simulation. Over-the-air long-range RF evaluation between flight and ground hardware is designated for Semester 2.

Active communication interfaces comprise `/c2/target_alert` (event-driven debris targets) and `/c2/ugv_telemetry` (configured 2 Hz vehicle state and link heartbeat).

::: details Detailed requirements, operational constraints and safety considerations

**Functional & Operational Requirements**

- **REQ-COM-01 (Peer Discovery):** Heterogeneous computing nodes (ARM64 Ubuntu 24.04 on Raspberry Pi 5 vs x86_64 Ubuntu 24.04 on WSL2) must discover peers and exchange ROS 2 topics over the local network.
- **REQ-COM-02 (Payload Formatting & Parsing):** Target alerts and telemetry must encapsulate coordinates, classification labels, and timing metadata within lightweight JSON structures with sub-50 ms parsing overhead.
- **REQ-COM-03 (Asynchronous Goal Dispatch):** Ingested alerts must drive the Nav2 Behavior Tree asynchronously and manage sequential waypoint queues without blocking DDS event threads.
- **REQ-COM-04 (Airfield Operating Range):** Datalink architecture must support a line-of-sight range of $1.5\text{ to } 3.0\text{ km}$ across runway tarmac (e.g., Aarhus Airport Runway 10R/28L at $2,702\text{ m} \times 45\text{ m}$, or Singapore Changi Airport exceeding $4,000\text{ m}$).
- **REQ-COM-05 (Infrastructure Independence):** The inter-agent datalink cannot depend on civilian cellular networks (4G/5G) or commercial Wi-Fi due to coverage gaps, aerodrome security rules, and recurring SIM costs.
- **REQ-COM-06 (Power & Payload Budget):** Onboard transceiver hardware must run on a regulated 12V DC auxiliary bus (&lt;10 W peak draw) with a mass under 100 g for drone mounting.

**Singapore Radio Regulations & Spectrum Compliance**

Radio transmissions in Singapore are governed by the **Infocomm Media Development Authority (IMDA)** under *IMDA TS SRD* [\[3\]](./references.md#ref-3) and the *Telecommunications Act 1999* [\[10\]](./references.md#ref-10). Telemetry transceivers must be firmware-constrained to the permitted **917.0–925.0 MHz** sub-band with effective radiated power (ERP) bounded between 100 mW and 500 mW. Extended statutory specifications and spectrum allocations are documented in **[Appendix K: Communications Protocol & Radio Reference](/report#appendix-k)**.

_Regulatory status:_ The proposed Microhard P900 V2 has not yet been procured or submitted for IMDA equipment registration. Frequency configuration, channel spacing, and radiated power must be verified before field transmission.

**Proposed Fail-Safe Requirements (Semester 2)**

These behaviours are design requirements for Semester 2. They were not implemented in the Semester 1 software.

- **Link Loss While Idle:** UGV holds its current position, continues local 3D LiDAR obstacle monitoring, and inhibits autonomous driving.
- **Link Loss En Route:** UGV continues driving to the active waypoint. If communications are not restored within $30.0\text{ s}$ of goal arrival, the vehicle halts rather than executing subsequent unconfirmed waypoints.
- **Geofence Boundary Check:** Coordinates outside the airfield boundary (NUS EA Field: $X \in [-30, 25]\text{ m}$, $Y \in [-15, 15]\text{ m}$) are discarded with an error log, preventing out-of-bounds driving.

:::

<span id="sec-2-overview"></span>

## 3.3.2 System Architecture {#com-architecture}

The inter-agent communications pipeline links the aerial UAV C2 terminal (hosted on a physical Raspberry Pi 5 companion computer) with the UGV autonomy workstation (Ubuntu 24.04 under WSL2). When debris is detected, the companion computer serializes classified target metadata into structured JSON payloads published to `/c2/target_alert`. The UGV mission controller (`ugv_c2_bridge_node`) ingests and parses the alert, constructs a goal pose in the global `map` frame, applies the pickup offset geometry, and dispatches the goal asynchronously to the Nav2 `NavigateToPose` action server. Concurrently, vehicle pose and status telemetry stream back to the C2 terminal over `/c2/ugv_telemetry` at 2 Hz.

<Figure
  src="./assets/diagrams/c1-uav-ugv-communication-architecture.svg"
  alt="FOD Hunter UAV–UGV Communication Architecture"
  caption="Figure 3.3.2: UAV–UGV communication architecture showing target alert dispatch from Raspberry Pi 5 across CycloneDDS unicast to UGV bridge and Nav2, with 2 Hz telemetry return."
/>

<CommunicationsWidget1 />

::: details ROS 2 nodes, topics and communication interface

The companion computer and autonomy workstation communicate through dedicated ROS 2 publisher-subscriber topics and action servers shown in Figure 3.3.3. Target alerts arrive over `/c2/target_alert` configured with `RELIABLE` reliability and `TRANSIENT_LOCAL` durability (history depth 10) to ensure delivery even if subscriber initialization is delayed. Telemetry heartbeats publish at 2 Hz over `/c2/ugv_telemetry`, while mission execution coordinates asynchronously via the `nav2_msgs/action/NavigateToPose` action server.

| Interface                      | Direction           | Protocol / Type                      | Purpose                                                                                     |
| :----------------------------- | :------------------ | :----------------------------------- | :------------------------------------------------------------------------------------------ |
| `/c2/target_alert`             | C2 Terminal → UGV   | `std_msgs/msg/String` (JSON)         | Structured target debris alerts with priority and coordinates                               |
| `/c2/ugv_telemetry`            | UGV → C2 Terminal   | `std_msgs/msg/String` (JSON)         | Periodic vehicle pose, task state, and heartbeat at configured 2 Hz                         |
| `ugv_c2_bridge_node`           | Internal Processing | ROS 2 Python node (`rclpy`)          | JSON parsing, FIFO queueing, and action dispatch                                            |
| `NavigateToPose`               | Bridge → Nav2       | `nav2_msgs/action/NavigateToPose`    | Asynchronous navigation action invocation (the same pose is also published on `/goal_pose`) |
| `/c2/queued_waypoints_markers` | Bridge → RViz2      | `visualization_msgs/msg/MarkerArray` | Visual markers showing the active and queued waypoints                                      |

<Figure src="./assets/diagrams/c5-ros2-publisher-subscriber-architecture.svg" alt="ROS 2 Node Graph and Communication Architecture" caption="Figure 3.3.3: ROS 2 topic and action interfaces between Raspberry Pi 5, UGV C2 bridge, and Nav2 NavigateToPose action server." />

:::

## 3.3.3 Design Methodology & Selection {#com-methodology}

### 3.3.3.1 CycloneDDS and Static Unicast Selection {#com-dds}

ROS 2's Data Distribution Service (DDS) publisher–subscriber middleware was selected to decouple mission management from low-level motion control [\[7\]](./references.md#ref-7). FastDDS is the default ROS 2 middleware, but cross-machine discovery failed because multicast packets were dropped across the Hyper-V virtual network adapter on the Windows/WSL2 host.

**Eclipse CycloneDDS with static unicast peers** resolved this issue. Listing the participant IP addresses as peers lets discovery packets (SPDP/SEDP) reach each machine directly by UDP unicast, so discovery no longer depends on multicast crossing the WSL2 virtual network. The deployed `cyclonedds.xml` contains only the peer list:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<CycloneDDS xmlns="https://cdds.io/config" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <Domain id="any">
        <Discovery>
            <Peers>
                <Peer address="192.168.168.50"/>
                <Peer address="192.168.168.100"/>
                <Peer address="192.168.137.1"/>
                <Peer address="192.168.137.233"/>
            </Peers>
        </Discovery>
    </Domain>
</CycloneDDS>
```

`setup_dds.sh` sets `RMW_IMPLEMENTATION=rmw_cyclonedds_cpp` and `ROS_DOMAIN_ID=0`. It binds CycloneDDS to the active 192.168.168.x (Wi-Fi router) or 192.168.137.x (direct link) address through `CYCLONEDDS_URI`, using the same four peers. Multicast is left at its default setting; it is not disabled.

::: details Middleware architecture and static unicast design

<Figure src="./assets/diagrams/c3-cyclonedds-static-unicast-topology.svg" alt="CycloneDDS Static Unicast Peering Architecture" caption="Figure 3.3.4: CycloneDDS static unicast peering topology resolving WSL2 virtual switch NAT multicast discovery failure between simulation host and Raspberry Pi 5." />

With static peers configured, CycloneDDS sends participant discovery (SPDP) and endpoint discovery (SEDP) traffic directly to each listed address as unicast UDP, in addition to its default multicast. This avoids the virtual-switch multicast problem without disabling multicast.

:::

### 3.3.3.2 Payload and QoS Decisions {#com-payload-selection}

Structured JSON dictionaries encapsulated within `std_msgs/msg/String` topics were selected to enable seamless data exchange between the ARM64 companion computer and x86_64 workstation without compiling and synchronizing custom ROS 2 message packages (`.msg`).

Target alerts use **`TRANSIENT_LOCAL` durability** and **`RELIABLE` reliability** QoS:

- **`RELIABLE`:** Requires positive acknowledgement of target alerts, resending packets dropped by transient interference.
- **`TRANSIENT_LOCAL`:** Retains recent target alert samples in publisher memory, allowing late-joining subscribers to receive active goals upon startup. A restarted subscriber can therefore also receive alerts that were already handled.

Telemetry on `/c2/ugv_telemetry` uses the default publisher QoS (reliable, volatile, depth 10).

::: details Alert and telemetry schemas

Structured JSON payloads are exchanged across the inter-agent datalink: `/c2/target_alert` transmits georeferenced coordinates, threat IDs, priority flags, and approach angles from the aerial scanner; `/c2/ugv_telemetry` returns vehicle operational state, active goal progress, filtered pose estimates, and link watchdog heartbeats.

> The complete JSON message schemas, semantic field dictionaries, and pipeline dataflow diagrams (Tables K.1 and K.2, Figure K.1) are compiled in **[Appendix K: Communications Protocol & Radio Reference](/report#appendix-k)**.

:::

### 3.3.3.3 Long-Range Datalink Trade Study {#com-radio-selection}

While local Wi-Fi satisfied indoor benchtop development requirements, airfield deployment demands an autonomous, long-range datalink capable of 1.5–3.0 km line-of-sight propagation across active runways. Five candidate wireless technologies were evaluated against range, throughput, power consumption, and statutory radio spectrum compliance:

<Card tag="Airfield Technology Evaluation">

**Table 3.3.3: Wireless Communications Technology Trade-Off Matrix**

| Technology Candidate   | Operating Band                                               | Nominal Throughput      | LOS Range                       | Interface                 | Power Draw                   | Operational Assessment                                                                                                                             | Selection Status                                      |
| :--------------------- | :----------------------------------------------------------- | :---------------------- | :------------------------------ | :------------------------ | :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| **Microhard P900 V2**  | 902–928 MHz FHSS (917–925 MHz configuration to be confirmed) | Up to 276 kbps          | $5 - 15\text{ km}$              | Asynchronous UART / USB-C | 1.2 W RF (100 mA idle @ 12V) | Infrastructure-independent point-to-point. Possible Singapore deployment subject to IMDA and firmware checks. Requires a serial gateway for ROS 2. | <Badge type="info" text="PREFERRED CANDIDATE" />      |
| **Microhard pMDDL900** | 902–928 MHz 2×2 MIMO                                         | Up to 25 Mbps           | $5 - 20\text{ km}$              | Native Ethernet / IP      | 6–12 W transmit              | Native IP supports direct CycloneDDS bridging without gateway. High cost (\$1,200+ USD) and thermal dissipation exceed requirements.               | <Badge type="info" text="ALTERNATIVE BACKUP" />       |
| **Ubiquiti 5AC Wi-Fi** | 5.15–5.85 GHz OFDM                                           | $100 - 450\text{ Mbps}$ | $1 - 5\text{ km}$ (directional) | Ethernet (PoE)            | 7–9 W                        | High bandwidth, but directional dish alignment fails during dynamic UAV banking maneuvers. Severe ground attenuation.                              | <Badge type="info" text="REJECTED (UAV LINK)" />      |
| **4G LTE / 5G Modem**  | Telco Carrier Bands                                          | $10 - 150\text{ Mbps}$  | Cell dependent                  | USB / PCIe                | 3–6 W                        | Relies on civilian telecom towers; subject to recurring SIM fees and aerodrome security restrictions.                                              | <Badge type="info" text="REJECTED (TELCO RELIANT)" /> |
| **LoRa (SX1262)**      | 915 / 868 MHz CSS                                            | $0.3 - 5.5\text{ kbps}$ | $3 - 10\text{ km}$              | SPI / UART                | &lt;0.5 W                    | Low bandwidth and 222-byte payload limits cause multi-packet fragmentation and multi-second latency for JSON messages.                             | <Badge type="info" text="REJECTED (BANDWIDTH)" />     |

</Card>

::: details Long-range radio comparison, regulatory considerations and selection rationale

The Holybro Microhard P900 V2 was shortlisted for the UGV datalink because compact JSON target alerts (~500 bytes) require negligible bandwidth (<20 ms transmission at 276 kbps), eliminating high-power broadband IP modems. Direct UART interfacing minimizes SWaP (42 g, 7–35V DC), while hardware AES-256 point-to-point link encryption eliminates IP network routing vulnerabilities.

> For the comprehensive comparative trade study across all four candidate modems (Microhard P900 V2, RFD900x, Digi XBee-PRO, and pMDDL IP), RF security trade-offs, and procurement decision gates, see **[Appendix K: Communications Protocol & Radio Reference](/report#appendix-k)**.

:::

## 3.3.4 Implementation & Prototype {#com-implementation}

### 3.3.4.1 Two-Machine Integration {#com-network}

The Semester 1 hardware-in-the-loop testbed connected two physical computing nodes across an isolated Wi-Fi local network:

1. **Machine 1 (UAV C2 Terminal):** Raspberry Pi 5 (Quad-Core ARM Cortex-A76 @ 2.4 GHz, 8 GB RAM) running Ubuntu 24.04 LTS and ROS 2 Jazzy, hosting `DemoComs_C2.py` (IP: `192.168.168.50`).
2. **Machine 2 (UGV Autonomy Workstation):** Laptop workstation running Ubuntu 24.04 LTS under WSL2, executing Gazebo Harmonic DART physics, Dual-EKF state estimation, Nav2 path planning, `ugv_c2_bridge_node`, and `c2_alert_receiver` (IP: `192.168.168.100`).

The inter-agent operational workflow executes across four sequential stages:

- **Stage 1:** Establish peer-to-peer network discovery between ARGUS and HUNTER host systems.
- **Stage 2:** Acquire aerial inspection coordinates and update detected debris locations.
- **Stage 3:** Transmit structured C2 target alerts to HUNTER.
- **Stage 4:** Ingest target coordinates and dispatch autonomous navigation goals within Nav2.

Stages 1 and 2 cover aerial inspection and coordinate extraction, and are documented in the [ARGUS Communication System](https://cde4301-drone-ground-robots.github.io/CDE4301_runway_drone/report/#report-communication-system). Stages 3 and 4 document HUNTER's alert ingestion and autonomous navigation dispatch.

<VideoClip
  src="./assets/videos/uav-ugv-communication-video.mp4"
  poster="./assets/images/posters/uav-ugv-communication-video-poster.jpg"
  caption="Video 3.3.1: Benchtop demonstration of CycloneDDS static unicast topic exchange between Raspberry Pi 5 and ROS 2 Jazzy workstation over local Wi-Fi."
/>

### 3.3.4.2 Stage 3 — Sending C2 Alert to HUNTER {#com-stage-3}

<span id="com-dispatch"></span>

In Stage 3, the ARGUS communication client (`DemoComs_C2.py`) serializes the target alert and publishes it to `/c2/target_alert` formatted as JSON within a `std_msgs/msg/String`. Eclipse CycloneDDS transmits the datagram to the UGV workstation via static unicast peering.

On the HUNTER platform, the communication monitor (`c2_alert_receiver`) and mission controller (`ugv_c2_bridge_node`) subscribe to `/c2/target_alert` with matching `TRANSIENT_LOCAL` durability and `RELIABLE` reliability QoS profiles. In the benchmarked multi-machine demonstration (presentation slide 175), the following parameters were transmitted and verified:

| Parameter Field  | Demonstration Value      | Interpretation & Context                                                                              |
| :--------------- | :----------------------- | :---------------------------------------------------------------------------------------------------- |
| **Threat ID**    | `FOD_THREAT_001`         | Unique sequential identifier assigned to candidate debris                                             |
| **Object Class** | `Screw` (`FOD / screw`)  | Debris classification passed from edge detection model (the 1 October log records the class as `FOD`) |
| **Confidence**   | `0.96` (96.0%)           | Target classification confidence score                                                                |
| **Target X**     | `3.20 m`                 | Local metric coordinate in `map` Cartesian frame                                                      |
| **Target Y**     | `1.70 m`                 | Local metric coordinate in `map` Cartesian frame                                                      |
| **Target Yaw**   | `0.00 rad` ($0.0^\circ$) | Desired terminal vehicle orientation upon arrival                                                     |

_Note: These coordinates and classifications represent recorded demonstration test values, not live physical UAV flight measurements._

<C2TerminalDemo />

**Recorded test (1 October 2026):** The ROS 2 logs show that `ugv_c2_bridge_node` received and parsed this alert (`FOD_THREAT_001 at (3.20, 1.70)`) five times. On the last attempt, Nav2 started navigating to (3.20, 1.70), but the planner (SmacPlanner2D at that time) reported "no valid path found" for this target. Recovery actions ran and the goal was aborted after 24 s. This alert is therefore evidence of **message reception, parsing and goal dispatch**, not of arrival. Successful navigation to C2 goals is shown in Stage 4.

### 3.3.4.3 Stage 4 — C2 Alert Receiver to HUNTER Navigation {#com-stage-4}

Upon alert ingestion, the UGV bridge processes incoming target dispatches:

1. **Alert Ingestion & Parsing:** `ugv_c2_bridge_node` parses the incoming JSON payload from `/c2/target_alert`, extracting target coordinates, object classifications, and dispatch priority levels. `c2_alert_receiver` mirrors this payload for operator display.
2. **Coordinate Extraction:** The node extracts Cartesian metric coordinates from `target_metric.x` and `target_metric.y` (defaulting to top-level `x`/`y` if omitted).
3. **Map-Frame Pose Construction:** Because alert coordinates are referenced to the global Cartesian datum, coordinates are packaged into a `geometry_msgs/msg/PoseStamped` with `frame_id = map`.
4. **Intake Standoff Offset Calculation:** To position the rear-mounted centrifugal vacuum intake directly above the target debris, a 0.66 m standoff offset is applied along the vehicle approach vector from the robot's current pose. The terminal goal heading $\theta$ is oriented along this approach vector and converted to a planar quaternion:
   $$
   q_z = \sin\left(\frac{\theta}{2}\right), \quad q_w = \cos\left(\frac{\theta}{2}\right), \quad q_x = 0.0, \quad q_y = 0.0
   $$
5. **Asynchronous Nav2 Action Dispatch:** The bridge dispatches the goal to the Nav2 `NavigateToPose` action server asynchronously and publishes the coordinate to `/goal_pose`.
6. **Lattice Planning & Visualization:** Nav2's `SmacPlannerHybrid` generates a kinematically feasible Reeds-Shepp trajectory across the global costmap, visualized in RViz2 alongside queued waypoint markers (`/c2/queued_waypoints_markers`).
7. **Trajectory Tracking:** `RegulatedPurePursuitController` guides the simulated UGV (AgileX Scout 2.0 proxy in Gazebo Harmonic) to the standoff waypoint.

**Recorded result (13 October 2026):** In this session (SmacPlannerHybrid, NUS EA Field map), the bridge dispatched six C2 goals. Five reached the goal: three `IMMEDIATE` alerts and two queued targets, 7.9–14.7 m from the robot, in 10.7–24.8 s. The sixth was replaced by the next queued goal before Nav2 reported completion. Goal position error was not recorded.

<VideoClip
  src="./assets/videos/131026_UAV_sim_Charan_demo.mov"
  poster="./assets/images/posters/131026-uav-sim-charan-demo-poster.jpg"
  caption="Video 3.3.2: Recorded demonstration of C2 target ingestion triggering Nav2 path planning and autonomous UGV tracking in Gazebo Harmonic and RViz2."
/>

::: details Coordinate conversion and Nav2 action dispatch implementation

The bridge builds a `PoseStamped` goal in the `map` frame. The current version applies a 0.66 m intake offset and converts the approach heading to a quaternion:

$$
q_z = \sin\left(\frac{\theta}{2}\right), \quad q_w = \cos\left(\frac{\theta}{2}\right), \quad q_x = 0, \quad q_y = 0
$$

If the UGV is busy (`EN_ROUTE` or `VERIFIED`), new goals are appended to an internal FIFO queue (`goal_queue`); an `IMMEDIATE` alert clears the queue and is dispatched at once. The node publishes RViz markers (`visualization_msgs/msg/MarkerArray`) on `/c2/queued_waypoints_markers`: an amber cylinder for the active target, cyan cylinders for queued targets, and a yellow line joining them in order.

:::

**Related documentation:** [Navigation →](/report#programming) · [Simulation →](/report#programming) (links to the programming chapter).

### 3.3.4.4 Proposed Serial-Radio Gateway {#com-future-gateway}

The candidate Microhard P900 V2 operates via an asynchronous UART serial interface, precluding native DDS multicasting over the RF link. Hardware migration requires deploying dedicated serial gateway nodes to encapsulate, frame, and validate ROS 2 messages across the transparent serial bridge.

**Current status:**

- The Microhard P900 V2 remains a **proposed candidate**; no units have been procured or deployed.
- The software serial gateway has **not been implemented or bench-tested**.
- **No outdoor RF range or throughput tests** have been conducted.
- Singapore IMDA licensing, frequency mask restrictions (917–925 MHz) and power thresholds must be formally verified before transmitting over the air.

::: details Proposed COBS, CRC-32 and acknowledgement design

When transitioning from local Wi-Fi to a long-range transparent UART datalink, ROS 2 nodes cannot publish native DDS packets over a serial stream. A dedicated serial framing gateway packages JSON payloads with Consistent Overhead Byte Stuffing (COBS) packet delimitation, CRC-32 checksum integrity verification, and Stop-and-Wait ARQ acknowledgements.

> For complete serial framing state transitions, CRC-32 polynomials, timeout retry logic, and architectural pipeline schematics (Figure K.3), see **[Appendix K: Communications Protocol & Radio Reference](/report#appendix-k)**.

:::

## 3.3.5 Testing & Results {#com-testing}

Benchtop evaluations validated peer discovery, target alert transmission, JSON parsing, asynchronous Nav2 action invocation, and multi-waypoint queueing between the physical companion computer and autonomy workstation.

<Card tag="Communications Subsystem Verification Matrix">

**Table 3.3.4: Semester 1 Communication Test Results**

<div class="table-scroll-wrapper" style="overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; margin: 8px 0;">

| Test ID    | Test Objective                                                       | Supporting Evidence                                                                                                                                                                                                              | Verification Status                |
| :--------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------- |
| **COM-01** | Cross-machine CycloneDDS communication across ARM64 and x86_64 nodes | Video 3.3.1 (`uav-ugv-communication-video.mp4`), RPi 5 terminal recording (`230926-uavugv-comms-rpi5-.mp4`), workstation recording (`230926-uavugv-comms-laptop.mp4`); static peers in `cyclonedds.xml` / `setup_dds.sh`           | <Badge type="tip" text="PASSED" /> |
| **COM-02** | C2 target alert transmission and reception over `/c2/target_alert`   | `DemoComs_C2.py` publisher and matching `RELIABLE` + `TRANSIENT_LOCAL` subscribers in source; bridge logs record received alerts on 23 Sep and 1, 5, 9, 13, 16 and 22 Oct 2026                                                   | <Badge type="tip" text="PASSED" /> |
| **COM-03** | JSON target-coordinate parsing                                       | 1 Oct 2026 bridge log: `FOD_THREAT_001` at $(X=3.20\text{ m}, Y=1.70\text{ m})$ received and parsed five times; no parse errors in any bridge log. Navigation to this target failed (no valid path) and is not part of this test | <Badge type="tip" text="PASSED" /> |
| **COM-04** | C2 alert to `map`-frame goal and Nav2 `NavigateToPose` dispatch      | Video 3.3.2 (`131026_UAV_sim_Charan_demo.mov`); 13 Oct 2026 logs: six C2 goals dispatched, five reached with SmacPlannerHybrid (Hybrid A\*) on the AgileX Scout 2.0 simulation proxy                                           | <Badge type="tip" text="PASSED" /> |
| **COM-05** | Sequential multi-waypoint queue navigation                           | Video `Multiqueue waypoint.mp4` demonstrating autonomous sequential 3-target execution in Nav2; bridge logs show queueing and automatic advance to the next target on 1, 5, 9, 13 and 16 Oct 2026 (see queue limitation below)   | <Badge type="tip" text="PASSED" /> |

</div>

> **Test scope:** These results cover the Semester 1 indoor communication testbed and ROS 2 simulation. Physical UAV–UGV RF communication, outdoor range and real-world navigation remain unverified.

_Testing Note:_ COM-01 through COM-05 cover the Semester 1 objective: cross-machine communication and sending waypoints to the UGV simulation. Not every dispatched goal reached its target; some failed because no valid path existed. Periodic telemetry at 2 Hz (`/c2/ugv_telemetry`) is implemented in `ugv_c2_bridge_node`. Abort handling is **partially implemented**: an alert with `priority_level` or `suggested_action` set to `ABORT`, `CANCEL` or `STOP` clears the queue and cancels the active Nav2 goal (`cancel_goal_async()`). It was triggered in a 5 October 2026 session. It does not publish a zero-velocity command, and no emergency-stop test with acceptance criteria was run. A complete emergency stop, link-loss watchdog, geofencing, schema validation, RF packet-error rate, outdoor range and physical stopping distance are Semester 2 work.

**Queue limitation:** The ROS 2 logs show that a goal can be marked complete twice: once when the robot comes within 0.6 m of the target, and again when Nav2 reports success. Each completion advances the queue, so a queued waypoint was sometimes skipped (for example on 1 October 2026, when `FOD_THREAT_002` and `FOD_THREAT_003` were both dequeued within one second). The queue is therefore not reliable under all conditions; this will be fixed in Semester 2.

</Card>

#### Fail-Safe Architecture & Datalink Fault Handling {#com-failsafe}

**Emergency Abort & Goal Cancellation:** In the Semester 1 software, receiving a C2 alert with `priority_level` or `suggested_action` set to `ABORT`, `CANCEL` or `STOP` clears the internal waypoint queue and calls `cancel_goal_async()` on the Nav2 action client (verified in a 5 October 2026 session). However, this software-level cancellation does not command active braking or issue zero-velocity overrides. Figure 3.3.7 illustrates this multi-tier architecture, showing current software queue flushing alongside proposed Semester 2 hardware Safe Torque Off (STO) motor driver interlocks:

<Figure src="./assets/diagrams/c8-emergency-abort-logic.svg" alt="Multi-Tier Emergency Abort and Goal Cancellation Architecture" caption="Figure 3.3.7: Emergency abort and cancellation flowchart: Semester 1 queue flushing and asynchronous Nav2 cancellation, with hardware E-stop and STO interlocks planned for Semester 2." />

**Datalink Loss & Autonomous Recovery:** The Semester 1 prototype lacks a communication watchdog; if the datalink drops, the UGV continues executing its current goal without an RF link. Figure 3.3.8 presents the proposed Semester 2 datalink monitoring state machine, which will transition the rover into an autonomous holding state upon missing periodic heartbeats before executing return-to-base navigation:

<Figure src="./assets/diagrams/c9-communication-failure-recovery.svg" alt="Datalink Loss and Recovery Finite State Machine" caption="Figure 3.3.8: Proposed datalink failure and recovery state flow: autonomous hold, reconnection handling, and watchdog return-to-base (Semester 2 design; Semester 1 software lacks link-loss watchdog)." />

::: details Recorded communication demonstrations and evidence

<VideoClip src="./assets/videos/230926-uavugv-comms-rpi5-.mp4" poster="./assets/images/posters/230926-uavugv-comms-rpi5-poster.jpg" caption="Video 3.3.3: Raspberry Pi 5 terminal recording showing incoming JSON alerts and CycloneDDS publishing." />

<VideoClip src="./assets/videos/230926-uavugv-comms-laptop.mp4" poster="./assets/images/posters/230926-uavugv-comms-laptop-poster.jpg" caption="Video 3.3.4: Laptop workstation recording showing Nav2 goal queueing and action dispatch." />

<VideoClip src="./assets/videos/Multiqueue waypoint.mp4" poster="./assets/images/posters/multiqueue-waypoint-poster.jpg" caption="Video 3.3.5: Multi-Queue Sequential Waypoint Navigation demonstration in Nav2 showing autonomous 3-target sequence execution." />

:::

## 3.3.6 Engineering Discussion {#com-discussion}

Semester 1 development decoupled aerial reconnaissance from ground remediation via asynchronous ROS 2 interfaces, resolving virtualized network discovery through CycloneDDS static unicast peering and avoiding cross-compilation overhead via structured JSON serialization.

Key architectural limitations guide Semester 2 development:

1. **Dynamic Addressing:** Hardcoded static IP configurations in `cyclonedds.xml` lack resilience against DHCP lease changes; operational field deployments require dynamic discovery or zero-configuration addressing.
2. **Serial Gateway Protocol:** Integrating UART-based transceivers (Microhard P900 V2) necessitates implementing a robust serial gateway implementing COBS packet delimitation, CRC-32 integrity validation, and ARQ acknowledgement protocols.
3. **Cryptographic Authentication:** The current signature is an unkeyed SHA-256 digest, which detects accidental byte corruption but does not authenticate the sender. Semester 2 implementation will incorporate keyed HMAC signatures to prevent spoofed target injection.

### Related Documentation — ARGUS Communication System {#com-argus-reference}

This document covers Stage 3 (C2 alert transmission) and Stage 4 (HUNTER navigation goal dispatch). For Stage 1 (communication setup) and Stage 2 (FOD coordinate generation), see the [ARGUS Communication System](https://cde4301-drone-ground-robots.github.io/CDE4301_runway_drone/report/#report-communication-system).

## 3.3.7 Limitations & Future Work {#com-semester-two}

Semester 2 milestones focus on radio transceiver procurement, firmware frequency masking validation (IMDA 917–925 MHz compliance), serial gateway implementation, and full over-the-air inter-agent field verification:

[View Hilbert's Semester 2 Implementation Plan →](./semester-2-plan.md#programming-semester-2)

::: details Detailed proposed milestones

1. **Payload Profiling:** Measure and freeze exact JSON packet sizes for all alert and telemetry message types to establish maximum required UART baud rates.
2. **IMDA Regulatory Clearance:** Verify Microhard P900 V2 firmware frequency masking via PicoConfig software to prove strict 917.0–925.0 MHz channel confinement; submit technical inquiry to IMDA regarding Short Range Device (SRD) power thresholds.
3. **Vendor Quotations & Procurement:** Solicit verified quotations from authorized academic distributors for 2× Holybro Microhard P900 V2 radios, matched 915 MHz rubber-ducky antennas, and high-gain ground station dipoles.
4. **Formal Radio Selection Gate:** Review quotations and regulatory feasibility to officially lock the P900 V2 or activate the pMDDL900 alternative backup plan.
5. **Serial Framing Gateway Development:** Write and unit-test the Python/C++ serial gateway node implementing COBS packet delimitation, CRC-32 integrity validation, and ARQ retransmission timeouts.
6. **Benchtop Radio-in-the-Loop (RIL) Testing:** Connect physical P900 V2 radios via RF coaxial attenuators (-30 dB) in the lab to validate UART throughput, JSON serialization, and Nav2 dispatch without over-the-air radiation.
7. **Latency & Reliability Profiling:** Measure end-to-end command dispatch latency ($t_{\text{alert}} \le 100\text{ ms}$) and packet error rates (PER < 0.1%) under controlled simulated channel noise.
8. **Field Ground-to-Ground Range Testing:** Execute incremental outdoor range sweeps at the NUS EA Field campus proving ground ($50\text{ m}$, $100\text{ m}$, $250\text{ m}$), measuring Received Signal Strength Indication (RSSI) and packet delivery ratios.
9. **Antenna Elevation & Polarization Optimization:** Evaluate vertical vs horizontal antenna mounting orientations on the UGV chassis to eliminate vehicle body shadowing and ground reflection nulls.
10. **Full Inter-Agent Closed-Loop Integration:** Execute end-to-end mission verification connecting real UAV flight reconnaissance, RF alert transmission, UGV autonomous trajectory clearance, and telemetry uplink.

:::

<!-- #endregion report -->

[Hilbert's engineering references →](./references.md)
