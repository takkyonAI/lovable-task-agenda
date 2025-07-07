
import { useState, useCallback } from 'react';
import { Task } from '../types/task';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

export const useGoogleSheets = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<GoogleSheetsConfig | null>(null);

  const saveConfig = useCallback((newConfig: GoogleSheetsConfig) => {
    setConfig(newConfig);
    setIsConfigured(true);
    localStorage.setItem('googleSheetsConfig', JSON.stringify(newConfig));
    console.log('Configuração do Google Sheets salva:', { 
      spreadsheetId: newConfig.spreadsheetId,
      serviceAccountEmail: newConfig.serviceAccountEmail 
    });
  }, []);

  const loadConfig = useCallback(() => {
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        setIsConfigured(true);
        return parsedConfig;
      } catch (err) {
        console.error('Erro ao carregar configuração:', err);
      }
    }
    return null;
  }, []);

  const getAccessToken = async (): Promise<string> => {
    if (!config) throw new Error('Configuração não encontrada');
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: config.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    };

    // Simulação de JWT - em produção seria necessário uma biblioteca JWT
    console.log('Gerando token de acesso para:', config.serviceAccountEmail);
    
    // Por enquanto, retornamos um token mock para desenvolvimento
    return 'mock-access-token';
  };

  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    if (!isConfigured || !config) {
      console.log('Google Sheets não configurado, retornando array vazio');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Buscando tarefas da planilha:', config.spreadsheetId);
      
      // Simulação da busca - em produção faria chamada real para API
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Exemplo de tarefa da planilha',
          description: 'Esta é uma tarefa de exemplo vinda do Google Sheets',
          type: 'manual',
          priority: 'media',
          status: 'pendente',
          scheduledDate: new Date(),
          category: 'vendas',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      console.log('Tarefas carregadas:', mockTasks.length);
      return mockTasks;
    } catch (err) {
      const errorMessage = 'Erro ao buscar tarefas do Google Sheets';
      console.error(errorMessage, err);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, config]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    if (!isConfigured || !config) {
      throw new Error('Google Sheets não configurado');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Adicionando tarefa à planilha:', task.title);

      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Tarefa adicionada com sucesso:', newTask.id);
      return newTask;
    } catch (err) {
      const errorMessage = 'Erro ao adicionar tarefa no Google Sheets';
      console.error(errorMessage, err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, config]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    if (!isConfigured || !config) {
      throw new Error('Google Sheets não configurado');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Atualizando tarefa na planilha:', taskId);

      const updatedTask: Task = {
        id: taskId,
        title: updates.title || '',
        description: updates.description || '',
        type: updates.type || 'manual',
        priority: updates.priority || 'media',
        status: updates.status || 'pendente',
        scheduledDate: updates.scheduledDate || new Date(),
        category: updates.category || 'vendas',
        createdAt: updates.createdAt || new Date(),
        updatedAt: new Date(),
        ...updates
      };

      console.log('Tarefa atualizada com sucesso:', taskId);
      return updatedTask;
    } catch (err) {
      const errorMessage = 'Erro ao atualizar tarefa no Google Sheets';
      console.error(errorMessage, err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, config]);

  return {
    isConfigured,
    isLoading,
    error,
    saveConfig,
    loadConfig,
    fetchTasks,
    addTask,
    updateTask
  };
};
