import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 自动更新 Service Worker
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Kaoyan Master',
        short_name: 'Kaoyan Master',
        description: 'Gemini 作文练习网站 - 跨平台 PWA 应用',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // 使用 NetworkFirst 策略，优先从网络获取最新内容
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // HTML 文件使用 NetworkFirst，确保获取最新版本
            urlPattern: /\.(?:html)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          },
          {
            // JS/CSS 文件使用 NetworkFirst，但缓存时间较短
            urlPattern: /\.(?:js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ],
        // 跳过等待，立即激活新的 Service Worker
        skipWaiting: true,
        clientsClaim: true
      },
      injectRegister: 'auto',
      // 开发时禁用 PWA，避免缓存问题
      devOptions: {
        enabled: false
      }
    })
  ],
  build: {
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})

