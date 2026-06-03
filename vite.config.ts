/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const enCI = process.env.GITHUB_ACTIONS === 'true';
const repo  = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const base  = enCI && repo ? `/${repo}/` : '/';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['node_modules', 'dist'],
  },
})
