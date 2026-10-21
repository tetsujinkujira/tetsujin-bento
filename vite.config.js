import { defineConfig } from 'vite'
import { contentPlugin } from './scripts/text-content.mjs'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

// ビルド後にsw.jsのタイムスタンプを更新するプラグイン
function swVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = resolve(import.meta.dirname, 'dist/sw.js')
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
  base: '/',
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'src/index.html'),
        menu: resolve(import.meta.dirname, 'src/menu.html'),
        order: resolve(import.meta.dirname, 'src/order.html'),
        area: resolve(import.meta.dirname, 'src/area.html'),
        about: resolve(import.meta.dirname, 'src/about.html'),
        recruit: resolve(import.meta.dirname, 'src/recruit.html'),
        legal: resolve(import.meta.dirname, 'src/legal.html'),
        privacy: resolve(import.meta.dirname, 'src/privacy.html'),
        notFound: resolve(import.meta.dirname, 'src/404.html'),
      }
    }
  },
  plugins: [contentPlugin(), swVersionPlugin(), {
    name: 'security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [{ tag: 'meta', attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.tile.openstreetmap.org; frame-src https://maps.google.com https://www.google.com; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"
        }, injectTo: 'head-prepend' }, { tag: 'meta', attrs: {
          name: 'referrer', content: 'strict-origin-when-cross-origin'
        }, injectTo: 'head-prepend' }]
      }
    }
  }],
  server: {
    open: true
  }
})
