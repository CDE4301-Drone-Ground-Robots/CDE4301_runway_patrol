/**
 * Overview page content that is not Markdown: the cinematic hero text and chapters, and the hotspot data
 * the Explore FOD Hunter viewer builds on (data/explorer.ts). Quoted passages are verbatim from the Report
 * (source noted on each). Report text itself (acknowledgements, executive summary, introduction …) lives in
 * docs/report/**.
 */

// ---------- 01 Hero + cinematic chapters ----------
export const hero = {
  eyebrow: 'Runway Patrol',
  title: 'FOD Hunter',
  tagline: 'Engineering Autonomous Airfield Safety.',
  description: 'An integrated UAV–UGV approach to autonomous foreign object debris detection and clearance.'
}

/** Chapters revealed during the scroll-driven orbit (progress = 0…1 through the stage). */
export const chapters = [
  {
    at: 0.22,
    kicker: 'Two robots, one task',
    title: 'Detect. Dispatch. Clear.',
    body: 'FOD Hunter is the remediation half of the two-robot FOD Hunter × FOD Argus system: FOD Argus detects debris, whilst FOD Hunter removes it.',
    source: 'Report · Executive summary'
  },
  {
    at: 0.45,
    kicker: 'Rear deck',
    title: 'A landing deck for the UAV',
    body: 'After the runway is cleared, FOD Hunter returns to its home position and the drone lands on top.',
    source: 'Report · Introduction · User journey'
  },
  {
    at: 0.68,
    kicker: 'Semester 1',
    title: 'A critical-function prototype',
    body: 'A critical-function prototype of FOD Hunter has been achieved, with clearly defined roles across eight subsystems: navigation, communication, mechanical (chassis, suspension and FOD remediation), electrical (power and microcontroller), and computer vision.',
    source: 'Report · Executive summary'
  },
  {
    at: 0.9,
    kicker: 'What you are looking at',
    title: 'Our own design',
    body: 'This is the FOD Hunter CAD assembly. Semester 1 navigation simulation used the commercial AgileX Scout 2.0 as an interim kinematic proxy; it is not the FOD Hunter design.',
    source: 'Final_UGV.glb; Simulation documentation'
  }
]

