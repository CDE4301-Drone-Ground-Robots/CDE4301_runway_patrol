---
title: "STM32 Low-Level Control Unit"
description: "Two-tier embedded control architecture, STM32 NUCLEO-F446RE selection, 11-subsystem pin allocation, and hardware verification."
owner: "Gabriel Tan"
outline: [2, 3]
---

# STM32 Low-Level Control Unit

<p class="fh-lead-summary">
  A bare-metal <strong>STM32 NUCLEO-F446RE</strong> (84 MHz active / 180 MHz max) executes the 50 Hz drive loop, 500 kbps CANopen motor bus, 5 V open-drain stepper sinking, and 250 ms safety watchdog across 11 pre-allocated hardware interfaces.
</p>

<div class="fh-status-strip" role="region" aria-label="Subsystem verification status">
  <div class="fh-status-row">
    <span class="fh-status-label">Tested</span>
    <span class="fh-pill fh-pill--tested">CAN diagnostics</span>
    <span class="fh-pill fh-pill--tested">2× ZLAC8015D on shared CAN</span>
    <span class="fh-pill fh-pill--tested">4WD drive</span>
    <span class="fh-pill fh-pill--tested">USB gamepad</span>
    <span class="fh-pill fh-pill--tested">250 ms watchdog</span>
    <span class="fh-pill fh-pill--tested">E-stop</span>
    <span class="fh-pill fh-pill--tested">stepper</span>
  </div>
  <div class="fh-status-row">
    <span class="fh-status-label">Designed, not yet tested</span>
    <span class="fh-pill fh-pill--untested">48 V battery</span>
    <span class="fh-pill fh-pill--untested">safety contactor</span>
    <span class="fh-pill fh-pill--untested">BMS</span>
    <span class="fh-pill fh-pill--untested">IMU</span>
    <span class="fh-pill fh-pill--untested">GNSS</span>
    <span class="fh-pill fh-pill--untested">ROS 2 link</span>
    <span class="fh-pill fh-pill--untested">carrier PCB</span>
  </div>
</div>

<div class="fh-hero-slot">
  <div class="fh-hero-slot__meta">
    <span class="fh-hero-slot__title">Hero Looping Drive Video Slot (<code>stm32-drive-hero.mp4</code>)</span>
    <span class="fh-hero-slot__desc">4WD chassis benchtop and floor drive under wireless USB Host gamepad control (Preset 3: 32 V, 10.4 A, 25 RPM cap).</span>
  </div>
  <MissingAsset name="stm32-drive-hero.mp4" alt="Short looping 4WD chassis drive video placeholder" />
</div>

<!-- #region microcontrollers -->

<!-- #region report -->

<span id="why-dedicated-ecu"></span>

## 1. Objectives & Requirements {#objectives-requirements}

