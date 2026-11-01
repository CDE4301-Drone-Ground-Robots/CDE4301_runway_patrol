// Single source of spring parameters, shared by motion-v (tokens.ts) and the
// generated CSS linear() easings (scripts/gen-css-springs.mjs → motion.css).
// Apple default: critically damped (bounce 0). A little bounce only where a
// surface physically "lands" (card expansion), never on menus.
export const springs = {
  ui: { visualDuration: 0.22, bounce: 0 },
  menu: { visualDuration: 0.26, bounce: 0 },
  card: { visualDuration: 0.42, bounce: 0.12 },
  cardClose: { visualDuration: 0.36, bounce: 0 }
}
