import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const enCI = process.env.GITHUB_ACTIONS === 'true';
const repo  = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const base  = enCI && repo ? `/${repo}/` : '/';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PreventaPG — Plásticos Guerrero',
        short_name: 'PreventaPG',
        description: 'Catálogo de pedidos para Plásticos Guerrero',
        theme_color: '#1a3a6b',
        background_color: '#1a3a6b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\.xlsx$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'excel-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  base,
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
  },
})
