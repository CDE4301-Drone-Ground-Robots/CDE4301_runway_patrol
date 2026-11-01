<!-- Canonical report source. Edit here. -->

## Competitive Analysis {#competitive-analysis}

### Competitive analysis {#sec-competitors}


Existing solutions either **detect** FOD or **collect** it, but rarely do both well. The map below places each solution by its detection and collection performance. **Click any solution** to see how it works, what it does well and where it falls short.

<IntroductionWidget1 />

### Why a multi-robot approach? {#sec-multirobot}

#### Differentiating factor: productivity and long-term savings

In 2016, a research study by Savaş Öztürk and Ahmet Emin Kuzucuoğlu compared a five-year projection of the cost and performance of a manual solution against an autonomous solution at Istanbul Atatürk Airport, working with information from a simulated detection device.

- **Manual solution:** driving a truck on a fixed route to pick up FOD (as they currently do).
- **Autonomous solution:** deploying a fleet of robots (5, 10, 15 or 20) at evenly (or optimally) spaced stations to pick up FOD.

The research conducted by **Savaş Öztürk** and **Ahmet Emin Kuzucuoğlu (2016)** establishes the foundational precedence and theoretical bedrock for FOD HUNTER. In their seminal paper, *“A Multi-Robot Coordination Approach for Autonomous Runway Foreign Object Debris (FOD) Clearance,”* the authors developed a comprehensive experimental framework simulating runway-clearance operations at Istanbul Atatürk Airport.

Their study compared traditional manual collection, which relies on dispatching human-operated “Follow-Me” trucks, against three progressive phases of automated multi-robot coordination (ASP1-ASP3). These phases used heat-map clustering and the Hungarian (Kuhn-Munkres) algorithm for optimal task allocation.

#### Scenario comparison and sensitivity heat map from the study

The complete operational comparison reproduced from **Öztürk and Kuzucuoğlu (2016)** directly integrates the operational cost-delay parameters with the five-year sensitivity heat map across Istanbul Atatürk Airport operational simulations:

Scenario comparison and five-year usage and cost sensitivity heat map (Öztürk & Kuzucuoğlu, 2016).

<table class="data-table"><tbody>
<tr><th rowspan="2"></th><th colspan="4">ASP3</th><th colspan="4">ASP2</th><th colspan="4">ASP1</th><th colspan="3">MS</th></tr>
<tr><th>20 robots</th><th>15 robots</th><th>10 robots</th><th>5 robots</th><th>20 robots</th><th>15 robots</th><th>10 robots</th><th>5 robots</th><th>20 robots</th><th>15 robots</th><th>10 robots</th><th>5 robots</th><th>5 trucks</th><th>3 trucks</th><th>1 truck</th></tr>
<tr><td>BASE COST ($) →</td><td>2.660.000</td><td>2.282.500</td><td>1.905.000</td><td>1.527.500</td><td>2.660.000</td><td>2.282.500</td><td>1.905.000</td><td>1.527.500</td><td>2.660.000</td><td>2.282.500</td><td>1.905.000</td><td>1.527.500</td><td>2.825.000</td><td>1.975.000</td><td>1.125.000</td></tr>
<tr><td>AVERAGE DELAY TIME FOR EACH FOD COLLECTION OPERATION (s.) →</td><td>626</td><td>635</td><td>648</td><td>1057</td><td>787</td><td>853</td><td>836</td><td>1331</td><td>598</td><td>796</td><td>901</td><td>1166</td><td>853</td><td>989</td><td>1468</td></tr>
<tr><td>COST OF DELAY AT EACH OPERATION (USAGE) ($) →</td><td>15.638</td><td>15.875</td><td>16.205</td><td>26.433</td><td>19.670</td><td>21.328</td><td>20.890</td><td>33.278</td><td>14.955</td><td>19.893</td><td>22.533</td><td>29.153</td><td>21.323</td><td>24.728</td><td>36.698</td></tr>
</tbody></table>

<Card>

Five-Year Sensitivity Heat Map across 22 Usage Frequencies

Hover cells to inspect sensitivity tier & lifecycle costs

ASP: Autonomous System Phase; MS: Manual System. Runway delay penalty benchmarked at USD 1,500/min. Öztürk & Kuzucuoğlu (2016)

</Card>

The colours represent the most appropriate approach for each usage frequency (row-by-row ranking): **green is cheapest** and **red is most expensive**.

<CardGrid :cols="3">

<Card title="ASP3 · 10 robots" accent="emerald">

|   |   |
| --- | --- |
| Delay cost per op × ops | \$16,205 × 500 |
| Delay cost | \$8,102,500 |
| + Base cost | \$1,905,000 |
| 5-year total | \$10,007,500 |

</Card>

<Card title="MS · 1 truck" accent="rose">

|   |   |
| --- | --- |
| Delay cost per op × ops | \$36,698 × 500 |
| Delay cost | \$18,349,000 |
| + Base cost | \$1,125,000 |
| 5-year total | \$19,474,000 |

</Card>

<Card title="Saved with ASP3 over 5 years" accent="emerald">

\$19,474,000 − \$10,007,500

\$9,466,500

</Card>

</CardGrid>

This gives us the confidence to move forward with the multi-robot approach: it is not only possible with technology, but also economically viable.

#### Key findings

