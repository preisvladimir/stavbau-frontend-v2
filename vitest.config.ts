// vitest.config.ts (v rootu projektu)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(), // načte "paths" z tsconfig.json
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // pevné mapování pro jistotu
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    css: true,
  },
})
