import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: parseInt(env.FRONTEND_INTERNAL_PORT) || 80
    },
    build: {
      outDir: 'dist'
    }
  }
})