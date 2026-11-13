/// <reference types="vite/client" />
/// <reference types="vitepress/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module 'node:fs' {
  const fs: any
  export default fs
}

declare module 'node:path' {
  const path: any
  export default path
}

declare module 'node:url' {
  export function fileURLToPath(url: any): string
  export const URL: any
}

declare var process: any
