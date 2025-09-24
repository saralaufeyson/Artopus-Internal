// frontend/vite.config.ts (or vite.config.js if you chose JavaScript)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Frontend will run on port 3000
    proxy: {
      '/api': { // Any request starting with /api will be proxied
        target: 'http://localhost:5000', // Your backend server
        changeOrigin: true, // Needed for virtual hosted sites
        // rewrite: (path) => path.replace(/^\/api/, ''), // Optional: remove /api prefix if backend doesn't expect it
      }
    }
  }
})