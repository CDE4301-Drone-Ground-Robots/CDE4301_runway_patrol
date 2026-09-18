# FOD Hunter: Autonomous Airfield Inspection & FOD Remediation System

### CDE4301 Innovation & Design Capstone Project (Robotics)

**National University of Singapore (NUS) • College of Design and Engineering (CDE)**  
_In Collaboration with the Republic of Singapore Air Force (RSAF) & RAiD_  
**Academic Supervisors:** Dr. Tang Kok Zuea

---

## 👥 Project Team Roster

| Member             | Matric No.  | Subsystem Scope                                                      |
| :----------------- | :---------- | :------------------------------------------------------------------- |
| **Hilbert Soh**    | `A0308263H` | Autonomous Navigation, SLAM & Path Planning, C2 Comms                |
| **Takeuchi Asuka** | `A0308200R` | Project Manager, Vacuum & Magnetic Cleaning Module                   |
| **Zacarias Ng**    | `A0308821B` | Chassis Mechanical Design, Differential Drive Kinematics & CAD       |
| **Gabriel Tan**    | `A0308452H` | Computer Vision, YOLO Perception (Overseeing Electrical)             |
| **Bryan Ng**       | `A0308298E` | Electrical Power Distribution, BMS, Docking Station & STM32 Firmware |

---

## 🌐 For Non-Team Members

To view our live interactive capstone report dashboard, please visit:  
👉 **[FOD Hunter Interim Report (GitHub Pages)](https://cde4301-drone-ground-robots.github.io/CDE4301_runway_patrol/)**

---

## 📢 For Team Members

> [!IMPORTANT]
>
> ### 📁 Report Documentation Working Directory
>
> **All team members should edit, contribute, and add content inside the `For report/Interim report-v2/` folder.**  
> The report is built as a responsive, standalone Apple Keynote-inspired HTML/CSS/JS dashboard.

### 🗺️ Interim Report File Tree

Below is the directory map of `For report/Interim report-v2/`. Locate your assigned HTML files to edit your technical content:

> [!TIP]
> **Architecture Guideline:**
>
> - **`4-subsystems/`** is for **Summaries, short explanations, block diagrams, and key pointers**
> - **`7-documentation/`** is where **members store their full technical documentations for their respective subsystems**

```text
For report/Interim report-v2/
├── index.html                               # 🌟 Executive Summary Dashboard & 3D Model
├── 1-introduction.html                      # Problem statement, threat matrix & progress
├── 2-design-overview.html                   # UAV-UGV concept of operations & architecture
├── 3-individual-scopes.html                 # 3D Stack Deck of team roles & deliverables
├── 4-subsystems/                            # ⚙️ Subsystem Summaries (Short Explanations & Key Pointers)
│   ├── index.html                           # ── Subsystems Landing Hub
│   ├── mechanical.html                      # ── 4.1 Mechanical Summary & Key Pointers (Asuka & Zacarias)
│   ├── electrical.html                      # ── 4.2 Electrical Summary & Key Pointers (Bryan & Gabriel)
│   ├── programming.html                     # ── 4.3 Programming & Autonomy Summary (Hilbert)
│   └── computer-vision.html                 # ── 4.4 Computer Vision & Perception Summary (Gabriel)
├── 5-timeline.html                          # 📅 Gantt Matrix & Phased Milestone Roadmap
├── 6-references.html                        # 📚 Consolidated References & FAA Standards
├── 6-references/                            # 📚 Member Citation Files
│   ├── asuka/references.html                # ── Asuka References
│   ├── zacarias/references.html             # ── Zacarias References
│   ├── bryan/references.html                # ── Bryan References
│   ├── gabriel/references.html              # ── Gabriel References
│   ├── hilbert/references.html              # ── Hilbert References
│   └── literature/references.html           # ── Literature References
├── 7-documentation.html                     # 📖 Central In-Depth Documentation Hub
├── 7-documentation/                         # 📁 In-Depth Work Topics & Member Engineering Specifications
│   ├── asuka/                               # ── Asuka's In-Depth Work Topics
│   │   ├── suspension.html                  # ──── In-Depth Suspension & Vibration Isolation Spec
│   │   └── vacuum-module.html               # ──── In-Depth Vacuum & Magnetic Cleaning Module Spec
│   ├── zacarias/                            # ── Zacarias' In-Depth Work Topics
│   │   ├── chassis-fea.html                 # ──── In-Depth Structural Chassis FEA & Load Analysis
│   │   ├── drivetrain-kinematics.html       # ──── In-Depth Differential Drive Kinematics & Sizing
│   │   └── motor-calculations.html          # ──── In-Depth Motor Torque & Battery Sizing Math
│   ├── bryan/                               # ── Bryan's In-Depth Work Topics
│   │   ├── components-bom.html              # ──── In-Depth 35-Item Master Component BOM & Wiring Specs
│   │   └── power-calculations.html          # ──── In-Depth Power Consumption & Runtime Calculations
│   ├── gabriel/                             # ── Gabriel's In-Depth Work Topics
│   │   ├── vision-calculations.html         # ──── In-Depth Lens, FOV, GSD & Pixel Size Calculations
│   │   ├── vision-research.html             # ──── In-Depth Lighting & Environmental Sensor Research
│   │   └── yolo-comparison.html             # ──── In-Depth YOLO Model Benchmarks & Comparison
│   ├── hilbert/                             # ── Hilbert's In-Depth Work Topics
│   │   ├── communications.html              # ──── In-Depth UAV-UGV Telemetry & C2 Protocol Spec
│   │   ├── navigation.html                  # ──── In-Depth Nav2 Controller, Costmaps & SLAM Tuning
│   │   └── simulation.html                  # ──── In-Depth ROS 2 Jazzy & Gazebo Harmonic Simulation
│   └── literature/                          # ── In-Depth Literature & Airfield Research
│       ├── primary-research.html            # ──── In-Depth Airfield Practitioner Survey & Testing
│       └── problem-statement.html           # ──── In-Depth Airfield FOD Economic & Safety Analysis
├── css/styles.css                           # 🎨 Apple Design System Tokens & Animations
└── js/main.js                               # ⚡ Interactive Mega Menus, Swipers & Video
```

---

### 🛠️ How to Preview & Edit Locally

1. **Local HTTP Server:**

   ```bash
   # From repository root
   python -m http.server 8000
   ```

2. **Local HTTP Server (Recommended):**
   Navigate to [http://localhost:8000](http://localhost:8000) to preview with full font and asset loading.

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
│   └── Interim report-v2/      # 🌟 ACTIVE INTERIM REPORT WEB APPLICATION (See file tree above)
├── simulation/                 # ROS 2 Jazzy & Gazebo Harmonic workspace
│   ├── README.md               # Simulation setup, launch instructions & worlds
│   └── src/                    # Scout V2 rover URDF, worlds & Nav2 configs
└── index.html                  # Root landing portal (redirects to Interim report-v2)
```
