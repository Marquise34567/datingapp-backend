import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server proxy for local development. Uses process.env.BACKEND_URL
// when set (e.g. in your shell or npm scripts), otherwise falls back to
// http://localhost:8080 which should match your backend dev server.
export default defineConfig(() => {
  const backend = process.env.BACKEND_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
