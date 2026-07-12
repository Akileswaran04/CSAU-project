import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Allow LAN/phone access — binds to 0.0.0.0 so other devices
  // on the same network can reach the dev server by your machine's IP.
  server: {
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'Riddle Rush',
        short_name: 'Riddle Rush',
        description:
          'Challenge your friends in a fast-paced trivia race. Solve riddles, roll the dice, and race to the finish!',
        start_url: '/',
        lang: 'en',
        theme_color: '#4C8DFF',
        background_color: '#0B0E13',
        display: 'standalone',
        orientation: 'any',
        categories: ['games', 'entertainment', 'trivia'],
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,ico}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB (bundle is ~2.36 MB)
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /\.(?:glb|gltf)(\?.*)?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'models-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern:
              /^https?:\/\/api\.fontshare\.com\/.*$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'fontshare-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern:
              /^https?:\/\/fonts\.googleapis\.com\/.*$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
})
