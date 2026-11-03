import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Offline: every built file (code, fonts, audio, the intro video) is precached on the first visit.
    // Registration is manual (src/offline.ts) so the desktop build (Tauri) can skip the service worker.
    VitePWA({
      injectRegister: null,
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/icon.svg'],
      manifest: {
        name: 'PP.game — Space Mission Design',
        short_name: 'PP.game',
        description: 'Design, launch and fly space missions with real physics, money and investors.',
        theme_color: '#0b1026',
        background_color: '#020617',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3,mp4,vtt,webmanifest}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
})
