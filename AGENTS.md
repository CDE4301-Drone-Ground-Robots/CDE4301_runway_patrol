# CDE4301 Runway Patrol (FOD Hunter) — Shared Project Instructions

This repository contains the engineering design, simulation, and documentation for the NUS CDE4301 Innovation & Design Capstone project: **FOD Hunter — Autonomous Airfield Runway Patrol UGV**.

These instructions govern all AI pair programmers (Google Antigravity Gemini Agent and Claude Code Extension).

---

## 1. Project Scope & Architecture

### Active Target: Interim Report V3
- **Root Directory**: `For report/Interim report-v3/`
- **Engine**: VitePress (extending DefaultTheme) + Vue 3 + Tailwind CSS + motion-v + Three.js + GSAP ScrollTrigger + Liquid Glass Vue.
- **Development Commands** (run inside `For report/Interim report-v3/`):
  - Dev Server: `npm run docs:dev` (runs on `http://localhost:4174`)
  - Production Build: `npm run docs:build`
  - Preview Server: `npm run docs:preview` (runs on `http://localhost:4175`)
- **Windows Path Note**: The workspace folder contains `&` (`CDE4301 Innovation & Design Capstone (Robotics)`). If npm `.cmd` shims fail on Windows, run directly via Node:
  ```bash
  node ./node_modules/vitepress/bin/vitepress.js dev docs --port 4174
  ```
- **Preview Cache**: The preview server caches files; always restart preview after running a build.

### Strict Boundary with Legacy V2
- `For report/Interim report-v2/` is **strictly read-only reference**.
- **Never modify, delete, or reformat files in V2.**
- **No obsolete V2 references**: All links, styles, and asset paths in V3 must resolve strictly within V3 (`/report/...`, `./assets/...`). Do not link to `.html` files in V2.

---

## 2. Markdown Report Composition (`compose.ts`)

The project uses build-time Markdown composition to assemble the unified Overview Report from individual member documentation chapters without duplicating content.

- **Engine File**: `For report/Interim report-v3/docs/.vitepress/compose.ts`
- **Syntax**:
  ```markdown
  <!--@compose: ./members/<member>/<file>.md#<region>{shift=N,prefix=<prefix>}-->
  ```
- **Path Rebasing**: Authors write paths relative to their own file (`./assets/...`). `compose.ts` automatically rebases relative image/asset links so they resolve both on the member's standalone page and inside the combined report.
- **Prefixing & Anchor Isolation**:
  - Composed files use `prefix=name` (e.g. `prefix=nav`). This automatically prefixes anchor IDs (e.g. `{#sec-2-overview}` becomes `{#nav-sec-2-overview}`).
  - An anchor `<span id="name" class="compose-anchor"></span>` is injected at the start of the inserted section.
- **Heading IDs**: **Every Markdown section heading MUST have an explicit, unique ID** (e.g., `## 1 Executive Summary {#sec-1-summary}`) to avoid collisions during composition.

---

## 3. Subsystem Ownership & Documentation Structure

To ensure academic rigor and avoid duplication, each subsystem has an authoritative engineering owner. **Do not repeat calculations, theory, or subsystem narratives across member sections — use direct hyperlinks to the owner's section.**

| Subsystem | Lead / Engineer | Canonical Section / Scope |
| :--- | :--- | :--- |
| **Programming Lead** | **Hilbert Soh** | SLAM Toolbox, Nav2 path planning, Multi-agent C2 communications, ROS 2 Jazzy architecture, overseeing mechanical integration. |
| **Computer Vision Lead** | **Gabriel Tan** | YOLOv8 model benchmarking, FOD classification, RGB-D/LiDAR sensor fusion, camera pipeline, overseeing electrical architecture. |
| **Mechanical Engineer** | **Asuka** | FOD pickup centrifugal suction system, nozzle aerodynamics, trailing-arm suspension geometry. |
| **Mechanical Engineer** | **Zacarias Ng** | Custom chassis iterations, FEA structural simulations, differential drive kinematics, scrub radius calculations. |
| **Electrical Engineer** | **Bryan Ng** | 25.6V 20Ah LiFePO4 battery selection, power budget calculations, multi-rail DC-DC distribution, contact-charging dock. |

