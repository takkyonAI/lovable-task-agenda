// 🔄 Script para forçar limpeza de cache
console.log('🔄 FORÇANDO LIMPEZA DE CACHE...');

// Limpar localStorage
try {
    localStorage.clear();
    console.log('✅ LocalStorage limpo');
} catch (e) {
    console.warn('⚠️ Erro ao limpar localStorage:', e);
}

// Limpar sessionStorage
try {
    sessionStorage.clear();
    console.log('✅ SessionStorage limpo');
} catch (e) {
    console.warn('⚠️ Erro ao limpar sessionStorage:', e);
}

// Forçar reload com cache busting
const timestamp = Date.now();
const currentUrl = window.location.href;
const separator = currentUrl.includes('?') ? '&' : '?';
const newUrl = `${currentUrl}${separator}cache_bust=${timestamp}`;

console.log('🔄 Redirecionando com cache busting:', newUrl);

// Aguardar um pouco e recarregar
setTimeout(() => {
    window.location.href = newUrl;
}, 1000);

console.log('✅ Script de limpeza de cache executado'); 