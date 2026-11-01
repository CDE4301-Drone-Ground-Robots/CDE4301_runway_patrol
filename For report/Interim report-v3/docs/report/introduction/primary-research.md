---
title: "Primary Research & Practitioner Interviews"
owner: "FOD Hunter team"
outline: [2,3]
---
# Primary Research & Practitioner Interviews

<!-- #region report -->

## 👥 Three voices from the runway

<Badge type="info" text="Primary Research" />

Three perspectives shaped the project requirements: industry deployment, frontline maintenance, and airbase operations. Select an interviewee to read the key insight and open the complete interview record.

<CardGrid :cols="3">

<Card title="Mr Industry Partner">

<Card>

🧑🏻‍💼

</Card>

Industry Partner

<Card>

“An autonomous vehicle could inspect more frequently, follow an optimum path, and release servicemen for other critical roles.”

</Card>

:::: details Read the industry partner's interview text

::: info
**10 September 2026 · Industry Partner**

**Current process:** “It's manual. They involve two staff, one of them driving a vehicle... One person drives; the vehicle commander will look out for FOD. When they detect FOD, they will stop the vehicle, and then the vehicle commander will step out of the car to pick up the FOD.”

**Operational opportunity:** “Autonomous vehicle can inspect the runway more frequently. Autonomous vehicle, if it has an optimum path, pre-designed path, then the inspection can be faster... Autonomous vehicle means servicemen can be released for other critical roles.”

**Design implication:** The solution should use a repeatable route, increase inspection frequency, and measure detection thoroughness against known test objects.
:::

::::

</Card>

<Card title="3SG(NS) John Doe">

<Card>

🧑🏽‍🔧

</Card>

Paya Lebar Air Base · Technician

<Card>

“The smaller pieces are the ones we need help with. Rivets can cause damage, and sweepers sometimes miss them.”

</Card>

:::: details Read John Doe's interview text

::: tip
**16 September 2026 · Air Force Technician**

**Manual burden:** “Every day. Every day you need to do.” When contractors are off duty, personnel use a D-Max or tractor, high-beam lights, and a broom while walking alongside the vehicle.

**Critical debris:** “Screws, rivets are quite common. Rocks, screws, rivets... actually, bones are quite common.” The interview also describes shattered glass and pavement fragments.

**Engineering need:** “It’s the smaller pieces which we need help with... the ones that can actually cause damage, sometimes the sweeper will not pick it up.”
:::

::::

</Card>

<Card title="LTA(NS) James Doe">

<Card>

🧑🏻‍✈️

</Card>

Tengah Air Base · Air Traffic Controller

<Card>

“A drone inspection follows a set course, but operators still have to visually spot everything. It is used only once or twice a month.”

</Card>

:::: details Read James Doe's interview text

::: warning
**16 September 2026 · Air Traffic Controller**

**Current drone use:** “The drone has a set course plotted already... You have to see visually. There's no indicators that pop up.”

**Frequency:** “It’s probably used like once or twice a month. So, mostly it’s just the car, driver, a car and you, the officer are actually going up and down looking at the roads.”

**Operational value:** A system that automatically identifies runway debris and cues a ground robot could reduce dependence on visual inspection and support faster runway recovery after an incident.
:::

::::

</Card>

</CardGrid>

## 📋 Ground Research Findings Across 5 Operational Domains

<Badge type="tip" text="Empirical Evidence" />

<Card title="1. Current Operational Workflow &amp; Inspection Protocols">

