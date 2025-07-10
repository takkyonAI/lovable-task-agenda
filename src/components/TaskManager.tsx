import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Calendar, Clock, Users, ShieldCheck, RefreshCw, Wifi, WifiOff, User, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import CreateTaskDialog from './task/CreateTaskDialog';
import EditTaskDialog from './task/EditTaskDialog';
import TaskCard from './task/TaskCard';
import TaskFilters from './task/TaskFilters';
import AdvancedTaskFilters from './task/AdvancedTaskFilters';
import TaskDetailsModal from './task/TaskDetailsModal';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '@/utils/taskUtils';
import { formatDateToBR, formatTimeToBR, isSameDay, getTodayBR, getWeekDaysBR, getMonthDaysBR, getViewTitleBR } from '@/utils/dateUtils';
import { NewTask, Task, EditTask } from '@/types/task';
import { useUserProfiles } from '@/hooks/useUserProfiles';

const TaskManager = () => {
  const { 
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
    deleteTask,
    canDeleteTask,
    forceRefresh,
    // 🚀 MELHORIAS REAL-TIME: Novos estados do sistema melhorado
    newTasksCount,
    isRealTimeConnected,
    lastUpdateTime
  } = useTaskManager();

  const { currentUser } = useSupabaseAuth();
  const { getUserName, userProfiles } = useUserProfiles();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 🔄 Estado para controle de refresh manual
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para edição de tarefas
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTask, setEditTask] = useState<EditTask>({
    id: '',
    title: '',
    description: '',
    status: 'pendente',
    priority: 'media',
    due_date: '',
    due_time: '09:00',
    assigned_users: [],
    is_private: false
  });

  // Estados para navegação de data e visualização
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');

  // Estado para nova tarefa
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    status: 'pendente',
    priority: 'media',
    due_date: '',
    due_time: '09:00',
    assigned_users: [],
    is_private: false
  });

  // 🔧 Função helper para obter nome do usuário
  const getUserNameFallback = (userId: string) => {
    return getUserName(userId) || userId.substring(0, 8) + '...';
  };

  // 🔔 MELHORIA: Componente para mostrar status da conexão real-time
  const RealTimeStatusIndicator = () => {
    const [timeAgo, setTimeAgo] = useState('');
    
    useEffect(() => {
      const updateTimeAgo = () => {
        if (lastUpdateTime) {
          const diffInSeconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
          if (diffInSeconds < 60) {
            setTimeAgo(`${diffInSeconds}s atrás`);
          } else if (diffInSeconds < 3600) {
            setTimeAgo(`${Math.floor(diffInSeconds / 60)}m atrás`);
          } else {
            setTimeAgo(`${Math.floor(diffInSeconds / 3600)}h atrás`);
          }
        }
      };
      
      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 1000);
      return () => clearInterval(interval);
    }, [lastUpdateTime]);

    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {isRealTimeConnected ? (
          <div className="flex items-center gap-1">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-green-600">Conectado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <WifiOff className="w-4 h-4 text-red-500" />
            <span className="text-red-600">Desconectado</span>
          </div>
        )}
        <span>•</span>
        <span>Última atualização: {timeAgo}</span>
        {newTasksCount > 0 && (
          <>
            <span>•</span>
            <Badge variant="secondary" className="bg-blue-500 text-white animate-pulse">
              {newTasksCount} nova{newTasksCount !== 1 ? 's' : ''}
            </Badge>
          </>
        )}
      </div>
    );
  };

  // 🔄 MELHORIA: Função para refresh manual com feedback visual
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await forceRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Handler para clique nos cards de estatísticas
  const handleStatsClick = (status: 'all' | 'pendente' | 'concluida') => {
    setSelectedStatus(status);
    // Limpar outros filtros avançados para focar apenas no status
    setSelectedUser('all');
    setSelectedAccessLevel('all');
    setSelectedPriority('all');
  };

  // Função para calcular altura dinâmica baseada na quantidade de tarefas
  const calculateDynamicHeight = (taskCount: number, view: 'week' | 'month') => {
    if (view === 'week') {
      // Visualização semanal - altura base + altura por tarefa
      const baseHeight = 150; // altura base em pixels
      const taskHeight = 60; // altura por tarefa em pixels
      const minHeight = baseHeight + (taskCount * taskHeight);
      return `min-h-[${minHeight}px] sm:min-h-[${minHeight + 50}px]`;
    } else if (view === 'month') {
      // Visualização mensal - altura base + altura por tarefa
      const baseHeight = 60; // altura base em pixels
      const taskHeight = 30; // altura por tarefa em pixels
      const minHeight = baseHeight + (taskCount * taskHeight);
      return `min-h-[${minHeight}px] sm:min-h-[${minHeight + 40}px]`;
    }
    return '';
  };

  // Função para renderizar informações dos usuários de forma compacta
  const renderUserInfo = (task: Task, compact: boolean = false) => {
    const assignedNames = task.assigned_users.map(id => getUserNameFallback(id));
    const creatorName = getUserNameFallback(task.created_by);
    
    if (compact) {
      // Versão compacta para visualização mensal - mostra criador e usuários
      return (
        <div className="text-xs text-slate-300 space-y-1">
          {assignedNames.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="truncate">{assignedNames.slice(0, 2).join(', ')}{assignedNames.length > 2 ? '...' : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate">{creatorName}</span>
          </div>
        </div>
      );
    } else {
      // Versão para visualizações diária e semanal - apenas usuários atribuídos
      return (
        <div className="text-xs text-slate-300 space-y-1">
          {assignedNames.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="text-xs">Atribuído: {assignedNames.join(', ')}</span>
            </div>
          )}
        </div>
      );
    }
  };

  const handleCreateTask = async () => {
    if (isCreatingTask) return;
    
    setIsCreatingTask(true);
    try {
      const success = await createTask(newTask);
      if (success) {
        setNewTask({
          title: '',
          description: '',
          status: 'pendente',
          priority: 'media',
          due_date: '',
          due_time: '09:00',
          assigned_users: [],
          is_private: false
        });
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleEditTask = async () => {
    if (isEditingTask) return;
    
    setIsEditingTask(true);
    try {
      const success = await updateTask(editTask.id, {
        title: editTask.title,
        description: editTask.description,
        status: editTask.status,
        priority: editTask.priority,
        due_date: editTask.due_date,
        assigned_users: editTask.assigned_users,
        is_private: editTask.is_private
      });
      if (success) {
        setEditTask({
          id: '',
          title: '',
          description: '',
          status: 'pendente',
          priority: 'media',
          due_date: '',
          due_time: '09:00',
          assigned_users: [],
          is_private: false
        });
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Error editing task:', error);
    } finally {
      setIsEditingTask(false);
    }
  };

  const handleOpenEditDialog = (task: Task) => {
    const extractTimeForInput = (dateString: string): string => {
      if (!dateString) return '09:00';
      
      let timePart = '';
      
      if (dateString.includes(' ')) {
        timePart = dateString.split(' ')[1];
      }
      
      if (dateString.includes('T')) {
        timePart = dateString.split('T')[1];
      }
      
      if (timePart && timePart.includes(':')) {
        const timeParts = timePart.split(':');
        return `${timeParts[0]}:${timeParts[1]}`;
      }
      
      return '09:00';
    };

    setEditTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      due_time: extractTimeForInput(task.due_date || ''),
      assigned_users: task.assigned_users,
      is_private: task.is_private
    });
    setIsEditDialogOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const handleCloseTaskDetails = () => {
    setIsTaskDetailsOpen(false);
    setSelectedTask(null);
  };

  const handleDoubleClickHour = (hour: number, date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    
    setNewTask({
      title: '',
      description: '',
      status: 'pendente',
      priority: 'media',
      due_date: `${dateString} ${timeString}:00`,
      due_time: timeString,
      assigned_users: [],
      is_private: false
    });
    setIsCreateDialogOpen(true);
  };

  const handleDoubleClickDay = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    setNewTask({
      title: '',
      description: '',
      status: 'pendente',
      priority: 'media',
      due_date: `${dateString} 09:00:00`,
      due_time: '09:00',
      assigned_users: [],
      is_private: false
    });
    setIsCreateDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    switch (currentView) {
      case 'day':
        newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setSelectedDate(newDate);
  };

  const getTasksForHour = (hour: number) => {
    return filteredTasks.filter(task => {
      if (!task.due_date) return false;
      
      const taskDate = new Date(task.due_date);
      const taskHour = taskDate.getHours();
      
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedDay = selectedDate.getDate();
      
      const taskYear = taskDate.getFullYear();
      const taskMonth = taskDate.getMonth();
      const taskDay = taskDate.getDate();
      
      return taskYear === selectedYear && 
             taskMonth === selectedMonth && 
             taskDay === selectedDay && 
             taskHour === hour;
    });
  };

  const getTasksForDay = (day: Date) => {
    return filteredTasks.filter(task => {
      if (!task.due_date) return false;
      
      const taskDate = new Date(task.due_date);
      
      const taskYear = taskDate.getFullYear();
      const taskMonth = taskDate.getMonth();
      const taskDay = taskDate.getDate();
      
      const dayYear = day.getFullYear();
      const dayMonth = day.getMonth();
      const dayDay = day.getDate();
      
      return taskYear === dayYear && taskMonth === dayMonth && taskDay === dayDay;
    });
  };

  const weekDays = getWeekDaysBR(selectedDate);
  const monthDays = getMonthDaysBR(selectedDate);

  // Renderização da visualização semanal
  const renderWeekView = () => (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
      {weekDays.map((day, index) => {
        const dayTasks = getTasksForDay(day);
        const isToday = isSameDay(day, getTodayBR());
        const dayLabel = day.toLocaleDateString('pt-BR', { weekday: 'short' });
        
        return (
          <div
            key={index}
            className={`bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 flex flex-col ${
              isToday ? 'ring-2 ring-blue-500/50' : ''
            }`}
            onDoubleClick={() => handleDoubleClickDay(day)}
          >
            {/* Header do dia */}
            <div className="flex items-center justify-between p-2 sm:p-3 border-b border-slate-700/30">
              <div className="text-sm font-medium text-slate-300">
                {dayLabel}
              </div>
              <div className="text-xs text-slate-400">
                {day.getDate()}
              </div>
            </div>
            
            {/* Container das tarefas com scroll */}
            <div className="flex-1 p-2 sm:p-3 overflow-y-auto max-h-[200px] sm:max-h-[500px] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              <div className="space-y-1 sm:space-y-2">
                {dayTasks.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">
                    Nenhuma tarefa
                  </div>
                ) : (
                  dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <TaskCard
                        task={task}
                        actionButtons={<div />}
                        getStatusColor={getStatusColor}
                        getPriorityColor={getPriorityColor}
                        getStatusLabel={getStatusLabel}
                        getPriorityLabel={getPriorityLabel}
                        getUserName={getUserNameFallback}
                        canEditTask={() => canEditTaskFull(task)}
                        onEditTask={handleOpenEditDialog}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Contador de tarefas */}
            {dayTasks.length > 0 && (
              <div className="px-2 sm:px-3 py-1 border-t border-slate-700/30">
                <div className="text-xs text-slate-400 text-center">
                  {dayTasks.length} tarefa{dayTasks.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Renderização da visualização mensal
  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
        <div key={day} className="text-center text-sm font-medium text-slate-400 p-2">
          {day}
        </div>
      ))}
      {monthDays.map((day, index) => {
        const dayTasks = getTasksForDay(day);
        const isToday = isSameDay(day, getTodayBR());
        const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
        
        return (
          <div
            key={index}
            className={`bg-slate-800/20 backdrop-blur-sm rounded border border-slate-700/30 p-1 min-h-[80px] ${
              isToday ? 'ring-1 ring-blue-500/50' : ''
            } ${!isCurrentMonth ? 'opacity-50' : ''}`}
            onDoubleClick={() => handleDoubleClickDay(day)}
          >
            <div className="text-xs text-slate-400 mb-1">
              {day.getDate()}
            </div>
            
            <div className="space-y-0.5">
              {dayTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(task.status)} ${getPriorityColor(task.priority)}`}
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="truncate">{task.title}</div>
                  {task.due_date && (
                    <div className="text-xs opacity-70">
                      {formatTimeToBR(task.due_date)}
                    </div>
                  )}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <div className="text-xs text-slate-400 text-center">
                  +{dayTasks.length - 3} mais
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Renderização da visualização diária
  const renderDayView = () => (
    <div className="space-y-2">
      {Array.from({ length: 24 }, (_, hour) => {
        const hourTasks = getTasksForHour(hour);
        const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
        
        return (
          <div
            key={hour}
            className="bg-slate-800/20 backdrop-blur-sm rounded-lg p-3 border border-slate-700/30"
            onDoubleClick={() => handleDoubleClickHour(hour, selectedDate)}
          >
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-slate-300 w-16">
                {timeLabel}
              </div>
              <div className="flex-1 space-y-2">
                {hourTasks.map((task) => (
                  <div
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <TaskCard
                      task={task}
                      actionButtons={<div />}
                      getStatusColor={getStatusColor}
                      getPriorityColor={getPriorityColor}
                      getStatusLabel={getStatusLabel}
                      getPriorityLabel={getPriorityLabel}
                      getUserName={getUserNameFallback}
                      canEditTask={() => canEditTaskFull(task)}
                      onEditTask={handleOpenEditDialog}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Gerenciador de Tarefas
              </h1>
              <p className="text-slate-400 mt-1">
                Gerencie suas tarefas de forma eficiente
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RealTimeStatusIndicator />
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-slate-600 hover:border-slate-500"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={isCreatingTask}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreatingTask ? 'Criando...' : 'Nova Tarefa'}
            </Button>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              />
            </div>


          </div>
        </div>

        {/* Filtros avançados */}
        <AdvancedTaskFilters
          selectedUser={selectedUser}
          onUserChange={setSelectedUser}
          selectedAccessLevel={selectedAccessLevel}
          onAccessLevelChange={setSelectedAccessLevel}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          userProfiles={userProfiles}
          onClearFilters={clearAdvancedFilters}
        />

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card 
            className="bg-slate-800/50 border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors"
            onClick={() => handleStatsClick('all')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total</p>
                  <p className="text-3xl font-bold text-white">{filteredTasks.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors"
            onClick={() => handleStatsClick('pendente')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-400">{filteredTasks.filter(t => t.status === 'pendente').length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors"
            onClick={() => handleStatsClick('concluida')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Concluídas</p>
                  <p className="text-3xl font-bold text-green-400">{filteredTasks.filter(t => t.status === 'concluida').length}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Performance</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {filteredTasks.length > 0 ? Math.round((filteredTasks.filter(t => t.status === 'concluida').length / filteredTasks.length) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navegação de visualização */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigateDate('prev')}
                variant="outline"
                size="sm"
                className="border-slate-600 hover:border-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold text-white">
                {getViewTitleBR(currentView, selectedDate)}
              </h2>
              <Button
                onClick={() => navigateDate('next')}
                variant="outline"
                size="sm"
                className="border-slate-600 hover:border-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentView('day')}
                variant={currentView === 'day' ? 'default' : 'outline'}
                size="sm"
                className={currentView === 'day' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 hover:border-slate-500'}
              >
                Dia
              </Button>
              <Button
                onClick={() => setCurrentView('week')}
                variant={currentView === 'week' ? 'default' : 'outline'}
                size="sm"
                className={currentView === 'week' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 hover:border-slate-500'}
              >
                Semana
              </Button>
              <Button
                onClick={() => setCurrentView('month')}
                variant={currentView === 'month' ? 'default' : 'outline'}
                size="sm"
                className={currentView === 'month' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 hover:border-slate-500'}
              >
                Mês
              </Button>
            </div>
          </div>
          
          <TaskFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            getFilterCount={getFilterCount}
          />
        </div>

        {/* Conteúdo das tarefas */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/50">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-400 mt-4">Carregando tarefas...</p>
            </div>
          ) : (
            <>
              {currentView === 'day' && renderDayView()}
              {currentView === 'week' && renderWeekView()}
              {currentView === 'month' && renderMonthView()}
            </>
          )}
        </div>
      </div>

      {/* Diálogos */}
      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        newTask={newTask}
        onTaskChange={setNewTask}
        onCreateTask={handleCreateTask}
        isCreating={isCreatingTask}
      />

      <EditTaskDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editTask={editTask}
        onTaskChange={setEditTask}
        onSaveTask={handleEditTask}
        isSaving={isEditingTask}
      />

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isTaskDetailsOpen}
        onClose={handleCloseTaskDetails}
        onUpdateStatus={updateTaskStatus}
        onDeleteTask={handleDeleteTask}
        canEdit={selectedTask ? canEditTask(selectedTask) : false}
        canDelete={selectedTask ? canDeleteTask(selectedTask) : false}
        isUpdating={!!updatingTask}
      />
    </div>
  );
};

export default TaskManager;
