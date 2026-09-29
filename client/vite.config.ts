import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    strictPort: true, // fail clearly instead of silently switching port
    // During development, any request to /api is forwarded to our backend server.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
