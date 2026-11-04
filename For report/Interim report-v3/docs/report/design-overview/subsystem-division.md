<!-- Canonical report source. Edit here. -->

<!-- #region division -->

## Subsystem Division & Technical Leadership {#subsystem-division}

::: info
👥 Subsystem Division & Technical Leadership

To ensure rigorous technical accountability, engineering responsibilities are clearly partitioned with dedicated subsystem leadership:

<CardGrid :cols="4">

<Card title="Hilbert Soh (Overseeing Mechanical)" tag="Programming Subsystem Lead">

Sole ownership of **Programming Subsystem** (SLAM Toolbox, Nav2 path planning, algorithm trade-offs, and multi-agent C2 communications datalinks), while overseeing mechanical system integration.

</Card>

<Card title="Gabriel Tan (Overseeing Electrical)" tag="Computer Vision Subsystem Lead">

Sole ownership of **Computer Vision Subsystem** (YOLOv8 model benchmarking, FOD classification, and RGB-D/LiDAR sensor fusion), while overseeing electrical architecture.

</Card>

<Card title="Asuka &amp; Zacarias Ng" tag="Mechanical Subsystem Engineers">

Sole mechanical subsystem ownership: **Asuka** (FOD Pickup suction & Trailing Arm Suspension) and **Zacarias Ng** (Chassis iterations, FEA simulations & Differential Drive Kinematics).

</Card>

<Card title="Bryan Ng" tag="Electrical Subsystem Engineer">

Sole electrical subsystem ownership: 25.6V LiFePO4 battery selection, load budget calculations, multi-rail DC-DC power distribution, system wiring schematic, and contact-charging dock.

</Card>

</CardGrid>
:::

<!-- #endregion division -->

<!-- Programming chapter overview. The Report opens chapter programming with it; the Overview roadmap shows it too. -->
<!-- #region programming-overview -->

<p class="ov-subheading">Autonomous Navigation &amp; C2 Communications</p>

<!-- 7.1 Hilbert Soh — Programming Lead -->
<SubsystemLead member="hilbert" />

<p class="tech-pill-row">
  <span class="tech-pill">ROS 2 Jazzy · Ubuntu 24.04 LTS · Gazebo Harmonic</span>
  <a class="ovx-more" href="/report#software-environment">Software &amp; Environment <span aria-hidden="true">↗</span></a>
</p>

<div class="ov-contrib">

#### Autonomous Navigation {#ov-autonomous-navigation}

Developed a ROS 2 Nav2 navigation framework incorporating global path planning, Regulated Pure Pursuit (RPP) path tracking, costmap-based obstacle avoidance and Dual-EKF localization.

Evaluated A* and Hybrid A* planning approaches and investigated navigation parameter tuning to improve path-following behaviour.

The resulting navigation framework provides the foundation for autonomous waypoint navigation and future physical UGV integration.

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#navigation">Autonomous Navigation Documentation <span aria-hidden="true">↗</span></a>
</div>

</div>

<div class="ov-contrib">

#### UAV–UGV Communications {#ov-communications}

Developed a ROS 2 and CycloneDDS communication framework supporting target-coordinate exchange, waypoint dispatch and coordination between the UAV and UGV.

The communication architecture was designed to connect aerial FOD detection with ground-based navigation and clearance operations.

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#communications">UAV–UGV Communications Documentation <span aria-hidden="true">↗</span></a>
</div>

</div>

<div class="ov-contrib">

#### Simulation &amp; Validation {#ov-simulation}

Developed a Gazebo Harmonic simulation environment using the AgileX Scout 2.0 as the simulation proxy for FOD Hunter.

Evaluated autonomous navigation in the NUS EA Field environment, including path planning, waypoint execution, obstacle avoidance and recovery behaviour.

The simulation environment provides a repeatable testbed for evaluating navigation performance before physical hardware integration.

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#simulation">Simulation &amp; Validation Documentation <span aria-hidden="true">↗</span></a>
</div>

</div>

