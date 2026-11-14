<!-- Report chapter 7 reference catalogue. Edit here. -->

::: info
Academic & Regulatory Foundation

<Badge type="info" text="Scholarly Traceability" />

This repository contains the peer-reviewed literature, FAA / ICAO international civil aviation regulations, and pavement distress condition indices that govern the engineering parameters, sensor thresholds, and operational autonomy of the FOD Hunter robotic platform.
:::

## Reference Impact Matrix {#reference-impact-matrix}

<Badge type="info" text="Traceability" />

Cross-reference table mapping how each published standard and academic work directly informs the design decisions of our multi-agent platform:

| Ref # | Source / Authority | Domain | Specific Contribution to FOD Hunter Architecture |
| --- | --- | --- | --- |
| **\[1\]** | *Sensors* (Basel, 2026) | UAV Digitalization & Pavement Inspection | Informs high-altitude macro flight path planning, aerial camera optical coverage, and flight altitude limits ($15\text{--}25\text{ m}$). |
| **\[2\]** | *Remote Sensing* (MDPI, 2025) | Comprehensive FOD Sensor & Algorithm Survey | Provides comparative physics baseline for MMW radar, 3D LiDAR, LWIR thermal, and RGB false-positive suppression algorithms. |
| **\[3\]** | UC Berkeley / FAA ACRP (2016) | Drone-Enabled FOD Removal Limitations | Identifies the physical thrust/payload limitations of airborne drones, justifying the heterogeneous UAV+UGV collaborative split. |
| **\[4\]** | ST Engineering / CAG (2024) | Commercial SOTA: iFerret™ 2.0 | Establishes the state-of-the-art benchmark for fixed optical camera arrays at Singapore Changi Airport and identifies weather/shadow blind spots. |
| **\[5\]** | Federal Aviation Administration (2014) | FAA Advisory Circular AC 150/5220-24 | Mandates the regulatory detection thresholds: $\varnothing 38\text{ mm} \times 31\text{ mm}$ cylinder at $1,000\text{ m}$ (radar) and $20\text{ mm}$ debris at $300\text{ m}$ (optical). |
| **\[6\]** | ASTM International (2020) | ASTM D5340-20 Standard Test Method | Defines the standardized Pavement Condition Index (PCI) structural distress taxonomy for runway alligator cracking, joint spalls, and weathering. |

## Detailed Reference Catalogue {#reference-catalogue}

<Badge type="tip" text="6 Citations" />

::: info
<Badge type="info" text="[1]" /> <Badge type="info" text="Academic Journal" /> <Badge type="tip" text="2026" />

