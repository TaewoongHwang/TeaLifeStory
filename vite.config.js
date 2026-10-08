import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { normalizeBase } from './src/config/base.js'

// Override for a project Pages URL: VITE_BASE_PATH=/repository-name/
const requestedBase = process.env.VITE_BASE_PATH || '/'
const base = normalizeBase(requestedBase)

export default defineConfig({
  base,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/chagok-*.png', 'images/*.webp'],
      manifest: {
        id: base,
        name: '차곡차곡',
        short_name: '차곡차곡',
        description: '차 한 잔에 담긴 향과 마음을 차곡차곡 쌓아요.',
        lang: 'ko',
        start_url: base,
        scope: base,
        display: 'standalone',
        theme_color: '#743f32',
        background_color: '#f4ece2',
        icons: [
          { src: `${base}icons/chagok-icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icons/chagok-icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${base}icons/chagok-icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp,webmanifest}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
