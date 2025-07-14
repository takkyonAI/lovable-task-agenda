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
  
  // 🚀 OTIMIZAÇÕES REAL-TIME: Estados para controle de sincronização sem "piscar"
  const [newTasksCount, setNewTasksCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState(0);

  const { currentUser } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Refs para evitar race conditions e controlar timers
  const isLoadingRef = useRef(false);
  const fallbackRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationDebounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // 🔍 DETECÇÃO DE NAVEGADOR
  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox = userAgent.includes('firefox');
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isEdge = userAgent.includes('edge');
    
    return { isFirefox, isChrome, isSafari, isEdge };
  };

  // 🔄 OTIMIZAÇÃO: Sistema de fallback inteligente (menos agressivo)
  const setupIntelligentFallback = useCallback(() => {
    if (fallbackRefreshRef.current) {
      clearTimeout(fallbackRefreshRef.current);
    }
    
    // Só configurar fallback se real-time estiver desconectado por mais de 1 minuto
    if (!isRealTimeConnected && (Date.now() - lastConnectionTime) > 60000) {
      fallbackRefreshRef.current = setTimeout(() => {
        console.log('🔄 Fallback inteligente (10 minutos)...');
        if (!isRealTimeConnected) {
          loadTasks();
        }
        setupIntelligentFallback(); // Reagenda para 10 minutos
      }, 600000); // 10 minutos - muito menos agressivo
    }
  }, [isRealTimeConnected, lastConnectionTime]);

  // 🎯 OTIMIZAÇÃO: Função para formatar tarefa do banco para o tipo Task
  const formatTaskFromDB = useCallback((taskData: any): Task => {
    // Map "alta" priority to "urgente" for backward compatibility
    let priority: 'baixa' | 'media' | 'urgente' = taskData.priority as 'baixa' | 'media' | 'urgente';
    if (taskData.priority === 'alta') {
      priority = 'urgente';
    }

    return {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status as 'pendente' | 'em_andamento' | 'concluida' | 'cancelada',
      priority: priority,
      due_date: taskData.due_date || undefined,
      assigned_users: taskData.assigned_users || [],
      created_by: taskData.created_by,
      created_at: new Date(taskData.created_at),
      updated_at: new Date(taskData.updated_at),
      completed_at: taskData.completed_at ? new Date(taskData.completed_at) : undefined,
      is_private: taskData.is_private ?? false,
      edited_by: taskData.edited_by || undefined,
      edited_at: taskData.edited_at ? new Date(taskData.edited_at) : undefined
    };
  }, []);

  // 🔔 OTIMIZAÇÃO: Função para mostrar notificação com debounce (evita spam)
  const showTaskChangeNotificationDebounced = useCallback((task: Task, eventType: 'INSERT' | 'UPDATE' | 'DELETE', isOwnAction: boolean = false) => {
    if (isOwnAction || !currentUser) return;
    
    const notificationKey = `${task.id}-${eventType}`;
    
    // Cancelar notificação anterior se existir
    if (notificationDebounceRef.current.has(notificationKey)) {
      clearTimeout(notificationDebounceRef.current.get(notificationKey)!);
    }
    
    // Agendar nova notificação com debounce de 2 segundos
    const timeoutId = setTimeout(() => {
      const creatorName = task.created_by || 'Usuário';
      
      switch (eventType) {
        case 'INSERT':
          toast({
            title: "📋 Nova Tarefa!",
            description: `"${task.title}" foi criada`,
            duration: 2000 // Reduzido para 2 segundos
          });
          setNewTasksCount(prev => prev + 1);
          setTimeout(() => setNewTasksCount(prev => Math.max(0, prev - 1)), 5000); // Reduzido para 5 segundos
          break;
        case 'UPDATE':
          toast({
            title: "✏️ Tarefa Atualizada",
            description: `"${task.title}" foi modificada`,
            duration: 1500 // Reduzido para 1.5 segundos
          });
          break;
        case 'DELETE':
          toast({
            title: "🗑️ Tarefa Removida",
            description: `"${task.title}" foi excluída`,
            duration: 1500 // Reduzido para 1.5 segundos
          });
          break;
      }
      
      notificationDebounceRef.current.delete(notificationKey);
    }, 2000);
    
    notificationDebounceRef.current.set(notificationKey, timeoutId);
  }, [currentUser, toast]);

  // 🎯 OTIMIZAÇÃO: Handlers específicos para cada tipo de mudança (sem refresh completo)
  const handleTaskInsert = useCallback((newTaskData: any) => {
    const newTask = formatTaskFromDB(newTaskData);
    
    setTasks(prevTasks => {
      // Verificar se a tarefa já existe para evitar duplicatas
      const existingTaskIndex = prevTasks.findIndex(task => task.id === newTask.id);
      if (existingTaskIndex !== -1) {
        console.log('🔄 Tarefa já existe, ignorando INSERT:', newTask.id);
        return prevTasks;
      }
      
      // Adicionar nova tarefa no início da lista (mais recente primeiro)
      console.log('✅ Adicionando nova tarefa:', newTask.title);
      return [newTask, ...prevTasks];
    });
    
    // Mostrar notificação apenas se não foi criada pelo usuário atual
    const isOwnAction = currentUser?.user_id === newTask.created_by;
    showTaskChangeNotificationDebounced(newTask, 'INSERT', isOwnAction);
  }, [formatTaskFromDB, currentUser, showTaskChangeNotificationDebounced]);

  const handleTaskUpdate = useCallback((updatedTaskData: any) => {
    const updatedTask = formatTaskFromDB(updatedTaskData);
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      );
      
      // Verificar se realmente houve mudança
      const originalTask = prevTasks.find(task => task.id === updatedTask.id);
      if (originalTask && JSON.stringify(originalTask) === JSON.stringify(updatedTask)) {
        console.log('🔄 Tarefa não mudou, ignorando UPDATE:', updatedTask.id);
        return prevTasks;
      }
      
      console.log('✅ Atualizando tarefa:', updatedTask.title);
      return updatedTasks;
    });
    
    // Mostrar notificação apenas se não foi editada pelo usuário atual
    const isOwnAction = currentUser?.user_id === updatedTask.edited_by || 
                        currentUser?.user_id === updatedTask.created_by;
    showTaskChangeNotificationDebounced(updatedTask, 'UPDATE', isOwnAction);
  }, [formatTaskFromDB, currentUser, showTaskChangeNotificationDebounced]);

  const handleTaskDelete = useCallback((deletedTaskData: any) => {
    const deletedTask = formatTaskFromDB(deletedTaskData);
    
    setTasks(prevTasks => {
      const filteredTasks = prevTasks.filter(task => task.id !== deletedTask.id);
      console.log('✅ Removendo tarefa:', deletedTask.title);
      return filteredTasks;
    });
    
    // Sempre mostrar notificação de exclusão (é importante)
    showTaskChangeNotificationDebounced(deletedTask, 'DELETE', false);
  }, [formatTaskFromDB, showTaskChangeNotificationDebounced]);

  // 🔄 SISTEMA DE REAL-TIME OTIMIZADO COM CONTROLE DE RECONEXÃO
  useEffect(() => {
    loadTasks();
    
    // 🦊 FIREFOX: Verificar flag global definida pelo emergency-fix.js
    if ((window as any).FIREFOX_DISABLE_REALTIME) {
      console.log('🦊 FIREFOX: Real-time desabilitado - usando polling via emergency-fix.js');
      
      setIsRealTimeConnected(false);
      setLastConnectionTime(Date.now());
      
      // Escutar eventos de polling do emergency-fix.js
      const handleFirefoxPolling = () => {
        console.log('🔄 FIREFOX: Recebido evento de polling, recarregando tarefas...');
        loadTasks();
      };
      
      window.addEventListener('firefoxPollingUpdate', handleFirefoxPolling);
      
      return () => {
        window.removeEventListener('firefoxPollingUpdate', handleFirefoxPolling);
        console.log('🧹 FIREFOX: Removendo listener de polling');
      };
    }
    
    // 🚀 OUTROS NAVEGADORES: Sistema real-time otimizado com controle de reconexão
    let channel: any = null;
    
    console.log('🔄 Configurando sistema real-time otimizado (anti-piscar)...');
    
    // Wait for auth before setting up real-time
    if (!currentUser) {
      console.log('⏳ Aguardando autenticação...');
      return;
    }
    
    // Evitar reconexões muito frequentes
    const now = Date.now();
    if (connectionAttempts > 3 && (now - lastConnectionTime) < 30000) {
      console.log('🚫 Muitas tentativas de reconexão, aguardando 30 segundos...');
      
      reconnectTimeoutRef.current = setTimeout(() => {
        setConnectionAttempts(0);
      }, 30000);
      
      return;
    }
    
    try {
      setConnectionAttempts(prev => prev + 1);
      setLastConnectionTime(now);
      
      channel = supabase
        .channel(`tasks_stable_${currentUser.user_id}_${now}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tasks'
          },
          (payload) => {
            console.log('🎯 Nova tarefa detectada:', payload.new);
            setIsRealTimeConnected(true);
            setLastUpdateTime(Date.now());
            handleTaskInsert(payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tasks'
          },
          (payload) => {
            console.log('🎯 Tarefa atualizada:', payload.new);
            setIsRealTimeConnected(true);
            setLastUpdateTime(Date.now());
            handleTaskUpdate(payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'tasks'
          },
          (payload) => {
            console.log('🎯 Tarefa excluída:', payload.old);
            setIsRealTimeConnected(true);
            setLastUpdateTime(Date.now());
            handleTaskDelete(payload.old);
          }
        )
        .subscribe((status) => {
          console.log('🔗 Status real-time:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Sistema real-time estável conectado!');
            setIsRealTimeConnected(true);
            setConnectionAttempts(0);
            setLastConnectionTime(Date.now());
            
            // Notificação menos intrusiva
            if (connectionAttempts > 1) {
              toast({
                title: "⚡ Reconectado",
                description: "Atualizações em tempo real reestabelecidas",
                duration: 2000
              });
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.warn('🔒 Real-time desconectado:', status);
            setIsRealTimeConnected(false);
            
            // Só mostrar notificação se estava conectado antes
            if (isRealTimeConnected) {
              toast({
                title: "🔄 Modo Offline",
                description: "Usando dados locais",
                duration: 2000
              });
            }
          }
        });
        
    } catch (error) {
      console.error('❌ Erro ao configurar real-time:', error);
      setIsRealTimeConnected(false);
    }

    return () => {
      console.log('🧹 Limpando sistema real-time...');
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (fallbackRefreshRef.current) {
        clearTimeout(fallbackRefreshRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Limpar debounce de notificações
      notificationDebounceRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      notificationDebounceRef.current.clear();
    };
  }, [currentUser, connectionAttempts, lastConnectionTime, isRealTimeConnected]);

  // Configurar fallback inteligente
  useEffect(() => {
    setupIntelligentFallback();
  }, [setupIntelligentFallback]);

  useEffect(() => {
    filterTasks();
  }, [tasks, activeFilter, selectedUser, selectedAccessLevel, selectedPriority, selectedStatus]);

  /**
   * Carrega todas as tarefas do banco de dados
   */
  const loadTasks = async () => {
    if (isLoadingRef.current) {
      console.log('loadTasks já em progresso, ignorando...');
      return;
    }
    
    setIsLoading(true);
    isLoadingRef.current = true;
    
    try {
      console.log('🔍 Carregando todas as tarefas...');
      
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

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
        const formattedTasks: Task[] = taskData.map(formatTaskFromDB);
        console.log('✅ Tarefas carregadas:', formattedTasks.length);
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
    console.log('🔄 Forçando refresh manual...');
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
