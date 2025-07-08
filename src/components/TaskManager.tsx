import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Clock, CheckCircle, TrendingUp, CalendarDays, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
    assigned_users: []
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
        assigned_users: []
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
      assigned_users: []
    });
    setIsCreateDialogOpen(true);
  };

  const handleDoubleClickDay = (date: Date) => {
    // Formatar a data no formato YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('Duplo clique no dia:', { dateString, originalDate: date });
    
    setNewTask({
      title: '',
      description: '',
      status: 'pendente',
      priority: 'media',
      due_date: `${dateString} 09:00:00`,
      due_time: '09:00',
      assigned_users: []
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
      
      // Parse da data da tarefa sem conversão de timezone
      const taskDateStr = task.due_date.toString();
      const taskDateParts = taskDateStr.split(' ')[0].split('-'); // YYYY-MM-DD
      const taskTimeParts = taskDateStr.split(' ')[1]?.split(':') || ['0', '0']; // HH:MM:SS
      
      const taskYear = parseInt(taskDateParts[0]);
      const taskMonth = parseInt(taskDateParts[1]) - 1; // JS months are 0-based
      const taskDay = parseInt(taskDateParts[2]);
      const taskHour = parseInt(taskTimeParts[0]);
      
      // Data selecionada
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedDay = selectedDate.getDate();
      
      console.log('Comparando datas:', {
        task: { year: taskYear, month: taskMonth, day: taskDay, hour: taskHour },
        selected: { year: selectedYear, month: selectedMonth, day: selectedDay, hour }
      });
      
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
      
      // Parse da data da tarefa sem conversão de timezone
      const taskDateStr = task.due_date.toString();
      const taskDateParts = taskDateStr.split(' ')[0].split('-'); // YYYY-MM-DD
      
      const taskYear = parseInt(taskDateParts[0]);
      const taskMonth = parseInt(taskDateParts[1]) - 1; // JS months are 0-based
      const taskDay = parseInt(taskDateParts[2]);
      
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
                    <p className="text-2xl font-bold text-green-400">{stats.performance}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

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
            userProfiles={userProfiles}
            onClearFilters={clearAdvancedFilters}
          />

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
                                <h4 className="font-medium text-white text-sm break-words flex-1 text-left">{task.title}</h4>
                                <Badge className={`text-xs ml-2 ${getStatusColor(task.status)}`}>
                                  {getStatusLabel(task.status)}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-slate-400 text-xs mb-2 text-left">{task.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                                {task.assigned_users.length > 0 && (
                                  <span className="text-xs text-slate-400">
                                    {getUserName(task.assigned_users[0])}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="week">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CalendarDays className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Visualização Semanal (Segunda a Sábado)</span>
                    <span className="sm:hidden">Semana</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {weekDays.map((day, index) => {
                      const dayTasks = getTasksForDay(day);
                      const isToday = isSameDay(day, getTodayBR());
                      
                      return (
                        <div 
                          key={index} 
                          className={`border border-slate-600 rounded-lg p-2 sm:p-3 min-h-[150px] sm:min-h-[200px] cursor-pointer hover:bg-slate-600/10 transition-colors ${
                            isToday ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-600/20'
                          }`}
                          onDoubleClick={() => handleDoubleClickDay(day)}
                        >
                          <div className="text-center mb-2 sm:mb-3">
                            <div className="text-xs text-slate-400">
                              {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                            </div>
                            <div className={`text-sm sm:text-lg font-semibold ${isToday ? 'text-blue-400' : 'text-white'}`}>
                              {day.getDate()}
                            </div>
                          </div>
                          
                          <div className="space-y-1 sm:space-y-2">
                            {dayTasks.map(task => (
                              <div 
                                key={task.id} 
                                className="p-1 sm:p-2 bg-slate-500/30 rounded text-xs cursor-pointer hover:bg-slate-500/40 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskClick(task);
                                }}
                              >
                                <div className="mb-1 sm:mb-2">
                                  <span className="text-white font-medium break-words block text-left text-xs sm:text-sm line-clamp-2">{task.title}</span>
                                </div>
                                {task.due_date && (
                                  <div className="text-slate-400 mb-1 sm:mb-2 text-left text-xs">
                                    {formatTimeToBR(task.due_date)}
                                  </div>
                                )}
                                {task.description && (
                                  <div className="text-slate-400 mb-1 sm:mb-2 text-left text-xs line-clamp-2">
                                    {task.description}
                                  </div>
                                )}
                                <div className="flex justify-between items-center mb-1">
                                  <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                    {getStatusLabel(task.status).charAt(0).toUpperCase()}
                                  </Badge>
                                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority).charAt(0).toUpperCase()}
                                  </Badge>
                                </div>
                                {task.assigned_users.length > 0 && (
                                  <div className="text-xs text-slate-400 text-left truncate">
                                    {getUserName(task.assigned_users[0])}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="month">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span className="truncate">{getViewTitleBR('month', selectedDate)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-xs text-slate-400 py-1 sm:py-2 font-medium">
                        {day}
                      </div>
                    ))}
                    
                    {monthDays.map((day, index) => {
                      const dayTasks = getTasksForDay(day);
                      const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                      const isToday = isSameDay(day, getTodayBR());
                      
                      return (
                        <div 
                          key={index} 
                          className={`border border-slate-600 rounded p-1 min-h-[60px] sm:min-h-[100px] text-xs cursor-pointer hover:bg-slate-600/10 transition-colors ${
                            isCurrentMonth 
                              ? isToday 
                                ? 'bg-blue-500/20 border-blue-500' 
                                : 'bg-slate-600/20' 
                              : 'bg-slate-800/20 text-slate-500'
                          }`}
                          onDoubleClick={() => handleDoubleClickDay(day)}
                        >
                          <div className={`text-center mb-1 text-xs sm:text-sm ${isToday ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
                            {day.getDate()}
                          </div>
                          
                          <div className="space-y-1">
                            {dayTasks.slice(0, 2).map(task => (
                              <div 
                                key={task.id} 
                                className="p-1 bg-slate-500/30 rounded text-xs cursor-pointer hover:bg-slate-500/40 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskClick(task);
                                }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white font-medium truncate text-xs flex-1 text-left">{task.title}</span>
                                  <div className={`w-2 h-2 rounded-full ml-1 ${
                                    task.priority === 'urgente' ? 'bg-red-500' :
                                    task.priority === 'media' ? 'bg-orange-500' :
                                    'bg-blue-500'
                                  }`}></div>
                                </div>
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <div className="text-xs text-slate-400 text-center">
                                +{dayTasks.length - 2} mais
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-400 mt-2">Carregando tarefas...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isTaskDetailsOpen}
        onClose={handleCloseTaskDetails}
        onUpdateStatus={updateTaskStatus}
        onDeleteTask={handleDeleteTask}
        canEdit={selectedTask ? canEditTask(selectedTask) : false}
        canDelete={selectedTask ? canDeleteTask(selectedTask) : false}
        isUpdating={selectedTask ? updatingTask === selectedTask.id : false}
      />
    </div>
  );
};

export default TaskManager;
