import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_overdue' | 'task_pending';
  taskId?: string;
  timestamp: Date;
  read: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { currentUser } = useSupabaseAuth();
  const { toast } = useToast();

  // Verificar suporte a notificações
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Solicitar permissão para notificações
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    if (permission === 'granted') return true;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  // Enviar notificação nativa
  const sendNativeNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/rockfeller-favicon.png',
      badge: '/rockfeller-favicon.png',
      ...options
    });

    // Auto fechar após 5 segundos
    setTimeout(() => notification.close(), 5000);

    return notification;
  };

  // Adicionar notificação à lista
  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Enviar notificação nativa
    sendNativeNotification(notification.title, {
      body: notification.message,
      tag: notification.type,
      requireInteraction: true
    });

    // Mostrar toast com variante baseada no tipo
    const getToastVariant = (type: string) => {
      switch (type) {
        case 'task_assigned':
          return 'info';
        case 'task_overdue':
          return 'destructive';
        case 'task_pending':
          return 'warning';
        default:
          return 'default';
      }
    };

    // Mostrar toast também com design melhorado
    toast({
      title: notification.title,
      description: notification.message,
      duration: 6000,
      variant: getToastVariant(notification.type) as any
    });

    return newNotification.id;
  };

  // Marcar notificação como lida
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Remover notificação
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Limpar todas as notificações
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Verificar tarefas vencidas
  const checkOverdueTasks = async () => {
    if (!currentUser) return;

    try {
      const now = new Date().toISOString();
      
      const { data: overdueTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .contains('assigned_users', [currentUser.user_id])
        .lt('due_date', now)
        .neq('status', 'concluida')
        .neq('status', 'cancelada');

      if (error) {
        console.error('Erro ao verificar tarefas vencidas:', error);
        return;
      }

      overdueTasks?.forEach(task => {
        const dueDateObj = new Date(task.due_date);
        const daysOverdue = Math.floor((Date.now() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));
        
        addNotification({
          title: 'Tarefa Vencida!',
          message: `"${task.title}" venceu há ${daysOverdue} dia(s)`,
          type: 'task_overdue',
          taskId: task.id
        });
      });
    } catch (error) {
      console.error('Erro ao verificar tarefas vencidas:', error);
    }
  };

  // Verificar tarefas próximas do vencimento
  const checkPendingTasks = async () => {
    if (!currentUser) return;

    try {
      const now = new Date();
      const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      
      const { data: pendingTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .contains('assigned_users', [currentUser.user_id])
        .gt('due_date', now.toISOString())
        .lt('due_date', fourHoursFromNow.toISOString())
        .neq('status', 'concluida')
        .neq('status', 'cancelada');

      if (error) {
        console.error('Erro ao verificar tarefas próximas do vencimento:', error);
        return;
      }

      pendingTasks?.forEach(task => {
        const dueDateObj = new Date(task.due_date);
        const hoursUntilDue = Math.floor((dueDateObj.getTime() - Date.now()) / (1000 * 60 * 60));
        
        addNotification({
          title: 'Tarefa Próxima do Vencimento',
          message: `"${task.title}" vence em ${hoursUntilDue}h`,
          type: 'task_pending',
          taskId: task.id
        });
      });
    } catch (error) {
      console.error('Erro ao verificar tarefas próximas do vencimento:', error);
    }
  };

  // Monitorar novas tarefas atribuídas em tempo real
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('task-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        async (payload) => {
          console.log('Mudança em tarefa:', payload);
          
          // Verificar se esta tarefa é relevante para o usuário atual
          const task = payload.new as any;
          if (task && task.assigned_users && task.assigned_users.includes(currentUser.user_id)) {
            // Se é uma nova tarefa atribuída
            if (payload.eventType === 'INSERT') {
              addNotification({
                title: 'Nova Tarefa Atribuída!',
                message: `Você foi atribuído à tarefa: "${task.title}"`,
                type: 'task_assigned',
                taskId: task.id
              });
            }
            // Se é uma atualização que adiciona o usuário
            else if (payload.eventType === 'UPDATE') {
              const oldTask = payload.old as any;
              const wasAssigned = oldTask?.assigned_users?.includes(currentUser.user_id);
              const isNowAssigned = task.assigned_users.includes(currentUser.user_id);
              
              if (!wasAssigned && isNowAssigned) {
                addNotification({
                  title: 'Nova Tarefa Atribuída!',
                  message: `Você foi atribuído à tarefa: "${task.title}"`,
                  type: 'task_assigned',
                  taskId: task.id
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Verificações periódicas
  useEffect(() => {
    if (!currentUser) return;

    // Verificar imediatamente
    checkOverdueTasks();
    checkPendingTasks();

    // Verificar a cada 30 minutos
    const interval = setInterval(() => {
      checkOverdueTasks();
      checkPendingTasks();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Solicitar permissão automaticamente
  useEffect(() => {
    if (isSupported && permission === 'default') {
      requestPermission();
    }
  }, [isSupported, permission]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    permission,
    isSupported,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    checkOverdueTasks,
    checkPendingTasks
  };
}; 