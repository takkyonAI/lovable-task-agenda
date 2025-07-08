import React from 'react';
import { Bell, Check, X, Clock, AlertTriangle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    permission,
    isSupported,
    requestPermission,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Target className="w-4 h-4 text-blue-500" />;
      case 'task_overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'task_pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'border-l-blue-500';
      case 'task_overdue':
        return 'border-l-red-500';
      case 'task_pending':
        return 'border-l-yellow-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative text-white hover:bg-slate-700/50"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 sm:w-96 p-0 bg-slate-800 border-slate-700" align="end">
          <Card className="bg-slate-800 border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Notificações</CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllRead}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Marcar todas como lidas
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Status de permissão */}
              {isSupported && permission !== 'granted' && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-orange-300">
                        Ative as notificações
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={requestPermission}
                      className="text-xs bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30"
                    >
                      Ativar
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="w-12 h-12 text-slate-500 mb-2" />
                  <p className="text-slate-400 text-sm">
                    Nenhuma notificação
                  </p>
                  <p className="text-slate-500 text-xs">
                    Você será notificado sobre novas tarefas e prazos
                  </p>
                </div>
              ) : (
                <div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1 p-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200 ${
                            notification.read 
                              ? 'bg-slate-700/30 opacity-75' 
                              : 'bg-slate-700/50 hover:bg-slate-700/70'
                          } ${getNotificationColor(notification.type)}`}
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-medium ${
                                  notification.read ? 'text-slate-300' : 'text-white'
                                }`}>
                                  {notification.title}
                                </h4>
                                <p className={`text-xs mt-1 ${
                                  notification.read ? 'text-slate-500' : 'text-slate-400'
                                }`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                  {formatDistanceToNow(notification.timestamp, {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="w-6 h-6 p-0 text-slate-500 hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {notifications.length > 0 && (
                    <div className="border-t border-slate-700 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="w-full text-slate-400 hover:text-white text-xs"
                      >
                        Limpar todas as notificações
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationCenter; 