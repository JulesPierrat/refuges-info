import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Refuges.info',
        short_name: 'Refuges',
        description: "Carte des refuges, cabanes et points d'eau de montagne",
        lang: 'fr',
        theme_color: '#1E6F4C',
        background_color: '#1E6F4C',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallbackDenylist: [/^\/api/, /^\/point_recherche/],
        runtimeCaching: [
          {
            // refuges.info data — fresh when online, falls back to cache offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'refuges-api',
              expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // map tiles (vector/raster/terrain) — cache to limit re-downloads.
            urlPattern: ({ url }) =>
              /tiles|wmts|geopf|geo\.admin|opentopomap|elevation-tiles/.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 600, maxAgeSeconds: 7 * 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    // Proxy API calls to refuges.info in dev to avoid CORS.
    // The app calls `/api/...`; in production set VITE_API_BASE instead.
    proxy: {
      // Read API (GeoJSON) and the server-side search route (/point_recherche).
      '/api': { target: 'https://www.refuges.info', changeOrigin: true, secure: true },
      '/point_recherche': { target: 'https://www.refuges.info', changeOrigin: true, secure: true },
    },
  },
});
