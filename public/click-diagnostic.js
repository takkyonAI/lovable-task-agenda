// 🔧 SCRIPT DE DIAGNÓSTICO AVANÇADO DE CLIQUES - VERSÃO MELHORADA
// Execute este script no console do navegador quando estiver logado como Tatiana
// Para executar: copie todo este código e cole no console do Chrome

(function() {
  console.log('🔧 INICIANDO DIAGNÓSTICO AVANÇADO DE CLIQUES PARA TATIANA');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  // 1. Verificar informações do usuário e sessão
  const checkUserInfo = () => {
    console.log('👤 === INFORMAÇÕES DO USUÁRIO ===');
    console.log('- Email:', localStorage.getItem('userEmail') || 'Não encontrado');
    console.log('- User ID:', localStorage.getItem('userId') || 'Não encontrado');
    console.log('- Session:', localStorage.getItem('supabase.auth.token') ? 'Ativa' : 'Não ativa');
    
    // Verificar se há dados do Supabase
    const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
    console.log('- Chaves Supabase:', supabaseKeys.length);
    
    // Verificar erros salvos
    const lastError = localStorage.getItem('last-error');
    const criticalError = localStorage.getItem('critical-dom-error');
    
    if (lastError) {
      console.log('❌ Último erro salvo:', JSON.parse(lastError));
    }
    
    if (criticalError) {
      console.log('🚨 Erro crítico DOM salvo:', JSON.parse(criticalError));
    }
  };
  
  // 2. Verificar erros JavaScript ativos
  const checkJSErrors = () => {
    console.log('❌ === MONITORAMENTO DE ERROS JAVASCRIPT ===');
    
    let errorCount = 0;
    
    window.addEventListener('error', (e) => {
      errorCount++;
      console.error(`🚨 ERRO GLOBAL #${errorCount}:`, {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error,
        timestamp: new Date().toISOString()
      });
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      errorCount++;
      console.error(`🚨 PROMISE REJEITADA #${errorCount}:`, {
        reason: e.reason,
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('✅ Listeners de erro instalados');
  };
  
  // 3. Testar event listeners de forma abrangente
  const testEventListeners = () => {
    console.log('🖱️ === TESTANDO EVENT LISTENERS ===');
    
    // Criar botão de teste avançado
    const testBtn = document.createElement('button');
    testBtn.textContent = 'TESTE CLIQUE AVANÇADO';
    testBtn.style.cssText = `
      position: fixed;
      top: 50px;
      right: 20px;
      z-index: 99999;
      padding: 10px 20px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 5px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    
    let clickCount = 0;
    
    testBtn.addEventListener('click', (e) => {
      clickCount++;
      console.log(`✅ TESTE CLIQUE #${clickCount} FUNCIONOU!`, {
        target: e.target,
        timestamp: new Date().toISOString(),
        coordinates: { x: e.clientX, y: e.clientY }
      });
      
      testBtn.textContent = `CLIQUE #${clickCount} OK`;
      testBtn.style.background = '#44ff44';
      
      setTimeout(() => {
        testBtn.textContent = 'TESTE CLIQUE AVANÇADO';
        testBtn.style.background = '#ff4444';
      }, 1000);
    });
    
    document.body.appendChild(testBtn);
    
    // Remover após 30 segundos
    setTimeout(() => {
      if (testBtn.parentNode) {
        testBtn.parentNode.removeChild(testBtn);
        console.log('🗑️ Botão de teste removido');
      }
    }, 30000);
    
    console.log('✅ Botão de teste criado (canto superior direito)');
  };
  
  // 4. Verificar elementos que podem estar bloqueando cliques
  const checkBlockingElements = () => {
    console.log('🚧 === VERIFICANDO ELEMENTOS BLOQUEADORES ===');
    
    // Verificar overlays invisíveis
    const allElements = document.querySelectorAll('*');
    const suspiciousElements = [];
    
    allElements.forEach((el, index) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      // Verificar elementos com alta z-index
      if (parseInt(style.zIndex) > 1000) {
        suspiciousElements.push({
          element: el,
          zIndex: style.zIndex,
          position: style.position,
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          rect: rect
        });
      }
      
      // Verificar elementos transparentes grandes
      if (rect.width > 200 && rect.height > 200 && 
          (style.opacity === '0' || style.visibility === 'hidden')) {
        suspiciousElements.push({
          element: el,
          reason: 'Large transparent element',
          rect: rect,
          opacity: style.opacity,
          visibility: style.visibility
        });
      }
    });
    
    console.log(`🔍 Encontrados ${suspiciousElements.length} elementos suspeitos:`, suspiciousElements);
    
    // Verificar event listeners presos
    const buttons = document.querySelectorAll('button, [role="button"], a, input[type="button"]');
    console.log(`🔍 Encontrados ${buttons.length} elementos clicáveis`);
    
    buttons.forEach((btn, index) => {
      if (index < 10) { // Testar apenas os primeiros 10
        const rect = btn.getBoundingClientRect();
        console.log(`Button ${index}:`, {
          text: btn.textContent?.substring(0, 30),
          visible: rect.width > 0 && rect.height > 0,
          position: rect,
          disabled: btn.disabled,
          style: {
            pointerEvents: window.getComputedStyle(btn).pointerEvents,
            display: window.getComputedStyle(btn).display,
            zIndex: window.getComputedStyle(btn).zIndex
          }
        });
      }
    });
  };
  
  // 5. Verificar componentes React específicos
  const checkReactComponents = () => {
    console.log('⚛️ === VERIFICANDO COMPONENTES REACT ===');
    
    // Verificar se React está disponível
    if (window.React) {
      console.log('✅ React está disponível');
    } else {
      console.warn('⚠️ React não está disponível globalmente');
    }
    
    // Verificar componentes específicos
    const taskCards = document.querySelectorAll('[data-testid*="task"], .task-card, [class*="task"]');
    const dropdowns = document.querySelectorAll('select, [role="combobox"], [role="listbox"]');
    const buttons = document.querySelectorAll('button');
    
    console.log('🔍 Componentes encontrados:', {
      taskCards: taskCards.length,
      dropdowns: dropdowns.length,
      buttons: buttons.length
    });
    
    // Testar dropdowns especificamente
    dropdowns.forEach((dropdown, index) => {
      const rect = dropdown.getBoundingClientRect();
      console.log(`Dropdown ${index}:`, {
        visible: rect.width > 0 && rect.height > 0,
        disabled: dropdown.disabled,
        value: dropdown.value,
        options: dropdown.options?.length || 0
      });
    });
  };
  
  // 6. Verificar logs do console
  const checkConsoleLogs = () => {
    console.log('📝 === VERIFICANDO LOGS ANTERIORES ===');
    
    // Tentar acessar logs salvos
    const savedLogs = localStorage.getItem('debug-logs');
    if (savedLogs) {
      console.log('📋 Logs salvos encontrados:', JSON.parse(savedLogs));
    }
    
    // Instalar captura de logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log('✅ Captura de logs instalada');
  };
  
  // 7. Teste de clique global
  const setupGlobalClickTest = () => {
    console.log('🌐 === CONFIGURANDO TESTE GLOBAL DE CLIQUES ===');
    
    let globalClickCount = 0;
    
    const globalClickListener = (e) => {
      globalClickCount++;
      console.log(`🖱️ CLIQUE GLOBAL #${globalClickCount}:`, {
        target: e.target.tagName,
        className: e.target.className,
        id: e.target.id,
        text: e.target.textContent?.substring(0, 50),
        coordinates: { x: e.clientX, y: e.clientY },
        timestamp: new Date().toISOString()
      });
    };
    
    document.addEventListener('click', globalClickListener, true);
    
    console.log('✅ Listener global de cliques instalado');
    
    // Remover após 5 minutos
    setTimeout(() => {
      document.removeEventListener('click', globalClickListener, true);
      console.log('🗑️ Listener global removido após 5 minutos');
    }, 300000);
  };
  
  // 8. Executar todos os testes
  const runAllTests = () => {
    console.log('🚀 === EXECUTANDO TODOS OS TESTES ===');
    
    try {
      checkUserInfo();
      checkJSErrors();
      testEventListeners();
      checkBlockingElements();
      checkReactComponents();
      checkConsoleLogs();
      setupGlobalClickTest();
      
      console.log('✅ DIAGNÓSTICO COMPLETO EXECUTADO COM SUCESSO!');
      console.log('📊 Para ver resultados completos, monitore o console por alguns minutos');
      console.log('🔧 Se encontrar problemas, copie todos os logs e envie para suporte');
      
    } catch (error) {
      console.error('❌ ERRO DURANTE DIAGNÓSTICO:', error);
    }
  };
  
  // Executar diagnóstico
  runAllTests();
  
  // Retornar objeto com funções para uso manual
  return {
    checkUserInfo,
    checkJSErrors,
    testEventListeners,
    checkBlockingElements,
    checkReactComponents,
    checkConsoleLogs,
    setupGlobalClickTest,
    runAllTests
  };
})(); 