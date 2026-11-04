---
title: "UAV–UGV Communications & Command Integration"
owner: "Hilbert Soh"
outline: [2, 3]
---

# UAV–UGV Communications & Command Integration

_Semester 1 engineering documentation — ROS 2 Jazzy, CycloneDDS, command-and-control and future datalink selection._

<!-- #region report -->

## 1. Objectives & Requirements {#com-objectives}

The communication system allows the UAV-side computer to send FOD target coordinates to the UGV without directly controlling its motors ([\[5\]](./references.md#ref-5), [\[6\]](./references.md#ref-6), [\[11\]](./references.md#ref-11), [\[12\]](./references.md#ref-12)). The UGV checks incoming alerts, sends valid goals to Nav2 and returns status updates. We tested this workflow between **two physical computers on an indoor local network**, with the UGV simulated in Gazebo. We did **not** test a radio link between a flying UAV and a physical UGV.

The implemented streams were `/c2/target_alert` (event-driven alerts) and `/c2/ugv_telemetry` (2 Hz UGV status). Operational requirements for longer-range, infrastructure-independent transmission remain Semester 2 work.

::: details Detailed requirements, operational constraints and safety considerations

**3. Requirements & Considerations**

**3.1 Indoor DDS Testing Objectives**

Semester 1 communication development was structured around clear benchtop validation objectives prior to committing to costly outdoor RF hardware:

- Validate that ROS 2 Jazzy nodes running across heterogeneous computing architectures (ARM64 Ubuntu on Raspberry Pi 5 vs x86_64 Ubuntu on WSL2) discover peers and exchange DDS messages deterministically.
- Verify that JSON-serialized strings can encapsulate complete tactical alert and telemetry datasets with sub-50 ms parsing overhead.
- Prove that external DDS alert callbacks can directly drive the Nav2 Behavior Tree navigation pipeline and manage sequential goal queues without thread deadlocks.

**3.2 Long-Range Operational Requirements**

Commercial aerodrome runways present extreme operational environments: Runway 10R/28L at Aarhus Airport spans $2,702\text{ m} \times 45\text{ m}$, while international hub runways (e.g. Singapore Changi Airport) exceed $4,000\text{ m}$. Outdoor communications must fulfill rigorous engineering constraints:

- **Line-of-Sight Range:** Datalink must maintain uninterrupted communication across a minimum operational radius of **$1.5\text{ to } 3.0\text{ km}$** in ground-to-air line-of-sight conditions.
- **Payload Characteristics:** Individual alert payloads require $\approx 450 - 650\text{ bytes}$ of uncompressed JSON. At the implemented $2.0\text{ Hz}$ telemetry rate and burst downlink alerts, total required network throughput is remarkably low (&lt;10 kbps average, &lt;50 kbps burst). _High-bandwidth video streaming is deliberately excluded from the inter-agent datalink._
- **Infrastructure Independence:** The system cannot depend on civilian cellular networks (4G LTE / 5G) or commercial aerodrome Wi-Fi infrastructure due to dead zones, statutory data security mandates, and recurring monthly SIM subscriptions.
- **Electrical & SWaP Budget:** Onboard radio hardware must operate off the UGV's auxiliary DC bus ($12\text{V}$ regulated, &lt;10W peak power draw) and present a compact footprint for UAV payload integration (&lt;100g).

**3.3 Singapore Frequency Regulations & IMDA Compliance**

Deploying radio-frequency transmission equipment in Singapore is governed by the **Infocomm Media Development Authority (IMDA)** under the _Technical Specification for Short Range Devices (IMDA TS SRD)_ ([\[3\]](./references.md#ref-3)), the _Telecommunications Act 1999_ ([\[10\]](./references.md#ref-10)), and civil aviation spectrum mandates ([\[4\]](./references.md#ref-4)).

Radio configuration and approval must be checked against the current Singapore IMDA requirements:

- **North American ISM Band (902–928 MHz):** Industrial transceivers like the Microhard P900 are manufactured to hop across 26 MHz of bandwidth (902–928 MHz) at up to 1.0W (30 dBm) under FCC Part 15.247.
- **Singapore Allocated Band (917–925 MHz):** In Singapore, frequencies below 917 MHz and above 925 MHz are allocated to cellular mobile network operators (MNOs) and critical public communications. _The suitability of these frequencies for the proposed equipment must be confirmed with IMDA before transmission._
- **IMDA Power & Bandwidth Limits:** Under IMDA TS SRD Table 1 (Item 7b), short-range telemetry/telecommand devices operating in 917–925 MHz are restricted to maximum effective radiated power (ERP) limits typically between $100\text{ mW}$ and $500\text{ mW}$ ($20 - 27\text{ dBm}$), depending on channel bandwidth and duty cycle.

<Figure src="./assets/diagrams/imda-spectrum-allocation.svg" alt="Singapore IMDA 900 MHz Spectrum Allocation and Permitted Sub-Band" caption="**Figure 3.1: Singapore IMDA 900 MHz Spectrum Boundary Analysis.** Contrast between the unrestricted 26 MHz North American FCC Part 15 band and Singapore's 8 MHz legal window (917–925 MHz). Deployment of P900 V2 hardware mandates configuring pseudo-random frequency hopping channels strictly within the 917–925 MHz sub-band." />

_Regulatory status:_ The P900 V2 has not been approved for this project. The team must verify permitted frequencies, channel configuration, output power and licensing with IMDA before purchasing or transmitting. **No proposed long-range radio has been purchased, tested or approved.**

**3.4 System Safety and Fail-Safe Behavior**

Fail-safe logic must account for anomalous communications events:

- **Link Loss While Idle:** The UGV remains at its current georeferenced station, continuing local obstacle monitoring and suppressing all motion.
- **Link Loss En Route:** The UGV continues executing its active Nav2 trajectory to the current waypoint. If communications are not restored within $30.0\text{ s}$ of goal completion, it transitions to a holding pattern rather than blindly executing subsequent unconfirmed targets.
- **Corrupted or Out-of-Bounds Coordinates:** Alert payloads are validated against the operational geofence (NUS EA Field: $X \in [-30, 25]\text{ m}$, $Y \in [-15, 15]\text{ m}$). Waypoints violating geofence limits or exhibiting invalid JSON schemas are rejected immediately, generating a warning log without crashing the bridge node.

:::

## 2. System Architecture {#com-architecture}

We used a **Raspberry Pi 5** to represent the UAV-side command computer and an **Ubuntu 24.04/WSL2 workstation** to run the simulated UGV and Nav2. The Pi sent test target alerts. The UGV-side node checked each message, converted it into a map-frame goal and sent it to Nav2 using `NavigateToPose`. Status and heartbeat messages travelled back to the Pi. Because target detection was simulated, this test verifies the communication-to-navigation workflow, not an end-to-end UAV flight demonstration.

<Figure
  src="./assets/diagrams/c1-uav-ugv-communication-architecture.svg"
  alt="FOD Hunter UAV–UGV Communication Architecture"
  caption="**Figure 2.1: Heterogeneous Multi-Agent Communications Pipeline.** End-to-end dataflow illustrating simulated aerial target dispatch on the Raspberry Pi 5, CycloneDDS static unicast transport, UGV command bridge schema validation, Nav2 action dispatch, and reverse telemetry feedback."
/>

<Figure src="./assets/diagrams/uav-ugv-dispatch-workflow.svg" alt="UAV-to-UGV command dispatch workflow" caption="Existing logical dispatch workflow; distinguish simulated aerial detection from tested Raspberry Pi-to-Gazebo communication." />

::: details ROS 2 nodes, topics and communication interface

| Interface            | Direction           | Purpose                                                              |
| -------------------- | ------------------- | -------------------------------------------------------------------- |
| `/c2/target_alert`   | C2 terminal → UGV   | Structured FOD target and priority                                   |
| `/c2/ugv_telemetry`  | UGV → C2 terminal   | Vehicle state and status updates at 2 Hz                             |
| `ugv_c2_bridge_node` | UGV-side processing | Validate, queue and dispatch navigation goals                        |
| `NavigateToPose`     | UGV bridge → Nav2   | Execute target waypoint                                              |
| `/c2/goal_markers`   | UGV → RViz          | Visualize queued and active goals in RViz                            |

<Figure src="./assets/diagrams/c5-ros2-publisher-subscriber-architecture.svg" alt="ROS 2 Node Graph and Communication Architecture" caption="**Figure 2.2: ROS 2 Publisher–Subscriber and Action Interface Architecture.** Conceptual node graph depicting bidirectional communication between the companion Raspberry Pi 5 C2 commander and the UGV onboard mission controller (`ugv_c2_bridge_node`), with goal dispatch to the Nav2 `NavigateToPose` action server." />

:::

## 3. Design Methodology & Selection {#com-methodology}

### 3.1 CycloneDDS and Static Unicast Selection {#com-dds}

ROS 2's DDS-based publisher–subscriber model was selected to keep mission messages independent of the navigation implementation ([\[7\]](./references.md#ref-7)). **CycloneDDS with static unicast peers** addressed a specific integration problem: multicast discovery was unreliable across the workstation's WSL2/Hyper-V NAT networking. The team therefore configured known peer addresses rather than depending on multicast discovery. This was an engineering workaround verified in the indoor testbed, not a guarantee of reliability over a future long-range RF link.

::: details Middleware architecture and static unicast design

<CommunicationsWidget1 />

<Figure src="./assets/diagrams/c3-cyclonedds-static-unicast-topology.svg" alt="CycloneDDS Static Unicast Peering Architecture" caption="**Figure 3.2: CycloneDDS Static Unicast Peering Topology.** Comparison of default UDP multicast discovery failure across Hyper-V virtual switch NAT vs configured static unicast peer discovery between the Windows/WSL2 simulation host and external physical Raspberry Pi 5." />

**CycloneDDS static peer configuration**

We configured `cyclonedds.xml` on both computers with explicit peer addresses because multicast discovery was unreliable across the WSL2 network. Static IP declarations establish direct point-to-point participant discovery between the laptop workstation and Raspberry Pi 5:

The XML below is a historical configuration excerpt. Check it against the active WSL2 and Raspberry Pi files before reusing the addresses:

&lt;?xml version="1.0" encoding="UTF-8" ?&gt; &lt;CycloneDDS xmlns="https://cdds.io/config" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"&gt; &lt;Domain id="any"&gt; &lt;General&gt; &lt;NetworkInterfaceAddress&gt;auto&lt;/NetworkInterfaceAddress&gt; &lt;AllowMulticast&gt;false&lt;/AllowMulticast&gt; &lt;/General&gt; &lt;Discovery&gt; &lt;Peers&gt; &lt;Peer address="192.168.168.50"/&gt; &lt;!-- RPi 5 on Router Subnet --&gt; &lt;Peer address="192.168.168.100"/&gt; &lt;!-- Laptop on Router Subnet --&gt; &lt;Peer address="192.168.137.1"/&gt; &lt;!-- Laptop Windows Hotspot --&gt; &lt;Peer address="192.168.137.233"/&gt; &lt;!-- RPi 5 on Hotspot --&gt; &lt;/Peers&gt; &lt;/Discovery&gt; &lt;/Domain&gt; &lt;/CycloneDDS&gt;

Setting `<AllowMulticast>false</AllowMulticast>` instructs the DDS transport to direct all participant discovery (SPDP) and endpoint discovery (SEDP) traffic as point-to-point unicast UDP packets, avoiding multicast-based peer discovery in this configuration.

:::

### 3.2 Payload and QoS decisions {#com-payload-selection}

The team used JSON dictionaries carried in `std_msgs/msg/String` to simplify inspection and avoid distributing a custom compiled ROS 2 message package between machines. **RELIABLE + TRANSIENT_LOCAL QoS** was configured for target alerts. This supports delivery to compatible late-joining subscribers while the publisher retains samples, but does not guarantee delivery across disconnections. The design trades schema enforcement and message efficiency for rapid cross-machine integration; JSON validation and application-level safety checks are therefore important. During the later WSL2 audit, a default volatile test publisher produced an **incompatible durability QoS warning**. Publishers must offer QoS compatible with the bridge subscription; `TRANSIENT_LOCAL` alone does not guarantee delivery or reconnect recovery.

::: details Alert and telemetry schemas

**JSON payloads — examples and implementation status**

We used JSON inside `std_msgs/msg/String` so both computers could exchange messages without installing a custom ROS 2 message package.

The table below is a **proposed/illustrative extended alert schema**. The runtime audit confirms JSON target coordinates and mission dispatch, but does not establish that every listed field is parsed, authenticated or enforced by the active bridge. Check the source before describing individual fields as implemented:

<Card tag="UAV → UGV Command Stream">

**Table 5.1: Downlink Reconnaissance Alert Schema (`/c2/target_alert`)**

| JSON Field                           | Data Type           | Example Value                     | Role & Semantic Definition                                                                                  |
| ------------------------------------ | ------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `mission_id`                         | `string`            | `"RUNWAY_INSPECT_2026_0923"`      | Global unique identifier linking reconnaissance sorties to remediation records.                             |
| `threat_id`                          | `string`            | `"FOD_THREAT_001"`                | Sequential debris identifier used for tracking remediation task states.                                     |
| `object_class`                       | `string`            | `"metal_bolt"`                    | Object classification label passed from the vision pipeline to prioritize collection order.                  |
| `coordinates.x` / `.y`               | `float`             | `-15.0, 5.0`                      | Target coordinate in metric Cartesian `map` coordinate frame (meters).                                      |
| `coordinates.z` / `.yaw`             | `float`             | `0.0, 0.0`                        | Elevation relative to ground plane ($Z=0$) and approach orientation (radians).                              |
| `confidence`                         | `float`             | `0.96`                            | Normalized machine learning inference confidence score ($0.00 - 1.00$).                                     |
| `priority_level` (proposed)          | `string`            | `"NORMAL" \| "URGENT" \| "ABORT"` | Proposed priority/abort behaviour; physical stopping and cancellation timing are not verified.              |
| `timestamp_utc`                      | `string (ISO 8601)` | `"2026-09-23T14:32:00.123Z"`      | Precision Coordinated Universal Time stamp for latency and timeout monitoring.                              |
| `cryptographic_signature` (proposed) | `string (hex)`      | `"a3f5b8..." (SHA-256)`           | A plain SHA-256 hash does not authenticate the sender; keyed HMAC or a digital signature would be required. |

</Card>

The active UGV bridge publishes telemetry at **2 Hz** on `/c2/ugv_telemetry`. Table 5.2 describes an extended telemetry format; not every field is verified as present in the active source:

<Card tag="UGV → UAV / Base Telemetry">

**Table 5.2: Uplink Operational Telemetry Schema (`/c2/ugv_telemetry`)**

| JSON Field                        | Data Type | Example Value                                 | Role & Semantic Definition                                                        |
| --------------------------------- | --------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| `target_ack.threat_id`            | `string`  | `"FOD_THREAT_001"`                            | Active debris threat currently being tracked or remediated.                       |
| `target_ack.task_state`           | `string`  | `"EN_ROUTE"`                                  | Current finite state machine status: `IDLE`, `EN_ROUTE`, `VERIFIED`, `COLLECTED`. |
| `target_ack.queued_goals_count`   | `int`     | `2`                                           | Remaining waypoints buffered in UGV navigation execution queue.                   |
| `target_ack.distance_to_target_m` | `float`   | `4.82`                                        | Euclidean distance from UGV `base_footprint` to active goal (meters).             |
| `target_ack.eta_seconds`          | `float`   | `2.4`                                         | Estimated time to target arrival based on current linear velocity.                |
| `vehicle_telemetry.pose_metric`   | `object`  | `{"x": -10.2, "y": 4.8, "heading_deg": 12.4}` | Real-time estimated global pose in `map` frame derived from Dual-EKF fusion.      |
| `vehicle_telemetry.speed_kmh`     | `float`   | `7.2`                                         | Instantaneous vehicle travel speed in kilometers per hour.                        |
| `vehicle_telemetry.battery_pct`   | `float`   | `94.5`                                        | Estimated remaining battery state of charge percentage.                           |
| `link_watchdog.heartbeat_seq`     | `int`     | `142`                                         | Monotonically increasing heartbeat counter for wireless link health validation.   |

</Card>

<Figure src="./assets/diagrams/c6-json-target-alert-message-flow.svg" alt="JSON Target Alert Message Flow and Queueing Pipeline" caption="**Figure 3.3: Downlink Target Alert Message Processing Pipeline.** Illustrative JSON payload structure, string serialization over ROS 2 topic `/c2/target_alert`, multi-stage schema validation, de-duplication filtering, and Nav2 waypoint queue insertion in `ugv_c2_bridge_node`." />

:::

### 3.3 Long-range datalink trade study {#com-radio-selection}

Indoor Wi-Fi was suitable for Semester 1 integration but not established as an airfield-range solution. The **Microhard P900 V2** was identified as a _preliminary preferred_ serial-radio candidate, with pMDDL900 and other options compared for range, power, bandwidth and interface complexity. Procurement, frequency configuration and Singapore regulatory approval remain unresolved decision gates; the radio must not be described as deployed or approved.

::: details Long-range radio comparison, regulatory considerations and selection rationale

**4.4 Long-Range Airfield Technology Comparison**

We compared five wireless options for the planned outdoor communication link:

<Card tag="Airfield Technology Evaluation">

**Table 4.1: Long-Range Wireless Communications Technology Trade-Off Matrix**

| Technology Candidate                            | Frequency Band                                 | Nominal Throughput      | LOS Range                            | Interface                          | Power Draw                                                      | Infrastructure & Regulatory Assessment                                                                                                                                                                | Selection Status                                              |
| ----------------------------------------------- | ---------------------------------------------- | ----------------------- | ------------------------------------ | ---------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Microhard P900 V2**                           | 902–928 MHz FHSS (Configurable to 917–925 MHz) | Up to 276 kbps          | $5 - 15\text{ km}$ (air-to-ground)   | Asynchronous Serial (UART / USB-C) | $1.2\text{ W}$ transmit (at 1W RF), $100\text{ mA}$ idle at 12V | Fully infrastructure-independent point-to-point. Requires firmware configuration to restrict channels to 917–925 MHz for Singapore IMDA compliance. Requires serial framing gateway for ROS 2.        | <Badge type="info" text="PREFERRED CANDIDATE" />              |
| **Microhard pMDDL900**                          | 902–928 MHz 2×2 MIMO                           | Up to 25 Mbps           | $5 - 20\text{ km}$                   | Native Ethernet (RJ45) / IP        | $6 - 12\text{ W}$ transmit, heavy heat-sinking required         | Native IP allows direct CycloneDDS bridging without serial gateway. However, high power draw, thermal dissipation, and significantly higher cost (\$1,200+ USD) exceed lightweight JSON requirements. | <Badge type="info" text="Alternative Backup" />               |
| **Long-Range Wi-Fi Bridge** (e.g. Ubiquiti 5AC) | 5.15–5.85 GHz OFDM                             | $100 - 450\text{ Mbps}$ | $1 - 5\text{ km}$ (directional only) | Ethernet (PoE)                     | $7 - 9\text{ W}$ (requires PoE injector)                        | High bandwidth but severe line-of-sight and antenna misalignment vulnerability. Bulky directional antennas unsuitable for dynamic UAV flight banking angles. High multipath ground attenuation.       | <Badge type="info" text="Rejected for UAV" />                 |
| **4G LTE / 5G Cellular Modem** (e.g. Sixfab)    | Licensed Carrier Bands (B1/B3/B7/B8/B20)       | $10 - 150\text{ Mbps}$  | Cellular coverage dependent          | USB / PCIe / UART                  | $3 - 6\text{ W}$                                                | Relies entirely on civilian telco base stations. High recurring SIM costs; unacceptable latency spikes (&gt;150 ms) during cell handovers; strict aerodrome security regulations ban cellular uplink. | <Badge type="info" text="Rejected (Telco Dependent)" />       |
| **LoRa / LoRaWAN** (e.g. Semtech SX1262)        | 915 / 868 / 433 MHz Chirp Spread Spectrum      | $0.3 - 5.5\text{ kbps}$ | $3 - 10\text{ km}$                   | SPI / UART                         | &lt;0.5W transmit                                               | Extremely low data rate. Packet payload limits (typically 51–222 bytes per frame) require multi-packet fragment assembly for 500-byte JSON telemetry, introducing multi-second delivery latency.      | <Badge type="info" text="Rejected (Throughput Bottleneck)" /> |

</Card>

![Holybro Microhard P900 V2 Telemetry Radio](./assets/images/holybro-p900-v2.png)

![Microhard pMDDL900 OEM Digital Data Link](./assets/images/microhard-pmddl900-detail.png)

![Ubiquiti NanoStation 5AC Loco Wi-Fi Bridge](./assets/images/hardware-ubiquiti-nanostation-5ac.png)

![Sixfab Cellular IoT Modem HAT for Raspberry Pi](./assets/images/hardware-cellular-sixfab-hat.png)

<Figure src="./assets/images/hardware-lora-rak2245-module.png" alt="RAKwireless RAK2245 LoRa Gateway Module" caption="Illustrative product photographs of radio options considered; these devices were not physically tested. Images courtesy of Holybro, Microhard Systems, Ubiquiti Inc., Sixfab, and RAKwireless." />

<CardGrid :cols="2">

<Card tag="Preferred Candidate">

<Card>

</Card>

**Holybro P900 V2** 900 MHz FHSS Serial Radio

</Card>

<Card tag="IP Alternative">

<Card>

</Card>

**Microhard pMDDL900** 900 MHz 25 Mbps MIMO Ethernet

</Card>

<Card tag="Evaluated Baseline">

<Card>

</Card>

**Ubiquiti NanoStation 5AC** 5 GHz Directional Wi-Fi

</Card>

<Card tag="Telco Dependent">

<Card>

</Card>

**Sixfab Cellular HAT** 4G LTE / 5G Cellular Modem

</Card>

<Card tag="Low Data Rate">

<Card>

</Card>

**RAK2245 LoRa Node** Semtech LoRa Datalink

</Card>

</CardGrid>

**4.5 Why Microhard P900 V2 Is Currently Preferred**

The **Holybro Microhard P900 V2** ([\[20\]](./references.md#ref-20)) emerged as the preferred long-range telemetry candidate due to specific alignment with our technical scope:

- **Suitable data rate on paper:** Because our C2 messages consist exclusively of compact JSON strings (~500 bytes), the P900's 276 kbps link rate delivers complete packet transmission in &lt;20 ms, suggesting sufficient nominal bandwidth for low-rate messages, subject to link and framing overhead.
- **No Video Streaming Burden:** Real-time high-definition video is processed entirely on the UAV's onboard computer (YOLO inference). Only post-processed metadata and bounding coordinates traverse the RF link, completely eliminating the requirement for multi-megabit Wi-Fi or LTE links.
- **Size and power:** The proposed unit has published size and power specifications; its actual system power draw has not been measured. A claim of &lt;1.2 W electrical input during 1.0 W RF transmission should not be assumed. It is described as operating and operating off a wide 7–35V DC input (XT30/JST-GH), the Holybro enclosure weighs only 42g and integrates directly with companion computer UART GPIO pins without bulky power converters.
- **Configuration interface:** The V2 enclosure incorporates an onboard USB-to-UART converter with a physical mode switch (Data vs Configuration), allowing rapid parameter tuning via USB-C without requiring specialized FTDI programming jigs.

_Architectural Consideration:_ Because the P900 operates as a transparent serial stream (UART) rather than an Ethernet network interface, it cannot natively transport DDS discovery multicasts. Utilizing the P900 requires deploying a lightweight \*\*Serial Gateway Node\*\* on both the UAV and UGV to frame, serialize, and validate JSON messages across the UART bridge.

**4.6 Microhard pMDDL900 as an Alternative**

The **Microhard pMDDL900** ([\[21\]](./references.md#ref-21)) is retained as a high-performance alternative backup. Operating as a native 2×2 MIMO Ethernet digital data link, the pMDDL900 provides standard IP networking at up to 25 Mbps.

The pMDDL900 would allow CycloneDDS to communicate directly across the radio link without requiring a custom serial gateway. However, this capability introduces substantial trade-offs: the OEM module costs significantly more ($1,200+ USD vs ~$150 USD for the P900), consumes 6–12W of electrical power, generates severe thermal dissipation requiring dedicated aluminum heat-sinks, and introduces complex dual-antenna RF co-location constraints on the drone airframe. The pMDDL900 will only be reconsidered if project scope in Semester 2 expands to mandate live video downlinks to a mobile Ground Control Station.

**4.7 Preliminary Selection & Decision Gate**

The Holybro Microhard P900 V2 represents our \*\*preliminary preferred design baseline\*\*. Final procurement and deployment remain subject to four mandatory engineering decision gates in early Semester 2:

1. **IMDA Regulatory Feasibility:** Confirming firmware restriction parameters to verify whether hopping channels can be strictly constrained within 917–925 MHz, and determining whether statutory trial permits are required.
2. **Formal Vendor Quotations:** Obtaining verified institutional pricing and lead-time commitments from authorized academic suppliers.
3. **Serial Gateway Latency Benchmarking:** Bench-testing the Python/C++ serial framing gateway to prove end-to-end latency remains below 100 ms.
4. **Companion SBC Pin Compatibility:** Verifying hardware UART level-shifting and CTS/RTS hardware flow control between the P900 and the Raspberry Pi 5 / NVIDIA Jetson Orin GPIO headers.

:::

## 4. Implementation & Prototype {#com-implementation}

### 4.1 Two-machine integration {#com-network}

We connected the Raspberry Pi and workstation over a local Wi-Fi network. The workstation ran ROS 2, Gazebo and Nav2. CycloneDDS static peers allowed the two machines to discover each other. The addresses below describe this test setup and are not general configuration defaults.

::: details Testbed hardware and network configuration

**5.1 Semester 1 Indoor Network Topology**

The Semester 1 multi-machine testbed connected two distinct physical computing nodes across an isolated wireless subnet:

- **Machine 1 (UAV C2 Terminal):** Raspberry Pi 5 (Quad-Core ARM Cortex-A76 @ 2.4 GHz, 8 GB LPDDR4X RAM) running Ubuntu 24.04 LTS and ROS 2 Jazzy. Hosted `DemoComs_C2.py` and `uav_waypoint_commander.py`, operating on Wi-Fi interface `wlan0` (IP: `192.168.168.50` / `192.168.137.233`).
- **Machine 2 (UGV Simulation & Autonomy Workstation):** Engineering laptop (AMD Ryzen 7, NVIDIA RTX 4070, 32 GB RAM) running Ubuntu 24.04 LTS under WSL2. Executed Gazebo Harmonic DART physics, Dual-EKF state estimation, Nav2 Hybrid A\* / RPP stack, `ugv_c2_bridge_node`, and `c2_alert_receiver` (IP: `192.168.168.100` / `192.168.137.1`).

:::

### 4.2 Alert ingestion, coordinates and goal queue {#com-dispatch}

The UGV bridge read target coordinates in the `map` frame, converted the requested heading to a quaternion and sent a `PoseStamped` goal to Nav2. A FIFO queue handled multiple targets, and RViz markers showed queued and active goals. **These tests used synthetic map-frame targets; they did not verify conversion of real UAV GPS detections into UGV map coordinates.**

::: details Coordinate conversion and Nav2 dispatch implementation

**5.4 Coordinate Conversion and Nav2 Action Dispatch**

When `ugv_c2_bridge_node` ingests a target alert, it converts Cartesian offsets into a fully formatted `geometry_msgs/msg/PoseStamped` message referencing the global `map` frame. Target orientation is calculated by converting the scalar yaw angle into a unit quaternion:

$$
q_z = \sin\left(\frac{\theta}{2}\right), \quad q_w = \cos\left(\frac{\theta}{2}\right), \quad q_x = 0, \quad q_y = 0
$$

Goals are appended to an internal FIFO queue (`goal_queue`). The node concurrently publishes RViz marker spheres (`visualization_msgs/msg/MarkerArray`) on `/c2/goal_markers`, color-coding active waypoints in cyan, queued waypoints in amber, and completed targets in green with yellow trajectory breadcrumb lines.

<CommunicationsWidget2 />

:::

**Related documentation:** [Navigation →](/report#programming) · [Simulation →](/report#programming) (links to the programming chapter; exact subsection anchors should be verified in the live Report).

### 4.3 Proposed serial-radio gateway {#com-future-gateway}

The proposed P900 V2 uses a serial interface, so ROS 2 messages would need a gateway rather than being sent as native DDS traffic. The gateway would frame and validate messages before publishing them on the receiving computer. **This gateway has not yet been implemented or tested.**

::: details Proposed COBS, CRC-32 and acknowledgement design

**Proposed serial framing gateway**

When transitioning from indoor Wi-Fi to the long-range P900 V2 datalink, ROS 2 nodes cannot directly publish native DDS packets over a transparent UART connection. The proposed architecture would use a serial framing gateway on each computer:

<Figure src="./assets/diagrams/uav-ugv-rf-datalink.svg" alt="Proposed Serial Framing Gateway and RF Telemetry Pipeline" caption="**Figure 5.2: Proposed Semester 2 Serial Framing Gateway Pipeline.** Encapsulation of ROS 2 JSON topics into framed UART packets using Consistent Overhead Byte Stuffing (COBS) and 32-bit CRC error detection across the 900 MHz FHSS RF physical layer." />

_Framing & Reliability Protocol (Design Requirements):_

- **Packet Delimitation:** Uses **Consistent Overhead Byte Stuffing (COBS)** with a zero-byte delimiter (`0x00`) to establish unambiguous packet framing boundaries over the asynchronous serial stream without payload escape bloat.
- **Integrity Checking:** Appends a hardware-computed **CRC-32 checksum** to the trailer of each packet to detect bit-errors caused by RF fading or multipath interference.
- **Stop-and-Wait ARQ:** Implements an explicit acknowledgement (ACK/NACK) protocol with a $200\text{ ms}$ timeout and up to 3 retransmissions for critical target alert dispatches.

:::

**C2 — Complete communications demonstration (existing recording)**

<VideoClip src="./assets/videos/uav-ugv-communication-video.mp4" poster="./assets/images/posters/uav-ugv-communication-video-poster.jpg" caption="Video 3.3.0: Heterogeneous UAV-UGV communication pipeline demonstration between Raspberry Pi 5 and workstation." />

_Semester 1: Raspberry Pi 5 command generation and Gazebo UGV navigation via the workstation. This does not depict live UAV flight or a physical UGV._

## 5. Testing & Results {#com-testing}

The indoor test matrix covers peer discovery, alert reception, JSON parsing, waypoint dispatch, abort handling and telemetry. Recordings support the cross-device demonstration, but several numerical claims in the historical table have not been independently reproduced. The active bridge publishes telemetry at **2 Hz**; the earlier 600-message/ten-minute record appears to describe a **1 Hz** test and must not be presented as the current configuration.

**6.5 Communications-to-Navigation Integration Verification**

The recorded demonstration shows target alerts passing from the Raspberry Pi 5 to the UGV-side bridge and Nav2 in Gazebo. The bridge uses `NavigateToPose` and publishes simulated telemetry at **2 Hz**. Any pickup dwell represents a simulated task state, not physical debris collection.

<Card tag="Historical Indoor Test Matrix — Evidence Status Under Review">

**Table 6.1: Communications Subsystem Verification & Test Matrix**

| Test ID | Evaluation Scope                 | Test Procedure                                                                     | Acceptance Criteria                                                               | Status                                           | Observed Result                                                                                                                                     |
| ------- | -------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-01  | DDS Cross-Architecture Discovery | Run RPi 5 (ARM64) and Laptop (x86_64) across Wi-Fi subnet with CycloneDDS XML      | Bidirectional discovery within &lt;5.0 s; all topics visible in `ros2 topic list` | <Badge type="warning" text="HISTORICAL CLAIM" /> | Discovered in &lt;1.0 s; full node graph visible across both machines.                                                                              |
| COM-02  | Latched Alert Ingestion          | Publish 3 alerts on RPi 5, then launch receiver node on Laptop workstation         | Receiver ingests all 3 buffered alerts via Transient Local QoS without loss       | <Badge type="warning" text="HISTORICAL CLAIM" /> | Reported in the earlier test matrix; verify publisher persistence, compatible QoS and the original logs before treating this as a confirmed result. |
| COM-03  | JSON Schema Integrity            | Transmit structured payloads with coordinates, confidence, timestamps, and SHA-256 | Zero JSON parse exceptions; coordinates successfully mapped to Cartesian floats   | <Badge type="warning" text="HISTORICAL CLAIM" /> | Reported in the earlier test matrix; the available audit confirms JSON parsing in source, not the claimed count of successful messages.             |
| COM-04  | Nav2 Action Goal Queueing        | Dispatch 3 sequential targets; monitor Nav2 `NavigateToPose` goal execution        | UGV navigates to Target 1 → Dwells 2s → Dispatches Target 2 → Dispatches Target 3 | <Badge type="warning" text="HISTORICAL CLAIM" /> | Sequential clearance across all 3 coordinates; RViz markers updated.                                                                                |
| COM-05  | Emergency Abort Handling         | Publish `suggested_action: "ABORT"` while UGV is cruising at 2.22 m/s              | Action goal cancelled immediately; robot halts without collision                  | <Badge type="warning" text="HISTORICAL CLAIM" /> | Historical claim; cancellation latency and stopping distance were not established by the source-code/runtime audits.                                |
| COM-06  | Telemetry Uplink Heartbeat       | Historical ten-minute telemetry check; current bridge is configured at 2 Hz        | Check sequence continuity and message rate                                        | <Badge type="warning" text="RECHECK" />          | Historical record reports 600 messages at 1 Hz; current code publishes at 2 Hz.                                                                     |

</Card>

::: details Recorded communication demonstrations and evidence

<VideoClip src="./assets/videos/230926-uavugv-comms-rpi5-.mp4" poster="./assets/images/posters/230926-uavugv-comms-rpi5-poster.jpg" caption="Video 3.3.1: Raspberry Pi 5 terminal recording showing incoming JSON alerts and CycloneDDS publishing." />

<VideoClip src="./assets/videos/230926-uavugv-comms-laptop.mp4" poster="./assets/images/posters/230926-uavugv-comms-laptop-poster.jpg" caption="Video 3.3.2: Laptop workstation recording showing Nav2 goal queueing and action dispatch." />

<VideoClip src="./assets/videos/Multiqueue waypoint.mp4" poster="./assets/images/posters/multiqueue-waypoint-poster.jpg" caption="Video 3.3.3 (C4): Multi-Queue Sequential Waypoint Navigation demonstration in Nav2 showing autonomous 3-target sequence execution." />

_Raspberry Pi 5 terminal recording, workstation Nav2 recording, and multi-queue waypoint demonstration provide complementary perspectives on the distributed communications testbed._

:::

**C4 — Sequential waypoint dispatch:** Documented in Video 3.3.3 above, demonstrating autonomous ingestion, frame conversion, and sequential queueing of three target alerts (`target_01` at $t = 0\text{ s}$, `target_02` at $t = 12\text{ s}$, `target_03` at $t = 25\text{ s}$).

**Coordinate-to-goal conversion:** The complete transformation pipeline (source coordinates $\to$ schema validation $\to$ `geometry_msgs/PoseStamped` in `map` frame $\to$ Nav2 action queue) is illustrated in [Figure 3.3.4 (C6) — JSON Target Alert Message Flow and Queueing Pipeline](#sec-4-iterations).

<Figure src="./assets/diagrams/c8-emergency-abort-logic.svg" alt="Multi-Tier Emergency Abort and Goal Cancellation Architecture" caption="**Figure 5.2: Emergency Abort and Goal Cancellation Architecture.** Flowchart detailing software mission abort handling, queue flushing, asynchronous Nav2 action cancellation (`cancel_goal_async()`), and commanded zero-velocity override in the Semester 1 SIL testbed, distinguished from proposed Semester 2 physical hardware E-stop and STO motor interlocks." />

<Figure src="./assets/diagrams/c9-communication-failure-recovery.svg" alt="Datalink Loss and Recovery Finite State Machine" caption="**Figure 6.1: Datalink Failure and Autonomy Recovery State Flow.** Finite state machine detailing active goal execution during loss of communications, waypoint holding safe-pause upon arrival, automatic DDS reconnection, and Semester 2 proposed autonomous return-to-base (RTB) watchdog timeout." />

## 6. Engineering Discussion {#com-discussion}

We separated target dispatch from the UGV navigation software and connected ROS 2 nodes across two computers. Static unicast peers solved the discovery problem in our WSL2 setup. JSON messages were straightforward to inspect during testing, but they require validation in the application. Static peers also need to be updated when network addresses change. The indoor tests do not establish outdoor radio reliability. A plain message hash does not authenticate the sender; that requires keyed authentication or a digital signature.

::: details Additional evaluation and lessons learned

**7. Evaluation & Discussion**

**7.1 Evaluation of Semester 1 Implementation**

The recorded indoor demonstration showed the Raspberry Pi sending target alerts to the simulated UGV and the bridge passing goals to Nav2. The separation between mission messages and robot motion control made the system easier to test. These results do not establish reliability on a long-range radio link.

**7.2 Limitations of Indoor Wi-Fi & DDS Transport**

Despite its success on the benchtop, three critical limitations prevent direct deployment of this architecture to an outdoor operational airfield:

1. **Unverified outdoor range:** Indoor router tests do not establish reliable communication over runway distances. Outdoor coverage depends on antenna placement, interference and line of sight.
2. **Transport compatibility:** The proposed serial radio is not an IP network, so native DDS traffic would require a separate transport or gateway design.
3. **Static IP Fragility:** Static unicast peering requires hardcoded IP tables in `cyclonedds.xml`. While manageable in lab conditions, any network address change or IP lease renewal breaks node discovery.

**Preliminary P900 V2 selection**

The Holybro Microhard P900 V2 is a candidate for Semester 2. Operating on 900 MHz may offer different propagation characteristics from 5 GHz Wi-Fi, but range and reliability require testing. However, it requires accepting the development overhead of an asynchronous serial gateway node to frame and validate JSON messages across the UART bridge. Furthermore, the radio must be strictly validated against IMDA 917–925 MHz frequency limits before outdoor field transmission can be authorized.

**8. Improvements & Lessons Learned**

**8.1 DDS Discovery Under Virtualized NAT**

The main networking issue was ROS 2 discovery across WSL2 and the external Raspberry Pi. Multicast discovery was unreliable, so we configured explicit CycloneDDS peers in XML. This allowed the two computers to discover each other in our test setup. The configuration does not by itself prove zero added latency.

**8.2 JSON String vs Custom ROS 2 IDL Messages**

Utilizing standard `std_msgs/msg/String` carrying JSON payloads significantly accelerated heterogeneous development between the ARM64 Raspberry Pi 5 and x86_64 workstation. It eliminated the need to cross-compile and synchronize custom ROS 2 message packages (`.msg` files) across different colcon workspaces. For the low-rate test messages, JSON was convenient to inspect in the terminal. Parsing latency was not independently benchmarked in the runtime audit.

**8.3 Serial Gateway Design Considerations**

Preparing for long-range radio integration revealed that transparent serial links can fragment packets if baud rates or buffer sizes are misconfigured. The proposed Semester 2 serial gateway must enforce strict byte-stuffing framing (COBS) and hardware CRC-32 validation to prevent partial JSON dictionaries from being passed to the parser.

:::

## 7. Limitations & Semester 2 Plan {#com-semester-two}

Next, we need to confirm the radio regulations, select suitable hardware and implement the serial-to-ROS 2 gateway. We then plan to measure packet loss and latency, test communication loss and stale-message handling, and verify target dispatch between the physical UAV and UGV. Outdoor radio range and full physical mission performance have not yet been tested.

::: details Detailed proposed milestones

**9. Semester 2 Development Plan**

**Proposed implementation tasks**

The proposed transition from indoor Wi-Fi testing to outdoor radio operation has ten steps:

1. **Payload Profiling:** Measure and freeze exact JSON packet sizes for all alert and telemetry message types to establish maximum required UART baud rates.
2. **IMDA Regulatory Clearance:** Verify Microhard P900 V2 firmware frequency masking via PicoConfig software to prove strict 917.0–925.0 MHz channel confinement; submit technical inquiry to IMDA regarding Short Range Device (SRD) power thresholds.
3. **Vendor Quotations & Procurement:** Solicit verified quotations from authorized academic distributors for 2× Holybro Microhard P900 V2 radios, matched 915 MHz rubber-ducky antennas, and high-gain ground station dipoles.
4. **Formal Radio Selection Gate:** Review quotations and regulatory feasibility to officially lock the P900 V2 or activate the pMDDL900 alternative backup plan.
5. **Serial Framing Gateway Development:** Write and unit-test the Python/C++ serial gateway node implementing COBS packet delimitation, CRC-32 integrity validation, and ARQ retransmission timeouts.
6. **Benchtop Radio-in-the-Loop (RIL) Testing:** Connect physical P900 V2 radios via RF coaxial attenuators (-30 dB) in the lab to validate UART throughput, JSON serialization, and Nav2 dispatch without over-the-air radiation.
7. **Latency & Reliability Profiling:** Measure end-to-end command dispatch latency ($t_{\text{alert}} \le 100\text{ ms}$) and packet error rates (PER &lt; 0.1%) under controlled simulated channel noise.
8. **Field Ground-to-Ground Range Testing:** Execute incremental outdoor range sweeps at the NUS EA Field campus proving ground ($50\text{ m}$, $100\text{ m}$, $250\text{ m}$), measuring Received Signal Strength Indication (RSSI) and packet delivery ratios.
9. **Antenna Elevation & Polarization Optimization:** Evaluate vertical vs horizontal antenna mounting orientations on the UGV chassis to eliminate vehicle body shadowing and ground reflection nulls.
10. **Full Inter-Agent Closed-Loop Integration:** Execute end-to-end mission verification connecting real UAV flight reconnaissance, RF alert transmission, UGV autonomous trajectory clearance, and telemetry uplink.

:::

<!-- #endregion report -->

[Hilbert's engineering references →](./references.md)
