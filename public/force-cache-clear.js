// 🧹 SCRIPT DE LIMPEZA DE CACHE AGRESSIVA
// Para usar: adicione ?force_clear=true na URL

(function() {
  'use strict';
  
  // Verificar se deve forçar limpeza
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('force_clear') === 'true') {
    console.log('🧹 FORÇANDO LIMPEZA DE CACHE AGRESSIVA...');
    
    // Limpar todos os tipos de cache
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        cacheNames.forEach(function(cacheName) {
          caches.delete(cacheName);
        });
        console.log('🗑️ Service Workers cache limpo');
      });
    }
    
    // Limpar localStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('🗑️ Local/Session Storage limpo');
    
    // Limpar cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log('🗑️ Cookies limpos');
    
    // Forçar reload sem cache
    setTimeout(() => {
      window.location.href = window.location.href.split('?')[0] + '?timestamp=' + Date.now();
    }, 1000);
  }
  
  // Adicionar timestamp único a todos os scripts
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(script => {
    if (script.src.includes('index-')) {
      const newSrc = script.src + '?v=' + Date.now();
      script.src = newSrc;
      console.log('🔄 Script atualizado:', newSrc);
    }
  });
  
})(); 