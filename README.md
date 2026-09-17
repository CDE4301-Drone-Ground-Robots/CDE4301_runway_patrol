# Runway Patrol: Autonomous Airfield Inspection & FOD Remediation System

> **CDE4301 Innovation & Design Capstone Project (Robotics)**  
> **National University of Singapore (NUS) &bull; College of Design and Engineering (CDE)**  
> _In Collaboration with the Republic of Singapore Air Force (RSAF) &amp; RAiD_  
> **Academic Supervisors:** Dr. Tang Kok Zuea

---

## 📢 Important Notice for Capstone Team Members

> [!IMPORTANT]
>
> ### 📁 Report Documentation Working Directory
>
> **All team members should edit, contribute, and add content inside the `For report/Interim report/` folder.**  
> The previous Jekyll/Markdown build system has been retired. The interim report is now built as a responsive, standalone HTML/CSS/JS dashboard.

### 🗺️ File & Subsystem Map for Contributions

When updating your individual scopes, hardware specifications, benchmark tables, or technical descriptions, locate your relevant file below:

| Page / Section                | File Path                                                     | Scope & Contribution Instructions                                                 |
| :---------------------------- | :------------------------------------------------------------ | :-------------------------------------------------------------------------------- |
| **Executive Dashboard**       | `For report/Interim report/index.html`                        | High-level KPIs, project summary cards, team overview.                            |
| **1. Introduction**           | `For report/Interim report/1-introduction.html`               | Operational problem definition, FOD risk matrix, primary practitioner interviews. |
| **2. Design Overview**        | `For report/Interim report/2-design-overview.html`            | Joint UAV-UGV concept of operations, airfield constraints, engineering targets.   |
| **3. Individual Scopes**      | `For report/Interim report/3-individual-scopes.html`          | Phase 1 & Phase 2 deliverables for each team member.                              |
| **4.1 Mechanical Subsystem**  | `For report/Interim report/4-subsystems/mechanical.html`      | Chassis iterations 1–3, kinematics calculations, FEA load case simulations.       |
| **4.2 Electrical Subsystem**  | `For report/Interim report/4-subsystems/electrical.html`      | 48V power distribution, onboard compute architecture, system load table.          |
| **Master Electrical BOM**     | `For report/Interim report/4-subsystems/electrical-bom.html`  | Full 35-item electrical Bill of Materials and hardware pricing.                   |
| **4.3 Programming Subsystem** | `For report/Interim report/4-subsystems/programming.html`     | ROS 2 Jazzy autonomous navigation, Nav2 path planning, Gazebo simulation demo.    |
| **C2 Communications Spec**    | `For report/Interim report/4-subsystems/communications.html`  | Telemetry link, MAVLink & CycloneDDS schemas, fail-safe protocols.                |
| **4.4 Computer Vision**       | `For report/Interim report/4-subsystems/computer-vision.html` | YOLO model comparison, mAP benchmarking, camera sensor pipeline.                  |
| **5. Timeline & Gantt**       | `For report/Interim report/5-timeline.html`                   | Interactive Gantt chart matrix, milestone weeks, individual task work packages.   |
| **6. References & Standards** | `For report/Interim report/6-references.html`                 | Academic citations, FAA AC 150/5220-24, ASTM D5340-20 standards.                  |

### 🛠️ How to Preview & Edit Locally

1. **Open directly in browser:** Double-click `index.html` at the repository root, or open `For report/Interim report/index.html` directly in Chrome, Firefox, or Edge.
2. **Local HTTP Server (Recommended):**
   ```bash
   # From repository root
   npx serve .
   # or with Python
   python -m http.server 8000
   ```
   Navigate to `http://localhost:8000` to preview with full font and asset loading.
3. **Styling Guidelines:**
   - Global styles are located in `For report/Interim report/css/styles.css`.
   - Use predefined card containers (`<div class="card-box">`), callouts (`callout callout-info`, `callout-amber`, `callout-rose`), and tables (`<div class="admin-table-wrapper"><table class="admin-table">`).
   - Placeholder fields marked as `[To be filled in]` indicate pending content to update.

---

## 🏗️ Repository Architecture

```text
CDE4301_runway_patrol/
├── assets/                     # Shared media, photos, diagrams, and logos
│   └── images/                 # Subsystem hardware and team photo assets
├── Backup/                     # Versioned README backups and legacy markdown files
│   ├── 180926 README.md        # Comprehensive pre-interim README backup
│   ├── 280726 README.md
│   └── 250726 README (HTML).md
├── For report/
│   └── Interim report/         # 🌟 ACTIVE INTERIM REPORT WEB APPLICATION
│       ├── index.html          # Executive summary dashboard
│       ├── 1-introduction.html # Threat modeling & primary research
│       ├── 2-design-overview.html
│       ├── 3-individual-scopes.html
│       ├── 4-subsystems/       # Subsystem deep dives (Mech, Elec, Prog, CV)
│       │   ├── mechanical.html
│       │   ├── electrical.html
│       │   ├── electrical-bom.html
│       │   ├── programming.html
│       │   ├── communications.html
│       │   └── computer-vision.html
│       ├── 5-timeline.html     # Gantt matrix & roadmap
│       ├── 6-references.html   # Standards & citations
│       ├── css/styles.css      # Core design system & theme variables
│       ├── js/main.js          # Interactive dashboard logic & Gantt scanner
│       └── specs/              # Detailed specification pages
├── simulation/                 # ROS 2 Jazzy & Gazebo Harmonic workspace
│   ├── README.md               # Simulation setup, launch instructions & worlds
│   └── src/                    # Scout V2 rover URDF, worlds & Nav2 configs
└── index.html                  # Root landing page (redirects to Interim report)
```

---

## 👥 Project Team Roster

| Member             | Matric No.  | Subsystem Scope                                                      |
| :----------------- | :---------- | :------------------------------------------------------------------- |
| **Hilbert Soh**    | `A0308263H` | Autonomous Navigation, SLAM & Path Planning, C2 Comms                |
| **Takeuchi Asuka** | `A0308200R` | Project Manager, Vacuum & Magnetic Cleaning Module                   |
| **Zacarias Ng**    | `A0308821B` | Chassis Mechanical Design, Differential Drive Kinematics & CAD       |
| **Gabriel Tan**    | `A0308452H` | Computer Vision, YOLO Perception (Overseeing Electrical)             |
| **Bryan Ng**       | `A0308298E` | Electrical Power Distribution, BMS, Docking Station & STM32 Firmware |
