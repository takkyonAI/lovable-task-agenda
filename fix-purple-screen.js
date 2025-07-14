// 🔧 CORREÇÃO ULTRA-ROBUSTA PARA TELA ROXA
// Este script intercepta erros DOM e força limpeza de estilos roxos

console.log('🔧 INICIANDO CORREÇÃO ULTRA-ROBUSTA PARA TELA ROXA');

// 🛡️ Interceptar erro DOM específico e forçar limpeza
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorMessage = args[0];
  
  // Detectar erro DOM específico
  if (typeof errorMessage === 'string' && errorMessage.includes('removeChild')) {
    console.warn('🔧 ERRO DOM DETECTADO - FORÇANDO LIMPEZA DE TELA ROXA');
    
    // Forçar limpeza imediata
    setTimeout(() => {
      forcePurpleScreenCleanup();
    }, 100);
  }
  
  // Chamar console.error original
  originalConsoleError.apply(console, args);
};

// 🧹 Função para limpeza forçada de tela roxa
function forcePurpleScreenCleanup() {
  console.log('🧹 EXECUTANDO LIMPEZA FORÇADA DE TELA ROXA');
  
  // 1. Limpar body
  const body = document.body;
  if (body) {
    body.style.background = '';
    body.style.backgroundColor = '';
    body.classList.remove('bg-purple-600', 'bg-purple-500', 'bg-purple-700');
    console.log('✅ Body limpo de estilos roxos');
  }
  
  // 2. Limpar html
  const html = document.documentElement;
  if (html) {
    html.style.background = '';
    html.style.backgroundColor = '';
    html.classList.remove('bg-purple-600', 'bg-purple-500', 'bg-purple-700');
    console.log('✅ HTML limpo de estilos roxos');
  }
  
  // 3. Limpar container principal
  const mainContainer = document.querySelector('.min-h-screen');
  if (mainContainer) {
    mainContainer.classList.remove('bg-purple-600', 'bg-purple-500', 'bg-purple-700');
    console.log('✅ Container principal limpo');
  }
  
  // 4. Limpar todos os elementos com fundo roxo incorreto
  const purpleElements = document.querySelectorAll('*');
  let cleanedCount = 0;
  
  purpleElements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    const bgColor = computedStyle.backgroundColor;
    
    // Verificar se tem cor roxa incorreta
    if (bgColor.includes('147, 51, 234') || // purple-600
        bgColor.includes('168, 85, 247') || // purple-500
        bgColor.includes('126, 34, 206')) { // purple-700
      
      // Verificar se não é um elemento que deveria ter roxo
      const isValidPurple = el.hasAttribute('data-state') && el.getAttribute('data-state') === 'active';
      const isTabTrigger = el.classList.contains('data-[state=active]:bg-purple-600');
      
      if (!isValidPurple && !isTabTrigger) {
        el.style.backgroundColor = '';
        el.style.background = '';
        el.classList.remove('bg-purple-600', 'bg-purple-500', 'bg-purple-700');
        cleanedCount++;
        console.log(`🧹 Elemento limpo: ${el.tagName}.${el.className}`);
      }
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`✅ ${cleanedCount} elementos com fundo roxo incorreto foram limpos`);
  }
  
  // 5. Verificar se ainda há problemas
  setTimeout(() => {
    const bodyStyle = window.getComputedStyle(document.body);
    const hasIncorrectPurple = bodyStyle.backgroundColor.includes('147, 51, 234') || 
                               bodyStyle.backgroundColor.includes('168, 85, 247') || 
                               bodyStyle.backgroundColor.includes('126, 34, 206');
    
    if (hasIncorrectPurple) {
      console.warn('⚠️ TELA AINDA ROXA APÓS LIMPEZA - APLICANDO CORREÇÃO EXTREMA');
      
      // Correção extrema: forçar CSS inline
      const style = document.createElement('style');
      style.textContent = `
        html, body {
          background-color: transparent !important;
          background: transparent !important;
        }
        .min-h-screen {
          background: linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 50%, rgb(15, 23, 42) 100%) !important;
        }
        /* Preservar roxo apenas para abas ativas */
        [data-state="active"] {
          background-color: rgb(147, 51, 234) !important;
        }
      `;
      document.head.appendChild(style);
      console.log('🔧 CSS de correção extrema aplicado');
    } else {
      console.log('✅ Tela roxa corrigida com sucesso');
    }
  }, 200);
}

// 🔄 Executar limpeza inicial
setTimeout(() => {
  forcePurpleScreenCleanup();
}, 1000);

// 🎯 Interceptar mudanças de filtro
const originalSetAttribute = Element.prototype.setAttribute;
Element.prototype.setAttribute = function(name, value) {
  const result = originalSetAttribute.call(this, name, value);
  
  // Detectar mudanças que podem causar tela roxa
  if (name === 'class' && this.classList.contains('bg-purple-600')) {
    const isValidPurple = this.hasAttribute('data-state') && this.getAttribute('data-state') === 'active';
    
    if (!isValidPurple) {
      console.warn('🔧 INTERCEPTADO: Tentativa de adicionar bg-purple-600 - executando limpeza');
      setTimeout(() => {
        forcePurpleScreenCleanup();
      }, 50);
    }
  }
  
  return result;
};

// 🔄 Monitorar mudanças DOM
const observer = new MutationObserver((mutations) => {
  let shouldClean = false;
  
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      const target = mutation.target;
      if (target.classList.contains('bg-purple-600') || 
          target.classList.contains('bg-purple-500') || 
          target.classList.contains('bg-purple-700')) {
        
        const isValidPurple = target.hasAttribute('data-state') && target.getAttribute('data-state') === 'active';
        
        if (!isValidPurple) {
          console.warn('🔧 MUTAÇÃO DETECTADA: Classe roxa adicionada - agendando limpeza');
          shouldClean = true;
        }
      }
    }
  });
  
  if (shouldClean) {
    setTimeout(() => {
      forcePurpleScreenCleanup();
    }, 100);
  }
});

// Iniciar observação
observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['class'],
  subtree: true
});

console.log('✅ CORREÇÃO ULTRA-ROBUSTA PARA TELA ROXA INICIALIZADA'); 