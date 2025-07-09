import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  // ↓ この optimizeDeps の3行を追加します
  optimizeDeps: {
    include: ['@vercel/analytics/react'],
  },
})