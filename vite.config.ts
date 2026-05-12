import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GITHUB_ACTIONS='true' y GITHUB_REPOSITORY='owner/repo' los inyecta
// GitHub Actions automáticamente — no se necesita ninguna variable custom.
const enCI = process.env.GITHUB_ACTIONS === 'true';
const repo  = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const base  = enCI && repo ? `/${repo}/` : '/';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
  },
})
