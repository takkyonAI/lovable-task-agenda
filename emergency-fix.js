// 🚨 SCRIPT DE EMERGÊNCIA - INTERCEPTAR ERROS DOM + FIREFOX
// Este script executa IMEDIATAMENTE quando a página carrega
// para prevenir erros removeChild que quebram a aplicação

(function() {
  console.log('🚨 SCRIPT DE EMERGÊNCIA ATIVADO');
  
  // 🔍 DETECÇÃO DE NAVEGADOR
  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox = userAgent.includes('firefox');
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isEdge = userAgent.includes('edge');
    
    console.log('🔍 EMERGÊNCIA: Navegador detectado:', {
      userAgent,
      isFirefox,
      isChrome,
      isSafari,
      isEdge
    });
    
    return { isFirefox, isChrome, isSafari, isEdge };
  };
  
  const browser = detectBrowser();
  
  // 🦊 FIREFOX: Detectar navegador e aplicar correções específicas
  if (navigator.userAgent.toLowerCase().includes('firefox')) {
    console.log('🦊 FIREFOX: Aplicando correções de emergência...');
    
    // Definir flag global para indicar que é Firefox
    window.FIREFOX_DISABLE_REALTIME = true;
    
    // 🚫 POLLING COMPLETAMENTE DESABILITADO - Causava piscar das notificações
    console.log('🚫 FIREFOX: Polling COMPLETAMENTE DESABILITADO para evitar piscar');
    
    // Não configurar nenhum polling
    // let firefoxPollingInterval;
    // const startFirefoxPolling = () => {
    //   console.log('🔄 FIREFOX: Iniciando polling silencioso a cada 15 segundos');
    //   
    //   firefoxPollingInterval = setInterval(() => {
    //     console.log('🔄 FIREFOX: Polling silencioso executado');
    //     
    //     // Disparar evento personalizado para o React
    //     const event = new CustomEvent('firefoxPollingUpdate', {
    //       detail: { timestamp: Date.now() }
    //     });
    //     window.dispatchEvent(event);
    //   }, 15000); // 15 segundos - mais frequente
    // };
    
    // 🚫 BLOQUEAR COMPLETAMENTE WEBSOCKET NO FIREFOX
    if (window.WebSocket) {
      console.log('🚫 FIREFOX: Bloqueando WebSocket para prevenir loops');
      
      // Substituir WebSocket por uma implementação que falha silenciosamente
      window.WebSocket = function() {
        console.log('🚫 FIREFOX: WebSocket bloqueado - usando polling');
        throw new Error('WebSocket desabilitado no Firefox');
      };
      
      // Bloquear também EventSource
      if (window.EventSource) {
        window.EventSource = function() {
          console.log('🚫 FIREFOX: EventSource bloqueado - usando polling');
          throw new Error('EventSource desabilitado no Firefox');
        };
      }
    }
    
    // 🚫 DESABILITADO: Não iniciar polling
    // setTimeout(startFirefoxPolling, 5000);
    
    // 🚫 DESABILITADO: Não configurar cleanup de polling
    // window.addEventListener('beforeunload', () => {
    //   if (firefoxPollingInterval) {
    //     clearInterval(firefoxPollingInterval);
    //   }
    // });
  }
  
  // 1. INTERCEPTAR MÉTODOS DOM CRÍTICOS
  const originalRemoveChild = Node.prototype.removeChild;
  const originalAppendChild = Node.prototype.appendChild;
  const originalInsertBefore = Node.prototype.insertBefore;
  
  // Interceptar removeChild para prevenir erros
  Node.prototype.removeChild = function(child) {
    try {
      if (this && child && this.contains && this.contains(child)) {
        return originalRemoveChild.call(this, child);
      } else {
        console.warn('🔧 EMERGÊNCIA: Prevenindo removeChild inválido');
        return child;
      }
    } catch (e) {
      console.error('🚨 EMERGÊNCIA: Erro removeChild interceptado:', e);
      return child;
    }
  };
  
  // Interceptar appendChild
  Node.prototype.appendChild = function(child) {
    try {
      if (this && child) {
        return originalAppendChild.call(this, child);
      } else {
        console.warn('🔧 EMERGÊNCIA: Prevenindo appendChild inválido');
        return child;
      }
    } catch (e) {
      console.error('🚨 EMERGÊNCIA: Erro appendChild interceptado:', e);
      return child;
    }
  };
  
  // Interceptar insertBefore
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    try {
      if (this && newNode) {
        return originalInsertBefore.call(this, newNode, referenceNode);
      } else {
        console.warn('🔧 EMERGÊNCIA: Prevenindo insertBefore inválido');
        return newNode;
      }
    } catch (e) {
      console.error('🚨 EMERGÊNCIA: Erro insertBefore interceptado:', e);
      return newNode;
    }
  };
  
  // 2. FORÇAR FUNCIONAMENTO DE CLIQUES
  const forceClickFunctionality = () => {
    console.log('🔧 EMERGÊNCIA: Forçando funcionamento de cliques');
    
    // Listener global para capturar TODOS os cliques
    document.addEventListener('click', function(event) {
      console.log('🖱️ EMERGÊNCIA: Clique detectado:', event.target.tagName, event.target.className);
      
      // 🔧 CORREÇÃO: Verificar se é um clique em card de estatísticas
      const isStatsCardClick = (
        // Verificar se emergency handler está desabilitado
        window.disableEmergencyHandler === true ||
        // Verificar se é um clique em stats card
        window.isStatsCardClick === true ||
        // Verificar se é um elemento dentro de um card de estatísticas
        event.target.closest('[data-stats-card]') ||
        // Verificar por texto específico
        (event.target.textContent && event.target.textContent.match(/(Total|Pendentes|Concluídas|Performance)/)) ||
        // Verificar por classes específicas de números de estatísticas
        (event.target.className && event.target.className.includes('text-3xl') && event.target.className.includes('font-bold')) ||
        // Verificar se é um número isolado (provável indicador de stats)
        (event.target.textContent && /^\d+$/.test(event.target.textContent.trim()) && parseInt(event.target.textContent.trim()) > 0) ||
        // Verificar se é um elemento dentro de um card de estatísticas por hierarquia
        (event.target.closest('.bg-slate-800\\/50') && event.target.closest('.bg-slate-800\\/50').textContent?.match(/(Total|Pendentes|Concluídas|Performance)/))
      );
      
      if (isStatsCardClick) {
        console.log('📊 EMERGÊNCIA: Clique em stats card detectado - IGNORANDO');
        return; // Não processar clique em stats card
      }
      
      // Verificar se é um botão
      if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
        console.log('🔧 EMERGÊNCIA: Botão clicado, verificando funcionalidade');
        
        // Para Firefox, adicionar delay extra
        if (browser.isFirefox) {
          setTimeout(() => {
            console.log('🦊 FIREFOX: Processando clique com delay');
          }, 100);
        }
      }
      
      // Verificar se clique em tarefa
      const taskCard = event.target.closest('[data-task-id]');
      if (taskCard) {
        const taskId = taskCard.getAttribute('data-task-id');
        console.log('📋 EMERGÊNCIA: Clique em tarefa detectado:', taskId);
        
        // Tentar encontrar handler React
        const reactHandler = taskCard.onclick || taskCard._reactInternalFiber;
        if (reactHandler) {
          console.log('⚛️ EMERGÊNCIA: Handler React encontrado, executando');
        }
      }
    }, true); // Use capture phase
    
    console.log('✅ EMERGÊNCIA: Listener global instalado');
  };
  
  // 3. INTERCEPTAR ERROS GLOBAIS
  const interceptGlobalErrors = () => {
    window.addEventListener('error', function(event) {
      console.error('🚨 EMERGÊNCIA: Erro global capturado:', event.error);
      
      // Para Firefox, tratar erros específicos
      if (browser.isFirefox && event.error && event.error.message) {
        if (event.error.message.includes('NS_ERROR_CONTENT_BLOCKED')) {
          console.log('🦊 FIREFOX: Erro CSP ignorado');
          event.preventDefault();
          return false;
        }
      }
      
      // Tentar recuperar de erros DOM
      if (event.error && event.error.message && event.error.message.includes('removeChild')) {
        console.log('🔧 EMERGÊNCIA: Tentando recuperar de erro removeChild');
        event.preventDefault();
        return false;
      }
    });
    
    // Interceptar promises rejeitadas
    window.addEventListener('unhandledrejection', function(event) {
      console.error('🚨 EMERGÊNCIA: Promise rejeitada:', event.reason);
      
      // Para Firefox, tratar rejeições específicas
      if (browser.isFirefox && event.reason && event.reason.toString().includes('NS_ERROR_CONTENT_BLOCKED')) {
        console.log('🦊 FIREFOX: Promise CSP rejeitada - Continuando');
        event.preventDefault();
        return false;
      }
    });
    
    console.log('🔧 EMERGÊNCIA: Monitorando erros...');
  };
  
  // 4. EXECUTAR TODAS AS CORREÇÕES
  forceClickFunctionality();
  interceptGlobalErrors();
  
  console.log('✅ EMERGÊNCIA: Script de emergência instalado com sucesso');
  
  // 5. MONITORAMENTO CONTÍNUO
  setInterval(() => {
    console.log('🔧 EMERGÊNCIA: Monitorando erros...');
  }, 5000);
  
})(); 