import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ mode }) => ({
  define: {
    'import.meta.env.VITE_SITE_INDEXABLE': JSON.stringify(
      process.env.VERCEL_ENV === 'preview' ||
        loadEnv(mode, process.cwd(), '').VITE_SITE_INDEXABLE === 'false'
        ? 'false'
        : 'true',
    ),
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))

export default config
