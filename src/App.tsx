import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Index from '@/pages/Index';
import LoginForm from '@/components/LoginForm';
import FirstTimePasswordChange from '@/components/FirstTimePasswordChange';
import { useState, useEffect, Component, ReactNode } from 'react';
import './App.css';

const queryClient = new QueryClient();

// Simple Error Boundary for iPad debugging
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('iPad Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isIPad = navigator.platform.includes('iPad') || 
                     (navigator.platform.includes('Mac') && navigator.maxTouchPoints > 0);
      
      return (
        <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-red-900 to-slate-800 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-red-400 text-lg font-bold mb-4">
              {isIPad ? '🍎 iPad Error Detected' : '❌ Application Error'}
            </div>
            <div className="text-white text-sm mb-4">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            {isIPad && (
              <div className="text-slate-300 text-xs mb-4">
                <strong>iPad Debug Info:</strong><br/>
                Platform: {navigator.platform}<br/>
                User Agent: {navigator.userAgent.substring(0, 50)}...<br/>
                Touch Points: {navigator.maxTouchPoints}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component with iPad-specific styling
function LoadingScreen() {
  const [loadingTime, setLoadingTime] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center prevent-white-screen">
      <div className="text-center">
        <div className="text-white text-xl mb-4">Carregando...</div>
        <div className="text-slate-300 text-sm">
          {loadingTime > 10 && "Carregamento está demorando mais que o esperado..."}
          {loadingTime > 20 && (
            <div className="mt-2">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Recarregar Página
              </button>
            </div>
          )}
        </div>
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
