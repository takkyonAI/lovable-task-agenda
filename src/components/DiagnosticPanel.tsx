import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Info, Wifi, WifiOff } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
}

interface DiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ isOpen, onClose, userEmail }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    
    const diagnosticResults: DiagnosticResult[] = [];

    // 1. Verificar navegador
    try {
      const userAgent = navigator.userAgent;
      const isFirefox = userAgent.includes('Firefox');
      const isChrome = userAgent.includes('Chrome');
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = userAgent.includes('Android');

      diagnosticResults.push({
        name: 'Navegador',
        status: 'info',
        message: `${isFirefox ? 'Firefox' : isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Outro'} ${isIOS ? '(iOS)' : isAndroid ? '(Android)' : '(Desktop)'}`,
        details: userAgent
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Navegador',
        status: 'error',
        message: 'Erro ao detectar navegador',
        details: String(error)
      });
    }

    // 2. Verificar localStorage
    try {
      localStorage.setItem('diagnostic-test', 'test');
      localStorage.removeItem('diagnostic-test');
      diagnosticResults.push({
        name: 'LocalStorage',
        status: 'success',
        message: 'Funcionando corretamente'
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'LocalStorage',
        status: 'error',
        message: 'Não funciona - pode causar problemas de login',
        details: String(error)
      });
    }

    // 3. Verificar componentes Select
    try {
      const selectElements = document.querySelectorAll('[role="combobox"]');
      if (selectElements.length > 0) {
        diagnosticResults.push({
          name: 'Componentes Select',
          status: 'success',
          message: `${selectElements.length} componentes encontrados`,
          details: 'Dropdowns devem funcionar normalmente'
        });
      } else {
        diagnosticResults.push({
          name: 'Componentes Select',
          status: 'warning',
          message: 'Nenhum componente select encontrado',
          details: 'Pode indicar problema de carregamento'
        });
      }
    } catch (error) {
      diagnosticResults.push({
        name: 'Componentes Select',
        status: 'error',
        message: 'Erro ao verificar componentes',
        details: String(error)
      });
    }

    // 4. Verificar cliques nas tarefas
    try {
      const taskElements = document.querySelectorAll('[data-testid="task-card"], .task-card, [class*="task"]');
      if (taskElements.length > 0) {
        diagnosticResults.push({
          name: 'Cards de Tarefa',
          status: 'success',
          message: `${taskElements.length} cards encontrados`,
          details: 'Cliques devem funcionar normalmente'
        });
      } else {
        diagnosticResults.push({
          name: 'Cards de Tarefa',
          status: 'warning',
          message: 'Nenhum card de tarefa encontrado',
          details: 'Pode indicar problema de carregamento ou filtros'
        });
      }
    } catch (error) {
      diagnosticResults.push({
        name: 'Cards de Tarefa',
        status: 'error',
        message: 'Erro ao verificar cards',
        details: String(error)
      });
    }

    // 5. Verificar conexão com Supabase
    try {
      const supabaseCheck = (window as any).supabase !== undefined;
      if (supabaseCheck) {
        diagnosticResults.push({
          name: 'Supabase',
          status: 'success',
          message: 'Cliente carregado corretamente'
        });
      } else {
        diagnosticResults.push({
          name: 'Supabase',
          status: 'error',
          message: 'Cliente não carregado',
          details: 'Problemas de conexão com banco de dados'
        });
      }
    } catch (error) {
      diagnosticResults.push({
        name: 'Supabase',
        status: 'error',
        message: 'Erro ao verificar conexão',
        details: String(error)
      });
    }

    // 6. Verificar erros no console
    try {
      const lastError = localStorage.getItem('last-error');
      if (lastError) {
        const errorData = JSON.parse(lastError);
        diagnosticResults.push({
          name: 'Último Erro',
          status: 'error',
          message: errorData.error || 'Erro desconhecido',
          details: `${errorData.timestamp} - ${errorData.url}`
        });
      } else {
        diagnosticResults.push({
          name: 'Histórico de Erros',
          status: 'success',
          message: 'Nenhum erro recente encontrado'
        });
      }
    } catch (error) {
      diagnosticResults.push({
        name: 'Histórico de Erros',
        status: 'warning',
        message: 'Não foi possível verificar erros',
        details: String(error)
      });
    }

    // 7. Verificar viewport e responsividade
    try {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      };

      const isMobile = viewport.width < 768;
      diagnosticResults.push({
        name: 'Viewport',
        status: 'info',
        message: `${viewport.width}x${viewport.height} (${isMobile ? 'Mobile' : 'Desktop'})`,
        details: `DPR: ${viewport.devicePixelRatio}`
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Viewport',
        status: 'error',
        message: 'Erro ao verificar viewport',
        details: String(error)
      });
    }

    // 8. Verificar usuário específico (se fornecido)
    if (userEmail) {
      diagnosticResults.push({
        name: 'Usuário Atual',
        status: 'info',
        message: userEmail,
        details: userEmail.includes('tatiana') ? 'Usuário com problemas reportados' : 'Usuário normal'
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostic();
    }
  }, [isOpen]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'bg-green-500/20 text-green-400',
      warning: 'bg-yellow-500/20 text-yellow-400',
      error: 'bg-red-500/20 text-red-400',
      info: 'bg-blue-500/20 text-blue-400'
    };

    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              🔍 Diagnóstico do Sistema
              {userEmail && (
                <Badge variant="outline" className="text-slate-300">
                  {userEmail}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={runDiagnostic}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? '🔄 Executando...' : '🔍 Executar Diagnóstico'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('last-error');
                  runDiagnostic();
                }}
                className="border-slate-600 text-slate-300"
              >
                🗑️ Limpar Erros
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{result.name}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-slate-300 text-sm">{result.message}</p>
                      {result.details && (
                        <p className="text-slate-400 text-xs mt-1 break-all">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && !isRunning && (
              <div className="text-center py-8 text-slate-400">
                Clique em "Executar Diagnóstico" para começar
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 