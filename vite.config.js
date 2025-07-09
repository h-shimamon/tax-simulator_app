import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  // optimizeDepsを削除し、↓ のssr設定を追加
  ssr: {
    noExternal: ['@vercel/analytics/react'],
  },
})