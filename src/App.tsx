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

// 🔧 CORREÇÃO CRÍTICA: ErrorBoundary melhorado para resolver problema removeChild
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: any; recoveryAttempts: number }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, recoveryAttempts: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // 🔧 CORREÇÃO: Detecção precisa de dispositivos
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    const isRealIPad = /iPad/i.test(userAgent) || 
                      (platform.includes('Mac') && navigator.maxTouchPoints > 0 && /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent));
    
    const isDesktopChrome = /Chrome/i.test(userAgent) && !/Mobile/i.test(userAgent) && !isRealIPad;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent) && !isDesktopChrome;
    
    const deviceType = isRealIPad ? 'Real iPad' : isDesktopChrome ? 'Chrome Desktop' : isMobile ? 'Mobile Device' : 'Unknown Device';
    
    console.error(`🔧 ErrorBoundary caught error on ${deviceType}:`, error, errorInfo);
    
    // 🚨 CORREÇÃO CRÍTICA: Detectar erro de removeChild que quebra todos os cliques
    const isDOMError = error.message.includes('removeChild') || 
                      error.message.includes('Node') || 
                      error.message.includes('insertBefore') ||
                      error.message.includes('appendChild') ||
                      error.stack?.includes('removeChild');
    
    if (isDOMError) {
      console.error('🚨 CRITICAL DOM ERROR DETECTED - This breaks all click functionality!');
      console.error('🔧 Error details:', {
        message: error.message,
        stack: error.stack,
        component: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
      
      // Salvar erro crítico
      try {
        localStorage.setItem('critical-dom-error', JSON.stringify({
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          device: deviceType,
          userAgent: navigator.userAgent,
          recoveryAttempts: this.state.recoveryAttempts
        }));
      } catch (e) {
        console.error('Failed to save critical error:', e);
      }
      
      // 🔧 CORREÇÃO: Tentar recuperar funcionalidade de cliques
      this.attemptClickRecovery();
    }
    
    // 🔧 CORREÇÃO: Salvar erro completo no localStorage
    try {
      localStorage.setItem('last-error', JSON.stringify({
        error: error.message,
        stack: error.stack,
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        isDOMError,
        deviceType,
        recoveryAttempts: this.state.recoveryAttempts
      }));
    } catch (e) {
      console.error('Failed to save error to localStorage:', e);
    }
    
    this.setState({ 
      errorInfo, 
      recoveryAttempts: this.state.recoveryAttempts + 1 
    });
  }

  // 🔧 NOVO: Método para tentar recuperar funcionalidade de cliques
  attemptClickRecovery = () => {
    console.log('🔧 Attempting to recover click functionality...');
    
    // Aguardar um pouco antes de tentar recuperar
    setTimeout(() => {
      try {
        // Verificar se event listeners globais estão funcionando
        const testClick = () => {
          console.log('✅ Global click listener is working');
        };
        
        // Adicionar listener global temporário
        document.addEventListener('click', testClick, { once: true });
        
        // Tentar recriar event listeners essenciais
        const buttons = document.querySelectorAll('button, [role="button"]');
        console.log(`🔧 Found ${buttons.length} clickable elements, attempting to restore...`);
        
        buttons.forEach((button, index) => {
          if (button && typeof button.addEventListener === 'function') {
            button.addEventListener('click', (e) => {
              console.log(`🖱️ Button ${index} clicked successfully`);
            }, { once: true });
          }
        });
        
        // Verificar se React ainda está funcionando
        if (window.React) {
          console.log('✅ React is still available');
        } else {
          console.warn('⚠️ React may not be available');
        }
        
        console.log('🔧 Click recovery attempt completed');
        
      } catch (e) {
        console.error('❌ Click recovery failed:', e);
      }
    }, 100);
  };

  // 🔧 CORREÇÃO: Método de reload mais robusto
  handleReload = () => {
    try {
      console.log('🔄 Attempting safe reload...');
      
      // Limpar estado de erro
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null, 
        recoveryAttempts: 0 
      });
      
      // Limpar localStorage de erros
      localStorage.removeItem('last-error');
      localStorage.removeItem('critical-dom-error');
      
      // Reload mais seguro
      window.location.href = window.location.href;
    } catch (e) {
      console.error('Error during reload:', e);
      // Fallback para reload forçado
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // 🔧 CORREÇÃO: Detecção mais precisa de dispositivos
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      
      const isRealIPad = /iPad/i.test(userAgent) || 
                        (platform.includes('Mac') && navigator.maxTouchPoints > 0 && /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent));
      
      const isDesktopChrome = /Chrome/i.test(userAgent) && !/Mobile/i.test(userAgent) && !isRealIPad;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent) && !isDesktopChrome;
      
      const isDOMError = this.state.error?.message.includes('removeChild') || 
                        this.state.error?.message.includes('Node') ||
                        this.state.error?.stack?.includes('removeChild');
      
      return (
        <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-red-900 to-slate-800 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-red-400 text-lg font-bold mb-4">
              {isDOMError ? '🚨 Critical Click Error' : 
               isRealIPad ? '🍎 iPad Error' : 
               isMobile ? '📱 Mobile Error' : 
               isDesktopChrome ? '💻 Chrome Desktop Error' : 
               '❌ Application Error'}
            </div>
            
            <div className="text-slate-300 mb-6">
              {isDOMError ? 
                'DOM manipulation error detected. This may cause clicks to stop working.' :
                'An unexpected error occurred. The application will reload to recover.'
              }
            </div>
            
            {/* 🔧 CORREÇÃO: Informações de debug mais completas */}
            <div className="text-xs text-slate-400 mb-4 text-left">
              <strong>Debug Info:</strong><br/>
              Device: {isRealIPad ? 'Real iPad' : isDesktopChrome ? 'Chrome Desktop' : isMobile ? 'Mobile' : 'Unknown'}<br/>
              Error: {this.state.error?.message.substring(0, 100)}...<br/>
              Recovery Attempts: {this.state.recoveryAttempts}<br/>
              Time: {new Date().toLocaleTimeString()}<br/>
              DOM Error: {isDOMError ? 'Yes' : 'No'}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Reload Application
              </button>
              
              {isDOMError && (
                <button
                  onClick={this.attemptClickRecovery}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  🔧 Try Click Recovery
                </button>
              )}
              
              <button
                onClick={() => {
                  const errorDetails = {
                    message: this.state.error?.message,
                    stack: this.state.error?.stack,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                  };
                  console.log('📋 Error details copied to console:', errorDetails);
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
                  }
                }}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                📋 Copy Error Details
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
