import { useState, useEffect } from 'react';
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

  const { currentUser } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
    
    // Set up real-time subscription
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
          
          // Handle different event types for immediate UI updates
          if (payload.eventType === 'DELETE') {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== payload.old.id));
          } else if (payload.eventType === 'INSERT') {
            loadTasks();
          } else if (payload.eventType === 'UPDATE') {
            loadTasks();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, activeFilter]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (taskError) {
        console.error('Erro ao carregar tarefas:', taskError);
        toast({
          title: "Erro",
          description: "Erro ao carregar tarefas",
          variant: "destructive"
        });
        return;
      }

      if (taskData) {
        const formattedTasks: Task[] = taskData.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as 'pendente' | 'em_andamento' | 'concluida' | 'cancelada',
          priority: task.priority as 'baixa' | 'media' | 'alta' | 'urgente',
          due_date: task.due_date || undefined,
          assigned_users: task.assigned_users || [],
          created_by: task.created_by,
          created_at: new Date(task.created_at),
          updated_at: new Date(task.updated_at),
          completed_at: task.completed_at ? new Date(task.completed_at) : undefined
        }));

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
    }
  };

  const filterTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let filtered = tasks;

    switch (activeFilter) {
      case 'today':
        filtered = tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          return taskDate >= today && taskDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });
        break;
      case 'week':
        filtered = tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          return taskDate >= weekStart && taskDate < weekEnd;
        });
        break;
      case 'month':
        filtered = tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          return taskDate >= monthStart && taskDate < monthEnd;
        });
        break;
      default:
        filtered = tasks;
    }

    setFilteredTasks(filtered);
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
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    setUpdatingTask(taskId);
    try {
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
          title: "Erro",
          description: "Erro ao atualizar status da tarefa",
          variant: "destructive"
        });
        return;
      }

      const statusLabels = {
        'pendente': 'Pendente',
        'em_andamento': 'Em Andamento',
        'concluida': 'Concluída',
        'cancelada': 'Cancelada'
      };

      toast({
        title: "Sucesso",
        description: `Tarefa ${statusLabels[newStatus].toLowerCase()} com sucesso`,
      });

      await loadTasks();
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar tarefa",
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

  const createTask = async (newTask: {
    title: string;
    description: string;
    status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    priority: 'baixa' | 'media' | 'alta' | 'urgente';
    due_date: string;
    due_time: string;
    assigned_users: string[];
  }) => {
    if (!newTask.title.trim()) {
      toast({
        title: "Erro",
        description: "Título da tarefa é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Prepare the due_date - mantém como string simples sem conversão de timezone
      let formattedDueDate = null;
      if (newTask.due_date) {
        // Se a data está no formato "YYYY-MM-DD HH:MM:SS", mantém assim
        if (newTask.due_date.includes(' ')) {
          formattedDueDate = newTask.due_date;
        } else if (newTask.due_date.includes('T')) {
          // Se está no formato ISO, converte para formato simples
          const date = new Date(newTask.due_date);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const time = newTask.due_time || '09:00';
          formattedDueDate = `${year}-${month}-${day} ${time}:00`;
        } else {
          // Se é só a data, adiciona o horário
          const time = newTask.due_time || '09:00';
          formattedDueDate = `${newTask.due_date} ${time}:00`;
        }
        
        console.log('Data formatada para salvar:', formattedDueDate);
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description || null,
          status: newTask.status,
          priority: newTask.priority,
          due_date: formattedDueDate,
          assigned_users: newTask.assigned_users,
          created_by: currentUser.user_id
        });

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar tarefa",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso",
      });

      // Force immediate reload of tasks to ensure UI is updated
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar tarefa",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return false;
    }

    // Verificar se o usuário tem permissão para excluir
    if (!['admin', 'franqueado', 'coordenador', 'supervisor_adm'].includes(currentUser.role)) {
      toast({
        title: "Erro",
        description: "Você não tem permissão para excluir tarefas",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Remove task from local state immediately for instant UI feedback
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
          title: "Erro",
          description: "Erro ao excluir tarefa",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Tarefa excluída com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      // Reload tasks to restore the task if deletion failed
      await loadTasks();
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir tarefa",
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
    getFilterCount,
    updateTaskStatus,
    canEditTask,
    createTask,
    loadTasks,
    deleteTask,
    canDeleteTask
  };
};
