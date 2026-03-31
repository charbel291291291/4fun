import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'eyedeaz internal system',
          short_name: 'eyedeaz',
          description: 'Agency Management System',
          theme_color: '#0a0a0a',
          background_color: '#0a0a0a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'https://i.ibb.co/vYvH6yR/eyedeaz-logo.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'https://i.ibb.co/vYvH6yR/eyedeaz-logo.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'https://i.ibb.co/vYvH6yR/eyedeaz-logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // Cache strategy for external images
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/i\.ibb\.co\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'external-images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Cache Google Fonts
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':    ['react', 'react-dom'],
            'vendor-motion':   ['motion'],
            'vendor-recharts': ['recharts'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ui':       ['lucide-react', 'clsx', 'tailwind-merge'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
