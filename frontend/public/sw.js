// Service Worker - Cache Invalidation FORÇADA
const CACHE_VERSION = 'v3-' + Date.now().toString();
const CACHE_NAME = `bxc-boletos-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  console.log('🔄 SW: Installing new version', CACHE_VERSION);
  // Forçar ativação imediata
  self.skipWaiting();
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('🗑️ SW: Deleting ALL old cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NÃO interceptar requisições externas (Firebase, APIs, etc)
  if (url.origin !== location.origin) {
    return; // Deixar o navegador lidar com requisições externas
  }
  
  // NÃO interceptar requisições de API
  if (url.pathname.startsWith('/api/')) {
    return; // Deixar o navegador lidar com APIs
  }
  
  // Para recursos locais (JS, CSS, HTML), sempre buscar da rede
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store'
    }).catch(() => {
      // Só usar cache em caso de falha de rede
      return caches.match(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('🔄 SW: Activating new version', CACHE_VERSION);
  // Tomar controle imediato de todas as páginas
  event.waitUntil(
    clients.claim().then(() => {
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ SW: Deleting ALL cache on activate', cacheName);
            return caches.delete(cacheName);
          })
        );
      });
    })
  );
});
