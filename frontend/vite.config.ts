import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow external access
    allowedHosts: [
      'localhost',
      '.ngrok-free.dev', // Allow all ngrok free tier domains
      '.ngrok.io',       // Allow all ngrok domains
      '.trycloudflare.com', // Allow all Cloudflare Tunnel domains
    ],
  },
})
