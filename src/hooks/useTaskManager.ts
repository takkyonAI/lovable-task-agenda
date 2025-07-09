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

  const { currentUser } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Refs para evitar race conditions
  const isLoadingRef = useRef(false);
  const loadTasksTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    loadTasks();
    
    // Set up real-time subscription com melhor processamento
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Real-time task change:', payload);
          
          // Handle different event types with optimized state updates
          if (payload.eventType === 'DELETE') {
            // Immediate UI update for deletions
            setTasks(prevTasks => prevTasks.filter(task => task.id !== payload.old.id));
          } else if (payload.eventType === 'INSERT') {
            // For inserts, add task immediately instead of full reload
            const newTask = payload.new;
            if (newTask && newTask.id) {
              setTasks(prevTasks => {
                // Check if task already exists to prevent duplicates
                const existingTask = prevTasks.find(task => task.id === newTask.id);
                if (existingTask) {
                  console.log('Task already exists, skipping duplicate:', newTask.id);
                  return prevTasks;
                }
                
                // Format the new task
                const formattedTask: Task = {
                  id: newTask.id,
                  title: newTask.title,
                  description: newTask.description || '',
                  status: newTask.status as 'pendente' | 'em_andamento' | 'concluida' | 'cancelada',
                  priority: newTask.priority === 'alta' ? 'urgente' : newTask.priority as 'baixa' | 'media' | 'urgente',
                  due_date: newTask.due_date || undefined,
                  assigned_users: newTask.assigned_users || [],
                  created_by: newTask.created_by,
                  created_at: new Date(newTask.created_at),
                  updated_at: new Date(newTask.updated_at),
                  completed_at: newTask.completed_at ? new Date(newTask.completed_at) : undefined,
                  is_private: newTask.is_private || false
                };
                
                // Add to the beginning of the array (newest first)
                return [formattedTask, ...prevTasks];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // For updates, update specific task instead of full reload
            const updatedTask = payload.new;
            if (updatedTask && updatedTask.id) {
              setTasks(prevTasks => prevTasks.map(task => {
                if (task.id === updatedTask.id) {
                  return {
                    ...task,
                    title: updatedTask.title,
                    description: updatedTask.description || '',
                    status: updatedTask.status as 'pendente' | 'em_andamento' | 'concluida' | 'cancelada',
                    priority: updatedTask.priority === 'alta' ? 'urgente' : updatedTask.priority as 'baixa' | 'media' | 'urgente',
                    due_date: updatedTask.due_date || undefined,
                    assigned_users: updatedTask.assigned_users || [],
                    updated_at: new Date(updatedTask.updated_at),
                    completed_at: updatedTask.completed_at ? new Date(updatedTask.completed_at) : undefined,
                    is_private: updatedTask.is_private || false
                  };
                }
                return task;
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (loadTasksTimeoutRef.current) {
        clearTimeout(loadTasksTimeoutRef.current);
      }
    };
  }, []);

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
        
        const formattedTasks: Task[] = taskData.map((task) => {
          // Map "alta" priority to "urgente" for backward compatibility
          let priority: 'baixa' | 'media' | 'urgente' = task.priority as 'baixa' | 'media' | 'urgente';
          if (task.priority === 'alta') {
            priority = 'urgente';
          }

          const formattedTask = {
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
            is_private: task.is_private || false
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
    // 🔍 DEBUG: Log inicial para debugging de Vanessa (assessora_adm)
    console.log('🔍 DEBUG createTask - Starting task creation for user:', {
      user_id: currentUser?.user_id,
      user_name: currentUser?.name,
      user_role: currentUser?.role,
      user_email: currentUser?.email,
      task_title: newTask.title
    });

    if (!newTask.title.trim()) {
      console.log('🔍 DEBUG createTask - Title validation failed');
      toast({
        title: "Título obrigatório",
        description: "O título da tarefa é obrigatório para criar uma nova tarefa.",
        variant: "destructive"
      });
      return false;
    }

    if (!currentUser) {
      console.log('🔍 DEBUG createTask - User not authenticated');
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
      
      // 🔍 DEBUG: Log dos dados que serão inseridos
      console.log('🔍 DEBUG createTask - Insert data:', {
        title: insertData.title,
        status: insertData.status,
        priority: insertData.priority,
        due_date: insertData.due_date,
        assigned_users: insertData.assigned_users,
        created_by: insertData.created_by,
        is_private: insertData.is_private,
        current_user_role: currentUser.role
      });

      // 🔍 DEBUG: Verificar sessão do Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 DEBUG createTask - Current session:', {
        session_user_id: sessionData?.session?.user?.id,
        session_email: sessionData?.session?.user?.email,
        session_error: sessionError
      });
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select('*');

      if (error) {
        console.error('🔍 DEBUG createTask - Database error:', {
          error_message: error.message,
          error_details: error.details,
          error_hint: error.hint,
          error_code: error.code,
          user_role: currentUser.role,
          user_id: currentUser.user_id
        });
        
        // 🔍 DEBUG: Erro específico para política RLS
        if (error.code === '42501' || error.message.includes('policy')) {
          console.error('🔍 DEBUG createTask - RLS Policy error detected for user:', {
            user_role: currentUser.role,
            user_id: currentUser.user_id,
            error_message: error.message
          });
        }
        
        toast({
          title: "Erro ao criar tarefa",
          description: "Não foi possível criar a tarefa. Tente novamente.",
          variant: "destructive"
        });
        return false;
      }

      // 🔍 DEBUG: Log de sucesso
      console.log('🔍 DEBUG createTask - Task created successfully:', {
        task_id: data?.[0]?.id,
        task_title: data?.[0]?.title,
        user_role: currentUser.role,
        user_id: currentUser.user_id
      });

      toast({
        title: "Tarefa criada com sucesso!",
        description: `"${newTask.title}" foi criada e está pronta para uso.`,
        variant: "success"
      });

      // Real-time subscription will handle the UI update automatically
      return true;
    } catch (error) {
      console.error('🔍 DEBUG createTask - Unexpected error:', {
        error,
        user_role: currentUser.role,
        user_id: currentUser.user_id
      });
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
    createTask,
    loadTasks,
    deleteTask,
    canDeleteTask,
    forceRefresh
  };
};
