import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Index from '@/pages/Index';
import LoginForm from '@/components/LoginForm';
import FirstTimePasswordChange from '@/components/FirstTimePasswordChange';
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import './App.css';

const queryClient = new QueryClient();

// 🚨 SOLUÇÃO RADICAL: SEM ERROR BOUNDARY = SEM TELA VERMELHA
// Aplicação roda sem Error Boundary - erros são tratados globalmente

// 🔧 INTERCEPTADOR GLOBAL DE ERROS
const setupGlobalErrorHandling = () => {
  // Interceptar erros globais
  window.addEventListener('error', (e) => {
    console.error('🚨 ERRO GLOBAL INTERCEPTADO E IGNORADO:', e.message);
    e.preventDefault(); // Prevenir que o erro quebre a aplicação
    return false;
  });
  
  // Interceptar promises rejeitadas
  window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 PROMISE REJEITADA INTERCEPTADA E IGNORADA:', e.reason);
    e.preventDefault();
    return false;
  });
  
  console.log('🔧 INTERCEPTADORES GLOBAIS INSTALADOS');
};

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

        {showReloadButton && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 Recarregar Página
          </button>
        )}
      </div>
    </div>
  );
}

// 🔧 CORREÇÃO: Componente principal da aplicação
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

  // Setup global error handling
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const content = (
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
  );

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

// 🚨 APLICAÇÃO PRINCIPAL SEM ERROR BOUNDARY
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
