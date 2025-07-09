import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Clock, CheckCircle, TrendingUp, CalendarDays, Calendar, ChevronLeft, ChevronRight, User, Users, Eye } from 'lucide-react';
import CreateTaskDialog from './task/CreateTaskDialog';
import TaskDetailsModal from './task/TaskDetailsModal';
import TaskFilters from './task/TaskFilters';
import AdvancedTaskFilters from './task/AdvancedTaskFilters';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '@/utils/taskUtils';
import { formatDateToBR, formatTimeToBR, isSameDay, getTodayBR, getWeekDaysBR, getMonthDaysBR, getViewTitleBR } from '@/utils/dateUtils';
import { NewTask, Task } from '@/types/task';

const TaskManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayBR());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
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
    clearAdvancedFilters,
    getFilterCount,
    updateTaskStatus,
    canEditTask,
    createTask,
    deleteTask,
    canDeleteTask
  } = useTaskManager();

  const { getUserName, userProfiles } = useUserProfiles();

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
    const assignedNames = task.assigned_users.map(id => getUserName(id));
    const creatorName = getUserName(task.created_by);
    
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
    <div className="space-y-6">
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Gerenciar Tarefas</CardTitle>
                <p className="text-slate-400 text-sm">Crie e gerencie tarefas com visualização de calendário</p>
              </div>
            </div>
            
            <CreateTaskDialog
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              newTask={newTask}
              onTaskChange={setNewTask}
              onCreateTask={handleCreateTask}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-700/30 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-700/30 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pendentes}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-700/30 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Concluídas</p>
                    <p className="text-2xl font-bold text-green-400">{stats.concluidas}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-700/30 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Performance</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.performance}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <TaskFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              getFilterCount={getFilterCount}
            />
            
            <AdvancedTaskFilters
              selectedUser={selectedUser}
              onUserChange={setSelectedUser}
              selectedAccessLevel={selectedAccessLevel}
              onAccessLevelChange={setSelectedAccessLevel}
              onClearFilters={clearAdvancedFilters}
              userProfiles={userProfiles}
            />
          </div>

          <Card className="bg-slate-700/30 border-slate-600 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-slate-600/50 border-slate-500 hover:bg-slate-500/50 text-white text-xs sm:text-sm"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Ant</span>
                </Button>
                
                <div className="text-center flex-1 px-2">
                  <h3 className="text-sm sm:text-lg font-semibold text-white truncate">{getViewTitleBR(currentView, selectedDate)}</h3>
                  <p className="text-xs sm:text-sm text-slate-400">{filteredTasks.length} tarefas</p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-slate-600/50 border-slate-500 hover:bg-slate-500/50 text-white text-xs sm:text-sm"
                  onClick={() => navigateDate('next')}
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <span className="sm:hidden">Prox</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'day' | 'week' | 'month')}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 border-slate-600">
              <TabsTrigger value="day" className="data-[state=active]:bg-blue-600">
                Dia
              </TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-blue-600">
                Semana
              </TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-blue-600">
                Mês
              </TabsTrigger>
            </TabsList>

            <TabsContent value="day">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    <div className="flex-1">
                      <div className="hidden sm:block">
                        Agenda do Dia - {formatDateToBR(selectedDate)}
                      </div>
                      <div className="block sm:hidden">
                        <div>Agenda do Dia</div>
                        <div className="text-sm text-slate-400 font-normal">
                          {formatDateToBR(selectedDate)}
                        </div>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div key={hour} className="flex border-b border-slate-600/50">
                        <div className="w-16 text-sm text-slate-400 py-3 pr-4">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        <div 
                          className="flex-1 min-h-[60px] py-2 cursor-pointer hover:bg-slate-600/20 transition-colors" 
                          onDoubleClick={() => handleDoubleClickHour(hour, selectedDate)}
                        >
                          {getTasksForHour(hour).map(task => (
                            <div 
                              key={task.id} 
                              className="flex flex-col p-3 bg-slate-600/30 rounded border-l-4 border-blue-500 mb-2 cursor-pointer hover:bg-slate-600/40 transition-colors"
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <h4 className="font-medium text-white text-sm break-words flex-1 text-left">{task.title}</h4>
                                  {task.is_private && (
                                    <Eye className="w-4 h-4 text-amber-400 flex-shrink-0" title="Tarefa Privada" />
                                  )}
                                </div>
                                <Badge className={`