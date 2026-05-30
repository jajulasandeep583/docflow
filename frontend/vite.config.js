import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import frappeui from 'frappe-ui/vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Frappe serves this app from:
//   HTML  -> /docflow              (docflow/www/docflow.html)
//   assets-> /assets/docflow/frontend/...
const BASE = '/assets/docflow/frontend/'

export default defineConfig({
  base: BASE,
  plugins: [
    // Official Frappe plugin: dev proxy to the bench, Lucide icon resolution
    // (~icons/lucide/*), Jinja boot-data + CSRF token injection, and the
    // production build output (writes docflow/www/docflow.html).
    frappeui({
      frontendRoute: '/docflow',
      buildConfig: {
        outDir: path.resolve(__dirname, '../docflow/public/frontend'),
        baseUrl: BASE,
        indexHtmlPath: path.resolve(__dirname, '../docflow/www/docflow.html'),
        emptyOutDir: true,
      },
    }),
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'DocFlow',
        short_name: 'DocFlow',
        description: 'A mobile-friendly view of your Frappe DocTypes',
        start_url: '/docflow',
        scope: '/docflow',
        display: 'standalone',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [
          { src: BASE + 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: BASE + 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: BASE + 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: null,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2018',
  },
})