### Page Structure (Nine-Section Standard)
Every member engineering page follows this sequence:
1. `## 1 Executive Summary {#sec-1-summary}`
2. `## 2 Subsystem Overview {#sec-2-overview}`
3. `## 3 Requirements & Considerations {#sec-3-requirements}`
4. `## 4 Design Iterations & Selection {#sec-4-iterations}`
5. `## 5 Detailed Design & Implementation {#sec-5-implementation}`
6. `## 6 Testing Methodology & Results {#sec-6-testing}`
7. `## 7 Evaluation & Discussion {#sec-7-evaluation}`
8. `## 8 Improvements & Lessons Learned {#sec-8-improvements}`
9. `## 9 Semester 2 Development Plan {#sec-9-future}`

---

## 4. Academic Integrity & Evidence Standards

1. **No Invented Evidence**: Never create, round, extrapolate, or alter measurements, test results, specifications, or citations. If empirical data is missing, write a visible `TODO (owner)`.
2. **Simulation Proxy vs Custom Physical Prototype**:
   - **AgileX Scout 2.0**: Commercial UGV used strictly as the **simulation proxy** / kinematic stand-in in Gazebo Harmonic & SIL.
   - **FOD Hunter**: The custom physical UGV prototype (custom welded chassis, trailing-arm suspension, dual ZLAC8015D hub motors, centrifugal vacuum).
   - **Never conflate the two**: Never present proxy simulation graphs or 3D models as the physical prototype, and never swap prototype CAD into proxy simulation figures.
3. **Status Labels**: Always clearly distinguish between analytical prediction, simulation, bench test, and field test.
4. **Citations**: Numbered `[N]` format linking to the owner's reference catalogue (`/references/<member>#ref-N`). Every reference must cite an authentic standard (FAA AC 150/5210-24, ASTM F2477, ICAO Annex 14) or published academic paper.

---

## 5. Zotero Scope & Reference Governance Policy

> [!IMPORTANT]
> **Strict Isolation Rule:** The Zotero MCP server is provisioned across the workspace process, but its usage is **strictly restricted to Hilbert Soh's engineering subsystem (`docs/report/members/hilbert/`)**.

### Permitted Uses of Zotero MCP:
1. **Verifying Academic References**: Check citations in Hilbert's documentation (`communications.md`, `navigation.md`, `simulation.md`, `motor-drivetrain-calculation.md`, `steering-kinematics.md`).
2. **Metadata Validation**: Cross-check author lists, publication years, titles, DOIs, and statutory standards (FAA, ASTM, ICAO, IMDA).
3. **Reference Hygiene**: Identify duplicate or missing references in Hilbert's work.
4. **Catalogue Maintenance**: Maintain Hilbert's canonical reference catalogue (`docs/report/members/hilbert/references.md`).

### Strict Governance Restrictions:
- **Never touch references of other members**: Do NOT manage, modify, or synchronize references belonging to **Asuka, Zacarias, Gabriel, or Bryan** (`docs/report/members/{asuka,zacarias,gabriel,bryan}/references.md`).
- **Never modify the shared catalogue**: Do NOT alter the team's shared reference catalogue (`docs/report/references.md`) without explicit user authorization.
- **Read-Only / Safe Verification**: Do not automatically overwrite citations or reference markdown files. Always present proposed modifications for review before applying edits.

---

## 6. UI/UX, SSR & Performance Guidelines

- **Prose vs Technical Cards**: Ordinary explanatory prose sits directly on the page background (subject to the ≤ 2,000 words limit per page). Technical cards (`<TechFigure>`, `.equation`, `.data-table`, interactive Vue components) are for visual/mathematical artifacts. **Never hide prose inside cards or tooltips to bypass word limits.**
- **SSR-First**: Server-side rendering must be complete and readable with JavaScript disabled. No `window` or `document` calls at setup/module level; browser-only libraries (`three`, `gsap`, `@wxperia/liquid-glass-vue`) must be dynamically imported in `onMounted`.
- **Lifecycle Cleanup**: All event listeners, ScrollTriggers, WebGL contexts, and intervals must be cleanly disposed in `onBeforeUnmount`.
- **Reduced Motion**: Respect system accessibility preferences via `MotionConfig reducedMotion="user"`.

---

## 7. Safety & Repository Controls

- **No Unauthorized Commits or Pushes**: Never run `git commit` or `git push` without explicit user permission.
- **Documentation Preservation**: Preserve all mathematical equations (KaTeX), interactive 3D hero models, and design tokens during any refactoring.
