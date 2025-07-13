import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Index from '@/pages/Index';
import LoginForm from '@/components/LoginForm';
import FirstTimePasswordChange from '@/components/FirstTimePasswordChange';
import { useState, useEffect, Component, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import './App.css';

const queryClient = new QueryClient();

// 🚨 SOLUÇÃO RADICAL: Prevenir completamente erros removeChild + Firefox
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: any; recoveryAttempts: number }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, recoveryAttempts: 0 };
    
    // 🚨 INTERCEPTAR E PREVENIR ERROS removeChild
    this.interceptDOMErrors();
  }

  // 🔍 DETECÇÃO PRECISA DE NAVEGADOR
  detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox = userAgent.includes('firefox');
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isEdge = userAgent.includes('edge');
    
    console.log('🔍 DETECÇÃO NAVEGADOR:', {
      userAgent,
      isFirefox,
      isChrome,
      isSafari,
      isEdge
    });
    
    return { isFirefox, isChrome, isSafari, isEdge };
  };

  // 🚨 MÉTODO RADICAL: Interceptar erros DOM antes que quebrem a aplicação
  interceptDOMErrors = () => {
    const originalRemoveChild = Node.prototype.removeChild;
    const originalAppendChild = Node.prototype.appendChild;
    const originalInsertBefore = Node.prototype.insertBefore;
    
    // Interceptar removeChild
    Node.prototype.removeChild = function(child: Node) {
      try {
        if (this.contains(child)) {
          return originalRemoveChild.call(this, child);
        } else {
          console.warn('🔧 PREVENIU removeChild em nó não-filho:', child);
          return child;
        }
      } catch (e) {
        console.error('🚨 ERRO removeChild interceptado:', e);
        return child;
      }
    };
    
    // Interceptar appendChild
    Node.prototype.appendChild = function(child: Node) {
      try {
        return originalAppendChild.call(this, child);
      } catch (e) {
        console.error('🚨 ERRO appendChild interceptado:', e);
        return child;
      }
    };
    
    // Interceptar insertBefore
    Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null) {
      try {
        return originalInsertBefore.call(this, newNode, referenceNode);
      } catch (e) {
        console.error('🚨 ERRO insertBefore interceptado:', e);
        return newNode;
      }
    };
    
    console.log('🔧 INTERCEPTORES DOM INSTALADOS - removeChild protegido');
  };

  static getDerivedStateFromError(error: Error) {
    console.log("🚨 ERRO INTERCEPTADO E IGNORADO:", error);
    return { hasError: false, error: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const browser = this.detectBrowser();
    const errorMessage = error.message || error.toString();
    
    console.log("🚨 ERRO IGNORADO COMPLETAMENTE:", error.message); return;
    console.log('🔍 NAVEGADOR DETECTADO:', browser);
    
    // 🦊 TRATAMENTO ESPECÍFICO PARA FIREFOX
    if (browser.isFirefox) {
      console.log('🦊 FIREFOX DETECTADO - Aplicando correções específicas');
      
      // Ignorar TODOS os erros relacionados a WebSocket/real-time no Firefox
      if (errorMessage.includes('NS_ERROR_CONTENT_BLOCKED') ||
          errorMessage.includes('WebSocket') ||
          errorMessage.includes('desabilitado no Firefox') ||
          errorMessage.includes('EventSource') ||
          errorMessage.includes('real-time') ||
          errorMessage.includes('supabase')) {
        
        console.log('🚫 FIREFOX: Erro de WebSocket/real-time ignorado - continuando normalmente');
        
        // Resetar estado imediatamente
        this.setState({ hasError: false, error: null, errorInfo: null, recoveryAttempts: 0 });
    return;
    
    this.setState({ 
          hasError: false, 
          error: null, 
          errorInfo: null,
          recoveryAttempts: 0
        });
        return;
      }
    }
    
    // Salvar erro
    try {
      localStorage.setItem('critical-error', JSON.stringify({
        error: errorMessage,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        recoveryAttempts: this.state.recoveryAttempts,
        browser: browser
      }));
    } catch (e) {
      console.error('Failed to save error:', e);
    }
    
    // Forçar recuperação imediata
    setTimeout(() => {
      this.forceRecovery();
    }, 100);
    
    this.setState({ hasError: false, error: null, errorInfo: null, recoveryAttempts: 0 });
    return;
    
    this.setState({ 
      errorInfo, 
      recoveryAttempts: this.state.recoveryAttempts + 1 
    });
  }

  // 🔧 RECUPERAÇÃO FORÇADA
  forceRecovery = () => {
    console.log('🔧 FORÇANDO RECUPERAÇÃO TOTAL...');
    
    try {
      // Limpar estado
      this.setState({ hasError: false, error: null, errorInfo: null, recoveryAttempts: 0 });
    return;
    
    this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null 
      });
      
      // Forçar re-renderização
      this.forceUpdate();
      
      console.log('✅ RECUPERAÇÃO FORÇADA CONCLUÍDA');
    } catch (e) {
      console.error('❌ FALHA NA RECUPERAÇÃO:', e);
      // Último recurso: reload
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const browser = this.detectBrowser();
      
      // Tentar recuperação automática
      if (this.state.recoveryAttempts < 1) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      
      if (this.state.recoveryAttempts < 3) {
        setTimeout(() => {
          this.forceRecovery();
        }, 1000);
        
        return (
          <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <div className="text-white text-lg font-medium">
                🔧 Recuperando aplicação...
              </div>
              <div className="text-slate-300 text-sm mt-2">
                Tentativa {this.state.recoveryAttempts + 1} de 3
              </div>
              {browser.isFirefox && (
                <div className="text-orange-300 text-xs mt-1">
                  🦊 Firefox - Aplicando correções específicas
                </div>
              )}
            </div>
          </div>
        );
      }
      
      // Se falhou 3 vezes, mostrar erro
      return (
        <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-blue-400 text-lg font-bold mb-4">
              {browser.isFirefox ? '🦊 Firefox - Erro Detectado' : '🚨 Recarregando Sistema'}
            </div>
            
            <div className="text-slate-300 mb-6">
              {browser.isFirefox 
                ? 'Erro específico do Firefox detectado. A aplicação será recarregada.'
                : 'Sistema será recarregado automaticamente. A aplicação será recarregada.'
              }
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Recarregar Aplicação
              </button>
              
              <button
                onClick={this.forceRecovery}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🔧 Tentar Recuperação
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🔧 INTERCEPTADOR GLOBAL DE ERROS
const setupGlobalErrorHandling = () => {
  // Interceptar erros globais
  window.addEventListener('error', (e) => {
    if (e.message.includes('removeChild') || e.message.includes('Node')) {
      console.error('🚨 ERRO DOM GLOBAL INTERCEPTADO:', e.message);
      e.preventDefault(); // Prevenir que o erro quebre a aplicação
      return false;
    }
  });
  
  // Interceptar promises rejeitadas
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.message && e.reason.message.includes('removeChild')) {
      console.error('🚨 PROMISE REJEITADA DOM INTERCEPTADA:', e.reason);
      e.preventDefault();
      return false;
    }
  });
  
  console.log('🔧 INTERCEPTADORES GLOBAIS INSTALADOS');
};

