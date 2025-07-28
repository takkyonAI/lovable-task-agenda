import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_overdue' | 'task_pending';
  taskId?: string;
  timestamp: Date;
  read: boolean;
}

// ⚠️ SISTEMA COMPLETAMENTE DESABILITADO para resolver piscar da tela
// NÃO REATIVAR sem implementar throttling/debouncing adequado
alert("NOTIFICAÇÕES DESATIVADAS - useNotifications.ts");
console.log("DEBUG: useNotifications.ts carregado - notificações desativadas");
const NOTIFICATIONS_ENABLED = false;

/**
 * 🚫 HOOK DE NOTIFICAÇÕES - TEMPORARIAMENTE DESATIVADO
 * 
 * HISTÓRICO:
 * - Data da desativação: 15/01/2025
 * - Motivo: Resolução de problema de "piscar" na interface causado por re-renders excessivos
 * - Problema original: Sistema executava verificações a cada 30 minutos + real-time subscriptions
 *   causando re-renders constantes e instabilidade visual
 * 
 * SISTEMA ORIGINAL (PROBLEMÁTICO):
 * ❌ checkOverdueTasks() - verificava tarefas vencidas automaticamente
 * ❌ checkPendingTasks() - verificava tarefas próximas do vencimento (30-45min antes)
 * ❌ Real-time subscription - monitorava mudanças em tempo real via supabase
 * ❌ setInterval(30min) - verificações periódicas automáticas
 * ❌ Toast notifications - notificações visuais a cada mudança
 * 
 * COMO REATIVAR COM SEGURANÇA NO FUTURO:
 * 1. Implementar polling com intervalo MÍNIMO de 5 minutos
 * 2. Adicionar debounce nas verificações
 * 3. Limitar real-time subscriptions a mudanças críticas apenas
 * 4. Usar flags de feature para ativação gradual
 * 5. Monitorar performance durante testes
 * 
 * CÓDIGO DE REFERÊNCIA PARA REATIVAÇÃO:
 * ```javascript
 * // Polling seguro (mínimo 5 minutos)
 * useEffect(() => {
 *   if (!currentUser) return;
 *   
 *   const safeInterval = setInterval(() => {
 *     // Verificações apenas se necessário
 *     if (document.hasFocus()) { // Apenas se usuário ativo
 *       checkCriticalTasks(); // Função simplificada
 *     }
 *   }, 300000); // 5 minutos mínimo
 *   
 *   return () => clearInterval(safeInterval);
 * }, [currentUser.id]); // Dependência estável
 * ```
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { currentUser } = useSupabaseAuth();
  const { toast } = useToast();

  // 🚫 SISTEMA DE NOTIFICAÇÕES COMPLETAMENTE DESATIVADO
  // Motivo: Resolução de problema de piscar na tela (15/01/2025)
  // Este comentário deve ser mantido para futuras referências

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

  /**
   * 🚫 ENVIO DE NOTIFICAÇÕES NATIVAS - DESATIVADO
   * 
   * Função original enviava notificações do navegador, mas foi desativada pois:
   * - Causava re-renders quando chamada frequentemente
   * - Não é essencial para funcionamento básico do sistema
   * - Pode ser reativada individualmente no futuro
   */
  const sendNativeNotification = (title: string, options?: NotificationOptions) => {
    // 🚫 DESATIVADO - Não enviar notificações nativas
    console.log('📝 Notificação desativada:', title); // Log para debug se necessário
    return null;
  };

  /**
   * 🚫 ADICIONAR NOTIFICAÇÕES À LISTA - DESATIVADO
   * 
   * Esta função era chamada por:
   * - checkOverdueTasks() quando encontrava tarefas vencidas
   * - checkPendingTasks() quando encontrava tarefas próximas do vencimento  
   * - Real-time subscription quando detectava mudanças
   * 
   * Desativada para evitar:
   * - State updates frequentes causando re-renders
   * - Toast notifications excessivas
   * - Acúmulo de notificações desnecessárias
   */
  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    // 🚫 DESATIVADO - Não adicionar notificações
    console.log('📝 Notificação ignorada:', notification.title); // Log para debug
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

  /**
   * 🚫 VERIFICAÇÃO DE TAREFAS VENCIDAS - DESATIVADO
   * 
   * FUNÇÃO ORIGINAL:
   * - Consultava banco para tarefas com due_date < now
   * - Filtrava por tarefas do usuário atual  
   * - Criava notificação para cada tarefa vencida
   * - Chamada automaticamente a cada 30 minutos
   * 
   * PROBLEMA IDENTIFICADO:
   * - Query frequente ao banco de dados
   * - Loops de notificação para tarefas já vencidas há dias
   * - Re-renders constantes quando havia muitas tarefas vencidas
   * 
   * REATIVAÇÃO SEGURA:
   * - Implementar cache de tarefas já notificadas
   * - Limitar notificações a tarefas vencidas nas últimas 24h
   * - Executar apenas 1x por dia ou sob demanda
   */
  const checkOverdueTasks = async () => {
    // 🚫 DESATIVADO - Não verificar tarefas vencidas automaticamente
    console.log('📝 Verificação de tarefas vencidas desativada'); // Debug
    return;
  };

  /**
   * 🚫 VERIFICAÇÃO DE TAREFAS PRÓXIMAS DO VENCIMENTO - DESATIVADO
   * 
   * FUNÇÃO ORIGINAL:
   * - Verificava tarefas com vencimento em 30-45 minutos
   * - Enviava notificação "vence em X minutos"
   * - Executada a cada 5 minutos para precisão
   * 
   * PROBLEMA IDENTIFICADO:
   * - Verificação muito frequente (a cada 5 minutos)
   * - Múltiplas notificações para a mesma tarefa
   * - Re-renders constantes durante período de 30-45 minutos antes do vencimento
   * 
   * FUNCIONALIDADE IMPLEMENTADA EM 14/01/2025 E DESATIVADA EM 15/01/2025:
   * Esta era a funcionalidade mais recente, implementada para notificar apenas 
   * 30 minutos antes do vencimento (ao invés de 4 horas). Funcionou bem mas 
   * foi desativada junto com todo o sistema para resolver o piscar.
   * 
   * REATIVAÇÃO SEGURA:
   * - Implementar apenas para tarefas críticas/urgentes
   * - Enviar notificação apenas 1x por tarefa
   * - Cache de tarefas já notificadas
   * - Verificação máxima de 1x por hora
   */
  const checkPendingTasks = async () => {
    // 🚫 DESATIVADO - Não verificar tarefas próximas do vencimento
    console.log('📝 Verificação de tarefas pendentes desativada'); // Debug
    return;
  };

  // �� MONITORAMENTO REAL-TIME DESATIVADO
  // 
  // CÓDIGO ORIGINAL REMOVIDO:
  // useEffect(() => {
  //   if (!currentUser) return;
  //   
  //   const channel = supabase.channel('task-notifications')
  //     .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
  //       (payload) => {
  //         // Lógica que causava re-renders constantes
  //         addNotification({...});
  //       })
  //     .subscribe();
  //     
  //   return () => supabase.removeChannel(channel);
  // }, [currentUser]);
  //
  // PROBLEMA: 
  // - Subscription ativa reagia a TODAS as mudanças na tabela tasks
  // - Gerava notificação para cada INSERT/UPDATE/DELETE
  // - Causava re-renders excessivos quando múltiplos usuários trabalhavam simultaneamente
  //
  // SOLUÇÃO APLICADA:
  // - Remoção completa do real-time monitoring
  // - Sistema agora funciona apenas com polling de 1 minuto no useTaskManager
  //
  // REATIVAÇÃO SEGURA:
  // - Filtrar apenas tarefas relevantes para o usuário
  // - Implementar debounce de 5-10 segundos
  // - Agrupar múltiplas mudanças em uma única notificação
  // - Usar throttling para limitar frequência de updates

  // 🚫 VERIFICAÇÕES PERIÓDICAS DESATIVADAS
  //
  // CÓDIGO ORIGINAL REMOVIDO:
  // useEffect(() => {
  //   if (!currentUser) return;
  //   
  //   // Verificar imediatamente - CAUSAVA PROBLEMA
  //   checkOverdueTasks();
  //   checkPendingTasks();
  //   
  //   // Verificar a cada 30 minutos - PRINCIPAL CAUSA DO PISCAR
  //   const interval = setInterval(() => {
  //     checkOverdueTasks();
  //     checkPendingTasks();
  //   }, 30 * 60 * 1000);
  //   
  //   return () => clearInterval(interval);
  // }, [currentUser]);
  //
  // PROBLEMA IDENTIFICADO:
  // - setInterval executando verificações pesadas a cada 30 minutos
  // - Dependência [currentUser] causava re-criação do interval quando user mudava
  // - Verificações imediatas no mount causavam loading states conflitantes
  // - Multiple intervals rodando simultaneamente em casos edge
  //
  // SOLUÇÃO APLICADA:
  // - Remoção completa das verificações automáticas
  // - Sistema agora é "pull-based" ao invés de "push-based"
  // - Usuário pode atualizar manualmente se necessário
  //
  // REATIVAÇÃO SEGURA:
  // - Usar intervalo MÍNIMO de 5 minutos
  // - Implementar apenas se usuário estiver ativo (document.hasFocus())
  // - Cache de resultados para evitar queries desnecessárias
  // - Implementar circuit breaker em caso de erros consecutivos

  // 🚫 SOLICITAÇÃO AUTOMÁTICA DE PERMISSÃO DESATIVADA
  //
  // CÓDIGO ORIGINAL REMOVIDO:
  // useEffect(() => {
  //   if (isSupported && permission === 'default') {
  //     requestPermission();
  //   }
  // }, [isSupported, permission]);
  //
  // MOTIVO DA DESATIVAÇÃO:
  // - Não era crítico para o funcionamento
  // - Pode ser solicitado sob demanda no futuro
  // - Remove uma possível fonte de re-renders

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