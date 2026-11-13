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
  description: 'A drone and a ground robot working together to find and remove foreign object debris (FOD) from runways.'
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
    text: 'A raised deck over the rear of the vehicle where the UAV lands at the end of a mission. It is proposed as a contact-charging dock, with the drone resting on a grid of contact pads (similar in principle to commercial pads such as Skycharge). Development is planned for Semester 2; electrical specifications and charging tests are not yet available.',
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
    text: 'Four direct-drive hub motors, driven by two ZLAC8015D dual-channel servo drivers. Skid steering was chosen because it allows turning on the spot without steering linkages. The motors are sized by calculation for 15 km/h, using a 65 kg assumed vehicle mass for preliminary engineering calculations; Semester 1 ground tests ran at 0.34 m/s on a bench power supply.',
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
    text: 'In the CAD, each corner carries a suspension arm and a spring–damper unit. Each corner is modelled as a corner mass supported by a spring and a damper in parallel, sitting on a wheel assumed to be 100% rigid.',
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
    text: 'Under a polycarbonate cover: the high-level computer (Jetson Orin NX dev kit case in the CAD), the STM32 NUCLEO-F446RE real-time controller, 48 V-class LiFePO4 batteries (20 Ah; 51.2 V nominal assuming a 16S pack), DC-DC converters and fuse box. The STM32 stops the motors if gamepad commands stop arriving for 250 ms, and the emergency stop sends a CiA 402 Quick-Stop to the drivers. A similar timeout on the ROS 2 link from the Jetson is planned for Semester 2.',
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
    text: 'A 20-litre wet-and-dry vacuum with a modified collection bin sits at the rear of the chassis. Suction was chosen as the single collection mechanism for metallic and non-metallic debris. In an on-vehicle trial the top-down intake collected M3–M4 screws under 10 g; a redesigned sweep-box pick-up has so far been tested only as a cardboard critical-function prototype.',
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
