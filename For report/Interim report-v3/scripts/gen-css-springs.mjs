// Regenerates the CSS spring easings in docs/.vitepress/theme/motion.css from the same
// spring parameters as theme/motion/tokens.ts, using Motion's own spring solver.
// Usage: node scripts/gen-css-springs.mjs
import { spring } from 'motion-dom'
import { springs } from '../docs/.vitepress/theme/motion/spring-params.mjs'

for (const [name, p] of Object.entries(springs)) {
  const [duration, ...easing] = String(spring({ keyframes: [0, 1], ...p })).split(' ')
  console.log(`  /* ${name}: visualDuration ${p.visualDuration}s, bounce ${p.bounce} */`)
  console.log(`  --spring-${name}-duration: ${duration};`)
  console.log(`  --spring-${name}: ${easing.join(' ')};`)
}
