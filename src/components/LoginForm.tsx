import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { sanitizeInput } from '@/utils/inputValidation';
import { APP_NAME } from '@/constants/app';
import Logo from '@/components/ui/Logo';

const LoginForm: React.FC = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { login } = useSupabaseAuth();

  // Debug: Confirmar que o LoginForm está usando o componente Logo
  console.log('🔄 LoginForm carregado com componente Logo em:', new Date().toLocaleTimeString());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting - simple client-side check
    if (loginAttempts >= 5) {
      alert('Muitas tentativas de login. Tente novamente em alguns minutos.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(loginData.email, loginData.password);
      if (!success) {
        setLoginAttempts(prev => prev + 1);
      } else {
        setLoginAttempts(0);
      }
    } catch (error) {
      setLoginAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader className="text-center pb-2 pt-4">
          {/* LOGO DA ROCKFELLER - Tamanho pequeno para container compacto */}
          <Logo size="sm" variant="icon" className="mx-auto mb-2" />
          <CardTitle className="text-white text-lg mb-1">{APP_NAME}</CardTitle>
          <p className="text-slate-400 text-xs">Acesse sua conta</p>
        </CardHeader>
        
        <CardContent className="pt-1 pb-4">
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <Label htmlFor="login-email" className="text-slate-300 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: sanitizeInput(e.target.value) }))}
                  className="bg-slate-700/50 border-slate-600 text-white pl-10 h-10"
                  placeholder="seu@email.com"
                  required
                  maxLength={100}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="login-password" className="text-slate-300 text-sm">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white pl-10 h-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  maxLength={128}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading || loginAttempts >= 5}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-10 mt-4"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