<!-- 7.2 Computer Vision — Gabriel -->
<SubsystemLead member="gabriel" />

<div class="ov-contrib">

#### Computer Vision &amp; Sensor Fusion {#ov-computer-vision}

Modeled high-speed perception kinematics and optical projection geometry to establish a real-time edge processing ceiling that maintains throughput and leaves ample compute headroom for upstream ROS 2 navigation and vehicle control.

Benchmarked real-time single-stage CNN backbones against transformer-based architectures on an HPC cluster; selected YOLO11-S for superior speed and fine localization while ruling out heavy transformers due to severe latency and memory-bandwidth penalties. 

Diagnosed small-hardware detection failure modes using confusion matrix analysis, establishing that missed detections stem from deep convolutional downsampling feature loss rather than class confusion; introduced targeted mitigations combining sub-millimeter GSD optical compensation, functional remediation superclasses, and high-resolution inference.

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#cv-sensor-fusion">Sensor Fusion &amp; Depth Estimation <span aria-hidden="true">↗</span></a>
  <a class="ovx-more" href="/report#vision-calculations">Vision Field-of-View Calculations <span aria-hidden="true">↗</span></a>
  <a class="ovx-more" href="/report#vision-research">Vision &amp; Sensor Research <span aria-hidden="true">↗</span></a>
  <a class="ovx-more" href="/report#cv-yolo-comparison">YOLO Model Benchmarking &amp; Comparison <span aria-hidden="true">↗</span></a>
</div>

</div>

<!-- #endregion programming-overview -->

<!-- Mechanical chapter overview. The Report opens chapter mechanical with it; the Overview roadmap shows it too. -->
<!-- #region mechanical-overview -->

<p class="ov-subheading">Mechanical Design &amp; FOD Remediation</p>

<!-- 5.1 Chassis Design — Zacarias -->
<SubsystemLead member="zacarias" />

<div class="ov-contrib">

#### Chassis Design {#ov-chassis-design}

<p class="ov-placeholder">*To Be Filled*</p>

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#chassis-structural-design">Chassis Design Documentation <span aria-hidden="true">↗</span></a>
  <a class="ovx-more" href="/report#fea-simulation">FEA Structural Simulation <span aria-hidden="true">↗</span></a>
  <a class="ovx-more" href="/report#material-selection">Material Selection &amp; DFM <span aria-hidden="true">↗</span></a>
</div>

</div>

<!-- 5.2 Suspension & FOD Remediation — Asuka -->
<SubsystemLead member="asuka" />

<div class="ov-contrib">

#### Suspension System {#ov-suspension-system}

<p class="ov-placeholder">*To Be Filled*</p>

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#suspension">Suspension System Documentation <span aria-hidden="true">↗</span></a>
</div>

</div>

<div class="ov-contrib">

#### FOD Remediation {#ov-fod-remediation}

<p class="ov-placeholder">*To Be Filled*</p>

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#vacuum-module">Centrifugal Suction &amp; Vacuum Module <span aria-hidden="true">↗</span></a>
  <a class="ovx-more" href="/report#fod-sweep-box">FOD Sweep Box &amp; Airflow Ducting <span aria-hidden="true">↗</span></a>
</div>

</div>

<!-- 5.3 Steering Kinematics — Hilbert Soh -->
<SubsystemLead member="hilbert" />

<div class="ov-contrib">

#### Steering Kinematics &amp; Drive Architecture {#ov-steering-kinematics}

Evaluated skid-steer, Ackermann and Mecanum steering architectures to identify a suitable solution for FOD Hunter's runway operations.

Selected a four-wheel skid-steer configuration and developed kinematic models describing wheel velocities, turning radius and manoeuvrability.

An interactive 3D demonstration was also developed to visualize steering behaviour under different wheel-speed commands.

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#steering">Steering Kinematics Documentation <span aria-hidden="true">↗</span></a>
  <a class="ovx-more" href="/report#motor-selection">Motor Drivetrain Calculations <span aria-hidden="true">↗</span></a>
