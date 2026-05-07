import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mapboxDemo: resolve(__dirname, 'mapbox-demo.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,  // Auto-open browser on dev start
  },
})
