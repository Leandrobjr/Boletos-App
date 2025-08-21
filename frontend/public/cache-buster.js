// Cache Buster - Força invalidação completa
console.log('🔄 CACHE BUSTER LOADED - Version:', Date.now());

// Força reload se detectar versão antiga
if (localStorage.getItem('app_version') !== Date.now().toString()) {
  localStorage.setItem('app_version', Date.now().toString());
  console.log('🔄 FORCING CACHE INVALIDATION');
  
  // Limpar todos os caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log('🗑️ Cache deleted:', name);
      });
    });
  }
  
  // Força reload da página
  setTimeout(() => {
    window.location.reload(true);
  }, 1000);
}
