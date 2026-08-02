import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // escuta em todas as interfaces e aceita qualquer host, para funcionar
    // atrás de túnel público (cloudflared/ngrok) durante os testes
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
