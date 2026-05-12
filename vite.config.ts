import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // En local: base='/'  |  En GitHub Pages: base='/nombre-repo/'
  base: process.env.VITE_BASE_PATH ?? '/',
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
  },
})
