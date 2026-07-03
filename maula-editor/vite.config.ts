import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3104,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3204',
        changeOrigin: true,
      },
    }
  },
  preview: {
    port: 3104,
    host: '0.0.0.0',
    allowedHosts: ["editor.mumtaz.ai", "editor.mumtaz.ai"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@shared': path.resolve(__dirname, '../../shared'),
    }
  }
});
