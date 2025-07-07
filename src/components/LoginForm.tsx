
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Mail, Lock } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const LoginForm: React.FC = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login, signUp } = useSupabaseAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(loginData.email, loginData.password);
      if (!success) {
        alert('Credenciais inválidas. Verifique seu email e senha.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signUp(signupData.email, signupData.password, signupData.name);
      // Limpar formulário
      setSignupData({ name: '', email: '', password: '' });
    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-white text-xl">Sistema de Gerenciamento</CardTitle>
          <p className="text-slate-400 text-sm">Entre ou crie sua conta</p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
              <TabsTrigger value="login" className="text-slate-300">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="text-slate-300">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-white pl-10"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="login-password" className="text-slate-300">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-white pl-10"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name" className="text-slate-300">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.name}
                      onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-white pl-10"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-email" className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-white pl-10"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="signup-password" className="text-slate-300">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-white pl-10"
                      placeholder="Sua senha"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isLoading ? 'Criando Conta...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
