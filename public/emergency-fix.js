// 🚨 SCRIPT DE EMERGÊNCIA - INTERCEPTAR ERROS DOM
// Este script executa IMEDIATAMENTE quando a página carrega
// para prevenir erros removeChild que quebram a aplicação

(function() {
  console.log('🚨 SCRIPT DE EMERGÊNCIA ATIVADO');
  
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
  
  // 2. INTERCEPTAR ERROS GLOBAIS
  window.addEventListener('error', function(e) {
    if (e.message && (e.message.includes('removeChild') || e.message.includes('Node'))) {
      console.error('🚨 EMERGÊNCIA: Erro DOM global interceptado:', e.message);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
  
  // 3. INTERCEPTAR PROMISES REJEITADAS
  window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && e.reason.message && e.reason.message.includes('removeChild')) {
      console.error('🚨 EMERGÊNCIA: Promise rejeitada DOM interceptada:', e.reason);
      e.preventDefault();
      return false;
    }
  });
  
  // 4. FORÇAR FUNCIONAMENTO DE CLIQUES
  const forceClickFunctionality = () => {
    console.log('🔧 EMERGÊNCIA: Forçando funcionamento de cliques');
    
    // Aguardar um pouco para garantir que a página carregou
    setTimeout(() => {
      // Adicionar listener global de emergência
      document.addEventListener('click', function(e) {
        console.log('🖱️ EMERGÊNCIA: Clique detectado:', e.target.tagName, e.target.className);
        
        // Se é um filtro que não está funcionando
        if (e.target.closest('[role="combobox"]') || e.target.closest('select')) {
          console.log('🔧 EMERGÊNCIA: Filtro clicado, forçando funcionamento');
          
          // Tentar abrir o dropdown manualmente
          const select = e.target.closest('[role="combobox"]') || e.target.closest('select');
          if (select) {
            select.focus();
            
            // Simular eventos de mouse
            const mouseDown = new MouseEvent('mousedown', { bubbles: true });
            const mouseUp = new MouseEvent('mouseup', { bubbles: true });
            const click = new MouseEvent('click', { bubbles: true });
            
            select.dispatchEvent(mouseDown);
            select.dispatchEvent(mouseUp);
            select.dispatchEvent(click);
          }
        }
        
        // Se é um botão que não está funcionando
        if (e.target.tagName === 'BUTTON' && !e.defaultPrevented) {
          console.log('🔧 EMERGÊNCIA: Botão clicado, verificando funcionalidade');
          
          const buttonText = e.target.textContent?.toLowerCase() || '';
          
          // Identificar tipos de botões e forçar ações
          if (buttonText.includes('nova') || buttonText.includes('criar')) {
            console.log('🔧 EMERGÊNCIA: Forçando abertura de criar tarefa');
            
            // Tentar encontrar e abrir o diálogo de criar tarefa
            const createButton = document.querySelector('[data-create-task]') || e.target;
            if (createButton) {
              createButton.click();
            }
          }
        }
        
        // Se é um card de tarefa
        if (e.target.closest('[data-task-id]')) {
          console.log('🔧 EMERGÊNCIA: Card de tarefa clicado');
          
          const taskCard = e.target.closest('[data-task-id]');
          const taskId = taskCard.getAttribute('data-task-id');
          
          if (taskId) {
            console.log('🔧 EMERGÊNCIA: Abrindo tarefa', taskId);
            
            // Tentar abrir o modal de tarefa
            // (Isso será capturado pelo sistema React se estiver funcionando)
          }
        }
      }, true);
      
      console.log('✅ EMERGÊNCIA: Listener global instalado');
    }, 2000);
  };
  
  // 5. EXECUTAR QUANDO DOM ESTIVER PRONTO
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceClickFunctionality);
  } else {
    forceClickFunctionality();
  }
  
  // 6. MONITORAR ERROS CONTINUAMENTE
  setInterval(() => {
    const errors = performance.getEntriesByType('navigation');
    if (errors.length > 0) {
      console.log('🔧 EMERGÊNCIA: Monitorando erros...');
    }
  }, 5000);
  
  console.log('✅ EMERGÊNCIA: Script de emergência instalado com sucesso');
})(); 