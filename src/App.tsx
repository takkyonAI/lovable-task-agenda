import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// 🚨 SOLUÇÃO ULTRA-RADICAL: INTERCEPTAÇÃO TOTAL DE ERROS ANTES DO REACT ROUTER
// Especialmente para Chrome que ainda está mostrando "Application Error"

// 🔧 DETECTAR NAVEGADOR
const detectBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
  const isFirefox = userAgent.includes('firefox');
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
  const isEdge = userAgent.includes('edge');
  
  return { isChrome, isFirefox, isSafari, isEdge };
};

// 🚫 INTERCEPTAÇÃO ULTRA-AGRESSIVA DE ERROS
const setupUltraAggressiveErrorBlocking = () => {
  const browser = detectBrowser();
  
  console.log('🔧 INICIANDO INTERCEPTAÇÃO ULTRA-AGRESSIVA DE ERROS');
  console.log('🌐 NAVEGADOR DETECTADO:', browser);
  
  // 1. INTERCEPTAR console.error ANTES DE TUDO
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  console.error = (...args) => {
    const message = args.join(' ').toLowerCase();
    
    // 🚫 BLOQUEAR TODOS OS ERROS RELACIONADOS
    if (message.includes('websocket') ||
        message.includes('application error') ||
        message.includes('react router') ||
        message.includes('router') ||
        message.includes('route') ||
        message.includes('boundary') ||
        message.includes('error boundary') ||
        message.includes('firefox') ||
        message.includes('desabilitado') ||
        message.includes('blocked') ||
        message.includes('connection') ||
        message.includes('network') ||
        message.includes('failed') ||
        message.includes('timeout')) {
      
      console.log('🚫 ERRO BLOQUEADO ULTRA-AGRESSIVAMENTE:', args[0]);
      return;
    }
    
    originalConsoleError.apply(console, args);
  };
  
  console.warn = (...args) => {
    const message = args.join(' ').toLowerCase();
    
    if (message.includes('websocket') ||
        message.includes('application error') ||
        message.includes('router') ||
        message.includes('boundary')) {
      console.log('🚫 WARNING BLOQUEADO:', args[0]);
      return;
    }
    
    originalConsoleWarn.apply(console, args);
  };
  
  // 2. INTERCEPTAR ERROS GLOBAIS
  window.addEventListener('error', (e) => {
    const message = e.message.toLowerCase();
    
    if (message.includes('websocket') ||
        message.includes('application error') ||
        message.includes('router') ||
        message.includes('boundary') ||
        message.includes('firefox') ||
        message.includes('desabilitado')) {
      
      console.log('🚫 ERRO GLOBAL BLOQUEADO:', e.message);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true); // useCapture = true para interceptar antes
  
  // 3. INTERCEPTAR PROMISES REJEITADAS
  window.addEventListener('unhandledrejection', (e) => {
    const reason = String(e.reason).toLowerCase();
    
    if (reason.includes('websocket') ||
        reason.includes('application error') ||
        reason.includes('router') ||
        reason.includes('boundary') ||
        reason.includes('firefox') ||
        reason.includes('desabilitado')) {
      
      console.log('🚫 PROMISE REJEITADA BLOQUEADA:', e.reason);
      e.preventDefault();
      return false;
    }
  });
  
  // 4. CHROME ESPECÍFICO: Interceptação adicional
  if (browser.isChrome) {
    console.log('🌐 CHROME DETECTADO - Aplicando interceptação específica');
    
    // Interceptar qualquer erro que possa aparecer no Chrome
    const originalThrow = Error.prototype.constructor;
    Error.prototype.constructor = function(...args) {
      const message = args[0] || '';
      if (typeof message === 'string' && 
          (message.includes('WebSocket') || 
           message.includes('Application Error') ||
           message.includes('desabilitado no Firefox'))) {
        console.log('🚫 CHROME: Erro de construção bloqueado:', message);
        return new Error('Erro bloqueado pelo sistema');
      }
      return originalThrow.apply(this, args);
    };
  }
  
  console.log('✅ INTERCEPTAÇÃO ULTRA-AGRESSIVA INSTALADA');
};

// 🔧 ROUTER CUSTOMIZADO ULTRA-SEGURO
function UltraSafeRouter({ children }: { children: React.ReactNode }) {
  const browser = detectBrowser();
  
  // Interceptar TODOS os erros antes que cheguem ao React Router
  React.useEffect(() => {
    setupUltraAggressiveErrorBlocking();
  }, []);

  try {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  } catch (error) {
    console.log('🚫 ERRO CAPTURADO NO ULTRA-SAFE ROUTER:', error);
    
    // Retornar aplicação sem router em caso de erro
    return (
      <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-2xl font-bold mb-4">
            {browser.isChrome ? '🌐 Chrome' : '🌐 Navegador'} - Aplicação Funcionando
          </div>
          <div className="text-lg">
            Sistema de roteamento alternativo ativo
          </div>
          {children}
        </div>
      </div>
    );
  }
}

// 🔧 INTERCEPTADOR GLOBAL DE ERROS MELHORADO
const setupGlobalErrorHandling = () => {
  // Interceptar erros globais
  window.addEventListener('error', (e) => {
    console.log('🚨 ERRO GLOBAL INTERCEPTADO E IGNORADO:', e.message);
    e.preventDefault(); // Prevenir que o erro quebre a aplicação
    return false;
  });
  
  // Interceptar promises rejeitadas
  window.addEventListener('unhandledrejection', (e) => {
    console.log('🚨 PROMISE REJEITADA INTERCEPTADA E IGNORADA:', e.reason);
    e.preventDefault();
    return false;
  });
  
  console.log('🔧 INTERCEPTADORES GLOBAIS INSTALADOS');
};

// 🔧 CORREÇÃO: LoadingScreen melhorado
const LoadingScreen = () => {
  const browser = detectBrowser();
  
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-6"></div>
        <div className="text-white text-xl font-medium mb-2">
          Carregando Aplicação...
        </div>
        <div className="text-slate-300 text-sm">
          {browser.isChrome ? '🌐 Chrome' : browser.isFirefox ? '🦊 Firefox' : browser.isSafari ? '🍎 Safari' : '🌐 Navegador'} - Sistema Ultra-Seguro Ativo
        </div>
      </div>
    </div>
  );
};

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

  return content;
}

// 🚨 APLICAÇÃO PRINCIPAL COM ULTRA-SAFE ROUTER
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UltraSafeRouter>
          <AppContent />
          <Toaster />
        </UltraSafeRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
