import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const API_TARGET = process.env.API_TARGET || 'http://localhost:8000';
const WS_TARGET  = process.env.WS_TARGET  || 'ws://localhost:8000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        autoRewrite: true,
      },
      '/ws': {
        target: WS_TARGET,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
