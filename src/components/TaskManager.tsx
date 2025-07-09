import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Calendar, Clock, Users, ShieldCheck, RefreshCw, Wifi, WifiOff, User } from 'lucide-react';
import CreateTaskDialog from './task/CreateTaskDialog';
import EditTaskDialog from './task/EditTaskDialog';
import TaskCard from './task/TaskCard';
import AdvancedTaskFilters from './task/AdvancedTaskFilters';
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
  const { getUserName } = useUserProfiles();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  // 🔧 Estados faltantes que foram referenciados no código
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

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('day');

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
    if (isCreatingTask) return; // Prevent multiple simultaneous calls
    
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
    if (isEditingTask) return; // Prevent multiple simultaneous calls
    
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
    // Converter task para editTask format
    const extractTimeForInput = (dateString: string): string => {
      if (!dateString) return '09:00';
      
      let timePart = '';
      
      // Se contém espaço (formato: "YYYY-MM-DD HH:MM:SS")
      if (dateString.includes(' ')) {
        timePart = dateString.split(' ')[1];
      }
      
      // Se contém T (formato ISO: "YYYY-MM-DDTHH:MM:SS")
      if (dateString.includes('T')) {
        timePart = dateString.split('T')[1];
      }
      
      // Extrair apenas HH:MM
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
    // Formatar a data no formato YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    
    console.log('Duplo clique na hora:', { dateString, timeString, originalDate: date });
    
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
    // Formatar a data no formato YYYY-MM-DD
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

  // Calcular estatísticas baseadas nas tarefas filtradas
  const stats = {
    total: filteredTasks.length,
    pendentes: filteredTasks.filter(t => t.status === 'pendente').length,
    concluidas: filteredTasks.filter(t => t.status === 'concluida').length,
    performance: filteredTasks.length > 0 ? Math.round((filteredTasks.filter(t => t.status === 'concluida').length / filteredTasks.length) * 100) : 0
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

  // Função corrigida para comparar datas sem conversão de timezone
  const getTasksForHour = (hour: number) => {
    return filteredTasks.filter(task => {
      if (!task.due_date) return false;
      
      // Usar a mesma lógica que formatTimeToBR - converter para Date e extrair a hora local
      const taskDate = new Date(task.due_date);
      const taskHour = taskDate.getHours();
      
      // Data selecionada
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedDay = selectedDate.getDate();
      
      // Data da tarefa
      const taskYear = taskDate.getFullYear();
      const taskMonth = taskDate.getMonth();
      const taskDay = taskDate.getDate();
      
      return taskYear === selectedYear && 
             taskMonth === selectedMonth && 
             taskDay === selectedDay && 
             taskHour === hour;
    });
  };

  // Função corrigida para comparar datas sem conversão de timezone
  const getTasksForDay = (day: Date) => {
    return filteredTasks.filter(task => {
      if (!task.due_date) return false;
      
      // Usar a mesma lógica que formatTimeToBR - converter para Date e extrair a data local
      const taskDate = new Date(task.due_date);
      
      // Data da tarefa
      const taskYear = taskDate.getFullYear();
      const taskMonth = taskDate.getMonth();
      const taskDay = taskDate.getDate();
      
      // Data do dia comparado
      const dayYear = day.getFullYear();
      const dayMonth = day.getMonth();
      const dayDay = day.getDate();
      
      return taskYear === dayYear && taskMonth === dayMonth && taskDay === dayDay;
    });
  };

  const weekDays = getWeekDaysBR(selectedDate);
  const monthDays = getMonthDaysBR(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 🚀 MELHORIA: Header com status real-time */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Gerenciador de Tarefas
              </h1>
              <p className="text-gray-600 mt-1">
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
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
          
          {/* Filtros e controles existentes */}
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
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <Button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Filtros avançados */}
        {showAdvancedFilters && (
          <AdvancedTaskFilters
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            selectedAccessLevel={selectedAccessLevel}
            setSelectedAccessLevel={setSelectedAccessLevel}
            selectedPriority={selectedPriority}
            setSelectedPriority={setSelectedPriority}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            clearAdvancedFilters={clearAdvancedFilters}
          />
        )}

        {/* Tabs de filtros temporais */}
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Badge variant="secondary">{getFilterCount('all')}</Badge>
              Todas
            </TabsTrigger>
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <Badge variant="secondary">{getFilterCount('today')}</Badge>
              Hoje
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <Badge variant="secondary">{getFilterCount('week')}</Badge>
              Esta Semana
            </TabsTrigger>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <Badge variant="secondary">{getFilterCount('month')}</Badge>
              Este Mês
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de tarefas */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Carregando tarefas...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Nenhuma tarefa encontrada</p>
                <p className="text-sm text-gray-400 mt-2">
                  {searchTerm ? 'Tente ajustar sua pesquisa' : 'Comece criando uma nova tarefa'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks
              .filter(task => 
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  actionButtons={<div />}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  getStatusLabel={getStatusLabel}
                  getPriorityLabel={getPriorityLabel}
                  getUserName={getUserNameFallback}
                  canEditTask={canEditTaskFull}
                  onEditTask={handleOpenEditDialog}
                />
              ))
          )}
        </div>
      </div>

      {/* Dialog de criação de tarefa */}
      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        newTask={newTask}
        onTaskChange={setNewTask}
        onCreateTask={handleCreateTask}
        isCreating={isCreatingTask}
      />

      {/* Dialog de edição de tarefa */}
      <EditTaskDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editTask={editTask}
        onTaskChange={setEditTask}
        onSaveTask={handleEditTask}
        isSaving={isEditingTask}
      />
    </div>
  );
};

export default TaskManager;
