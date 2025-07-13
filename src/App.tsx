import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useSupabaseAuth';
import { Index } from '@/pages/Index';
import { LoginForm } from '@/components/LoginForm';
import { FirstTimePasswordChange } from '@/components/FirstTimePasswordChange';
import { useState, useEffect, Component, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import './App.css';

const queryClient = new QueryClient();

// 🔧 CORREÇÃO: ErrorBoundary melhorado para resolver problemas de DOM
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: any }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔧 ErrorBoundary caught an error:', error, errorInfo);
    
    // 🔧 CORREÇÃO: Salvar erro no localStorage para debug
    try {
      localStorage.setItem('last-error', JSON.stringify({
        error: error.message,
        stack: error.stack,
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }));
    } catch (e) {
      console.error('Failed to save error to localStorage:', e);
    }
    
    this.setState({ errorInfo });
  }

  // 🔧 CORREÇÃO: Método seguro para reload
  handleReload = () => {
    try {
      // Limpar estado
      this.setState({ hasError: false, error: null, errorInfo: null });
      
      // Limpar localStorage de erros
      localStorage.removeItem('last-error');
      
      // Reload seguro
      window.location.href = window.location.href;
    } catch (e) {
      console.error('Error during reload:', e);
      // Fallback para reload forçado
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isIPad = navigator.platform.includes('iPad') || 
                     (navigator.platform.includes('Mac') && navigator.maxTouchPoints > 0);
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      return (
        <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-red-900 to-slate-800 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-red-400 text-lg font-bold mb-4">
              {isIPad ? '🍎 iPad Error Detected' : isMobile ? '📱 Mobile Error' : '❌ Application Error'}
            </div>
            <div className="text-white text-sm mb-4">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            
            {/* 🔧 CORREÇÃO: Informações de debug mais completas */}
            <div className="text-slate-300 text-xs mb-4 bg-slate-900/50 p-3 rounded">
              <strong>Debug Info:</strong><br/>
              <div className="text-left space-y-1">
                <div>Platform: {navigator.platform}</div>
                <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
                <div>Touch Points: {navigator.maxTouchPoints}</div>
                <div>Time: {new Date().toLocaleString()}</div>
                {this.state.error?.stack && (
                  <div className="mt-2">
                    <strong>Stack:</strong><br/>
                    <div className="text-xs text-slate-400 max-h-20 overflow-y-auto">
                      {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                🔄 Reload Page
              </button>
              
              {/* 🔧 CORREÇÃO: Botão para limpar dados */}
              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                    this.handleReload();
                  } catch (e) {
                    console.error('Error clearing storage:', e);
                    this.handleReload();
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors text-sm"
              >
                🗑️ Clear Data & Reload
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
