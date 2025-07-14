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

  // 🚫 FORÇA DESABILITAÇÃO ULTRA-ROBUSTA: Bloquear completamente canal task-notifications
  // SOLUÇÃO DEFINITIVA: Impedir qualquer tentativa de reabilitação automática
  useEffect(() => {
    if (!currentUser) return;

    console.log('🚫 FORÇA DESABILITAÇÃO: useNotifications - Canal task-notifications BLOQUEADO PERMANENTEMENTE');
    
    // 🛡️ MONITORAMENTO: Verificar periodicamente se alguém está tentando reabilitar
    const blockingInterval = setInterval(() => {
      const supabaseClient = supabase as any;
      if (supabaseClient._realtime) {
        const existingChannels = supabaseClient._realtime.channels || [];
        const taskNotificationChannels = existingChannels.filter((ch: any) => 
          ch.topic?.includes('task-notifications')
        );
        
        if (taskNotificationChannels.length > 0) {
          console.warn(`🚫 FORÇA DESABILITAÇÃO: Detectados ${taskNotificationChannels.length} canais task-notifications - REMOVENDO IMEDIATAMENTE`);
          taskNotificationChannels.forEach((ch: any) => {
            try {
              supabaseClient.removeChannel(ch);
              console.log(`🗑️ Canal task-notifications removido: ${ch.topic}`);
            } catch (error) {
              console.warn(`⚠️ Erro ao remover canal task-notifications: ${error}`);
            }
          });
        }
      }
    }, 1000); // Verificar a cada segundo

    // 🚫 BLOQUEIO GLOBAL: Marcar flag global para impedir reabilitação
    (window as any).TASK_NOTIFICATIONS_PERMANENTLY_DISABLED = true;
    console.log('🚫 FLAG GLOBAL: task-notifications permanentemente desabilitado');
    
    return () => {
      clearInterval(blockingInterval);
      console.log('🧹 FORÇA DESABILITAÇÃO: Limpando monitoramento de bloqueio');
      
      // Manter flag global mesmo no cleanup
      (window as any).TASK_NOTIFICATIONS_PERMANENTLY_DISABLED = true;
    };
  }, [currentUser]);

  // 🚫 DESABILITADO TEMPORARIAMENTE: Monitorar novas tarefas atribuídas em tempo real
  // CAUSA RAIZ: Conflito com useTaskManager.ts - ambos escutam mudanças na tabela 'tasks'
  // Isso estava causando múltiplas conexões real-time e o problema das 40 notificações
  useEffect(() => {
    if (!currentUser) return;

    console.log('🚫 useNotifications: Canal real-time DESABILITADO para evitar conflitos');
    
    // 🛡️ VALIDAÇÃO: Verificar se alguém está tentando reabilitar
    if ((window as any).TASK_NOTIFICATIONS_PERMANENTLY_DISABLED !== true) {
      console.warn('🚫 REFORÇANDO: Flag de desabilitação não estava definida - definindo agora');
      (window as any).TASK_NOTIFICATIONS_PERMANENTLY_DISABLED = true;
    }
    
    // TODO: Reintegrar notificações via useTaskManager.ts para evitar conflitos
    // const channel = supabase
    //   .channel('task-notifications')
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'tasks'
    //     },
    //     async (payload) => {
    //       console.log('Mudança em tarefa:', payload);
    //       
    //       // Verificar se esta tarefa é relevante para o usuário atual
    //       const task = payload.new as any;
    //       if (task && task.assigned_users && task.assigned_users.includes(currentUser.user_id)) {
    //         // Se é uma nova tarefa atribuída
    //         if (payload.eventType === 'INSERT') {
    //           addNotification({
    //             title: 'Nova Tarefa Atribuída!',
    //             message: `Você foi atribuído à tarefa: "${task.title}"`,
    //             type: 'task_assigned',
    //             taskId: task.id
    //           });
    //         }
    //         // Se é uma atualização que adiciona o usuário
    //         else if (payload.eventType === 'UPDATE') {
    //           const oldTask = payload.old as any;
    //           const wasAssigned = oldTask?.assigned_users?.includes(currentUser.user_id);
    //           const isNowAssigned = task.assigned_users.includes(currentUser.user_id);
    //           
    //           if (!wasAssigned && isNowAssigned) {
    //             addNotification({
    //               title: 'Nova Tarefa Atribuída!',
    //               message: `Você foi atribuído à tarefa: "${task.title}"`,
    //               type: 'task_assigned',
    //               taskId: task.id
    //             });
    //           }
    //         }
    //       }
    //     }
    //   )
    //   .subscribe();

    return () => {
      // supabase.removeChannel(channel); // Comentado pois canal foi desabilitado
      console.log('🧹 useNotifications: Cleanup - canal já estava desabilitado');
    };
  }, [currentUser]);

  // 🚫 DESABILITADO: Verificações periódicas - Causavam piscar das notificações
  useEffect(() => {
    if (!currentUser) return;

    // 🚫 DESABILITADO: Verificações imediatas removidas
    // checkOverdueTasks();
    // checkPendingTasks();

    // 🚫 DESABILITADO: Interval removido para evitar piscar
    // const interval = setInterval(() => {
    //   checkOverdueTasks();
    //   checkPendingTasks();
    // }, 30 * 60 * 1000);

    console.log('🚫 NOTIFICAÇÕES: Verificações periódicas DESABILITADAS para evitar piscar');

    // Retornar função vazia
    return () => {
      console.log('🧹 NOTIFICAÇÕES: Cleanup - sem intervals para limpar');
    };
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