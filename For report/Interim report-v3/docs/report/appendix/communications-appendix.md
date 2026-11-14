---
title: "Appendix K: Communications Protocol & Radio Reference"
description: "JSON message schemas, candidate long-range datalink comparative analysis, IMDA spectrum regulations, and serial framing specifications."
owner: "Hilbert Soh"
---

# Appendix K: Communications Protocol & Radio Reference

<!-- #region comms-appendix -->

This appendix details the inter-agent JSON message schemas, candidate long-range RF transceiver evaluations, Singapore statutory spectrum compliance parameters, and proposed serial framing protocols for the UAV–UGV communications subsystem.

### K.1 Complete JSON Alert & Telemetry Schemas

The command and control interface exchanges structured JSON payloads over ROS 2 topics between the aerial reconnaissance drone (ARGUS) and the ground remediation rover (HUNTER).

<Card tag="UAV → UGV Command Stream">

**Table K.1: C2 Target Alert Format (`/c2/target_alert`)**

| JSON Field | Data Type | Example Value | Role & Semantic Definition |
| :--- | :--- | :--- | :--- |
| `mission_id` | `string` | `"RUNWAY_PATROL_PHASE1"` | Sortie identifier linking reconnaissance missions to remediation tasks. |
| `threat_id` | `string` | `"FOD_BOLT_M10_003"` | Unique debris identifier assigned by aerial detection system. |
| `timestamp` | `float` | `1730000000.123` | Unix epoch time ($s$) when FOD was detected by drone camera. |
| `confidence` | `float` | `0.94` | Classification model softmax probability score ($0.00 - 1.00$). |
| `priority` | `string` | `"IMMEDIATE"` / `"STANDARD"` | Queueing priority: `IMMEDIATE` preempts active goals; `STANDARD` appends to FIFO queue. |
| `remediation_action` | `string` | `"SUCTION_HIGH_VOLUME"` | Action flag specifying remediation subsystem (`SUCTION`, `SWEEPER`, `INSPECT`). |
| `estimated_size_cm` | `float` | `3.5` | Bounding box estimated major axis dimension ($cm$). |
| `object_class` | `string` | `"METAL_FASTENER"` | Detected debris material category for remediation verification. |
| `coordinates.x` | `float` | `12.50` | Georeferenced target Cartesian $X$ position ($m$) in site `map` frame. |
| `coordinates.y` | `float` | `-4.20` | Georeferenced target Cartesian $Y$ position ($m$) in site `map` frame. |
| `coordinates.z` | `float` | `0.00` | Target elevation ($m$) relative to local ground plane datum. |
| `approach_heading_deg` | `float` | `180.0` | Recommended UGV yaw alignment angle ($^\circ$) for vacuum nozzle approach. |

</Card>

```json
{
  "mission_id": "RUNWAY_PATROL_PHASE1",
  "threat_id": "FOD_BOLT_M10_003",
  "timestamp": 1730000000.123,
  "confidence": 0.94,
  "priority": "IMMEDIATE",
  "remediation_action": "SUCTION_HIGH_VOLUME",
  "estimated_size_cm": 3.5,
  "object_class": "METAL_FASTENER",
  "coordinates": { "x": 12.50, "y": -4.20, "z": 0.00 },
  "approach_heading_deg": 180.0
}
```

<Card tag="UGV → C2 Status Stream">

**Table K.2: UGV Telemetry State Format (`/ugv/telemetry`)**

| JSON Field | Data Type | Example Value | Role & Semantic Definition |
| :--- | :--- | :--- | :--- |
| `robot_id` | `string` | `"FOD_HUNTER_01"` | Canonical hardware station identifier. |
| `system_state` | `string` | `"EN_ROUTE"` | Operational state (`IDLE`, `EN_ROUTE`, `REMEDIATING`, `FAULT`). |
| `battery_voltage` | `float` | `51.2` | 16S LiFePO4 bus terminal voltage ($V$). |
| `battery_soc_percent` | `float` | `88.5` | Battery management system state of charge ($0.0 - 100.0\%$). |
| `active_goal_id` | `string` | `"FOD_BOLT_M10_003"` | Debris identifier currently being navigated to. |
| `queued_goals_count` | `integer`| `2` | Number of pending target alerts stored in FIFO dispatch queue. |
| `pose.x` | `float` | `10.15` | Current filtered global $X$ pose ($m$) from Dual-EKF observer. |
| `pose.y` | `float` | `-3.80` | Current filtered global $Y$ pose ($m$) from Dual-EKF observer. |
| `pose.heading_deg` | `float` | `178.5` | Filtered vehicle heading angle ($^\circ$) relative to map datum. |
| `safety_interlock_ok` | `boolean`| `true` | Hardware emergency stop and contact dock circuit continuity flag. |

