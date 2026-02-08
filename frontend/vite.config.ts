import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for the React frontend.
 * - Build output: frontend/build (served by NestJS in production)
 * - Dev proxy: /api -> localhost:3000 (backend)
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    pool: 'forks',
  },
  build: {
    outDir: 'build',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
