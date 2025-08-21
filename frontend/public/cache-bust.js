// Cache Busting Script v3.0 AGRESSIVO
console.log('🚨 CACHE BUSTING ULTRA AGRESSIVO - LOGS INFINITOS DETECTADOS');

// 1. Clear ALL storage types
try {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Todos os storages limpos');
} catch (e) {
  console.warn('⚠️ Erro ao limpar storages:', e);
}

// 2. Clear IndexedDB
if ('indexedDB' in window) {
  try {
    indexedDB.deleteDatabase('firebaseLocalStorageDb');
    indexedDB.deleteDatabase('keyval-store');
    console.log('✅ IndexedDB limpo');
  } catch (e) {
    console.warn('⚠️ Erro ao limpar IndexedDB:', e);
  }
}

// 3. Clear Service Worker cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}

// 4. Clear browser cache via Cache API
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
  });
}

// 5. Force hard reload with cache bypass
setTimeout(() => {
  console.log('🔄 FORÇANDO RELOAD ULTRA AGRESSIVO...');
  window.location.href = window.location.href + '?cb=' + Date.now();
}, 1500);