</Card>

```json
{
  "robot_id": "FOD_HUNTER_01",
  "system_state": "EN_ROUTE",
  "battery_voltage": 51.2,
  "battery_soc_percent": 88.5,
  "active_goal_id": "FOD_BOLT_M10_003",
  "queued_goals_count": 2,
  "pose": { "x": 10.15, "y": -3.80, "heading_deg": 178.5 },
  "safety_interlock_ok": true
}
```

<Figure 
  src="../members/hilbert/assets/diagrams/c6-json-target-alert-message-flow.svg" 
  alt="JSON Target Alert Message Flow and Queueing Pipeline" 
  caption="Figure K.1: JSON target alert parsing, priority evaluation, coordinate conversion, and FIFO goal dispatch pipeline in ugv_c2_bridge_node." 
/>

---

### K.2 Candidate Long-Range Datalink Comparative Analysis

Table K.3 evaluates candidate wireless datalink technologies against operational runway patrol requirements (1.5–3.0 km range, low power consumption, lightweight payload, and Singapore spectrum compliance).

**Table K.3: Long-Range Datalink Technology Trade Study**

| Parameter | Microhard P900 V2 (Candidate) | RFD900x (Alternative) | Digi XBee-PRO 900HP (Alternative) | Microhard pMDDL2450 (Broadband IP) |
| :--- | :--- | :--- | :--- | :--- |
| **RF Band & Spread Spectrum** | $902\text{–}928\text{ MHz}$ (FHSS) | $902\text{–}928\text{ MHz}$ (FHSS) | $902\text{–}928\text{ MHz}$ (FHSS) | $2.4\text{ GHz}$ MIMO (OFDM IP) |
| **Firmware Channel Masking** | **917.0–925.0 MHz supported** | Wideband 902–928 MHz | Channel hopping mask configurable | Broadband $2.4\text{ GHz}$ ISM |
| **Max Transmit Power** | $1.0\text{ W}$ ($30\text{ dBm}$, adjustable) | $1.0\text{ W}$ ($30\text{ dBm}$) | $250\text{ mW}$ ($24\text{ dBm}$) | $1.0\text{ W}$ ($30\text{ dBm}$) |
| **Over-the-Air Data Rate** | Up to $276\text{ kbps}$ | Up to $250\text{ kbps}$ | Up to $200\text{ kbps}$ | Up to $25\text{ Mbps}$ |
| **Airfield Range (LOS)** | $3\text{–}10\text{ km}$ with $2.1\text{ dBi}$ omni | $3\text{–}10\text{ km}$ with whip antenna | $2\text{–}5\text{ km}$ with whip antenna | $1\text{–}3\text{ km}$ (higher path loss) |
| **Supply Voltage & Draw** | $3.3\text{–}5.5\text{ V DC}$, $\approx 3.5\text{ W}$ peak | $5.0\text{ V DC}$, $\approx 5.0\text{ W}$ peak | $3.3\text{ V DC}$, $\approx 1.0\text{ W}$ peak | $9\text{–}30\text{ V DC}$, $\approx 12.0\text{ W}$ peak |
| **Physical Mass & Size** | **$18\text{ g}$** ($26.5 \times 33 \times 3.5\text{ mm}$) | $14.5\text{ g}$ ($30 \times 57 \times 12\text{ mm}$) | $40\text{ g}$ ($33 \times 42\text{ mm}$) | $120\text{ g}$ (requires heatsink) |
| **Security & Encryption** | Hardware AES-256 link layer | Hardware AES-128 link layer | Hardware AES-128 link layer | WPA2-PSK / AES-CCMP |
| **Host Interface** | Asynchronous UART serial ($3.3\text{ V}$) | Asynchronous UART serial | Asynchronous UART / SPI | $10/100$ Ethernet IP |
| **Unit Cost Envelope** | $\approx \$150\text{–}200\text{ USD}$ | $\approx \$120\text{–}150\text{ USD}$ | $\approx \$90\text{–}120\text{ USD}$ | $\approx \$1,200+\text{ USD}$ |

