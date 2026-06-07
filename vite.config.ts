import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Proxy API calls to refuges.info in dev to avoid CORS.
    // The app calls `/api/...`; in production set VITE_API_BASE instead.
    proxy: {
      '/api': {
        target: 'https://www.refuges.info',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
