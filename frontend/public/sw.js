// Service Worker - Cache Invalidation
const CACHE_VERSION = Date.now().toString();
const CACHE_NAME = `bxc-boletos-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  console.log('🔄 SW: Installing new version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Sempre buscar da rede, nunca do cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('🔄 SW: Activating new version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ SW: Deleting old cache on activate', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
