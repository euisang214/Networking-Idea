import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'frontend',  // ← Tell Vite that frontend/ is the source root
  server: {
    host: '0.0.0.0',
    port: 3000,  // ← Changed from 80 to avoid permission issues
    strictPort: false,
  },
  build: {
    outDir: '../dist'  // ← Build output relative to root
  },
  envPrefix: 'REACT_APP_'
})