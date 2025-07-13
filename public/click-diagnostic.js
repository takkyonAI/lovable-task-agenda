// 🔧 SCRIPT DE DIAGNÓSTICO DE CLIQUES
// Execute este script no console do navegador quando estiver logado como Tatiana
// Para executar: copie todo este código e cole no console do Chrome

(function() {
  console.log('🔧 INICIANDO DIAGNÓSTICO DE CLIQUES PARA TATIANA');
  
  // 1. Verificar informações do usuário
  const checkUserInfo = () => {
    console.log('👤 INFORMAÇÕES DO USUÁRIO:');
    console.log('- Email:', localStorage.getItem('userEmail') || 'Não encontrado');
    console.log('- User ID:', localStorage.getItem('userId') || 'Não encontrado');
    console.log('- Session:', localStorage.getItem('supabase.auth.token') ? 'Ativa' : 'Não ativa');
    
    // Verificar se há dados do Supabase
    const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
    console.log('- Chaves Supabase:', supabaseKeys);
  };
  
  // 2. Verificar erros JavaScript
  const checkJSErrors = () => {
    console.log('❌ VERIFICANDO ERROS JAVASCRIPT:');
    
    window.addEventListener('error', (e) => {
      console.error('🚨 ERRO GLOBAL:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error
      });
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      console.error('🚨 PROMISE REJEITADA:', e.reason);
    });
  };
  
  // 3. Testar event listeners
  const testEventListeners = () => {
    console.log('🖱️ TESTANDO EVENT LISTENERS:');
    
    // Criar botão de teste
    const testBtn = document.createElement('button');
    testBtn.textContent = 'TESTE CLIQUE';
    testBtn.style.cssText = `
      position: fixed;
      top: 50px;
      right: 20px;
      z-index: 99999;
      background: #ff0000;
      color: white;
      padding: 15px;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
    `;
    
    let clicks = 0;
    testBtn.addEventListener('click', () => {
      clicks++;
      console.log(`✅ CLIQUE ${clicks} FUNCIONOU!`);
      testBtn.textContent = `CLIQUE ${clicks}`;
    });
    
    document.body.appendChild(testBtn);
    
    // Remover após 10 segundos
    setTimeout(() => {
      testBtn.remove();
      console.log('🔧 Teste de clique finalizado');
    }, 10000);
  };
  
  // 4. Verificar elementos que podem estar bloqueando cliques
  const checkBlockingElements = () => {
    console.log('🎯 VERIFICANDO ELEMENTOS BLOQUEADORES:');
    
    // Verificar elementos com z-index alto
    const allElements = document.querySelectorAll('*');
    const highZIndexElements = [];
    
    allElements.forEach(el => {
      const zIndex = window.getComputedStyle(el).zIndex;
      if (zIndex !== 'auto' && parseInt(zIndex) > 1000) {
        highZIndexElements.push({
          element: el,
          zIndex: zIndex,
          className: el.className,
          id: el.id
        });
      }
    });
    
    console.log('- Elementos com z-index alto:', highZIndexElements);
    
    // Verificar overlays invisíveis
    const invisibleOverlays = [];
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'absolute') {
        const rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) {
          invisibleOverlays.push({
            element: el,
            opacity: style.opacity,
            visibility: style.visibility,
            display: style.display,
            className: el.className
          });
        }
      }
    });
    
    console.log('- Possíveis overlays invisíveis:', invisibleOverlays);
  };
  
  // 5. Verificar componentes React
  const checkReactComponents = () => {
    console.log('⚛️ VERIFICANDO COMPONENTES REACT:');
    
    // Verificar se há componentes com erro
    const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
    console.log('- Error boundaries encontrados:', errorBoundaries.length);
    
    // Verificar botões que deveriam funcionar
    const buttons = document.querySelectorAll('button');
    console.log('- Total de botões na página:', buttons.length);
    
    buttons.forEach((btn, index) => {
      const hasClickListener = btn.onclick !== null || btn.addEventListener;
      console.log(`- Botão ${index + 1}:`, {
        text: btn.textContent?.trim(),
        disabled: btn.disabled,
        className: btn.className,
        hasClickListener: !!btn.onclick
      });
    });
  };
  
  // 6. Verificar console logs existentes
  const checkConsoleLogs = () => {
    console.log('📝 VERIFICANDO LOGS EXISTENTES:');
    
    // Interceptar console.log para capturar logs do sistema
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('🔧')) {
        console.log('📋 LOG DO SISTEMA DETECTADO:', ...args);
      }
      originalLog.apply(console, args);
    };
  };
  
  // 7. Executar todos os testes
  const runAllTests = () => {
    console.log('🚀 EXECUTANDO TODOS OS TESTES...');
    
    checkUserInfo();
    checkJSErrors();
    checkBlockingElements();
    checkReactComponents();
    checkConsoleLogs();
    
    setTimeout(() => {
      testEventListeners();
    }, 1000);
    
    console.log('✅ DIAGNÓSTICO COMPLETO - Verifique os logs acima');
    console.log('💡 Se o botão vermelho de teste não funcionar, o problema é de event listeners globais');
    console.log('💡 Se funcionar, o problema é específico dos componentes React');
  };
  
  // Executar diagnóstico
  runAllTests();
  
  // Adicionar função global para re-executar
  window.runClickDiagnostic = runAllTests;
  console.log('💡 Para executar novamente, digite: runClickDiagnostic()');
})(); 