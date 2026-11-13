/**
 * Explore FOD Hunter — the eight feature hotspots.
 *
 * Physical hotspots are anchored to CAD parts identified in the GLB (data/fod-hunter-parts.json, Phase
 * 14.1 audit). Explanations reuse the verified highlight texts in data/overview.ts (sourced from the
 * team documentation); the Navigation text is quoted verbatim from report/design-overview/subsystem-division.md (programming-overview).
 * Navigation has no physical sensor in the CAD (no GNSS / IMU / LiDAR part), so it is a labelled
 * system-level callout rather than a marker on the vehicle.
 * `report` is a heading id on the Report page, verified against docs/report.md and its partials.
 */
import { highlights } from './overview'

export type Subsystem = 'Mechanical' | 'Electrical' | 'Programming'
export interface Hotspot {
  id: string
  title: string
  subsystem: Subsystem
  text: string
  anchor: [number, number, number] | null // CAD coordinates (m); null = conceptual callout
  part: string
  report?: { id: string; label: string } // omitted for proposed features with no report section yet
}

const verified = (id: string) => highlights.find((h) => h.id === id)
const textOf = (id: string) => verified(id)?.text ?? '(To Be Filled)'
const anchorOf = (id: string) => verified(id)?.anchor ?? null

export const hotspots: Hotspot[] = [
  {
    id: 'contact-charging',
    title: 'Contact Charging',
    subsystem: 'Electrical',
    text: textOf('charger'),
    anchor: anchorOf('charger'),
    part: 'UAV Charger (raised rear deck)'
  },
  {
    id: 'chassis',
    title: 'Chassis',
    subsystem: 'Mechanical',
    text: textOf('chassis'),
    anchor: anchorOf('chassis'),
    part: '3030/4040 aluminium extrusions, side plates',
    report: { id: 'chassis', label: 'Mechanical → Chassis' }
  },
  {
    id: 'suspension',
    title: 'Suspension',
    subsystem: 'Mechanical',
    text: textOf('suspension'),
    anchor: anchorOf('suspension'),
    part: 'Shock_Absorber ×4, SUS2_Arm ×4',
    report: { id: 'suspension', label: 'Mechanical → Suspension' }
  },
  {
    id: 'motor',
    title: 'Motor',
    subsystem: 'Mechanical',
    text: textOf('drive'),
    anchor: anchorOf('drive'),
    part: 'ZLLG80 hub motors ×4, ZLAC8015D drivers ×2',
    report: { id: 'motor-selection', label: 'Mechanical → Motor Selection and Calculations' }
  },
  {
    id: 'computer-vision',
    title: 'Computer Vision',
    subsystem: 'Programming',
    text: textOf('camera'),
    anchor: anchorOf('camera'),
    part: 'LI-IMX568-GMSL2 camera (front)',
    report: { id: 'computer-vision', label: 'Programming → Computer Vision' }
  },
  {
    id: 'electronics-bay',
    title: 'Electronics Bay',
    subsystem: 'Electrical',
    text: textOf('electronics'),
    anchor: anchorOf('electronics'),
    part: 'Orin NX case, NUCLEO-F446RE, LiFePO4 packs, DC-DC converters',
    report: { id: 'microcontrollers', label: 'Electrical → Microcontrollers' }
  },
  {
    id: 'fod-remediation',
    title: 'FOD Remediation',
    subsystem: 'Mechanical',
    text: textOf('vacuum'),
    anchor: anchorOf('vacuum'),
    part: 'SOARFLY 20 L vacuum (rear)',
    report: { id: 'fod-remediation', label: 'Mechanical → FOD Remediation' }
  },
  {
    id: 'navigation',
    title: 'Navigation',
    subsystem: 'Programming',
    // verbatim, report/design-overview/subsystem-division.md (programming-overview)
    text: 'The Programming subsystem consolidates the entire software intelligence of the UGV, encompassing high-speed autonomous navigation, airfield SLAM mapping, global/local path trajectory planning, multi-robot coordination, and secure UAV-to-UGV command and control (C2) datalinks.',
    anchor: null,
    part: 'System-level capability (no dedicated navigation sensor in the CAD)',
    report: { id: 'navigation', label: 'Programming → Navigation' }
  }
]
