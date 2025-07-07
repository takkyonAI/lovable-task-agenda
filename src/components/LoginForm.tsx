import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, User, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  console.log('LoginForm renderizando');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando processo de login...');
    setIsLoading(true);

    try {
      console.log('Chamando função login...');
      const success = await login(email, password);
      console.log('Resultado do login:', success);
      
      if (!success) {
        console.log('Login falhou - mostrando alerta');
        alert('Credenciais inválidas');
      } else {
        console.log('Login bem-sucedido');
      }
    } catch (error) {
      console.error('Erro no handleSubmit:', error);
      alert('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (role: 'admin' | 'franqueado' | 'vendedor') => {
    console.log('Quick login para:', role);
    const emailMap = {
      admin: 'wadevenga@hotmail.com',
      franqueado: 'franqueado@empresa.com',
      vendedor: 'vendedor@empresa.com'
    };
    
    setEmail(emailMap[role]);
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-white text-xl">Acesso ao Sistema</CardTitle>
          <p className="text-slate-400 text-sm">Entre com suas credenciais</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-slate-300">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="••••••••"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="pt-4 border-t border-slate-700">
            <p className="text-slate-400 text-xs text-center mb-3">Acesso rápido para teste:</p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('admin')}
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
              >
                <Crown className="w-4 h-4 mr-2" />
                Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('franqueado')}
                className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
              >
                <Shield className="w-4 h-4 mr-2" />
                Franqueado
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('vendedor')}
                className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
              >
                <User className="w-4 h-4 mr-2" />
                Vendedor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
