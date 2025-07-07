
import { useState, useCallback, useEffect } from 'react';
import { Task } from '../types/task';
import { User } from '../types/user';

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

  // Carregar configuração na inicialização
  useEffect(() => {
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        setIsConfigured(true);
      } catch (err) {
        console.error('Erro ao carregar configuração:', err);
      }
    }
  }, []);

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

  const setupSheets = useCallback(async () => {
    if (!config) return;

    try {
      console.log('Configurando planilha com estrutura inicial...');
      
      // Aqui implementaríamos a criação das abas e estrutura da planilha
      // Por enquanto, vamos simular a configuração
      
      // Estrutura da aba "Tarefas":
      // A1:M1 - Cabeçalhos: ID, Título, Descrição, Tipo, Prioridade, Status, Data Agendada, Data Conclusão, Categoria, Tempo Estimado, Criado Em, Atualizado Em, Usuário ID
      
      // Estrutura da aba "Usuários":
      // A1:F1 - Cabeçalhos: ID, Nome, Email, Papel, Criado Em, Último Login
      
      console.log('Planilha configurada com sucesso');
      return true;
    } catch (err) {
      console.error('Erro ao configurar planilha:', err);
      setError('Erro ao configurar a estrutura da planilha');
      return false;
    }
  }, [config]);

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
          title: 'Configurar sistema de usuários',
          description: 'Implementar controle de acesso e permissões',
          type: 'manual',
          priority: 'alta',
          status: 'pendente',
          scheduledDate: new Date(),
          category: 'desenvolvimento',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Testar integração Google Sheets',
          description: 'Verificar se os dados estão sendo salvos corretamente',
          type: 'manual',
          priority: 'media',
          status: 'concluido',
          scheduledDate: new Date(Date.now() - 86400000),
          completedDate: new Date(),
          category: 'testes',
          createdAt: new Date(Date.now() - 86400000),
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

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<Task> => {
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

      // Aqui implementaríamos a adição real na planilha
      // Por enquanto, simulamos o sucesso
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
        category: updates.category || 'geral',
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

  const fetchUsers = useCallback(async (): Promise<User[]> => {
    if (!isConfigured || !config) {
      return [];
    }

    setIsLoading(true);
    try {
      console.log('Buscando usuários da planilha...');
      
      // Simulação - em produção buscaria da aba "Usuários"
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Administrador',
          email: 'admin@sistema.com',
          role: 'admin',
          createdAt: new Date(),
          lastLogin: new Date()
        }
      ];

      return mockUsers;
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, config]);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    if (!isConfigured || !config) {
      throw new Error('Google Sheets não configurado');
    }

    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    console.log('Usuário adicionado:', newUser.email);
    return newUser;
  }, [isConfigured, config]);

  return {
    isConfigured,
    isLoading,
    error,
    saveConfig,
    loadConfig,
    setupSheets,
    fetchTasks,
    addTask,
    updateTask,
    fetchUsers,
    addUser
  };
};
