/**
 * Motion design tokens. One vocabulary for motion-v (springs), GSAP (eases, durations)
 * and CSS (motion.css mirrors these as custom properties).
 *
 * | Interaction        | Token              | Value                        |
 * | ------------------ | ------------------ | ---------------------------- |
 * | Button press/hover | duration.press/hover | 160 / 180 ms, ease.out     |
 * | Dropdown           | springs.menu       | 260 ms visual, no bounce     |
 * | Card expansion     | springs.card       | 420 ms visual, bounce 0.12   |
 * | Card close         | springs.cardClose  | 360 ms visual, no bounce     |
 * | Page entrance      | duration.page      | 360 ms                       |
 * | Scroll reveal      | duration.reveal    | 550 ms, stagger 60 ms        |
 * | Ambient background | ambient            | 40–90 s loops, < 0.05 Hz     |
 */
import { springs as springParams } from './spring-params.mjs'

export const duration = {
  press: 0.16,
  hover: 0.18,
  dropdown: 0.24,
  card: 0.42,
  page: 0.36,
  reveal: 0.55,
  stagger: 0.06
} as const

/** Cubic-bezier control points (Emil Kowalski / review-animations STANDARDS.md). */
export const ease = {
  out: [0.23, 1, 0.32, 1] as [number, number, number, number],
  inOut: [0.77, 0, 0.175, 1] as [number, number, number, number],
  drawer: [0.32, 0.72, 0, 1] as [number, number, number, number]
}

/** GSAP equivalents of `ease`. */
export const gsapEase = {
  out: 'power3.out',
  inOut: 'power2.inOut'
} as const

type SpringName = keyof typeof springParams
export const spring = Object.fromEntries(
  Object.entries(springParams).map(([k, v]) => [k, { type: 'spring', ...v }])
) as Record<SpringName, { type: 'spring'; visualDuration: number; bounce: number }>

/** Ambient background: slow enough to stay below ~0.05 Hz (apple-design §14). */
export const ambient = {
  topoSpeed: 0.035,
  maxFps: 30
} as const
