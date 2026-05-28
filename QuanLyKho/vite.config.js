import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo4.jpg'],
      manifest: {
        name: 'ĂN VẶT NHÀ MƠ - Quản Lý Kho',
        short_name: 'Nhà Mơ Kho',
        description: 'Hệ thống quản lý kho Ăn Vặt Nhà Mơ',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo4.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'logo4.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
})
