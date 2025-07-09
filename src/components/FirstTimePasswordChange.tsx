import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { APP_NAME, PASSWORD_CONFIG } from '@/constants/app';
import { validatePassword } from '@/utils/inputValidation';
import Logo from '@/components/ui/Logo';

const FirstTimePasswordChange: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    message: '',
    score: 0
  });
  
  const { currentUser, logout } = useSupabaseAuth();
  const { toast } = useToast();

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    const validation = validatePassword(password);
    setPasswordStrength(validation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordStrength.isValid) {
      toast({
        title: "Erro",
        description: "Por favor, crie uma senha que atenda aos requisitos",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      // Marcar first_login_completed como true
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ first_login_completed: true })
        .eq('user_id', currentUser?.user_id);

      if (profileError) {
        throw profileError;
      }

      toast({
        title: "Sucesso!",
        description: "Senha alterada com sucesso. Você será redirecionado para o login.",
      });

      // Aguardar um pouco para mostrar o toast
      setTimeout(() => {
        // Fazer logout para forçar novo login com a nova senha
        logout();
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar senha",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score >= 4) return 'text-green-400';
    if (passwordStrength.score >= 3) return 'text-yellow-400';
    if (passwordStrength.score >= 2) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPasswordStrengthWidth = () => {
    return `${(passwordStrength.score / 5) * 100}%`;
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader className="text-center">
          <Logo size="md" variant="icon" className="mx-auto mb-4" />
          <CardTitle className="text-white text-xl">{APP_NAME}</CardTitle>
          <p className="text-slate-400 text-sm">Troca Obrigatória de Senha</p>
        </CardHeader>
        
        <CardContent>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-medium">Primeira Vez no Sistema</span>
            </div>
            <p className="text-orange-300 text-sm">
              Por segurança, você deve criar uma nova senha pessoal para substituir a senha temporária.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="text-slate-300">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white pl-10 pr-10"
                  placeholder="Digite sua nova senha"
                  required
                  minLength={PASSWORD_CONFIG.MIN_LENGTH}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score >= 4 ? 'bg-green-500' : 
                          passwordStrength.score >= 3 ? 'bg-yellow-500' : 
                          passwordStrength.score >= 2 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: getPasswordStrengthWidth() }}
                      />
                    </div>
                  </div>
                  <p className={`text-xs ${getPasswordStrengthColor()}`}>
                    {passwordStrength.message}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="confirm-password" className="text-slate-300">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white pl-10 pr-10"
                  placeholder="Confirme sua nova senha"
                  required
                  minLength={PASSWORD_CONFIG.MIN_LENGTH}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {confirmPassword && newPassword && (
                <div className="mt-1 flex items-center gap-2">
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-xs">Senhas coincidem</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-xs">Senhas não coincidem</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs mb-2">Sua senha deve conter:</p>
              <div className="space-y-1">
                {[
                  { check: newPassword.length >= PASSWORD_CONFIG.MIN_LENGTH, text: `Pelo menos ${PASSWORD_CONFIG.MIN_LENGTH} caracteres` },
                  { check: /[A-Z]/.test(newPassword), text: 'Pelo menos uma letra maiúscula' },
                  { check: /[a-z]/.test(newPassword), text: 'Pelo menos uma letra minúscula' },
                  { check: /[0-9]/.test(newPassword), text: 'Pelo menos um número' },
                  { check: /[^a-zA-Z0-9]/.test(newPassword), text: 'Pelo menos um caractere especial' }
                ].map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {requirement.check ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <div className="w-3 h-3 border border-slate-500 rounded-full" />
                    )}
                    <span className={`text-xs ${requirement.check ? 'text-green-400' : 'text-slate-400'}`}>
                      {requirement.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading || !passwordStrength.isValid || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Alterando Senha...' : 'Alterar Senha'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-slate-400 text-xs">
              Olá, <strong className="text-white">{currentUser?.name}</strong>! 
              Após alterar sua senha, você será redirecionado para fazer login novamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirstTimePasswordChange; 