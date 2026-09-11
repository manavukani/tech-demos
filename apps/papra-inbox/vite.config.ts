import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // pdfjs-dist ships an ESM worker; letting Vite pre-bundle it breaks the
    // `?url` worker import, so exclude it from the dep optimizer.
    exclude: ['pdfjs-dist'],
  },
})
