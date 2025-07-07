import { useState, useCallback, useEffect } from 'react';
import { Task } from '../types/task';
import { User } from '../types/user';
import { setupSheetsStructure, fetchSheetData, appendSheetData, updateSheetData, isTokenValid } from '../utils/googleSheetsApi';
import { rowToTask, taskToRow, rowToUser, userToRow } from '../utils/googleSheetsConverters';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  clientId: string;
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
        // Verificar se ainda está autenticado
        if (isTokenValid()) {
          setIsConfigured(true);
        }
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
      clientId: newConfig.clientId 
    });
  }, []);

  const loadConfig = useCallback(() => {
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        if (isTokenValid()) {
          setIsConfigured(true);
        }
        return parsedConfig;
      } catch (err) {
        console.error('Erro ao carregar configuração:', err);
      }
    }
    return null;
  }, []);

  const setupSheets = useCallback(async () => {
    if (!config) return false;

    try {
      setIsLoading(true);
      setError(null);
      console.log('Configurando planilha com estrutura inicial...');
      
      const success = await setupSheetsStructure(
        config.spreadsheetId, 
        config.clientId
      );
      
      if (success) {
        console.log('Planilha configurada com sucesso');
      }
      
      return success;
    } catch (err) {
      console.error('Erro ao configurar planilha:', err);
      setError(`Erro ao configurar a estrutura da planilha: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return false;
    } finally {
      setIsLoading(false);
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
      
      const values = await fetchSheetData(
        config.spreadsheetId,
        config.clientId,
        'Tarefas!A2:M'
      );

      const tasks: Task[] = [];
      for (const row of values) {
        if (row[0]) { // Só processar se tiver ID
          tasks.push(rowToTask(row));
        }
      }

      console.log('Tarefas carregadas:', tasks.length);
      return tasks;
    } catch (err) {
      const errorMessage = 'Erro ao buscar tarefas do Google Sheets';
      console.error(errorMessage, err);
      setError(`${errorMessage}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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

      const rowData = taskToRow(newTask);

      await appendSheetData(
        config.spreadsheetId,
        config.clientId,
        'Tarefas!A:M',
        [rowData]
      );

      console.log('Tarefa adicionada com sucesso:', newTask.id);
      return newTask;
    } catch (err) {
      const errorMessage = 'Erro ao adicionar tarefa no Google Sheets';
      console.error(errorMessage, err);
      setError(`${errorMessage}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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

      // Primeiro, buscar a tarefa atual
      const values = await fetchSheetData(
        config.spreadsheetId,
        config.clientId,
        'Tarefas!A2:M'
      );

      let rowIndex = -1;
      let currentTask: Task | null = null;

      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        if (row[0] === taskId) {
          rowIndex = i + 2; // +2 porque começamos na linha 2 (A2)
          currentTask = rowToTask(row);
          break;
        }
      }

      if (!currentTask || rowIndex === -1) {
        throw new Error('Tarefa não encontrada');
      }

      const updatedTask: Task = {
        ...currentTask,
        ...updates,
        updatedAt: new Date()
      };

      const rowData = taskToRow(updatedTask);

      await updateSheetData(
        config.spreadsheetId,
        config.clientId,
        `Tarefas!A${rowIndex}:M${rowIndex}`,
        [rowData]
      );

      console.log('Tarefa atualizada com sucesso:', taskId);
      return updatedTask;
    } catch (err) {
      const errorMessage = 'Erro ao atualizar tarefa no Google Sheets';
      console.error(errorMessage, err);
      setError(`${errorMessage}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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
      
      const values = await fetchSheetData(
        config.spreadsheetId,
        config.clientId,
        'Usuários!A2:G'
      );

      const users: User[] = [];
      for (const row of values) {
        if (row[0]) { // Só processar se tiver ID
          users.push(rowToUser(row));
        }
      }

      console.log('Usuários carregados:', users.length);
      return users;
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

    setIsLoading(true);
    try {
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date(),
        isActive: userData.isActive !== false // Default para true se não especificado
      };

      const rowData = userToRow(newUser);

      await appendSheetData(
        config.spreadsheetId,
        config.clientId,
        'Usuários!A:G',
        [rowData]
      );

      console.log('Usuário adicionado:', newUser.email);
      return newUser;
    } catch (err) {
      console.error('Erro ao adicionar usuário:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, config]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>): Promise<User> => {
    if (!isConfigured || !config) {
      throw new Error('Google Sheets não configurado');
    }

    setIsLoading(true);
    try {
      console.log('Atualizando usuário na planilha:', userId);

      // Buscar usuário atual
      const values = await fetchSheetData(
        config.spreadsheetId,
        config.clientId,
        'Usuários!A2:G'
      );

      let rowIndex = -1;
      let currentUser: User | null = null;

      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        if (row[0] === userId) {
          rowIndex = i + 2;
          currentUser = rowToUser(row);
          break;
        }
      }

      if (!currentUser || rowIndex === -1) {
        throw new Error('Usuário não encontrado');
      }

      const updatedUser: User = {
        ...currentUser,
        ...updates
      };

      const rowData = userToRow(updatedUser);

      await updateSheetData(
        config.spreadsheetId,
        config.clientId,
        `Usuários!A${rowIndex}:G${rowIndex}`,
        [rowData]
      );

      console.log('Usuário atualizado com sucesso:', userId);
      return updatedUser;
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, config]);

  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    if (!isConfigured || !config) {
      throw new Error('Google Sheets não configurado');
    }

    setIsLoading(true);
    try {
      console.log('Excluindo usuário da planilha:', userId);

      // Buscar linha do usuário
      const values = await fetchSheetData(
        config.spreadsheetId,
        config.clientId,
        'Usuários!A2:G'
      );

      let rowIndex = -1;
      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        if (row[0] === userId) {
          rowIndex = i + 2;
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error('Usuário não encontrado');
      }

      // Deletar linha
      const requests = [{
        deleteDimension: {
          range: {
            sheetId: 0, // Assumindo que é a primeira aba
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex
          }
        }
      }];

      const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`;
      await fetch(batchUpdateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('google_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      console.log('Usuário excluído com sucesso:', userId);
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
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
    setupSheets,
    fetchTasks,
    addTask,
    updateTask,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser
  };
};
