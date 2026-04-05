import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// HAMMER_FIX_VERSION: 1.0.4 - Force-silencing chunk warnings and ensuring Vercel awareness.

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