#### Radio Security Considerations
- **Serial RF (Microhard P900 V2):** Operates an air-gapped point-to-point asynchronous serial connection. The lack of an IP network stack completely eliminates remote port scanning, SSH brute-force attacks, and IP routing exploits. The modem firmware enforces AES-256 physical-layer payload encryption paired via unique 32-bit Network IDs.
- **Broadband IP (pMDDL2450 / pMDDL900):** Native TCP/IP networking exposes computing hosts to network attack surfaces, requiring firewall policies (`iptables`), connection rate limiting (`fail2ban`), MAC address whitelisting, and disabled broadcast beacons.

#### Institutional Procurement Decision Gates
Acquisition and flight integration of P900 V2 transceivers depends on four engineering verification gates scheduled in Semester 2:
1. **IMDA Channel Masking Verification:** Confirming via PicoConfig software that hopping frequencies are strictly constrained within 917.0–925.0 MHz.
2. **Supplier Procurement:** Securing formal institutional purchase quotes from authorized regional distributors.
3. **Serial Gateway Benchmarking:** Bench-testing the serial framing gateway in loopback to confirm packet processing latency remains $<50\text{ ms}$.
4. **Hardware Flow Control Validation:** Confirming CTS/RTS hardware handshaking between the transceiver and companion computing headers (Raspberry Pi 5 / Jetson GPIO).

---

### K.3 Singapore IMDA Spectrum Regulations (917–925 MHz)

Radio transmissions in Singapore are legally governed by the **Infocomm Media Development Authority (IMDA)** under the *Technical Specification for Short Range Devices (IMDA TS SRD)* [\[3\]](../members/hilbert/references.md#ref-3), the *Telecommunications Act 1999* [\[10\]](../members/hilbert/references.md#ref-10), and civil aviation aerodrome spectrum directives [\[4\]](../members/hilbert/references.md#ref-4).

- **Singapore Permitted Sub-Band (917.0–925.0 MHz):** Standard North American ISM transceivers hop across 902.0–928.0 MHz. Frequencies below 917.0 MHz and above 925.0 MHz are legally allocated to cellular mobile network operators (MNOs) and public services. Unmodified overseas firmware that hops into 902–917 MHz or 925–928 MHz violates statutory regulations. Transceiver firmware must be constrained to the 8.0 MHz window between 917.0 and 925.0 MHz.
- **IMDA Radiated Power Limits:** Under IMDA TS SRD Table 1 (Item 7b), telemetry devices operating within 917–925 MHz are restricted to effective radiated power (ERP) limits between **$100\text{ mW}$ and $500\text{ mW}$ ($20\text{–}27\text{ dBm}$)**, depending on occupied channel bandwidth and duty cycle. Transceivers rated at 1.0 W (30 dBm) conducted output must be configured in software to reduce power output to remain compliant with radiated limits when paired with omnidirectional whip antennas.

<Figure 
  src="../members/hilbert/assets/diagrams/imda-spectrum-allocation.svg" 
  alt="Singapore IMDA 900 MHz Spectrum Allocation and Permitted Sub-Band" 
  caption="Figure K.2: Singapore 900 MHz spectrum comparison and IMDA compliance limits for the candidate Microhard P900 V2 telemetry transceiver." 
/>

---

### K.4 Proposed Serial Framing & Datalink Reliability Protocol

When transitioning from local Wi-Fi to a long-range transparent UART datalink, ROS 2 nodes cannot publish native DDS packets over a serial stream. The proposed architecture deploys a lightweight serial gateway node on each platform.

<Figure 
  src="../members/hilbert/assets/diagrams/uav-ugv-rf-datalink.svg" 
  alt="Proposed Serial Framing Gateway and RF Telemetry Pipeline" 
  caption="Figure K.3: Proposed serial-radio gateway architecture framing JSON messages with COBS encoding and CRC-32 integrity checks over UART." 
/>

#### Framing & Reliability Protocol Specifications:
1. **Packet Delimitation (COBS):** Employs **Consistent Overhead Byte Stuffing (COBS)** with a `0x00` delimiter byte to mark packet boundaries. COBS guarantees that delimiter bytes never appear in the payload, providing robust packet synchronization over noisy serial channels without unpredictable byte-stuffing bloat.
2. **Integrity Checking (CRC-32):** Appends a hardware-computed 4-byte **CRC-32 polynomial** checksum to the packet trailer, detecting bit flips, frame truncations, and RF interference bursts.
3. **Stop-and-Wait ARQ:** Critical target alerts require positive acknowledgement (`ACK`). If an acknowledgement is not received within $200\text{ ms}$, the gateway initiates up to 3 automatic retransmissions before flagging an alert timeout fault.

<!-- #endregion comms-appendix -->
