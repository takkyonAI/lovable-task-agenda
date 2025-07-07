import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Check, X, LogOut, RefreshCw, Info, AlertTriangle, Copy } from 'lucide-react';
import { initGoogleAuth, getOAuthToken, isTokenValid, disconnectGoogle, listUserSpreadsheets, getAllPossibleOrigins } from '@/utils/googleSheetsApi';

interface GoogleSheetsConfigProps {
  onConfigSave: (config: {
    spreadsheetId: string;
    clientId: string;
  }) => void;
  isConfigured: boolean;
}

interface Spreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
}

const GoogleSheetsConfig: React.FC<GoogleSheetsConfigProps> = ({ onConfigSave, isConfigured }) => {
  const [clientId, setClientId] = useState('72324115240-q1idjsb043dl7ifr1jf7hc6itthvofqk.apps.googleusercontent.com');
  const [spreadsheetId, setSpreadsheetId] = useState('1Qj3JSlBYh1ScYpOhpyyz14nmoJ9b0I8MVsnyBYqNZWs');
  const [isExpanded, setIsExpanded] = useState(!isConfigured);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [showSpreadsheetSelect, setShowSpreadsheetSelect] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  useEffect(() => {
    setIsAuthenticated(isTokenValid());
  }, []);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'N/A';
  const allOrigins = getAllPossibleOrigins();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGoogleAuth = async () => {
    if (!clientId) {
      alert('Por favor, insira o Client ID primeiro');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log('🔄 Iniciando processo de autenticação...');
      console.log('Client ID:', clientId);
      console.log('Origem atual:', window.location.origin);
      
      // Inicializar Google Identity Services
      const initialized = await initGoogleAuth(clientId);
      if (!initialized) {
        throw new Error('Falha ao inicializar Google Identity Services');
      }

      // Obter token OAuth
      await getOAuthToken(clientId);
      setIsAuthenticated(true);
      
      console.log('✅ Autenticação realizada com sucesso!');
      
      // Buscar planilhas do usuário
      await loadUserSpreadsheets();
      
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setAuthError(errorMessage);
      
      // Mostrar alerta apenas para erros que não são de configuração
      if (!errorMessage.includes('redirect_uri_mismatch')) {
        alert(`Erro na autenticação: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogle();
    setIsAuthenticated(false);
    setSpreadsheets([]);
    setShowSpreadsheetSelect(false);
    console.log('Desconectado do Google');
  };

  const loadUserSpreadsheets = async () => {
    if (!isAuthenticated || !clientId) return;

    try {
      setIsLoading(true);
      console.log('Carregando planilhas do usuário...');
      const userSpreadsheets = await listUserSpreadsheets(clientId);
      setSpreadsheets(userSpreadsheets);
      setShowSpreadsheetSelect(true);
      console.log('Planilhas carregadas:', userSpreadsheets.length);
    } catch (error) {
      console.error('Erro ao carregar planilhas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (clientId && spreadsheetId && isAuthenticated) {
      onConfigSave({
        clientId,
        spreadsheetId
      });
      setIsExpanded(false);
    }
  };

  const handleSpreadsheetSelect = (selectedId: string) => {
    setSpreadsheetId(selectedId);
    const selected = spreadsheets.find(s => s.id === selectedId);
    console.log('Planilha selecionada:', selected?.name);
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Configuração Google Sheets</CardTitle>
              <p className="text-slate-400 text-sm">Conecte com sua conta Google</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${isConfigured && isAuthenticated ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConfigured && isAuthenticated ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Conectado
                </>
              ) : (
                <>
                  <X className="w-3 h-3 mr-1" />
                  Desconectado
                </>
              )}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white"
            >
              {isExpanded ? 'Fechar' : 'Configurar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 text-sm font-medium mb-2">
                  CONFIGURAÇÃO OAUTH NECESSÁRIA
                </p>
                <div className="text-slate-300 text-xs space-y-2">
                  <p><strong>Origem atual detectada:</strong></p>
                  <div className="flex items-center space-x-2 p-2 bg-slate-700/50 rounded font-mono text-xs">
                    <span className="flex-1">{currentOrigin}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(currentOrigin)}
                      className="h-6 w-6 p-0 hover:bg-slate-600/50"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
            >
              {showConfigHelp ? 'Ocultar' : 'Mostrar'} Instruções Detalhadas
            </Button>
            
            {showConfigHelp && (
              <div className="mt-3 p-3 bg-slate-900/50 rounded text-xs text-slate-300 space-y-2">
                <p><strong>PASSO A PASSO - Google Cloud Console:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Acesse: <code>console.cloud.google.com</code></li>
                  <li>Vá para: APIs & Services → Credentials</li>
                  <li>Encontre o Client ID OAuth 2.0</li>
                  <li>Clique em ✏️ para editar</li>
                  <li>Em "Authorized JavaScript origins" adicione:</li>
                </ol>
                
                <div className="ml-4 space-y-1">
                  {allOrigins.map(origin => (
                    <div key={origin} className="flex items-center space-x-2 p-1 bg-slate-700/30 rounded">
                      <code className="flex-1 text-green-400">{origin}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(origin)}
                        className="h-5 w-5 p-0"
                      >
                        <Copy className="w-2 h-2" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <p className="text-yellow-400"><strong>6. REMOVA TODAS as "Authorized redirect URIs"</strong></p>
                <p>7. Salve e aguarde 5-10 minutos para propagação</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="clientId" className="text-slate-300">Client ID do OAuth 2.0</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white font-mono text-xs"
              placeholder="Client ID do Google Cloud Console"
            />
          </div>

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <pre className="text-red-400 text-xs whitespace-pre-wrap">{authError}</pre>
            </div>
          )}

          {!isAuthenticated ? (
            <Button 
              onClick={handleGoogleAuth}
              disabled={!clientId || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar com Google'
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Conectado ao Google</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Desconectar
                </Button>
              </div>

              {showSpreadsheetSelect && spreadsheets.length > 0 && (
                <div>
                  <Label className="text-slate-300">Selecionar Planilha</Label>
                  <Select value={spreadsheetId} onValueChange={handleSpreadsheetSelect}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Escolha uma planilha" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {spreadsheets.map((sheet) => (
                        <SelectItem 
                          key={sheet.id} 
                          value={sheet.id}
                          className="text-white hover:bg-slate-700"
                        >
                          {sheet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="spreadsheetId" className="text-slate-300">ID da Planilha</Label>
                <Input
                  id="spreadsheetId"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="ID da planilha ou selecione acima"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Extraído automaticamente da URL fornecida
                </p>
              </div>

              <Button 
                onClick={handleSave}
                disabled={!spreadsheetId || isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Salvar Configuração
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default GoogleSheetsConfig;