The low-level Electronic Control Unit (ECU) offloads real-time motor control, microsecond stepper pulse generation, and hardware fault supervision from the high-level NVIDIA Jetson companion computer. Every hardware requirement below maps directly to a verification row in [Section 5](#testing-results).

| ID | Requirement | Target Metric | Subsystem / Interface |
| :--- | :--- | :--- | :--- |
| **HW-R1** | Real-time CPU headroom | $\le 50\%$ load under $2\times$ worst-case traffic | Cortex-M4F @ $84\text{ MHz}$ ($180\text{ MHz}$ max) |
| **HW-R2** | Dual-axle CANopen traction bus | $500\text{ kbps}$, 2 nodes on 1 bus ($0\%$ packet loss) | `CAN1` (`PB8` RX, `PB9` TX) → 2× ZLAC8015D |
| **HW-R3** | Vacuum actuator optocoupler drive | $\ge 10\text{ mA}$ LED sink current, $\le 1\ \mu\text{s}$ timing jitter | `PC2` (`PULSE-`), `PC3` (`DIR-`) 5 V open-drain |
| **HW-R4** | Standalone operator teleoperation | Direct USB HID polling with $\le 250\text{ ms}$ timeout | `USB_OTG_FS` (`PA11` DM, `PA12` DP) |
| **HW-R5** | Hardware & protocol emergency stop | $\le 20\text{ ms}$ fault-to-brake response | CiA 402 `0x0002` + `PB1` RF interlock |
| **HW-R6** | Multi-sensor serial expansion | $\ge 4$ hardware UARTs + $1\times\text{I2C}$ (zero pin conflicts) | `USART1`, `USART3`, `UART4`, `UART5`, `I2C1` |
| **HW-R7** | Vibration-resistant interconnect | Locking headers + onboard CAN & 5 V pull-up rail | Custom 2-layer KiCad carrier PCB |

## 2. System Architecture {#system-architecture}

Compute is split across two tiers connected over a supervised serial/USB link (`cmd_vel` at $50\text{ Hz}$ with a $500\text{ ms}$ watchdog). Click any block in **Figure 2.1** to jump to its design section.

<Figure
  src="./assets/diagrams/stm32-hardware-two-tier-computing-split-architecture-di.svg"
  alt="Two-Tier Computing Split Architecture Diagram"
  caption="**Figure 2.1: Two-Tier Computing Split Architecture.** The NVIDIA Jetson runs non-real-time Linux and ROS 2 perception/planning, while the bare-metal STM32 NUCLEO-F446RE executes the 50 Hz drive loop, 500 kbps CANopen bus, 11.9 ns DWT stepper timing, and 250 ms communication watchdog."
/>

| Subsystem | Hardware Implementation | Key Specifications & Role |
| :--- | :--- | :--- |
| **Microcontroller** | **STM32 NUCLEO-F446RE** (Cortex-M4F) | $84\text{ MHz}$ active ($180\text{ MHz}$ max), **2 hardware CAN buses**, **6 UARTs**, 5 V-tolerant I/O. |
| **Traction Drive** | **2× ZLAC8015D** dual-channel servo drivers | **500 kbps CAN1** (`PB8`/`PB9`), driving **4 hub motors** ($263\text{ mm}$ wheels, $r = 0.1315\text{ m}$). |
| **Operator Control** | **Wireless GameSir gamepad** | Connected directly to **USB_OTG_FS Host** (`PA11`/`PA12`) for standalone testing without a laptop. |
| **Vacuum Actuator** | **Stepper motor + TB6600 driver** ($110\text{ mm}$ stroke) | Common-anode **5 V low-side sinking** (`PC2` `PULSE-`, `PC3` `DIR-` open-drain). |
| **Power & Safety** | **48 V LiFePO4 battery** ($32\text{ V}$ bench supply in Sem 1) | RF safety switch on `PB1` alongside CiA 402 Quick-Stop (`0x0002`) and main contactor cutoff. |
| **Sem 2 Expansion** | Pre-allocated UART, I2C & GPIO channels | **Smart BMS** (`USART1`), **9-DOF IMU** (`I2C1`), **UM980 RTK GNSS** (`USART3`), **Microhard Radio v2** (`UART4`), **ToF** (`UART5`), **vacuum relay** (`PC0`), **lighting** (`PB4`, `PB5`). |

<!-- #endregion microcontrollers -->

<span id="requirements-selection"></span>

## 3. Design Methodology & Selection {#design-selection}

### 3.1 Why a separate microcontroller? {#why-separate-mcu}

<DecisionCard
  title="Why offload low-level control from the NVIDIA Jetson to a dedicated MCU?"
  need="50 Hz (20 ms) motor velocity updates, 200–800 µs stepper pulses, and a ≤ 250 ms communication watchdog that acts even if Linux freezes."
  choice="Two-tier split: NVIDIA Jetson (Linux / ROS 2) for perception and planning + bare-metal STM32 NUCLEO-F446RE for real-time actuation and safety."
  tradeoff="Adds a second processor and serial link protocol, but isolates motor braking and microsecond pulse timing from Linux kernel scheduling jitter."
>

- **OS Scheduling Isolation:** General-purpose Linux kernels on the NVIDIA Jetson experience multi-millisecond preemption delays under GPU load (YOLO11 inference and SLAM), which corrupts $200\text{–}800\ \mu\text{s}$ stepper pulse trains.
- **Independent Fault Containment:** If the Jetson reboots or drops `cmd_vel` packets for $>500\text{ ms}$ ($250\text{ ms}$ for the USB gamepad), the STM32 triggers a CiA 402 Quick-Stop (`0x0002`) independently.
- **Native Peripheral Density:** Provides 2 hardware `bxCAN` controllers, 6 hardware `UART`/`USART` ports, and 5 V-tolerant open-drain GPIOs on a single chip without USB-to-serial adapters.

</DecisionCard>

### 3.2 Why the NUCLEO-F446RE? {#why-f446re}

<DecisionCard
  title="Why select the STM32 NUCLEO-F446RE over Arduino, ESP32, Pico, STM32G474RE, or Teensy 4.1?"
  need="≥ 34.34 MHz worst-case CPU budget (2× margin), ≥ 4 hardware UARTs, ≥ 1 hardware CAN controller, and 5 V-tolerant open-drain GPIO."
  choice="STM32 NUCLEO-F446RE (180 MHz Cortex-M4F, 6 UARTs, 2 bxCAN controllers, 5 V-tolerant I/O, onboard ST-Link VCP)."
  tradeoff="Larger footprint than bare stamp modules (ESP32 / Pico), but eliminates external CAN SPI controllers, UART multiplexers, and 3.3 V-to-5 V level shifters."
>

At the Semester 1 operating clock of **$84\text{ MHz}$**, the unscaled worst-case peripheral load of **$17.16\text{ MHz}$** uses **$20.4\%$** of the CPU ($40.9\%$ with a $2\times$ safety margin of $34.34\text{ MHz}$, leaving $59.1\%$ headroom). Raising the PLL to the rated **$180\text{ MHz}$** reduces the $2\times$ safety-margin load to **$19.1\%$** ($>80\%$ headroom).

</DecisionCard>

| Task / Subsystem | Load Assumption | Effective Load |
| :--- | :--- | :--- |
| **4× UART** *(BMS, GPS, Radio, ToF)* | 4 channels @ $115,200\text{ baud}$ ($11,520\text{ B/s}$ each) $= 46,080\text{ B/s}$ | $46,080\text{ B/s} \times 150\text{ cycles/B} =$ **6.91 MHz** |
| **CAN Processing** *(ZLAC8015D Bus)* | $9,000\text{ frames/s}$ ($1\text{ Mbps}$ bus saturation ceiling) | $9,000\text{ frames/s} \times 350\text{ cycles/frame} =$ **3.15 MHz** |
| **GPS Parsing** | $10\text{ Hz} \times 5\text{ sentences} \times 80\text{ B} = 4,000\text{ B/s}$ | $4,000\text{ B/s} \times 100\text{ cycles/B} =$ **0.40 MHz** |
| **Microstep Pulse Generation** | $20,000\text{ interrupts/s}$ | $20,000\text{ int/s} \times 75\text{ cycles/int} =$ **1.50 MHz** |
| **IMU Fast-Mode Polling** | $100\text{ sensor reads/s}$ | $100\text{ reads/s} \times 2,000\text{ cycles/read} =$ **0.20 MHz** |
| **Telemetry & 50 Hz Main Loop** | 50 Hz kinematics, ramping, USB Host polling & logging | **5.00 MHz** |
| **Total (1× / 2× Margin)** | Worst-Case Summed Load / $2\times$ Industrial Margin | **17.16 MHz** / **34.34 MHz** ($40.9\%$ @ $84\text{ MHz}$, $19.1\%$ @ $180\text{ MHz}$) |

<table class="data-table"><tbody>
<tr><th>Platform</th><th>Hardware Serial</th><th>Hardware CAN</th><th>Operating Freq</th><th>Verdict</th></tr>
<tr><td><strong>Arduino Uno / Nano</strong></td><td>1</td><td>0</td><td>16 MHz</td><td><Badge type="danger" text="Rejected" /> 1 UART, 0 CAN; 16 MHz clock is below the 34.34 MHz 2× requirement</td></tr>
<tr><td><strong>Espressif ESP32</strong></td><td>3</td><td>1</td><td>240 MHz</td><td><Badge type="danger" text="Rejected" /> Only 3 hardware UARTs (4 required for BMS + GNSS + Radio + ToF)</td></tr>
<tr><td><strong>Raspberry Pi Pico</strong></td><td>2</td><td>0</td><td>133 MHz</td><td><Badge type="danger" text="Rejected" /> Only 2 UARTs and 0 native CAN controllers</td></tr>
<tr><td><strong>STM32G474RE</strong></td><td>5</td><td>3</td><td>170 MHz</td><td><Badge type="warning" text="Viable Backup" /> Meets specs; retained as drop-in Nucleo-64 backup</td></tr>
<tr><td><strong>Teensy 4.1</strong></td><td>8</td><td>3</td><td>600 MHz</td><td><Badge type="warning" text="Viable Backup" /> Higher unit cost; 3.3 V-only GPIOs require external 5 V stepper buffer</td></tr>
<tr><td><strong>STM32 NUCLEO-F446RE</strong></td><td><strong>6</strong></td><td><strong>2</strong></td><td><strong>180 MHz</strong></td><td><Badge type="tip" text="Selected" /> 6 UARTs, 2 bxCAN, 5 V-tolerant open-drain I/O, and onboard ST-Link</td></tr>
</tbody></table>

### 3.3 Why one shared CAN bus? {#why-shared-can}

<DecisionCard
  title="Why daisy-chain both ZLAC8015D drivers on one 500 kbps CAN1 bus instead of dual buses?"
  need="Synchronized velocity commands and 150 ms Statusword polling across 4 hub motors (2 axles) with minimal harness wiring."
  choice="Single differential 500 kbps CAN1 bus (PB8 RX, PB9 TX) using CANopen Node ID 1 (0x601/0x581) for the front axle and Node ID 2 (0x602/0x582) for the rear axle."
  tradeoff="Shares bus bandwidth between two drivers (~40 frames/s actual vs. 4,500 frames/s capacity at 500 kbps, < 1% bus load), freeing CAN2 and cutting harness wires from 4 to 2."
>

- **Address Isolation:** Under CiA 402 CANopen, Driver 1 listens on `0x601` (replies `0x581`) and Driver 2 listens on `0x602` (replies `0x582`). Hardware acceptance filters prevent packet collisions.
- **2 ms Inter-Node Stagger:** `Motor_Set_Velocity_All()` staggers Node 1 and Node 2 SDO writes by `2 ms` so TX mailboxes never contend during the `20 ms` (`50 Hz`) control loop.

</DecisionCard>

### 3.4 Why 5 V current sinking for the stepper? {#why-5v-sinking}

<DecisionCard
  title="Why drive the TB6600 stepper optocouplers with 5 V open-drain current sinking?"
  need="≥ 10 mA forward current through the TB6600 internal IR optocoupler LED + 220 Ω series resistor without adding an external level-shifter IC."
  choice="Common-anode 5 V low-side sinking: tie PUL+ and DIR+ to the +5 V rail and configure PC2 (PULSE-) and PC3 (DIR-) as 5 V-tolerant open-drain outputs (GPIO_MODE_OUTPUT_OD)."
  tradeoff="Inverts logic polarity in software (GPIO_PIN_RESET = active pulse, GPIO_PIN_SET = idle), but delivers the full 5 V swing (~15 mA LED current) directly from the MCU pins."
>

- **3.3 V Push-Pull Deficit:** Sourcing $3.3\text{ V}$ in common-cathode mode leaves only $3.3\text{ V} - 1.6\text{ V} = 1.7\text{ V}$ across the $220\ \Omega$ resistor ($\approx 7.7\text{ mA}$), failing to switch the optocoupler cleanly.
- **5 V Open-Drain Solution:** Pulling `PC2` or `PC3` to `0 V` drops $5.0\text{ V} - 1.6\text{ V} = 3.4\text{ V}$ across the internal resistor ($\approx 15.4\text{ mA}$), switching the TB6600 at pulse widths down to $200\ \mu\text{s}$.

</DecisionCard>

## 4. Implementation & Prototype {#interface-wiring}

All 11 external subsystems are mapped onto non-overlapping Morpho and Arduino headers on the NUCLEO-F446RE (**Figure 4.1** and Table 4.1).

<Figure
  src="./assets/images/comm-diagram.jpeg"
  alt="STM32 NUCLEO-F446RE hardware interface and pinout diagram grouped by Sensor, Power, Motor, Visual and User Input subsystems"
  caption="**Figure 4.1: STM32 NUCLEO-F446RE Hardware Interface Map.** Pin allocation across all 11 external subsystems (Motor, User Input, Power, Sensor, Vacuum Actuator, and Visual Lighting)."
/>

| Subsystem / Function | Interface | Pin Assignments | Target Device / Electrical Note |
| :--- | :--- | :--- | :--- |
| **CAN Motor Bus** | `CAN1` | `PB8 (RX), PB9 (TX)` | External 500 kbps transceiver → 2× ZLAC8015D (Node 1 & 2) |
| **Gamepad Controller** | `USB_OTG_FS` | `PA11 (DM), PA12 (DP)` | Embedded USB Host wireless GameSir receiver |
| **Microstep Stepper** | `GPIO_OD` | `PC2 (PULSE-), PC3 (DIR-)` | TB6600 driver (5 V common-anode low-side open-drain sink) |
| **RF Safety Interlock** | `GPIO Input` | `PB1` | Hardware RF relay emergency cutoff monitor |
| **BMS Interface** | `USART1` | `PA9 (TX), PA10 (RX)` | 6S–22S 100 A LiFePO4 Smart BMS ($115,200\text{ baud}$) |
| **IMU Sensor** | `I2C1` | `PB6 (SCL), PB7 (SDA)` | 9-DOF IMU (`I2C` address `0x68`, $400\text{ kHz}$ Fast-Mode) |
| **GPS Module** | `USART3` | `PC10 (TX), PC11 (RX)` | UM980 RTK GNSS module ($10\text{ Hz}$ NMEA/RTCM) |
| **Radio Telemetry** | `UART4` | `PA0 (TX), PA1 (RX)` | Microhard Radio v2 C2 telemetry link |
| **ToF Distance Sensor** | `UART5` | `PC12 (TX), PD2 (RX)` | Ground/debris clearance Time-of-Flight sensor |
| **Vacuum Control Relay** | `GPIO Output` | `PC0` | Vacuum blower solid-state relay trigger |
| **Visual Lighting** | `GPIO Output` | `PB4, PB5` | Runway headlights & status strobes |

::: details Interactive pinout & peripheral interface explorer (11 devices)

<Stm32HardwareWidget1 />

<Stm32HardwareWidget2 />

:::

## 5. Testing & Results {#testing-results}

Each row below verifies the corresponding requirement from [Section 1](#objectives-requirements). Full firmware logs and stage-by-stage test code are documented in [STM32 Firmware Architecture & Control](./stm32-firmware.md#five-stages).

| Requirement | Test | Result | Status |
| :--- | :--- | :--- | :--- |
| **HW-R1: CPU Headroom** ($\le 50\%$ @ $2\times$ load) | Worst-case cycle analysis + 50 Hz loop timing (`controller.c`) | $17.16\text{ MHz}$ ($1\times$) / $34.34\text{ MHz}$ ($2\times$) $= 40.9\%$ @ $84\text{ MHz}$ ($19.1\%$ @ $180\text{ MHz}$) | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **HW-R2: Dual-Axle CAN Bus** ($500\text{ kbps}$, 2 nodes) | `Transceiver_DC_Loopback_Test()` + dual SDO `0x6041` boot probe | $100\%$ DC loopback pass (`PB9`→`PB8`); Nodes `0x601` & `0x602` online with `0` Bus-Off events | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **HW-R3: Stepper 5 V Sink** ($\ge 10\text{ mA}$, $\le 1\ \mu\text{s}$ jitter) | Open-drain `PC2`/`PC3` + `DWT->CYCCNT` ($11.9\text{ ns}$ resolution) sweep | Clean steps across $200\text{–}5,000\ \mu\text{s}$ pulse width + $20\ \mu\text{s}$ `DIR` guard across $110\text{ mm}$ stroke | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **HW-R4: USB Host Gamepad** ($\le 250\text{ ms}$ timeout) | Wireless dongle enumeration (`PA11`/`PA12`) + power-off drop test | Enumerates XInput/HID; halts motors in $\le 250\text{ ms}$ on packet loss or $< 1\text{ ms}$ on USB unplug | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **HW-R5: Emergency Stop** ($\le 20\text{ ms}$ brake) | Gamepad `B`/`BACK` E-stop + CiA 402 `0x0002` Quick-Stop | Latches `ESTOP_LATCHED` in 1 loop tick ($20\text{ ms}$); `PB1` RF pin assigned, contactor wiring pending | <span class="fh-pill fh-pill--partial">Partial</span> |
| **HW-R6: Serial Expansion** (4 UART + 1 I2C) | STM32CubeMX pin conflict check across all 11 peripherals | Zero pin/DMA conflicts across `USART1/3`, `UART4/5`, `I2C1`; sensor drivers scheduled for Sem 2 | <span class="fh-pill fh-pill--untested">Not yet tested</span> |
| **HW-R7: Carrier PCB** (Locking connectors) | KiCad schematic & 2-layer PCB layout rules check (ERC/DRC) | Schematic complete (`kicad-schematic.png`); board fabrication and assembly scheduled for Sem 2 | <span class="fh-pill fh-pill--untested">Not yet tested</span> |

## 6. Engineering Discussion {#engineering-discussion}

Two hardware-layer failures surfaced during benchtop bring-up and were resolved without adding external integrated circuits:

<BugCard
  title="Bug 1 · TB6600 stepper driver ignored 3.3 V step pulses"
  symptom="Motor shaft stayed locked and produced zero movement when pulsing PC2 and PC3 as standard 3.3 V push-pull outputs (GPIO_MODE_OUTPUT_PP)."
  rootCause="The STM32 GPIO pins source at most 3.3 V. Across the TB6600 internal IR optocoupler LED (~1.6 V forward drop) and 220 Ω series resistor, common-cathode wiring left only ~1.7 V (~7.7 mA), below the optocoupler turn-on threshold."
  fix="Rewired the TB6600 in common-anode mode (PUL+ and DIR+ tied to +5 V) and reconfigured PC2 and PC3 as 5 V-tolerant open-drain sinks (GPIO_MODE_OUTPUT_OD) with active-LOW pulse logic."
  evidence="Full 5.0 V swing (~15.4 mA LED current) verified on bench; motor stepped cleanly from 5,000 µs down to 200 µs pulse widths across the 110 mm stroke (Stage 2)."
>

```c
GPIO_InitStruct.Pin   = STEPPER_PUL_PIN | STEPPER_DIR_PIN;
GPIO_InitStruct.Mode  = GPIO_MODE_OUTPUT_OD; /* 5V open-drain sink */
GPIO_InitStruct.Pull  = GPIO_NOPULL;
HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);
```

</BugCard>

<BugCard
  title="Bug 2 · bxCAN transmit mailboxes locked up when a driver was unpowered"
  symptom="All three STM32 hardware CAN TX mailboxes (MAILBOX0..2) permanently stalled during bench power-cycling whenever the 32 V driver supply was switched off before the MCU."
  rootCause="With AutoRetransmission = ENABLE (STM32 HAL default), an unacknowledged frame (CAN_ESR LEC = 3 ACK Error) is retransmitted endlessly by hardware, blocking new SDO frames and starving the main loop."
  fix="Set hcan1.Init.AutoRetransmission = DISABLE, added a pre-Init DC loopback self-test on PB9/PB8, and aborted pending TX mailboxes before queuing periodic diagnostic pings."
  evidence="CAN_ESR explicitly reports LEC = 3 (ACK Error) when unpowered and recovers within 1 ping cycle once 32 V power is restored (Stage 1)."
>

```c
hcan1.Init.AutoRetransmission = DISABLE; /* Retire un-ACKed frames */
if (HAL_CAN_IsTxMessagePending(&hcan1, CAN_TX_MAILBOX0))
  HAL_CAN_AbortTxRequest(&hcan1, CAN_TX_MAILBOX0);
```

</BugCard>

*Note: Firmware-layer bugs (mirrored left/right axle polarity and `HAL_Delay()` $1\text{ ms}$ step rate capping) are documented in [STM32 Firmware → Section 6](./stm32-firmware.md#section-9-problems).*

<span id="carrier-pcb"></span>

## 7. Limitations & Semester 2 {#limitations-semester-2}

1. **Jumper Harness Vibration Exposure $\rightarrow$ Custom KiCad Carrier PCB:** Semester 1 tests used friction jumper wires on the Nucleo Morpho headers and breadboard rails, which can loosen under runway vibration. A custom KiCad carrier PCB (**Figure 7.1**) seats the NUCLEO-F446RE headers and routes all 11 interfaces to locking connectors with an onboard CAN transceiver and dedicated 5 V common-anode pull-up rail.
2. **32 V Bench Supply Limit $\rightarrow$ 48 V LiFePO4 & Contactor Bring-Up:** Semester 1 tests ran on a $32\text{ V} / 10.4\text{ A}$ bench supply (`USE_POWER_PRESET_3`, $25\text{ RPM}$ cap). Semester 2 switches to the $48\text{ V}$ $20\text{ Ah}$ LiFePO4 pack (`USE_POWER_PRESET_1`, $30\text{ RPM}$) and wires the `PB1` RF safety interlock into the main contactor coil.
3. **Unpopulated Sensor Buses $\rightarrow$ BMS, IMU, GNSS & ToF Integration:** Bring up live telemetry on the pre-allocated pins: Smart BMS (`USART1` `PA9`/`PA10`), 9-DOF IMU (`I2C1` `PB6`/`PB7`), UM980 RTK GNSS (`USART3` `PC10`/`PC11`), Microhard Radio (`UART4` `PA0`/`PA1`), and ToF sensor (`UART5` `PC12`/`PD2`).
4. **Standalone Gamepad Only $\rightarrow$ Jetson ROS 2 Link:** Connect the NVIDIA Jetson to feed `cmd_vel` into `Robot_Set_CmdVel(vx, wz)` under the $500\text{ ms}$ watchdog while publishing wheel encoder odometry back to ROS 2.

<Figure
  src="./assets/images/kicad-schematic.png"
  alt="KiCad carrier board schematic and layout for Semester 2"
  caption="**Figure 7.1: Custom STM32 Carrier PCB (Semester 2 Integration).** Replaces friction jumper wires with locking connectors, an onboard CAN transceiver, and dedicated 5 V common-anode pull-ups for the TB6600 stepper driver."
/>

**Related documentation:** [STM32 Firmware Architecture & Control →](./stm32-firmware.md) · [Motor Drivetrain Calculations →](../hilbert/motor-drivetrain-calculation.md) · [Steering Kinematics →](../hilbert/steering-kinematics.md) · [Electrical Components & BOM →](../bryan/components-bom.md)

<!-- #endregion report -->

National University of Singapore · CDE4301 Capstone Project

<CardGrid :cols="2">

<Card>

← [Previous Documentation](./vision-research.md)

Computer Vision Research

</Card>

<Card>

[Next Architecture](./stm32-firmware.md) →

STM32 Firmware Architecture & Control

</Card>

</CardGrid>
