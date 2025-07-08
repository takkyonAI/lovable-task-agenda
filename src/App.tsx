
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Index from '@/pages/Index';
import LoginForm from '@/components/LoginForm';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const { currentUser, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/" replace /> : <LoginForm />} 
        />
        <Route 
          path="/" 
          element={currentUser ? <Index /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