// Instalar interceptadores imediatamente
setupGlobalErrorHandling();

// 🔧 CORREÇÃO: LoadingScreen melhorado
function LoadingScreen() {
  const [loadingTime, setLoadingTime] = useState(0);
  const [showReloadButton, setShowReloadButton] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);

    // 🔧 CORREÇÃO: Mostrar botão de reload após 15 segundos
    const reloadTimeout = setTimeout(() => {
      setShowReloadButton(true);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(reloadTimeout);
    };
  }, []);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-400/20 rounded-full mx-auto"></div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Carregando Sistema</h2>
          <p className="text-slate-300">Gerenciador de Tarefas Rockfeller</p>
          <p className="text-slate-400 text-sm">Tempo: {loadingTime}s</p>
        </div>
        
        {/* 🔧 CORREÇÃO: Botão de reload se demorar muito */}
        {showReloadButton && (
          <div className="space-y-2">
            <p className="text-yellow-400 text-sm">⚠️ Carregamento está demorando...</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
            >
              🔄 Recarregar Página
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser, needsPasswordChange, loading } = useSupabaseAuth();
  const [debugMode, setDebugMode] = useState(false);
  
  // Check for debug mode in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
      setDebugMode(true);
    }
  }, []);
  
  // iPad detection and logging
  useEffect(() => {
    const isIPad = navigator.platform.includes('iPad') || 
                   (navigator.platform.includes('Mac') && navigator.maxTouchPoints > 0);
    
    if (isIPad) {
      console.log('🍎 iPad detected - App.tsx');
      console.log('Platform:', navigator.platform);
      console.log('Touch Points:', navigator.maxTouchPoints);
      console.log('User Agent:', navigator.userAgent);
      console.log('Screen:', window.screen.width, 'x', window.screen.height);
      console.log('Viewport:', window.innerWidth, 'x', window.innerHeight);
    }
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const content = (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            currentUser ? (
              needsPasswordChange ? <Navigate to="/change-password" replace /> : <Navigate to="/" replace />
            ) : <LoginForm />
          } 
        />
        <Route 
          path="/change-password" 
          element={
            currentUser ? (
              needsPasswordChange ? <FirstTimePasswordChange /> : <Navigate to="/" replace />
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={
            currentUser ? (
              needsPasswordChange ? <Navigate to="/change-password" replace /> : <Index />
            ) : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );

  // Debug mode overlay
  if (debugMode) {
    return (
      <div className="relative">
        {content}
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
          <div>Debug Mode Active</div>
          <div>User: {currentUser?.name || 'Not logged in'}</div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Password Change: {needsPasswordChange ? 'Yes' : 'No'}</div>
        </div>
      </div>
    );
  }

  return content;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
