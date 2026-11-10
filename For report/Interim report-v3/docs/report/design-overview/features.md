<!-- Canonical report source. Edit here. -->

<!-- Chapter 2 opening (system concept, user needs). -->

![Collaborative UAV and UGV Multi-Agent Architecture](../../shared/assets/images/uav-and-ugv-collab.png)

<Badge type="info" text="System Concept" />

#### Heterogeneous Multi-Agent Closed-Loop Collaboration

Airborne UAV Scout (Macro Scanning) paired with Surface UGV Rover (Targeted Precision Transit & Active Physical Extraction).


### 💡 User Needs & Operational Drivers

Derived from field interviews with an industry partner, an RSAF technician and an RSAF air traffic controller (names withheld)

[🎙️ View Primary Field Research (3 Interviews) →](/report#primary-research)

Based on direct stakeholder consultations with airfield operations personnel and operational airbase case studies, the FOD Hunter platform is engineered around five fundamental user needs:

<CardGrid :cols="3">

<Card title="1. Operational Efficiency &amp; Reduced ROT" accent="purple">

⚡

Runway Occupancy Time (ROT) is the single most critical constraint on commercial and military airfields. Instead of deploying slow, human-driven sweeping trucks across the full runway length, our joint system utilizes high-speed aerial scanning to cue targeted ground transit, **slashing runway downtime by up to 75%**.

</Card>

<Card title="2. Full Autonomous Operation" accent="blue">

🤖

Eliminates the continuous requirement for human drivers and airside ground escorts. The UGV autonomously computes collision-free trajectories using ROS 2 Nav2, executes waypoint navigation, engages active suction, and reports ledger updates back to the Base C2 with zero manual joystick teleoperation.

</Card>

<Card title="3. High Ground Transit Speed ($\ge 10\text{ km/h}$)" accent="emerald">

🏎️

Airfield runways span 4 to 5 km in length. To rapidly reach flagged coordinates before the next scheduled aircraft departure, the UGV powertrain is geared to transit at **operational speeds $\ge 10\text{ km/h}$** across open asphalt, significantly outpacing standard indoor mobile robots.

</Card>

<Card title="4. Novel Purpose for Multi-Agent Task" accent="amber">

🔄

Discovers an unprecedented synergy in airside autonomy: overcoming the speed-vs-payload trade-off. Drones fly fast ($30\text{--}40\text{ km/h}$) but cannot carry heavy vacuum tanks; ground rovers carry high-flow extraction payloads but are too slow to sweep 5 km blindly. The multi-agent collaboration bridges both domains seamlessly.

</Card>

<Card title="5. Multi-Modal Sensor Verification" accent="rose">

🎯

Prevents false pickups and suction hood damage by executing close-range verification. Onboard co-axial 3D LiDAR and RGB camera corroborate target geometry and height profile before engaging the high-power centrifugal vacuum intake.

</Card>

<Card title="6. Continuous Readiness &amp; Docking" accent="blue">

🔋

Enables persistent airside readiness through an autonomous contact-charging interface, safely recharging the 24V LiFePO4 battery distribution bus between scheduled inspection runs.

</Card>

</CardGrid>

## List of Features {#list-of-features}

<Badge type="info" text="Features" />

### List of features: HUNTER × ARGUS {#sec-features-system}

For a valid solution, these are the features we know the system needs to have.

<CardGrid :cols="3">

<Card>

<MissingAsset name="system-1.jpg" alt="Drone scanning the runway and highlighting FOD" />

</Card>

<Card>

<MissingAsset name="system-2.jpg" alt="FOD Hunter rover sweeping the runway" />

</Card>

<Card>

<MissingAsset name="system-3.jpg" alt="Drone sending FOD locations to the rover" />

</Card>

<Card>

<MissingAsset name="system-4.jpg" alt="Drone landing on the rover to charge" />

</Card>

<Card>

<MissingAsset name="system-5.jpg" alt="Central command centre with operators monitoring the runway" />

</Card>

<Card>

<MissingAsset name="system-6.jpg" alt="Drone coverage area over the airfield" />

</Card>

</CardGrid>

<Badge type="info" text="Features" />

### List of features: HUNTER {#sec-features-hunter}

For a valid solution, these are the features we know the ground rover needs to have.

<CardGrid :cols="2">

<Card>

<MissingAsset name="hunter-1.jpg" alt="FOD detection confirmation" />

</Card>

<Card>

<MissingAsset name="hunter-2.jpg" alt="FOD remediation system" />

</Card>

<Card>

<MissingAsset name="hunter-3.jpg" alt="Autonomous navigation" />

</Card>

<Card>

<MissingAsset name="hunter-4.jpg" alt="Long-range communication" />

</Card>

<Card>

<MissingAsset name="hunter-5.jpg" alt="Compliant with aviation operating standards" />

</Card>

<Card>

<MissingAsset name="hunter-6.jpg" alt="Operating speed of 15 km/h" />

</Card>

<Card>

<MissingAsset name="hunter-7.jpg" alt="Payload of 65 kg" />

</Card>

<Card>

<MissingAsset name="hunter-8.jpg" alt="Differential drivetrain" />

</Card>

<Card>

<MissingAsset name="hunter-9.jpg" alt="Robust suspension system" />

</Card>

<Card>

<MissingAsset name="hunter-10.jpg" alt="Sized for easy transport" />

</Card>

</CardGrid>

### 🚀 Key Technical Innovations for Our UGV Platform

<!-- #region key-innovation -->
Core engineering advancements overcoming the limitations of fixed commercial systems and single-agent inspection rovers

<Badge type="info" text="Core Innovations" />

<CardGrid :cols="4">

<Card title="1. Closed-Loop &quot;Find-and-Fix&quot; Remediation" tag="Innovation 1">

🔄

Unlike stationary systems (*iFerret, Tarsier*) or diagnostic UGVs (*Airtrek, Guimu*) that only flag debris locations, our UGV pairs close-range multi-sensor fusion with real-time active physical clearance payloads (electromagnetic bar + high-flow vacuum intake), directly removing debris in a single automated sortie.

</Card>

<Card title="2. Selective Dual-Payload Activation" tag="Innovation 2">

⚡

To maximize energy efficiency and mission battery endurance, the UGV uses its multi-sensor perception stack to selectively activate remediation tools—engaging the front electromagnetic bar for ferrous metallic fasteners, or activating the high-power underbody centrifugal vacuum only when encountering non-metallic debris.

</Card>

<Card title="3. Multi-Modal False Alarm Suppression" tag="Innovation 3">

🛡️

By fusing 3D LiDAR point cloud elevations, RGB imagery, and thermal contrast at ground level, the UGV rejects false alarms caused by flat pavement markings, rubber skid marks, and dynamic shadow edges that severely degrade pure optical camera arrays (e.g. *iFerret 2.0*).

</Card>

<Card title="4. Aerial-Guided C2 Handshake" tag="Innovation 4">

🛰️

Rather than performing slow, exhaustive lawn-mower sweeps across the entire multi-kilometer airfield, the UGV relies on high-altitude UAV macro-scouting cueing. It transits directly to designated target coordinates, slashing Runway Occupancy Time (ROT) by up to **75%**.

</Card>

</CardGrid>
<!-- #endregion key-innovation -->
