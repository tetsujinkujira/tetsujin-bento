import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        menu: resolve(__dirname, 'src/menu.html'),
        order: resolve(__dirname, 'src/order.html'),
        area: resolve(__dirname, 'src/area.html'),
        about: resolve(__dirname, 'src/about.html'),
        recruit: resolve(__dirname, 'src/recruit.html'),
        legal: resolve(__dirname, 'src/legal.html'),
      }
    }
  },
  server: {
    open: true
  }
})
