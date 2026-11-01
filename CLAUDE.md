# CDE4301 Runway Patrol (FOD Hunter) — Claude Code Extension Instructions

<!-- Direct inclusion of authoritative project rules -->
@AGENTS.md

## Claude Code Quick Reference

- **Working Directory for V3 Website**: `For report/Interim report-v3/`
- **Commands**:
  - `npm run docs:dev` (starts dev server on port 4174)
  - `npm run docs:build` (production build)
  - `npm run docs:preview` (preview build on port 4175 — remember to restart if rebuilt)
  - Windows command note: Path has `&`. If npm cmd shim throws errors, invoke directly:
    `node ./node_modules/vitepress/bin/vitepress.js dev docs --port 4174`
- **Active Skills Available**:
  - `cde4301-documentation` (integrity rules, word limits, nine-section structure)
  - `vitepress-liquid-glass` (Vue 3, SSR safety, motion tokens, Liquid Glass theme)
  - `ros2-nav2-robotics`, `ros2-jazzy-engineering`, `nav2-engineering`, `gazebo-harmonic`
  - `playwright-browser-testing`, `technical-documentation-review`, `ui-ux-pro-max`
- **Zotero MCP Governance (Strict)**:
  - Zotero MCP is **strictly restricted to Hilbert Soh's subsystem (`docs/report/members/hilbert/`)**.
  - Use to verify metadata, DOIs, standard numbers, and maintain `docs/report/members/hilbert/references.md`.
  - NEVER manage or modify references for Asuka, Zacarias, Gabriel, or Bryan.
  - NEVER modify the shared team reference catalogue (`docs/report/references.md`) without explicit permission.
  - Read-only operations initially; never automatically alter markdown files.
- **Strict Guardrails**:
  1. `For report/Interim report-v2/` is read-only. Never modify.
  2. No duplicate engineering text across members: link directly to the canonical owner.
  3. Every heading must have an explicit anchor ID `{#sec-N-...}` for `@compose` compatibility.
  4. AgileX Scout 2.0 = Gazebo simulation proxy; FOD Hunter = custom physical UGV. Never conflate.
  5. Do NOT commit or push without explicit approval.