- **Vehicle Patrols:** A two-man crew (driver + vehicle commander) patrols in a pickup truck or D-Max utility vehicle. One person drives while the other visually scans the asphalt. When debris is spotted, the vehicle stops, and the commander steps out onto the active strip to pick it up manually.
- **Specialized Contractor Sweepers:** Contracted sweeper trucks (road-sweeper style) operate for approximately 2 hours in the morning and 2 hours at night before and after active flight windows.
- **Ad-hoc Manual FOD Sweeps:** When sweeper contractors are off-duty, technicians walk behind utility vehicles or tow tractors with benched high-beam headlights to manually inspect and sweep the ~4 km runway with standard manual brooms.
- **Base-Wide Sweeps:** On monthly RSAF Safety Days, the entire airbase personnel lines up to walk the 4 km runway together, which still takes up to an hour to complete.
- **Inspection Frequency & Timing:** Routine vehicle inspections occur 2 to 3 times a day (typically at 6:00/7:00 AM at first light, 2:00 PM midday, and after 6:00 PM). Midday checks exist specifically to enable additional flight sorties.
- **Route Execution:** There is no rigid track optimization during truck patrols; drivers navigate somewhat randomly across the left, center, and right sections of the strip at roughly 40 km/h.

</Card>

<Card title="2. Operational Inefficiencies &amp; Critical Pain Points">

- **Small Debris Ingestion Threat:** Contracted sweeper vehicles clean larger debris but frequently miss sub-3 cm and small items (screws, aircraft rivets, nuts, washers). These small metallic pieces represent the single greatest engine ingestion hazard for fighter jet air intakes.
- **Speed vs. Visual Accuracy Trade-off:** Eyeballing the asphalt at 40 km/h introduces severe visual fatigue and human error. The current manual process has no verifiable logging or objective accuracy tracking.
- **Counterproductive Tools:** Technicians report that standard manual brooms often shed more bristles/debris than they clean, and using leaf blowers merely pushes FOD into adjacent grass patches where jet engine wash sucks it back onto the runway.
- **Pavement Degradation:** Older airbases (e.g., Paya Lebar) suffer from pavement cracking and spalling caused by heavy aircraft vibrations (e.g., C-17 landings), producing loose pavement chunks and aggregate rocks.

</Card>

<Card title="3. Debris Characteristics &amp; Baseline Metrics">

- **Commonly Encountered FOD Types:** Small metallic fasteners (aircraft rivets, loose screws from arrestor gear servicing, nuts, washers); concrete spalls and asphalt gravel; shattered glass from cracked airfield edge/runway lights; animal carcasses/bones (roasted rats from engine heat, dead birds); windblown plastics, wood scrap, and loose nails.
- **Target Detection Size:** Objects recovered on-site are frequently around or smaller than 2 cm. A single 0.5 cm rivet or bolt can lead to catastrophic turbine blade failure requiring a multi-million dollar engine overhaul.
- **Debris Volume:** The typical collection volume per sweep is small—often under a single handful (palm-sized) across an entire 4–5 km runway.
- **False-Positive Challenges:** Bird droppings, rubber skid marks, and flat pavement oil stains must be differentiated to prevent unnecessary robot stops and false alarms.

</Card>

<Card title="4. Airspace Constraints for Drone (UAV) Deployment">

- **Strict Flight Clearances:** Operating drones within active military aerodromes requires shutting down local airspace, leading to extensive regulatory paperwork that limits regular operational drone flights to once every couple of months or for scheduled maintenance windows.
- **Civil Aviation Authority (CAAS) Restrictions:** Drone tethering and altitude caps (under 50 m) apply around critical aerodrome zones.
- **Geopolitical Hardware Constraints:** RSAF strictly restricts Chinese-manufactured platforms (e.g., DJI), mandating compliant Western or locally built avionics.
- **Existing Drone Roles:** Current drone flights primarily perform basic high-level photographic inspection of potholes, cracks, and approach lights—without automated real-time FOD classification or physical collection.

</Card>

<Card title="5. Stakeholder Requirements &amp; Strategic Value Proposition">

