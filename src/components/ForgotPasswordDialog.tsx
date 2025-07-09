import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { sanitizeInput } from '@/utils/inputValidation';

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { resendTemporaryPassword } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await resendTemporaryPassword(email);
      if (success) {
        setIsEmailSent(true);
      }
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsEmailSent(false);
    onClose();
  };

  const handleBackToLogin = () => {
    setIsEmailSent(false);
    setEmail('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            {isEmailSent ? '✅ Email Enviado!' : '🔑 Esqueci minha senha'}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-center">
            {isEmailSent 
              ? 'Verifique seu email para receber a nova senha temporária'
              : 'Digite seu email para receber uma nova senha temporária'
            }
          </DialogDescription>
        </DialogHeader>

        {isEmailSent ? (
          // Tela de sucesso
          <div className="space-y-4 py-4">
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-center">
              <div className="text-green-400 text-lg mb-2">📧</div>
              <p className="text-green-100 text-sm">
                Uma nova senha temporária foi enviada para:
              </p>
              <p className="text-green-200 font-medium mt-1">
                {email}
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <p className="text-blue-100 text-sm mb-2">
                <strong>📋 Próximos passos:</strong>
              </p>
              <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                <li>Verifique sua caixa de entrada (e spam)</li>
                <li>Copie a senha temporária do email</li>
                <li>Faça login com sua nova senha</li>
                <li>Você será solicitado a criar uma nova senha</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleBackToLogin}
                variant="outline"
                className="flex-1 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          // Formulário de recuperação
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="forgot-email" className="text-slate-300 text-sm">
                Email cadastrado
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                  className="bg-slate-700/50 border-slate-600 text-white pl-10"
                  placeholder="seu@email.com"
                  required
                  maxLength={100}
                  disabled={isLoading}
                />
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Digite o email usado para criar sua conta
              </p>
            </div>

            <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-3">
              <p className="text-amber-100 text-sm">
                <strong>⚠️ Importante:</strong> Uma nova senha temporária será enviada para este email. 
                Você precisará alterá-la no primeiro acesso.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Nova Senha
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog; 