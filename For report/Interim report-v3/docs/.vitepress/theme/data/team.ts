/// <reference path="../../env.d.ts" />
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
import hilbertPortrait from '../../../report/members/hilbert/assets/images/hilbert-portrait.jpg'
import asukaPortrait from '../../../report/members/asuka/assets/images/asuka-portrait.jpg'
import zacariasPortrait from '../../../report/members/zacarias/assets/images/zacarias-portrait.jpg'
import gabrielPortrait from '../../../report/members/gabriel/assets/images/gabriel-portrait.jpg'
import bryanPortrait from '../../../report/members/bryan/assets/images/bryan-portrait.jpg'

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
      { label: 'Communications', route: '/members/hilbert/communications' },
      { label: 'Simulation', route: '/members/hilbert/simulation' },
      { label: 'Motor Drivetrain Calculations', route: '/members/hilbert/motor-drivetrain-calculation' },
      { label: 'Steering Kinematics', route: '/members/hilbert/steering-kinematics' },
      { label: 'Semester 2 Plan', route: '/members/hilbert/semester-2-plan' }
    ],
    social: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hilbert-soh' },
      { label: 'Instagram', href: 'https://www.instagram.com/ollie_soh' }
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
      { label: 'Semester 2 Plan', route: '/members/asuka/semester-2-plan' }
    ],
    social: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/takeuchiasuka' },
      { label: 'Instagram', href: 'https://www.instagram.com/akasu.jpg' }
    ]
  },
  {
    id: 'zacarias',
    name: 'Zacarias Eleazar Ng Han En',
    shortName: 'Zacarias Ng',
    role: 'Mechanical',
    subsystem: 'Chassis design & FEA structural simulation',
    discipline: 'Mechanical Engineering',
    matric: 'A0306899H',
    portrait: zacariasPortrait,
    focus: '50% 45%',
    docs: [
      { label: 'Chassis Design', route: '/members/zacarias/chassis-design' },
      { label: 'FEA Simulation', route: '/members/zacarias/fea-simulation' },
      { label: 'Material Selection', route: '/members/zacarias/material-selection' },
      { label: 'Semester 2 Plan', route: '/members/zacarias/semester-2-plan' }
    ],
    // LinkedIn left out until Zacarias's own profile URL is known.
    social: [{ label: 'Instagram', href: 'https://www.instagram.com/zacarias.eleazar' }]
  },
  {
    id: 'gabriel',
    name: 'Gabriel Tan Kai Jie',
    shortName: 'Gabriel Tan',
    role: 'Computer vision & embedded systems',
    subsystem: 'Computer vision, sensor fusion & STM32 firmware',
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
      { label: 'YOLO Comparison', route: '/members/gabriel/yolo-comparison' },
      { label: 'Semester 2 Plan', route: '/members/gabriel/semester-2-plan' }
    ],
    // LinkedIn left out until Gabriel's own profile URL is known.
    social: [{ label: 'Instagram', href: 'https://www.instagram.com/disgusting_sparkling_water' }]
  },
  {
    id: 'bryan',
    name: 'Bryan Ng Rui Jie',
    shortName: 'Bryan Ng',
    role: 'Electrical',
    subsystem: '48V power distribution & electrical architecture',
    discipline: 'Mechanical Engineering (Robotics Specialisation)',
    matric: 'A0301661R',
    portrait: bryanPortrait,
    focus: '48% 50%',
    docs: [
      { label: 'Components List', route: '/members/bryan/components-list' },
      { label: 'Power Calculations', route: '/members/bryan/power-calculations' },
      { label: 'Semester 2 Plan', route: '/members/bryan/semester-2-plan' }
    ],
    social: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/bryan-ng-rj' },
      { label: 'Instagram', href: 'https://www.instagram.com/bryann_nrj' }
    ]
  }
]

export const memberById = (id: string) => team.find((m) => m.id === id)
