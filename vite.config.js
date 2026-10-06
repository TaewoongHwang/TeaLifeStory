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
      includeAssets: ['icons/*.png', 'icons/tea.svg'],
      manifest: {
        id: base,
        name: 'Tea Life Story',
        short_name: 'Tea Story',
        description: '차 한 잔에 담긴 향과 마음, 나만의 이야기를 남겨요.',
        lang: 'ko',
        start_url: base,
        scope: base,
        display: 'standalone',
        theme_color: '#743f32',
        background_color: '#f4ece2',
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${base}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