</div>

</div>

<!-- #endregion mechanical-overview -->

<!-- Electrical chapter overview. The Report opens chapter electrical with it; the Overview roadmap shows it too. -->
<!-- #region electrical-overview -->

<p class="ov-subheading">Electrical Systems &amp; Embedded Hardware</p>

<!-- 6.1 Power Distribution — Bryan -->
<SubsystemLead member="bryan" />

<div class="ov-contrib">

#### Power Calculation and Battery Selection {#ov-power-calculation}

Conducted power consumption calculations to estimate the total electrical load and determine the battery capacity required to meet the UGV's operating requirements.

Evaluated LiFePO4 battery configurations based on energy capacity, operating duration, weight and power demands, leading to the selection of a 48V 20Ah battery.

The selected battery configuration balances operating duration, system weight and energy reserves while supporting the UGV's intended operational requirements.

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#power-calculations">Power Calculations &amp; Battery Selection <span aria-hidden="true">↗</span></a>
</div>

</div>

<div class="ov-contrib">

#### Power Distribution & Electrical Protection {#ov-power-distribution}

Developed a 48V power distribution architecture incorporating fuse protection, a main kill switch and DC-DC converters to supply the different voltage requirements of onboard components.

Integrated a BMS for battery monitoring and protection, alongside dedicated fuse circuits for high-power loads such as the hub motors and vacuum system.

The power distribution architecture supports reliable power delivery, electrical isolation and protection against overcurrent and short-circuit faults.

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#power-distribution">Power Distribution &amp; Electrical Protection <span aria-hidden="true">↗</span></a>
</div>

</div>

#### Component Selection and BOM {#ov-component-BOM}

<p class="ov-placeholder">*To Be Filled*</p>

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#components-bom">Components Selection, BOM &amp; Integration <span aria-hidden="true">↗</span></a>
</div>

</div>

<div class="ov-contrib">

<!-- 6.2 Microcontroller Hardware & Firmware — Gabriel -->
<SubsystemLead member="gabriel" />

<div class="ov-contrib">

#### Microcontroller Hardware {#ov-microcontroller-hardware}

Selected and integrated the STM32 NUCLEO-F446RE as the real-time Embedded Control Unit (ECU), utilizing dual hardware bxCAN controllers, six UART/USART channels, and an ARM Cortex-M4F core to manage actuation, sensing, and safety loops with >80% CPU headroom.

Designed a conflict-free 64-pin Morpho electrical map, implementing 5 V current-sinking open-drain topology for optocoupled stepper control without level-shifters, isolated 500 kbps CAN motor bus routing, and pre-allocated interfaces for RTK GNSS, IMU, ToF ranging, and BMS telemetry.

Validated physical transceiver signal integrity and bus termination via automated DC loopback sweeps and hardware diagnostics prior to live drivetrain bring-up.

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#stm32-hardware">STM32 Hardware <span aria-hidden="true">↗</span></a>
</div>

</div>

<div class="ov-contrib">

#### Embedded Firmware {#ov-embedded-firmware}

Developed production-grade embedded firmware in a 5-stage V&V pipeline, progressing from CAN physical layer diagnostics and DWT sub-microsecond pulse timing to dual-driver CiA 402 motion control and fault recovery.

Implemented a deterministic 50 Hz control loop executing differential-drive kinematics (forward, coordinated arc, and spot turns) with dynamic wheel-speed scaling and asymmetric acceleration/deceleration S-curve ramping (35 / 15 RPM/s).

Built a comprehensive multi-tier safety architecture featuring a 6-state CiA 402 FSM, 250 ms communication watchdog, USB gamepad disconnect auto-stop, zero-latency hardware emergency braking, and neutral-interlock rearming.

<div class="ov-doc-links">
  <a class="ovx-more" href="/report#stm32-firmware">STM32 Firmware <span aria-hidden="true">↗</span></a>
</div>

</div>

<!-- #endregion electrical-overview -->
