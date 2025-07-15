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

  // 🚫 NOTIFICAÇÕES DESATIVADAS - Sistema desabilitado conforme solicitado
  // para resolver problema de piscar na tela

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

  // Enviar notificação nativa - DESATIVADO
  const sendNativeNotification = (title: string, options?: NotificationOptions) => {
    // 🚫 DESATIVADO - Não enviar notificações nativas
    return null;
  };

  // Adicionar notificação à lista - DESATIVADO
  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    // 🚫 DESATIVADO - Não adicionar notificações
    return '';
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

  // Verificar tarefas vencidas - DESATIVADO
  const checkOverdueTasks = async () => {
    // 🚫 DESATIVADO - Não verificar tarefas vencidas
    return;
  };

  // Verificar tarefas próximas do vencimento - DESATIVADO
  const checkPendingTasks = async () => {
    // 🚫 DESATIVADO - Não verificar tarefas próximas do vencimento
    return;
  };

  // 🚫 REAL-TIME DESATIVADO - Não monitorar mudanças em tempo real
  // useEffect para monitoramento em tempo real foi completamente removido

  // 🚫 VERIFICAÇÕES PERIÓDICAS DESATIVADAS - Não fazer verificações automáticas
  // useEffect com setInterval foi completamente removido

  // 🚫 PERMISSÃO AUTOMÁTICA DESATIVADA - Não solicitar permissão automaticamente
  // useEffect para solicitar permissão foi removido

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