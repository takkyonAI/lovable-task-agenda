
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileSpreadsheet, Settings, AlertCircle } from 'lucide-react';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';

const SheetSetup: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const googleSheets = useGoogleSheets();

  const handleSetupSheets = async () => {
    setIsLoading(true);
    try {
      const success = await googleSheets.setupSheets();
      if (success) {
        setIsSetupComplete(true);
      }
    } catch (error) {
      console.error('Erro ao configurar planilha:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sheetStructure = [
    {
      name: 'Tarefas',
      columns: [
        'ID', 'Título', 'Descrição', 'Tipo', 'Prioridade', 'Status',
        'Data Agendada', 'Data Conclusão', 'Categoria', 'Tempo Estimado',
        'Criado Em', 'Atualizado Em', 'Usuário ID'
      ]
    },
    {
      name: 'Usuários',
      columns: [
        'ID', 'Nome', 'Email', 'Papel', 'Criado Em', 'Último Login'
      ]
    }
  ];

  if (!googleSheets.isConfigured) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-slate-400">Configure o Google Sheets primeiro</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Estrutura da Planilha</CardTitle>
              <p className="text-slate-400 text-sm">Configure as abas e colunas necessárias</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${isSetupComplete ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {isSetupComplete ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configurado
                </>
              ) : (
                <>
                  <Settings className="w-3 h-3 mr-1" />
                  Pendente
                </>
              )}
            </Badge>
            
            {!isSetupComplete && (
              <Button 
                onClick={handleSetupSheets}
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {isLoading ? 'Configurando...' : 'Configurar Planilha'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {sheetStructure.map(sheet => (
            <div key={sheet.name} className="space-y-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium">Aba: {sheet.name}</h3>
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  {sheet.columns.length} colunas
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sheet.columns.map(column => (
                  <div key={column} className="p-2 bg-slate-700/30 rounded text-sm text-slate-300 border border-slate-600">
                    {column}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">Instruções de Configuração:</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>1. Certifique-se de que a planilha está compartilhada com a conta de serviço</li>
              <li>2. A planilha será configurada automaticamente com as abas necessárias</li>
              <li>3. Os dados serão organizados conforme a estrutura mostrada acima</li>
              <li>4. Mantenha a primeira linha de cada aba como cabeçalho</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SheetSetup;
