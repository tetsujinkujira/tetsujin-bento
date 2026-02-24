import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

// ビルド後にsw.jsのタイムスタンプを更新するプラグイン
function swVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = resolve(__dirname, 'dist/sw.js')
      try {
        let content = readFileSync(swPath, 'utf-8')
        const timestamp = Date.now().toString()
        content = content.replace('__BUILD_TIMESTAMP__', timestamp)
        writeFileSync(swPath, content)
        console.log(`sw.js のキャッシュバージョンを更新: ${timestamp}`)
      } catch (e) {
        // dev時はdistがないのでスキップ
      }
    }
  }
}

export default defineConfig({
  base: '/tetsujin-bento/',
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
        privacy: resolve(__dirname, 'src/privacy.html'),
        notFound: resolve(__dirname, 'src/404.html'),
      }
    }
  },
  plugins: [swVersionPlugin()],
  server: {
    open: true
  }
})