// ---------- 04 Highlights: only parts present in the CAD and described in the documentation ----------
export interface Highlight {
  id: string
  /** Part keys in fod-hunter-parts.json (documentation of where the anchor comes from). */
  parts: string[]
  /** Hotspot point in CAD metres (+Y up, +Z front), taken from the part bounds in fod-hunter-parts.json. */
  anchor: [number, number, number]
  title: string
  text: string
  cad: string
  owner: string
  link?: { text: string; href: string }
  /** Camera azimuth (deg, 0 = from the front/+Z, 90 = from the vehicle's left/+X) and elevation (deg). */
  view: { azimuth: number; elevation: number; zoom: number }
}
export const highlights: Highlight[] = [
  {
    id: 'charger',
    parts: ['UAV Charger'],
    anchor: [0, 0.514, -0.185],
    title: 'UAV contact-charging platform',
    text: 'A raised landing deck over the rear of the vehicle where the UAV lands at the end of a mission. It is designed as a contact-charging dock: the drone rests on a grid of contact pads, similar in principle to commercial contact-charging pads such as Skycharge. Electrical specifications and charging tests are not yet documented.',
    cad: 'UAV Charger',
    owner: 'Bryan Ng (contact-charging dock)',
    link: { text: 'Design overview', href: '/report#overview-of-design' },
    view: { azimuth: 200, elevation: 48, zoom: 1.05 }
  },
  {
    id: 'drive',
    parts: ['ZLLG80ASM250-HT V2.0', 'ZLAC8015D'],
    anchor: [0.336, -0.039, 0.25],
    title: 'Four hub-motor drive',
    text: '4 independent direct-drive hub motors driven by dual ZLAC8015D servo drivers. Four-wheel independent skid steering was selected because it delivers zero-radius turning, complete mechanical simplicity with zero steering linkages or kingpins, symmetrical bidirectional dynamics, and superior environmental sealing.',
    cad: 'ZLLG80 hub-motor wheels ×4, ZLAC8015D drivers ×2',
    owner: 'Hilbert Soh',
    link: { text: 'Motor & drivetrain sizing', href: '/members/hilbert/motor-drivetrain-calculation' },
    view: { azimuth: 62, elevation: 12, zoom: 1.0 }
  },
  {
    id: 'suspension',
    parts: ['Shock_Absorber', 'SUS2_Arm'],
    anchor: [0.24, 0.07, 0.21],
    title: 'Suspension',
    text: 'In the CAD, each corner carries a suspension arm and a spring–damper unit. Each corner is modelled as a corner mass supported by a spring and a dampener in parallel, sitting on a wheel assumed to be 100% rigid.',
    cad: 'Shock absorbers ×4, SUS2 arms ×4',
    owner: 'Asuka',
    link: { text: 'Suspension design', href: '/members/asuka/suspension' },
    view: { azimuth: 112, elevation: 6, zoom: 1.0 }
  },
  {
    id: 'electronics',
    parts: ['Orin_nx_dev_kit_case', 'NUCLEO-F446RE', 'LiFePO4 20Ah battery'],
    anchor: [0.1325, 0.224, 0.107],
    title: 'Electronics bay',
    text: 'Under a polycarbonate cover: the high-level computer (Jetson Orin NX dev kit case in the CAD), the STM32 NUCLEO-F446RE real-time controller, LiFePO4 batteries, DC-DC converters and fuse box. If the Jetson\'s OS crashes, reboots or drops frames, the STM32 detects the communication timeout and independently triggers a CiA 402 Quick-Stop on all four wheels.',
    cad: 'Orin NX case, NUCLEO-F446RE, LiFePO4 20 Ah ×2, DC-DC converters, fuse box',
    owner: 'Bryan Ng · Gabriel Tan',
    link: { text: 'STM32 low-level control', href: '/members/gabriel/stm32-hardware' },
    view: { azimuth: 30, elevation: 58, zoom: 0.9 }
  },
  {
    id: 'camera',
    parts: ['LI-IMX568-GMSL2-050H', 'NF-A12x25_Public-CAD'],
    anchor: [0, 0.225, 0.441],
    title: 'Front camera and cooling',
    text: 'A GMSL2 camera module is mounted at the front, above two cooling fans. Current computer-vision prototyping runs on a laptop with a USB camera; the GMSL2 module is the planned on-vehicle sensor.',
    cad: 'LI-IMX568 GMSL2 camera, Noctua NF-A12x25 fans ×2',
    owner: 'Gabriel Tan',
    link: { text: 'Computer vision subsystem', href: '/report#computer-vision' },
    view: { azimuth: 8, elevation: 18, zoom: 0.95 }
  },
  {
    id: 'vacuum',
    parts: ['SOARFLY Wet Dry Vacuum cleaner 20 Litre'],
    anchor: [0.011, 0.359, -0.245],
    title: 'FOD remediation module',
    text: 'A 20-litre wet-and-dry vacuum and modified collection bin sit at the rear of the chassis. A cardboard bounding box connected to the vacuum hose was used as a critical function prototype to test the new set-up.',
    cad: 'SOARFLY 20 L wet/dry vacuum, modified bin',
    owner: 'Asuka',
    link: { text: 'Vacuum module', href: '/members/asuka/vacuum-module' },
    view: { azimuth: 160, elevation: 32, zoom: 1.0 }
  },
  {
    id: 'chassis',
    parts: ['Base Plate', 'Side plates', '3030 Square tube'],
    anchor: [0.201, 0.08, 0],
    title: 'Chassis',
    text: 'An aluminium-extrusion frame with bolted brackets, enclosed by flat body panels (modelled in carbon-fibre epoxy in the CAD).',
    cad: '3030/4040 extrusions, CFC brackets, base and side plates',
    owner: 'Zacarias Ng',
    link: { text: 'Chassis design', href: '/members/zacarias/chassis-design' },
    view: { azimuth: 300, elevation: 22, zoom: 1.05 }
  }
]