- **Manpower Reduction:** With national service cohort sizes shrinking due to declining birth rates, automating repetitive airfield patrols frees critical maintenance technicians and NSFs for core mission-critical aircraft readiness.
- **Runway Re-opening Latency (Crash/Emergency Scenarios):** In the event of an incident (e.g., the recent F-16 crash incident), manual post-clearing of shattered debris delays runway operations. A rapid automated clearing cycle drastically reduces emergency runway downtime.
- **Future Airbase Expansions:** Upcoming relocations and expansions (such as the Changi East / Terminal 5 military runway expansion and Tengah Airbase expansion) present greenfield opportunities to integrate autonomous inspection stacks from day one.
- **Budget vs. Technology Mindset:** Air Force operational teams are less constrained by raw procurement budget and more focused on proven technological reliability, mission speed, and safety compliance.

</Card>

## ⚙️ Engineering Implication & Subsystem Specification Mapping

Translating practitioner operational findings directly into functional engineering specifications for Project FOD Hunter:

<Badge type="info" text="Traceability Matrix" />

| Operational Finding from Primary Research | Engineering Implication | Subsystem Specification Target |
| --- | --- | --- |
| **Small Debris Threat**  Fasteners, rivets, screws, washers, and glass fragments $<2\text{ cm}$ pose primary turbine ingestion risk and are missed by sweepers. | Macro aerial passes may miss sub-2 cm fasteners; UGV close-proximity sensors must provide high pixel density and surface height profiling. | <Badge type="info" text="Target Detection Limit" />   $\ge 5\text{ mm}$ height anomaly via 3D point cloud / 5.0 MP global-shutter camera segmentation.  **Minimum detectable footprint:** $10\text{ mm} \times 10\text{ mm}$. |
| **Airspace Restrictions for UAVs**  Daily drone flights in active military aerodromes face severe airspace approval bottlenecks. | The UGV cannot depend strictly on continuous aerial cued dispatch; it must be capable of operating independently as a self-contained scanning unit. | <Badge type="info" text="Autonomous Fallback Mode" />   Pre-programmed geometric grid / lawnmower patrol when UAV clearance is unavailable. |
| **Manual Patrol Velocity (40 km/h) vs. Robot Bounds**  Current truck patrols drive at $\approx 40\text{ km/h}$ over 4–6 km strip, causing visual fatigue. Small robots cannot safely execute precision collection at 40 km/h. | Implement a dual-velocity state machine to balance rapid transit with precision collection. | <Badge type="tip" text="Dual-Velocity Profile" />   • **Transit Mode:** $10\text{--}15\text{ km/h}$ ($2.78\text{--}4.17\text{ m/s}$) over open asphalt.  • **Scan/Clearance Mode:** $3\text{--}5\text{ km/h}$ ($0.83\text{--}1.39\text{ m/s}$) within $2\text{ m}$ of target. |
| **Small Collection Payload Volume**  Typical collection per sweep is minimal—less than a palm-sized handful across an entire runway. | A bulky, heavy hopper or industrial vacuum tank is unnecessary; prioritize localized suction and magnetic retention. | <Badge type="warning" text="Payload Hopper Capacity" />   $2.0\text{--}5.0\text{ L}$ cyclonic container.  **Collection Tooling:** Switchable front 24V/48V electromagnet bar ($40\text{--}60\text{ cm}$ span) + compliant underbody vacuum shroud. |
| **False-Positive Hotspots**  Bird droppings, rubber tire skid marks, and oil stains cause false manual stops. | 2D color bounding boxes are insufficient; height discrimination is essential. | <Badge type="danger" text="Sensor Fusion Rejection" />   Spatial filtering fusing YOLOv8-Seg pixel masks with 3D LiDAR elevation:  • Elevation $\le 0\text{ mm} \rightarrow$ Surface stain (ignore)  • Elevation $> 5\text{ mm} \rightarrow$ True FOD target (remediate). |
| **Pavement Degradation**  Pavement spalling and asphalt cracking from jet vibrations generate loose stones and fissures. | The robot must log surface damage without attempting to vacuum non-remediable static asphalt cracks. | <Badge type="info" text="Pavement Inspection Protocol" />   Multi-class classification separating loose debris from structural fissures.  Automated GIS geotagging with $\pm 2\text{ cm}$ RTK-GNSS precision. |

<!-- #endregion report -->
