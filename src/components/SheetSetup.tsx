
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileSpreadsheet, Settings, AlertCircle, Loader2 } from 'lucide-react';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useToast } from '@/hooks/use-toast';

const SheetSetup: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const googleSheets = useGoogleSheets();
  const { toast } = useToast();

  const handleSetupSheets = async () => {
    setIsLoading(true);
    try {
      console.log('Iniciando configuração da planilha...');
      const success = await googleSheets.setupSheets();
      
      if (success) {
        setIsSetupComplete(true);
        toast({
          title: "Planilha configurada com sucesso!",
          description: "As abas 'Tarefas' e 'Usuários' foram criadas com todas as colunas necessárias.",
        });
        console.log('✅ Planilha configurada com sucesso');
      } else {
        toast({
          title: "Erro na configuração",
          description: "Não foi possível configurar a planilha. Verifique os logs para mais detalhes.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao configurar planilha:', error);
      toast({
        title: "Erro na configuração",
        description: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
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
              <p className="text-slate-400 text-sm">Configure as abas e colunas necessárias para o banco de dados</p>
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
            
            <Button 
              onClick={handleSetupSheets}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  {isSetupComplete ? 'Reconfigurar' : 'Configurar Planilha'}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <h4 className="text-emerald-400 font-medium mb-2">✅ Conectado ao Google Sheets</h4>
            <p className="text-sm text-slate-300">
              Agora você pode configurar a estrutura da planilha para armazenar suas tarefas e usuários.
            </p>
          </div>

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
            <h4 className="text-blue-400 font-medium mb-2">O que acontecerá:</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Criação automática das abas "Tarefas" e "Usuários"</li>
              <li>• Configuração dos cabeçalhos das colunas</li>
              <li>• Estrutura pronta para armazenar dados do sistema</li>
              <li>• Sincronização automática com o aplicativo</li>
            </ul>
          </div>

          {googleSheets.error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <h4 className="text-red-400 font-medium mb-2">Erro:</h4>
              <p className="text-sm text-slate-300">{googleSheets.error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SheetSetup;
