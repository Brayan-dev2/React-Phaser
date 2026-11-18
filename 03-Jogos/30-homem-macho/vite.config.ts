import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O preview do Arena entra por um host proxied (https://<porta>-<id>.e2b.app).
// `allowedHosts: true` libera esse host; sem isso o dev server responde 403 e o iframe não carrega.
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, strictPort: true, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true, allowedHosts: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    // GDD §7.11: o chunk do Phaser é medido separado do JS inicial.
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'], react: ['react', 'react-dom'] },
      },
    },
  },
});
