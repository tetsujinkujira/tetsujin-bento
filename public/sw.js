// Service Worker for 手作り弁当喰楽部 鉄人
const CACHE_NAME = 'tetsujin-bento-v1';
const BASE_PATH = '/tetsujin-bento';

// キャッシュするファイル
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/menu.html`,
  `${BASE_PATH}/order.html`,
  `${BASE_PATH}/area.html`,
  `${BASE_PATH}/about.html`,
  `${BASE_PATH}/manifest.json`
];

// インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('キャッシュの追加に失敗:', error);
      })
  );
  // 即座にアクティブ化
  self.skipWaiting();
});

// アクティベート時（古いキャッシュを削除）
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

// フェッチ時（ネットワークファースト、失敗時はキャッシュ）
self.addEventListener('fetch', (event) => {
  // 外部リソースはスキップ
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したらキャッシュを更新
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから
        return caches.match(event.request);
      })
  );
});
