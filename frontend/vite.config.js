import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Spring Boot backend (CustomerProductController / facets / categories).
// Override with VITE_API_TARGET at build time, e.g.
//   VITE_API_TARGET=http://192.168.1.10:8080 npm run dev
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Forward every /api/* to the Spring Boot backend.
      // The Vite dev server is on 3000; if you `npm run build`
      // and serve dist/ behind nginx, point /api at the upstream
      // backend in the nginx config instead.
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    // Vite hashes these by default, but we want explicit, stable
    // filenames so we can wire long-cache + immutable in the CDN.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
