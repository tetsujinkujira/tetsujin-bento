// Service Worker for 手作り弁当喰楽部 鉄人
// CACHE_VERSION はビルド時に自動更新される
const CACHE_VERSION = '__BUILD_TIMESTAMP__';
const CACHE_NAME = `tetsujin-bento-${CACHE_VERSION}`;
const BASE_PATH = '';

// キャッシュするファイル（静的アセットのみ）
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/menu.html`,
  `${BASE_PATH}/order.html`,
  `${BASE_PATH}/area.html`,
  `${BASE_PATH}/about.html`,
  `${BASE_PATH}/manifest.json`
];

// キャッシュしないパス（常に最新を取得）
const NO_CACHE_PATTERNS = [
  '/data/',   // JSONデータファイル
  'sw.js'     // Service Worker自身
];

// インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開きました:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('キャッシュの追加に失敗:', error);
      })
  );
  // 即座にアクティブ化
  self.skipWaiting();
});

// アクティベート時（古いキャッシュを全て削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 即座にコントロール
  self.clients.claim();
});

// フェッチ時
self.addEventListener('fetch', (event) => {
  // 外部リソースはスキップ
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // キャッシュしないパターンに該当する場合は常にネットワークから取得
  const shouldSkipCache = NO_CACHE_PATTERNS.some(pattern =>
    event.request.url.includes(pattern)
  );

  if (shouldSkipCache) {
    event.respondWith(fetch(event.request));
    return;
  }

  // その他：ネットワークファースト、失敗時はキャッシュ
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
