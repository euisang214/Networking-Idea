import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 80,
    strictPort: true,
    hmr: {
      port: 24678,
      host: '0.0.0.0'
    }
  },
  build: {
    outDir: 'dist'
  },
  envPrefix: 'REACT_APP_'
})