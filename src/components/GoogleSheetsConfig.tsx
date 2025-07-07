
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Check, X } from 'lucide-react';

interface GoogleSheetsConfigProps {
  onConfigSave: (config: {
    spreadsheetId: string;
    serviceAccountEmail: string;
    privateKey: string;
  }) => void;
  isConfigured: boolean;
}

const GoogleSheetsConfig: React.FC<GoogleSheetsConfigProps> = ({ onConfigSave, isConfigured }) => {
  const [spreadsheetId, setSpreadsheetId] = useState('1Wz0K6XzVwg4zqwd537UifG_w8IQYaRCg1WbY4ZbUEow');
  const [serviceAccountEmail, setServiceAccountEmail] = useState('gerenciador-de-tarefas-rocknvt@gerenciador-de-tarefas-rocknvt.iam.gserviceaccount.com');
  const [privateKey, setPrivateKey] = useState('');
  const [isExpanded, setIsExpanded] = useState(!isConfigured);

  const handleSave = () => {
    if (spreadsheetId && serviceAccountEmail && privateKey) {
      onConfigSave({
        spreadsheetId,
        serviceAccountEmail,
        privateKey
      });
      setIsExpanded(false);
    }
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
              <p className="text-slate-400 text-sm">Configure a integração com sua planilha</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${isConfigured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConfigured ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Configurado
                </>
              ) : (
                <>
                  <X className="w-3 h-3 mr-1" />
                  Não Configurado
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
          <div>
            <Label htmlFor="spreadsheetId" className="text-slate-300">ID da Planilha</Label>
            <Input
              id="spreadsheetId"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="ID da planilha do Google Sheets"
            />
            <p className="text-xs text-slate-400 mt-1">
              Extraído da URL: https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit
            </p>
          </div>
          
          <div>
            <Label htmlFor="serviceAccountEmail" className="text-slate-300">Email da Conta de Serviço</Label>
            <Input
              id="serviceAccountEmail"
              value={serviceAccountEmail}
              onChange={(e) => setServiceAccountEmail(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="exemplo@projeto.iam.gserviceaccount.com"
            />
          </div>
          
          <div>
            <Label htmlFor="privateKey" className="text-slate-300">Chave Privada</Label>
            <Textarea
              id="privateKey"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              rows={4}
            />
            <p className="text-xs text-slate-400 mt-1">
              Cole aqui a chave privada do arquivo JSON da conta de serviço
            </p>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={!spreadsheetId || !serviceAccountEmail || !privateKey}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Salvar Configuração
          </Button>
          
          <div className="text-xs text-slate-400 space-y-1">
            <p><strong>Instruções:</strong></p>
            <p>1. Compartilhe a planilha com o email da conta de serviço</p>
            <p>2. Cole a chave privada do arquivo JSON</p>
            <p>3. Clique em "Salvar Configuração"</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default GoogleSheetsConfig;