[DOI: 10.3390/s26041100 ↗](https://doi.org/10.3390/s26041100)

**[Digitalization and Automation of Runway Inspection Using Unmanned Aerial Vehicles ↗](https://doi.org/10.3390/s26041100)**

**Authors:** Krestenitis, M., Petropoulos, A., Koulalis, I., Stipanovic, I., Skaric Palic, S., Ioannidis, K., & Vrochidis, S.<br> **Source:** *Sensors*, Vol. 26, Issue 4, Article 1100, pp. 1–17.

<Card title="Contribution to Project:">

Provides mathematical frameworks for UAV aerial flight path optimization across active runways. Demonstrates that airborne high-resolution photogrammetry captures macro surface anomalies at $30\text{--}40\text{ km/h}$, significantly reducing Runway Occupancy Time (ROT) compared to human walking or driving patrols.

</Card>
:::

::: info
<Badge type="info" text="[2]" /> <Badge type="info" text="Review Paper" /> <Badge type="tip" text="2025" />

[DOI: 10.3390/rs17020225 ↗](https://doi.org/10.3390/rs17020225)

**[A Review of Foreign Object Debris Detection on Airport Runways: Sensors and Algorithms ↗](https://doi.org/10.3390/rs17020225)**

**Authors:** Shan, J., Miccinesi, L., Beni, A., Pagnini, L., Cioncolini, A., & Pieraccini, M.<br> **Source:** *Remote Sensing*, Vol. 17, Issue 2, Article 225, pp. 1–33.

<Card title="Contribution to Project:">

Synthesizes empirical detection ranges and environmental vulnerability across millimeter-wave radar, LiDAR, and computer vision. Served as the basis for our Multi-Modal Sensor Fusion architecture—combining LiDAR elevation profiles to reject flat optical artifacts (tire marks, asphalt joints) from 3D physical debris.

</Card>
:::

::: warning
<Badge type="warning" text="[3]" /> <Badge type="warning" text="University Design Report" /> <Badge type="tip" text="2016" />

[UC Berkeley / FAA ACRP ↗](https://www.researchgate.net/publication/303812046)

**[Drone-enabled Foreign Object Debris (FOD) Removal System in ad hoc Situations ↗](https://www.researchgate.net/publication/303812046)**

**Authors:** Yamamoto, H., Sattar, R. A., Wang, J., Mendez, L. F., & Rakas, J.<br> **Source:** *Airport Cooperative Research Program (ACRP) University Design Competition Report*, University of California, Berkeley.

<Card title="Contribution to Project:">

Proved that attempting physical debris retrieval purely using multi-rotor UAVs creates severe rotor downwash (scattering light debris), high motor strain, and rapid battery depletion. Directly motivated FOD Hunter's division of labor: lightweight UAV for aerial scouting, heavy UGV for targeted physical suction.

</Card>
:::

::: tip
<Badge type="tip" text="[4]" /> <Badge type="tip" text="Commercial SOTA" /> <Badge type="tip" text="2024" />

[ST Engineering / CAG ↗](https://www.changiairport.com)

**[iFerret™ 2.0 AI-Powered Foreign Object Debris Detection System ↗](https://www.changiairport.com)**

**Authors:** Stratec Intelligent Vision / NCS / Changi Airport Group.<br> **Source:** *Technical Product Datasheet & Airside Deployment Documentation*, Singapore Changi Airport.

<Card title="Contribution to Project:">

Benchmarked the industry gold standard for electro-optical automated FOD detection currently protecting Singapore Changi Airport. Highlighted the primary operational bottleneck: fixed optical cameras cannot physically pick up debris and generate elevated false alarm rates during heavy tropical rainstorms and night shadows.

</Card>
:::

::: danger
<Badge type="danger" text="[5]" /> <Badge type="danger" text="Regulatory Standard" /> <Badge type="tip" text="2014" />

[FAA AC 150/5220-24 ↗](https://www.faa.gov/documentLibrary/media/Advisory_Circular/150-5220-24.pdf)

**[Airport Foreign Object Debris (FOD) Management Equipment ↗](https://www.faa.gov/documentLibrary/media/Advisory_Circular/150-5220-24.pdf)**

**Issuing Body:** Federal Aviation Administration (FAA), U.S. Department of Transportation.<br> **Standard:** *Advisory Circular AC 150/5220-24*, Airport Safety & Operations Division.

<Card title="Contribution to Project:">

Serves as the primary regulatory performance target for our vision and sensor subsystems. Defines standard target geometries ($\varnothing 38\text{ mm} \times 31\text{ mm}$ metal cylinder, $20\text{ mm}$ optical cube), minimum detection ranges, scan intervals, and mobile vehicle velocity requirements ($48\text{ km/h}$).

</Card>
:::

::: info
<Badge type="info" text="[6]" /> <Badge type="info" text="ASTM Standard" /> <Badge type="tip" text="2020" />

[ASTM D5340-20 ↗](https://www.astm.org/d5340-20.html)

**[Standard Test Method for Airport Pavement Condition Index (PCI) Surveys ↗](https://www.astm.org/d5340-20.html)**

**Issuing Body:** ASTM International.<br> **Standard:** *ASTM D5340-20*, Book of Standards, Road and Paving Materials.

<Card title="Contribution to Project:">

Provides the classification framework for FOD Hunter's runway structural defect inspection module. Categorizes distress types into alligator cracking, block cracking, joint seal damage, and asphalt spalling, enabling georeferenced severity logging.

</Card>
:::
