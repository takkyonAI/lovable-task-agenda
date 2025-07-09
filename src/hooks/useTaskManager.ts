import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';

export const useTaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'baixa' | 'media' | 'urgente'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'>('all');
  
  // 🚀 MELHORIAS REAL-TIME: Novos estados para controle de sincronização
  const [newTasksCount, setNewTasksCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);

  const { currentUser } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Refs para evitar race conditions
  const isLoadingRef = useRef(false);
  const loadTasksTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função debounced para carregar tarefas
  const debouncedLoadTasks = useCallback(() => {
    if (loadTasksTimeoutRef.current) {
      clearTimeout(loadTasksTimeoutRef.current);
    }
    
    loadTasksTimeoutRef.current = setTimeout(() => {
      if (!isLoadingRef.current) {
        loadTasks();
      }
    }, 300);
  }, []);

  // 🔄 MELHORIA: Auto-refresh periódico como fallback
  const setupAutoRefresh = useCallback(() => {
    if (autoRefreshTimeoutRef.current) {
      clearTimeout(autoRefreshTimeoutRef.current);
    }
    
    autoRefreshTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Auto-refresh: Verificando atualizações...');
      loadTasks();
      setupAutoRefresh(); // Reagenda para 2 minutos
    }, 120000); // 2 minutos
  }, []);

  // 💓 MELHORIA: Heartbeat para verificar conectividade real-time
  const setupHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    
    heartbeatTimeoutRef.current = setTimeout(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateTime;
      if (timeSinceLastUpdate > 300000) { // 5 minutos sem updates
        console.log('⚠️ Heartbeat: Sem atualizações há 5 minutos, forçando refresh...');
        loadTasks();
      }
      setupHeartbeat(); // Reagenda para 1 minuto
    }, 60000); // 1 minuto
  }, [lastUpdateTime]);

  // 🔔 MELHORIA: Função para mostrar notificação de nova tarefa
  const showNewTaskNotification = useCallback((task: Task, isCreatedByCurrentUser: boolean) => {
    if (!isCreatedByCurrentUser && currentUser) {
      // Só mostra notificação se a tarefa não foi criada pelo usuário atual
      const creatorName = task.created_by || 'Usuário';
      
      toast({
        title: "📋 Nova Tarefa Criada!",
        description: `"${task.title}" foi criada por ${creatorName}`,
        duration: 5000,
        variant: "default"
      });
      
      // Incrementar contador de novas tarefas
      setNewTasksCount(prev => prev + 1);
      
      // Resetar contador após 10 segundos
      setTimeout(() => {
        setNewTasksCount(prev => Math.max(0, prev - 1));
      }, 10000);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    loadTasks();
    setupAutoRefresh();
    setupHeartbeat();
    
    // Hybrid real-time + polling approach
    let channel: any = null;
    let pollingInterval: NodeJS.Timeout | null = null;
    let realTimeAttempts = 0;
    const maxRealTimeAttempts = 3;
    
    console.log('🔄 Setting up hybrid real-time/polling system...');
    
    // Wait for auth before setting up real-time
    if (!currentUser) {
      console.log('⏳ Waiting for user authentication...');
      return;
    }
    
    // Setup polling as immediate fallback
    const setupPolling = () => {
      console.log('📊 Setting up polling fallback (30s intervals)...');
      pollingInterval = setInterval(() => {
        console.log('🔄 Polling update...');
        loadTasks();
        setLastUpdateTime(Date.now());
      }, 30000); // Poll every 30 seconds
      
      toast({
        title: "📊 Modo Polling Ativo",
        description: "Atualizações automáticas a cada 30 segundos",
        duration: 3000
      });
    };
    
    const attemptRealTimeConnection = () => {
      if (realTimeAttempts >= maxRealTimeAttempts) {
        console.log('❌ Max real-time attempts reached, using polling only');
        setupPolling();
        return;
      }
      
      realTimeAttempts++;
      console.log(`🔄 Real-time attempt ${realTimeAttempts}/${maxRealTimeAttempts}...`);
      
      try {
        // Clean up existing channel
        if (channel) {
          supabase.removeChannel(channel);
        }
        
        // Create channel with timeout
        const connectionTimeout = setTimeout(() => {
          console.warn('⏰ Real-time connection timeout, falling back to polling');
          setIsRealTimeConnected(false);
          setupPolling();
        }, 10000); // 10 second timeout
        
        channel = supabase
          .channel(`tasks_${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks'
            },
            (payload) => {
              console.log('🎯 Real-time event received:', payload.eventType);
              setIsRealTimeConnected(true);
              setLastUpdateTime(Date.now());
              
              // Clear polling if real-time works
              if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
              }
              
              debouncedLoadTasks();
            }
          )
          .subscribe((status) => {
            console.log('🔗 Real-time status:', status);
            
            if (status === 'SUBSCRIBED') {
              clearTimeout(connectionTimeout);
              console.log('✅ Real-time connected successfully!');
              setIsRealTimeConnected(true);
              
              // Clear polling since real-time is working
              if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
              }
              
              toast({
                title: "✅ Real-time Conectado",
                description: "Atualizações instantâneas habilitadas!",
                duration: 3000
              });
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              clearTimeout(connectionTimeout);
              console.warn(`🔒 Real-time ${status.toLowerCase()}, attempt ${realTimeAttempts}/${maxRealTimeAttempts}`);
              setIsRealTimeConnected(false);
              
              // Retry or fall back to polling
              if (realTimeAttempts < maxRealTimeAttempts) {
                setTimeout(() => attemptRealTimeConnection(), 5000);
              } else {
                setupPolling();
              }
            }
          });
        
      } catch (error) {
        console.error('❌ Real-time setup error:', error);
        setIsRealTimeConnected(false);
        
        if (realTimeAttempts < maxRealTimeAttempts) {
          setTimeout(() => attemptRealTimeConnection(), 5000);
        } else {
          setupPolling();
        }
      }
    };
    
    // Start with real-time attempt
    attemptRealTimeConnection();

    return () => {
      console.log('🧹 Cleaning up hybrid system...');
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (loadTasksTimeoutRef.current) {
        clearTimeout(loadTasksTimeoutRef.current);
      }
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    };
  }, [currentUser, debouncedLoadTasks, toast]);

  useEffect(() => {
    filterTasks();
  }, [tasks, activeFilter, selectedUser, selectedAccessLevel, selectedPriority, selectedStatus]);

  /**
   * Carrega todas as tarefas do banco de dados
   */
  const loadTasks = async () => {
    if (isLoadingRef.current) {
      console.log('loadTasks already in progress, skipping...');
      return;
    }
    
    setIsLoading(true);
    isLoadingRef.current = true;
    
    try {
      console.log('🔍 loadTasks - Starting to load tasks...');
      
      // Clear any potential Supabase cache
      await supabase.auth.getSession();
      
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 loadTasks - Raw taskData from DB:', taskData?.length || 0);
      console.log('🔍 loadTasks - Task error:', taskError);
      console.log('🔍 loadTasks - Current user:', currentUser?.user_id);

      if (taskError) {
        console.error('Erro ao carregar tarefas:', taskError);
        toast({
          title: "Erro ao carregar tarefas",
          description: "Não foi possível carregar as tarefas. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      if (taskData) {
        console.log('🔍 loadTasks - Processing tasks...');
        
        const formattedTasks: Task[] = taskData.map((task: any) => {
          // Map "alta" priority to "urgente" for backward compatibility
          let priority: 'baixa' | 'media' | 'urgente' = task.priority as 'baixa' | 'media' | 'urgente';
          if (task.priority === 'alta') {
            priority = 'urgente';
          }

          const formattedTask: Task = {
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status as 'pendente' | 'em_andamento' | 'concluida' | 'cancelada',
            priority: priority,
            due_date: task.due_date || undefined,
            assigned_users: task.assigned_users || [],
            created_by: task.created_by,
            created_at: new Date(task.created_at),
            updated_at: new Date(task.updated_at),
            completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
            is_private: task.is_private ?? false,
            edited_by: task.edited_by || undefined,
            edited_at: task.edited_at ? new Date(task.edited_at) : undefined
          };
          
          return formattedTask;
        });

        console.log('🔍 loadTasks - Formatted tasks count:', formattedTasks.length);
        console.log('🔍 loadTasks - First 3 tasks:', formattedTasks.slice(0, 3).map(t => ({
          id: t.id,
          title: t.title,
          created_by: t.created_by,
          assigned_users: t.assigned_users
        })));

        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar tarefas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Force refresh function for debugging
  const forceRefresh = async () => {
    console.log('🔄 Forcing complete refresh...');
    await loadTasks();
  };

  const filterTasks = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let filtered = tasks;

    // Filtro temporal
    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          return taskDate >= today && taskDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });
        break;
      case 'week':
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          return taskDate >= weekStart && taskDate < weekEnd;
        });
        break;
      case 'month':
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          return taskDate >= monthStart && taskDate < monthEnd;
        });
        break;
      default:
        break;
    }

    // Filtro por usuário (apenas tarefas atribuídas)
    if (selectedUser !== 'all') {
      filtered = filtered.filter(task => 
        task.assigned_users.includes(selectedUser)
      );
    }

    // Filtro por nível de acesso (apenas tarefas atribuídas)
    if (selectedAccessLevel !== 'all') {
      try {
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('user_id, role')
          .eq('role', selectedAccessLevel);

        if (userProfiles) {
          const userIds = userProfiles.map(profile => profile.user_id);
          filtered = filtered.filter(task => 
            task.assigned_users.some(userId => userIds.includes(userId))
          );
        }
      } catch (error) {
        console.error('Erro ao filtrar por nível de acesso:', error);
      }
    }

    // Filtro por prioridade
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    // Filtro por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }

    setFilteredTasks(filtered);
  };

  const clearAdvancedFilters = () => {
    setSelectedUser('all');
    setSelectedAccessLevel('all');
    setSelectedPriority('all');
    setSelectedStatus('all');
  };

  const getFilterCount = (filter: 'all' | 'today' | 'week' | 'month') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filter) {
      case 'all':
        return tasks.length;
      case 'today':
        return tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          return taskDate >= today && taskDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        }).length;
      case 'week':
        return tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          return taskDate >= weekStart && taskDate < weekEnd;
        }).length;
      case 'month':
        return tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          return taskDate >= monthStart && taskDate < monthEnd;
        }).length;
      default:
        return 0;
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    if (!currentUser) {
      toast({
        title: "Usuário não autenticado",
        description: "Você precisa estar logado para atualizar tarefas.",
        variant: "destructive"
      });
      return;
    }

    setUpdatingTask(taskId);
    try {
      const task = tasks.find(t => t.id === taskId);
      
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'concluida') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Erro ao atualizar status da tarefa:', error);
        toast({
          title: "Erro ao atualizar status",
          description: "Não foi possível atualizar o status da tarefa. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      const getStatusMessage = (status: Task['status']) => {
        switch (status) {
          case 'pendente':
            return { title: "Status atualizado", description: `"${task?.title}" foi marcada como pendente.`, variant: "default" };
          case 'em_andamento':
            return { title: "Em andamento", description: `"${task?.title}" está em andamento.`, variant: "info" };
          case 'concluida':
            return { title: "Tarefa concluída!", description: `"${task?.title}" foi concluída com sucesso.`, variant: "success" };
          case 'cancelada':
            return { title: "Tarefa cancelada", description: `"${task?.title}" foi cancelada.`, variant: "destructive" };
          default:
            return { title: "Status atualizado", description: "Status da tarefa atualizado com sucesso.", variant: "default" };
        }
      };

      const statusMessage = getStatusMessage(newStatus);
      toast({
        title: statusMessage.title,
        description: statusMessage.description,
        variant: statusMessage.variant as any
      });

      await loadTasks();
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro inesperado ao atualizar tarefa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUpdatingTask(null);
    }
  };

  const canEditTask = (task: Task): boolean => {
    if (!currentUser) return false;
    
    if (task.created_by === currentUser.user_id) return true;
    if (task.assigned_users.includes(currentUser.user_id)) return true;
    if (['admin', 'franqueado'].includes(currentUser.role)) return true;
    
    return false;
  };

  /**
   * Verifica se o usuário pode editar completamente uma tarefa
   * (admin, franqueado e supervisor têm permissão completa para editar)
   */
  const canEditTaskFull = (task: Task): boolean => {
    if (!currentUser) return false;
    
    // Admin, franqueado e supervisor podem editar qualquer tarefa
    if (['admin', 'franqueado', 'supervisor_adm'].includes(currentUser.role)) return true;
    
    // Outros usuários só podem editar suas próprias tarefas ou tarefas atribuídas
    if (task.created_by === currentUser.user_id) return true;
    if (task.assigned_users.includes(currentUser.user_id)) return true;
    
    return false;
  };

  /**
   * Atualiza uma tarefa existente
   * 
   * @param taskId - ID da tarefa a ser atualizada
   * @param updatedTask - Dados atualizados da tarefa
   * @returns Promise<boolean> - true se atualizada com sucesso, false caso contrário
   */
  const updateTask = async (taskId: string, updatedTask: {
    title: string;
    description: string;
    status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    priority: 'baixa' | 'media' | 'urgente';
    due_date: string;
    assigned_users: string[];
    is_private: boolean;
  }) => {
    if (!updatedTask.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "O título da tarefa é obrigatório.",
        variant: "destructive"
      });
      return false;
    }

    if (!currentUser) {
      toast({
        title: "Usuário não autenticado",
        description: "Você precisa estar logado para editar tarefas.",
        variant: "destructive"
      });
      return false;
    }

    // Verificar se o usuário tem permissão para editar
    const taskToEdit = tasks.find(task => task.id === taskId);
    if (!taskToEdit || !canEditTaskFull(taskToEdit)) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para editar esta tarefa.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Processar data de vencimento com timezone do Brasil
      let formattedDueDate = null;
      if (updatedTask.due_date) {
        let dateOnly = updatedTask.due_date;
        
        // Se contém espaço, pega apenas a parte da data
        if (dateOnly.includes(' ')) {
          dateOnly = dateOnly.split(' ')[0];
        }
        
        // Se contém T (ISO), pega apenas a parte da data
        if (dateOnly.includes('T')) {
          dateOnly = dateOnly.split('T')[0];
        }
        
        // Extrair componentes da hora da string original
        let time = '09:00';
        if (updatedTask.due_date.includes(' ')) {
          const timePart = updatedTask.due_date.split(' ')[1];
          if (timePart) {
            time = timePart.substring(0, 5); // HH:MM
          }
        }
        
        // Incluir timezone do Brasil (-03:00) explicitamente
        formattedDueDate = `${dateOnly} ${time}:00-03:00`;
      }

      const updateData = {
        title: updatedTask.title,
        description: updatedTask.description || null,
        status: updatedTask.status,
        priority: updatedTask.priority,
        due_date: formattedDueDate,
        assigned_users: updatedTask.assigned_users,
        is_private: updatedTask.is_private
      };
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        toast({
          title: "Erro ao atualizar tarefa",
          description: "Não foi possível atualizar a tarefa. Tente novamente.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Tarefa atualizada com sucesso!",
        description: `"${updatedTask.title}" foi atualizada.`,
        variant: "success"
      });

      // Recarregar tarefas para mostrar as mudanças
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro inesperado ao atualizar tarefa. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
  };

  /**
   * Cria uma nova tarefa no sistema
   * 
   * IMPORTANTE: Esta função foi corrigida para resolver problemas de timezone.
   * A data é formatada com timezone explícito do Brasil (-03:00) para evitar
   * conversões automáticas UTC que causavam tarefas serem salvas na data errada.
   * 
   * @param newTask - Objeto com dados da nova tarefa
   * @returns Promise<boolean> - true se criada com sucesso, false caso contrário
   */
  const createTask = async (newTask: {
    title: string;
    description: string;
    status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    priority: 'baixa' | 'media' | 'urgente';
    due_date: string;
    due_time: string;
    assigned_users: string[];
    is_private: boolean;
  }) => {
    if (!newTask.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "O título da tarefa é obrigatório para criar uma nova tarefa.",
        variant: "destructive"
      });
      return false;
    }

    if (!currentUser) {
      toast({
        title: "Usuário não autenticado",
        description: "Você precisa estar logado para criar tarefas.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // CORREÇÃO DE TIMEZONE - Processamento da data de vencimento
      // Esta seção foi corrigida em 08/01/2025 para resolver problemas de timezone
      // onde tarefas eram salvas na data errada devido a conversões automáticas UTC
      let formattedDueDate = null;
      if (newTask.due_date) {
        // Extrair apenas a parte da data (YYYY-MM-DD)
        let dateOnly = newTask.due_date;
        
        // Se contém espaço, pega apenas a parte da data
        if (dateOnly.includes(' ')) {
          dateOnly = dateOnly.split(' ')[0];
        }
        
        // Se contém T (ISO), pega apenas a parte da data
        if (dateOnly.includes('T')) {
          dateOnly = dateOnly.split('T')[0];
        }
        
        // Extrair componentes da hora
        const time = newTask.due_time || '09:00';
        
        // SOLUÇÃO DEFINITIVA: Incluir timezone do Brasil (-03:00) explicitamente
        // Isso evita que o PostgreSQL interprete a data como UTC e cause conversões
        // automáticas que resultavam em tarefas sendo salvas na data errada
        //
        // ANTES: "2025-07-09 09:00:00" → interpretado como UTC → convertido para local = 06:00
        // DEPOIS: "2025-07-09 09:00:00-03:00" → interpretado como Brasil → mantém 09:00
        formattedDueDate = `${dateOnly} ${time}:00-03:00`;
      }

      const insertData = {
        title: newTask.title,
        description: newTask.description || null,
        status: newTask.status,
        priority: newTask.priority,
        due_date: formattedDueDate,
        assigned_users: newTask.assigned_users,
        created_by: currentUser.user_id,
        is_private: newTask.is_private
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select('*');

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        toast({
          title: "Erro ao criar tarefa",
          description: "Não foi possível criar a tarefa. Tente novamente.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Tarefa criada com sucesso!",
        description: `"${newTask.title}" foi criada e está pronta para uso.`,
        variant: "success"
      });

      // Real-time subscription will handle the UI update automatically
      return true;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro inesperado ao criar tarefa. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!currentUser) {
      toast({
        title: "Usuário não autenticado",
        description: "Você precisa estar logado para excluir tarefas.",
        variant: "destructive"
      });
      return false;
    }

    // Verificar se o usuário tem permissão para excluir
    if (!['admin', 'franqueado', 'coordenador', 'supervisor_adm'].includes(currentUser.role)) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para excluir tarefas.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Remove task from local state immediately for instant UI feedback
      const taskToDelete = tasks.find(task => task.id === taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Erro ao excluir tarefa:', error);
        // Reload tasks to restore the task if deletion failed
        await loadTasks();
        toast({
          title: "Erro ao excluir tarefa",
          description: "Não foi possível excluir a tarefa. Tente novamente.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Tarefa excluída",
        description: `"${taskToDelete?.title}" foi removida com sucesso.`,
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      // Reload tasks to restore the task if deletion failed
      await loadTasks();
      toast({
        title: "Erro inesperado",
        description: "Erro inesperado ao excluir tarefa. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
  };

  const canDeleteTask = (task: Task): boolean => {
    if (!currentUser) return false;
    
    // Apenas admin, franqueado, coordenador e supervisor_adm podem excluir
    return ['admin', 'franqueado', 'coordenador', 'supervisor_adm'].includes(currentUser.role);
  };

  return {
    tasks,
    filteredTasks,
    isLoading,
    updatingTask,
    activeFilter,
    setActiveFilter,
    selectedUser,
    setSelectedUser,
    selectedAccessLevel,
    setSelectedAccessLevel,
    selectedPriority,
    setSelectedPriority,
    selectedStatus,
    setSelectedStatus,
    clearAdvancedFilters,
    getFilterCount,
    updateTaskStatus,
    canEditTask,
    canEditTaskFull,
    updateTask,
    createTask,
    loadTasks,
    deleteTask,
    canDeleteTask,
    forceRefresh,
    // 🚀 MELHORIAS REAL-TIME: Novos estados exportados
    newTasksCount,
    isRealTimeConnected,
    lastUpdateTime
  };
};
