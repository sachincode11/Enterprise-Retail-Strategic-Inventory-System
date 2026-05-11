import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When running inside the Docker dev container, VITE_BACKEND_URL is set to
// "http://backend:8000" by docker-compose.dev.yml so the Vite proxy can reach
// the FastAPI container by its Docker service name.
// Locally (no Docker) it falls back to 127.0.0.1:8000 — no change needed.
const backendUrl = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Required to accept connections from outside the container
    port: 5173,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        ws: true,
        rewrite: (path) => (path.startsWith('/api/v1') ? path : path.replace(/^\/api/, '/api/v1')),
      },
    },
  },
});