1. **Dramatic reduction in runway downtime:** Traditional manual dispatch using a single truck required an average runway-closure time of **1,468 seconds (approximately 24.5 minutes)** per clearance event. An optimised fleet of 10 coordinated autonomous rovers (ASP3) reduced the average clearance downtime to **648 seconds (approximately 10.8 minutes)**, representing a reduction of more than 56% in operational closure time.
2. **Nearly 50% reduction in five-year financial costs:** Including capital expenditure, 24/7 personnel salaries, vehicle maintenance, and airport delay penalties calculated at **USD 1,500 per minute** of runway closure, the traditional manual truck system reached **USD 19,473,750** over five years. The 10-robot autonomous system reduced the burden to **USD 10,007,500**, delivering **USD 9,466,250** in net economic savings, or approximately a 48.6% lifecycle cost reduction.

**Integrating this bedrock into the FOD HUNTER narrative:** This empirical research demonstrates that a multi-robot autonomous solution is not merely theoretical. It is a commercially viable strategy capable of reducing airfield downtime, removing human workers from active taxiway hazards, and cutting long-term FOD maintenance costs.

By adopting Öztürk and Kuzucuoğlu’s multi-agent coordination framework as a foundation, FOD HUNTER aims to translate and scale these results for high-density international aviation hubs such as Singapore Changi Airport:

- **Productivity and throughput:** Integrating the autonomous UGV fleet directly with fixed airfield detection systems, such as Changi’s iFerret cameras, enables immediate direct-path dispatch without search overhead, targeting clearance windows under five minutes.
- **Enhanced safety standards:** The system replaces manual visual sweeps on hot asphalt and removes ground personnel from hazardous jet-blast zones and active traffic.
- **Economic scalability:** At high-traffic airports where slot delays carry extreme financial penalties, scaling the UGV platform amplifies the multi-million-dollar return on investment demonstrated in the literature.

### Additional benchmarking {#sec-benchmarks}

#### Performance specifications (FAA AC 150/5220-24 benchmark)

Regulatory operational performance requirements defined under Federal Aviation Administration Advisory Circular 150/5220-24 for automated FOD detection categories:

| Sensing Category | Standard Reference Target | Required Detection Range | Required Accuracy / Operating Conditions |
| --- | --- | --- | --- |
| **Stationary Radar** E-band (71–86 GHz) / W-band (92–100 GHz) | Standard metal cylinder  <Badge type="info" text="$\varnothing 38\text{ mm} \times 31\text{ mm}$ height" /> | $\ge 1,000\text{ m}$ | Location accuracy within $\le 5\text{ m}$; all-weather penetration (rain, fog, darkness). |
| **Stationary Electro-Optical** HD Multi-megapixel arrays + AI analytics | Small optical object  <Badge type="tip" text="$20\text{ mm}$ dimension" /> | $\ge 300\text{ m}$ | Ambient daytime lighting; high-contrast visual identification. |
| **Stationary Hybrid** Radar + Near-IR / PTZ Optical Co-location | Small debris object  <Badge type="info" text="$20\text{ mm}$ dimension" /> | Full Runway Width ($\approx 60\text{ m}$ span) | Covers entire lateral runway cross-section with automated cross-sensor verification. |
| **Mobile Vehicle Radar** Vehicle-mounted FMCW / MMW radar | Standard metal cylinder  <Badge type="warning" text="$\varnothing 38\text{ mm} \times 31\text{ mm}$ height" /> | $183\text{ m} \times 183\text{ m}$ scan area | Continuous scanning while vehicle travels at operational speeds up to $48\text{ km/h}$. |

#### Analysis of existing airside UGV solutions

*Table 3.2:* Benchmarking current commercial and research autonomous ground vehicles deployed for airfield maintenance:

| Solution | Primary Detection Technologies | Key Features | Limitations / Drawbacks |
| --- | --- | --- | --- |
| **Airtrek Groundwatch** Autonomous Airfield Rover | Multi-camera arrays, long-range LiDAR, Onboard Edge AI | • Dual wingtip deployment configuration  • Operator live view & aircraft exterior inspection  • High-accuracy GPS target tagging | <Badge type="danger" text="❌ Lacks Physical Collection" />   Diagnostic-only; cannot physically pick up or clear detected debris, still requiring human dispatch. |
| **Roboxi** Multi-Purpose Airfield Patrol | AI optical vision, multi-spectral thermal sensors, high-precision GNSS | • Modular payload architecture  • Acoustic bird deterrent capabilities  • Runway edge-light bulb & surface pavement inspection | <Badge type="warning" text="⚠️ High Weight &amp; Cost" />   Substantial payload mass and elevated capital cost; complex software stack with shorter battery runtime. |
| **Guimu Robot** Subsurface Pavement Diagnostic | High-frequency Ground-Penetrating Radar (GPR), 3D LiDAR, HD cameras | • Deep sub-surface structural mapping (voids, moisture, base erosion)  • Fast coverage: $7,500\text{ m}^2/\text{hr}$ at $20\text{ km/h}$  • Long 8-hour operational battery runtime | <Badge type="danger" text="❌ Zero FOD Retrieval" />   Engineered strictly for subsurface civil pavement structural analysis; lacks any surface FOD remediation mechanism. |

**Key Research & Engineering Gap:** Existing airside UGVs fall into two extremes: either heavy, costly diagnostic inspection rovers (Airtrek, Roboxi) that only log coordinates without physical retrieval, or civil engineering machines (Guimu) built exclusively for sub-surface radar. **FOD Hunter uniquely couples high-speed aerial cueing (UAV) with targeted, active physical extraction (UGV) to achieve true closed-loop "Find-and-Fix" airside remediation.**
