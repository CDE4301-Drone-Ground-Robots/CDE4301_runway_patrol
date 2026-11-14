# FOD Hunter

### CDE4301 Innovation & Design Capstone Project (Robotics)

**National University of Singapore (NUS) • College of Design and Engineering (CDE)**  
**Academic Supervisors:** Dr. Tang Kok Zuea & Dr Mark DeLessio

---

## Project Team Roster

| Member             | Matric No.  | Subsystem Scope                                                      |
| :----------------- | :---------- | :------------------------------------------------------------------- |
| **Hilbert Soh**    | `A0308263H` | Autonomous Navigation, SLAM & Path Planning, C2 Comms                |
| **Takeuchi Asuka** | `A0308285Y` | Project Manager, Vacuum FOD Picking Module and Suspension            |
| **Zacarias Ng**    | `A0308821B` | Chassis Mechanical Design, Differential Drive Kinematics & CAD       |
| **Gabriel Tan**    | `A0308452H` | Computer Vision, YOLO Perception (Overseeing Electrical)             |
| **Bryan Ng**       | `A0301661R` | Electrical Power Distribution, BMS, Docking Station & STM32 Firmware |

---

## For Non-Team Members

To view our live interactive capstone report, please visit:  
**[FOD Hunter Report (GitHub Pages)](https://cde4301-drone-ground-robots.github.io/CDE4301_runway_patrol/)**

---

## For Team Members: Editing the Website

> [!IMPORTANT]
>
> ### Where to edit
>
> **The website lives in `For report/Interim report-v3/`.** Everything on it is written in **Markdown** (`.md`); you never touch HTML.
> Each piece of text lives in exactly one file. The Report, the Overview and Meet the Team pull it in from there.
> Push your changes to `main` and the site rebuilds and goes live by itself (see [Publishing](#-publishing)).

All paths below are inside `For report/Interim report-v3/docs/`.

### Your files

Your folder is `report/members/<your-name>/`. Put your images, videos, CAD models and spreadsheets in its `assets/` folder.
Every member also has a `references.md` (their reference list in Report chapter 7) and a `semester-2-plan.md` (shown on the Overview and Meet the Team).

| Member       | File                              | Appears in the Report as                                   |
| :----------- | :-------------------------------- | :--------------------------------------------------------- |
| **Hilbert**  | `navigation.md`                   | 3.1 Navigation                                             |
|              | `communications.md`               | 3.2 Communication                                          |
|              | `simulation.md`                   | 3.3 Simulation                                             |
|              | `motor-drivetrain-calculation.md` | 4.3 Motor Drivetrain Calculations                          |
|              | `steering-kinematics.md`          | 4.4 Steering Kinematics                                    |
|              | `semester-2-plan.md`              | also 3.1 (the `programming-tasks` region)                  |
| **Asuka**    | `suspension.md`                   | 4.2 Suspension                                             |
|              | `vacuum-module.md`                | 4.5.1 Vacuum Module, incl. the Critical Function Prototype |
|              | `fod-sweep-box-v2.md`             | 4.5.2 FOD Sweep Box                                        |
| **Zacarias** | `chassis-design.md`               | 4.1.1 Chassis Design                                       |
|              | `fea-simulation.md`               | 4.1.2 FEA Simulation                                       |
|              | `material-selection.md`           | 4.1.3 Material Selection                                   |
| **Gabriel**  | `vision-research.md`              | 3.4.1 Vision Research                                      |
|              | `vision-calculations.md`          | 3.4.2 Vision Calculations                                  |
|              | `yolo-comparison.md`              | 3.4.3 YOLO Comparison                                      |
|              | `sensor-fusion.md`                | 3.4.4 Sensor Fusion                                        |
|              | `stm32-hardware.md`               | 5.2.1 STM32 Hardware                                       |
|              | `stm32-firmware.md`               | 5.2.2 STM32 Firmware                                       |
| **Bryan**    | `power-calculations.md`           | 5.1.1 Power Calculations                                   |
|              | `components-list.md`               | 5.1.2 Components List                                      |

Each technical file is also published as its own page, at `/members/<your-name>/<file>`.

### Files for everyone

| File                                                             | What it is                                                                                                                                                                |
| :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `report/preliminary/acknowledgements.md`, `executive-summary.md` | The Report's opening pages (also on the Overview)                                                                                                                         |
| `report/introduction/`                                           | 1.1 Problem Statement, 1.2 Primary Research, 1.3 Secondary Research, 1.4 Problem Scope, 1.5 Competitive Analysis, 1.6 User Journey, and `references.md` (literature list) |
| `report/design-overview/`                                        | 2.1 Features, 2.2 Requirements, 2.3 Specifications, 2.4 Subsystem Division (also the Mechanical / Electrical chapter openings and the Overview roadmap text)              |
| `report/conclusion.md`                                           | Chapter 6 Conclusion                                                                                                                                                      |
| `report/references.md`                                           | Chapter 7 reference catalogue                                                                                                                                             |
| `team.md`                                                        | Meet the Team: edit **only your own** `<TeamProfile member="…">` block                                                                                                    |
| `shared/assets/data/timeline.json`                               | The Timeline's schedule: tasks, owners, dates and statuses                                                                                                                |
| `index.md`, `timeline.md`, `report.md`                           | Page layouts of the Overview, Timeline and Report: change only when restructuring a page                                                                                  |

Names, matric numbers and photos (Meet the Team and the Report's Subsystem Lead plates) come from `.vitepress/theme/data/team.ts`. Never type them into Markdown.

### How to Preview Locally

#### 🪟 Windows

1. **Install Node.js LTS** (run once if not installed):
   ```bash
   winget install -e --id OpenJS.NodeJS.LTS
   ```
   *(Close and reopen your terminal after installation so `npm` is added to PATH. Alternatively, download the installer from [nodejs.org](https://nodejs.org/))*

2. **Install & Run Dev Server** (from repository root):
   ```bash
   cd "For report/Interim report-v3"
   npm install
   npm run docs:dev
   ```
   *(If `npm` is not recognized in PowerShell or Command Prompt, use `npm.cmd install` and `npm.cmd run docs:dev`)*

---

#### 🍎 macOS

1. **Install Node.js** (run once if not installed):
   - **Via Homebrew** (recommended):
     ```bash
     brew install node
     ```
   - **Or direct installer**: Download the macOS `.pkg` installer from [nodejs.org](https://nodejs.org/) (LTS version).

2. **Install & Run Dev Server** (from repository root):
   ```bash
   cd "For report/Interim report-v3"
   npm install
   npm run docs:dev
   ```

---

#### 🌐 View the Website

- Open **[http://127.0.0.1:4174](http://127.0.0.1:4174)** in your browser (the preview updates live as you edit and save Markdown files).
- To stop the dev server at any time: press `Ctrl + C` in your terminal.

---

## Repository Architecture

```text
CDE4301_runway_patrol/
├── .github/workflows/
│   └── deploy.yml               # Builds the website and publishes it to GitHub Pages on every push to main
├── For report/
│   └── Interim report-v3/       # 🌟 THE WEBSITE (VitePress: Markdown + Vue)
│       ├── docs/
│       │   ├── index.md         # Overview page
│       │   ├── team.md          # Meet the Team
│       │   ├── timeline.md      # Timeline (data: shared/assets/data/timeline.json)
│       │   ├── report.md        # The Report (orders the sections)
│       │   ├── report/
│       │   │   ├── preliminary/      # acknowledgements, executive summary
│       │   │   ├── introduction/     # problem statement, primary & secondary research, scope, competition, user journey
│       │   │   ├── design-overview/  # features, requirements, specifications, subsystem division
│       │   │   ├── members/          # one folder per member: technical pages, references, Semester 2 plan, assets/
│       │   │   ├── lead/             # Subsystem Lead plates
│       │   │   ├── conclusion.md
│       │   │   └── references.md
│       │   ├── shared/assets/   # shared images, videos, models, documents and data
│       │   ├── public/          # files served as-is (3D model, favicon, Overview images)
│       │   └── .vitepress/      # site code: config, theme, components, widgets
│       └── package.json         # npm scripts: docs:dev, docs:build, docs:preview
├── Backup/                      # README backups; Interim report-v2 (the old site) is kept locally only, not in git
├── runway_sim_ws/               # ROS 2 Jazzy & Gazebo Harmonic workspace
│   ├── README.md                # Simulation setup, launch instructions & worlds
│   └── src/                     # Scout V2 rover URDF, worlds & Nav2 configs
├── CDE4301Stm32/                # STM32F446RE motor-control firmware (CubeMX / PlatformIO) and GUI controller
└── index.html                   # Points to the live website when the repository is opened locally
```
