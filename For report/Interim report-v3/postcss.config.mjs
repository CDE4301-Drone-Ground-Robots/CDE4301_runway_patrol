import { postcssIsolateStyles } from 'vitepress'

// Makes `class="vp-raw"` work: VitePress's .vp-doc typography (list markers, li spacing,
// heading margins) no longer leaks into Vue components placed inside Markdown.
// base.css is deliberately not isolated: its button/list resets are relied on by the components.
export default {
  plugins: [postcssIsolateStyles({ includeFiles: [/vp-doc\.css/] })]
}
