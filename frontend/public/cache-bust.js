// Cache Busting Script v2.0
console.log('🔄 CACHE BUSTING ATIVO - Forçando refresh completo');

// 1. Clear localStorage
try {
  localStorage.clear();
  console.log('✅ localStorage limpo');
} catch (e) {
  console.warn('⚠️ Erro ao limpar localStorage:', e);
}

// 2. Clear sessionStorage  
try {
  sessionStorage.clear();
  console.log('✅ sessionStorage limpo');
} catch (e) {
  console.warn('⚠️ Erro ao limpar sessionStorage:', e);
}

// 3. Clear IndexedDB if available
if ('indexedDB' in window) {
  try {
    indexedDB.deleteDatabase('firebaseLocalStorageDb');
    console.log('✅ IndexedDB limpo');
  } catch (e) {
    console.warn('⚠️ Erro ao limpar IndexedDB:', e);
  }
}

// 4. Force reload with no-cache
setTimeout(() => {
  console.log('🔄 Forçando reload sem cache...');
  location.reload(true);
}, 1000);
