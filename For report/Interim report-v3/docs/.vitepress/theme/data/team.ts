/**
 * The one source of each member's identity: Meet the Team (Mirror Hall cards and profiles) and the Report's
 * Subsystem Lead plates both read it. Identity only — name, discipline, matric, portrait, documentation
 * pages. What each person did (contributions, scope, deliverables, Semester 2 plan) stays in Markdown:
 * docs/team.md and docs/report/members/<id>/semester-2-plan.md.
 *
 * Sources: names, disciplines, matriculation IDs, subsystem labels and social links are from team.md as
 * the team's own records. Portraits are the members' own photos (report/members/<id>/assets/images/
 * <id>.jpg); <id>-portrait.jpg is the same photo resized to 1200 px for the web.
 */
import hilbertPortrait from '@docs/report/members/hilbert/assets/images/hilbert-portrait.jpg'
import asukaPortrait from '@docs/report/members/asuka/assets/images/asuka-portrait.jpg'
import zacariasPortrait from '@docs/report/members/zacarias/assets/images/zacarias-portrait.jpg'
import gabrielPortrait from '@docs/report/members/gabriel/assets/images/gabriel-portrait.jpg'
import bryanPortrait from '@docs/report/members/bryan/assets/images/bryan-portrait.jpg'

export type MemberId = 'hilbert' | 'asuka' | 'zacarias' | 'gabriel' | 'bryan'

export interface DocLink {
  label: string
  /** VitePress route (base-less); render with withBase() */
  route: string
}

export interface Member {
  id: MemberId
  name: string
  /** short form for plates and the card heading */
  shortName: string
  /** subsystem label shown under the name on the card */
  role: string
  /** subsystem responsibility, as titled on the team page */
  subsystem: string
  discipline: string
  matric: string
  portrait: string
  /** CSS object-position keeping the face in frame when the photo is cropped to 3:4 */
  focus: string
  docs: DocLink[]
  social: { label: string; href: string }[]
}

export const team: Member[] = [
  {
    id: 'hilbert',
    name: 'Hilbert Soh Yong Tai',
    shortName: 'Hilbert Soh',
    role: 'Programming (navigation & comms)',
    subsystem: 'Autonomous navigation, SLAM & C2 communications',
    discipline: 'Mechanical Engineering (Robotics Specialisation)',
    matric: 'A0308263H',
    portrait: hilbertPortrait,
    focus: '50% 55%',
    docs: [
      { label: 'Navigation', route: '/members/hilbert/navigation' },
      { label: 'Communication', route: '/members/hilbert/communications' },
      { label: 'Simulation', route: '/members/hilbert/simulation' },
      { label: 'Motor Drivetrain Calculations', route: '/members/hilbert/motor-drivetrain-calculation' },
      { label: 'Steering Kinematics', route: '/members/hilbert/steering-kinematics' }
    ],
    social: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hilbert-soh' },
      { label: 'Instagram', href: 'https://www.instagram.com/ollie_soh?stkn=dGx0eWJyanhhcGN4' }
    ]
  },
  {
    id: 'asuka',
    name: 'Takeuchi Asuka',
    shortName: 'Takeuchi Asuka',
    role: 'Mechanical',
    subsystem: 'FOD pick-up & suspension',
    discipline: 'Mechanical Engineering (Minor in Innovation and Design programme)',
    matric: 'A0308285Y',
    portrait: asukaPortrait,
    focus: '50% 35%',
    docs: [
      { label: 'Suspension', route: '/members/asuka/suspension' },
      { label: 'Vacuum Module', route: '/members/asuka/vacuum-module' },
      { label: 'FOD Sweep Box', route: '/members/asuka/fod-sweep-box-v2' }
    ],
    social: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/takeuchiasuka' },
      { label: 'Instagram', href: 'https://www.instagram.com/akasu.jpg?stkn=anJpNHZ4b2Zxdnd0' }
    ]
  },
  {
    id: 'zacarias',
    name: 'Zacarias Eleazar Ng Han En',
    shortName: 'Zacarias Ng',
    role: 'Mechanical',
    subsystem: 'Chassis design & differential drive kinematics',
    discipline: 'Mechanical Engineering',
    matric: 'A0308821B',
    portrait: zacariasPortrait,
    focus: '50% 45%',
    docs: [
      { label: 'Chassis Design', route: '/members/zacarias/chassis-design' },
      { label: 'FEA Simulation', route: '/members/zacarias/fea-simulation' },
      { label: 'Material Selection', route: '/members/zacarias/material-selection' }
    ],
    // LinkedIn left out until Zacarias's own profile URL is known.
    social: [{ label: 'Instagram', href: 'https://www.instagram.com/zacarias.eleazar?stkn=MWEzaTE4aWlmNGY4Mg==' }]
  },
  {
    id: 'gabriel',
    name: 'Gabriel Tan Kai Jie',
    shortName: 'Gabriel Tan',
    role: 'Computer vision',
    subsystem: 'Computer vision & sensor fusion',
    discipline: 'Electrical Engineering',
    matric: 'A0308452H',
    portrait: gabrielPortrait,
    focus: '50% 35%',
    docs: [
      { label: 'STM32 Hardware', route: '/members/gabriel/stm32-hardware' },
      { label: 'STM32 Firmware', route: '/members/gabriel/stm32-firmware' },
      { label: 'Sensor Fusion', route: '/members/gabriel/sensor-fusion' },
      { label: 'Vision Calculations', route: '/members/gabriel/vision-calculations' },
      { label: 'Vision Research', route: '/members/gabriel/vision-research' },
      { label: 'YOLO Comparison', route: '/members/gabriel/yolo-comparison' }
    ],
    // LinkedIn left out until Gabriel's own profile URL is known.
    social: [{ label: 'Instagram', href: 'https://www.instagram.com/disgusting_sparkling_water?stkn=MWFycnFtMW0wYnN4Mg==' }]
  },
  {
    id: 'bryan',
    name: 'Bryan Ng Rui Jie',
    shortName: 'Bryan Ng',
    role: 'Electrical',
    subsystem: 'Electrical system & charging dock',
    discipline: 'Mechanical Engineering (Robotics Specialisation)',
    matric: 'A0301661R',
    portrait: bryanPortrait,
    focus: '48% 50%',
    docs: [
      { label: 'Components & BOM', route: '/members/bryan/components-bom' },
      { label: 'Power Calculations', route: '/members/bryan/power-calculations' }
    ],
    social: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/bryan-ng-rj' },
      { label: 'Instagram', href: 'https://www.instagram.com/bryann_nrj?stkn=NnY2YTJ1ZWJtbXpn' }
    ]
  }
]

export const memberById = (id: string) => team.find((m) => m.id === id)
