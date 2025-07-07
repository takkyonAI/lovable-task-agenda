
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Clock, CheckCircle, TrendingUp, CalendarDays, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import CreateTaskDialog from './task/CreateTaskDialog';
import { useTaskManager } from '@/hooks/useTaskManager';
import { getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '@/utils/taskUtils';
import { NewTask } from '@/types/task';

const TaskManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    status: 'pendente',
    priority: 'media',
    due_date: '',
    assigned_users: []
  });

  const {
    tasks,
    filteredTasks,
    isLoading,
    updatingTask,
    updateTaskStatus,
    canEditTask,
    createTask
  } = useTaskManager();

  const handleCreateTask = async () => {
    const success = await createTask(newTask);
    if (success) {
      setNewTask({
        title: '',
        description: '',
        status: 'pendente',
        priority: 'media',
        due_date: '',
        assigned_users: []
      });
      setIsCreateDialogOpen(false);
    }
  };

  // Calcular estatísticas
  const stats = {
    total: tasks.length,
    pendentes: tasks.filter(t => t.status === 'pendente').length,
    concluidas: tasks.filter(t => t.status === 'concluida').length,
    performance: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'concluida').length / tasks.length) * 100) : 0
  };

  // Funções para navegação de data
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

  const getViewTitle = () => {
    switch (currentView) {
      case 'day':
        return selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      case 'week':
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
      case 'month':
        return selectedDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
      default:
        return '';
    }
  };

  // Funções para obter tarefas por período
  const getTasksForHour = (hour: number) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === selectedDate.toDateString() && taskDate.getHours() === hour;
    });
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === day.toDateString();
    });
  };

  // Gerar dias da semana
  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  };

  // Gerar dias do mês
  const getMonthDays = () => {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();

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
          {/* Grid de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

          {/* Navegação do Calendário */}
          <Card className="bg-slate-700/30 border-slate-600 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-slate-600/50 border-slate-500 hover:bg-slate-500/50 text-white"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">{getViewTitle()}</h3>
                  <p className="text-sm text-slate-400">{filteredTasks.length} tarefas</p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-slate-600/50 border-slate-500 hover:bg-slate-500/50 text-white"
                  onClick={() => navigateDate('next')}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs para diferentes visualizações */}
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'day' | 'week' | 'month')}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 border-slate-600">
              <TabsTrigger value="day" className="data-[state=active]:bg-purple-600">
                Dia
              </TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-purple-600">
                Semana
              </TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-purple-600">
                Mês
              </TabsTrigger>
            </TabsList>

            {/* Vista Diária - Timeline */}
            <TabsContent value="day">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Agenda do Dia - {selectedDate.toLocaleDateString('pt-BR')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div key={hour} className="flex border-b border-slate-600/50">
                        <div className="w-16 text-sm text-slate-400 py-3 pr-4">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="flex-1 min-h-[60px] py-2">
                          {getTasksForHour(hour).map(task => (
                            <div key={task.id} className="flex items-center justify-between p-2 bg-slate-600/30 rounded border-l-4 border-blue-500 mb-1">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-white text-sm">{task.title}</h4>
                                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority)}
                                  </Badge>
                                </div>
                                <p className="text-slate-400 text-xs">{task.description}</p>
                              </div>
                              {task.status === 'pendente' && canEditTask(task) && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white ml-2"
                                  onClick={() => updateTaskStatus(task.id, 'concluida')}
                                  disabled={updatingTask === task.id}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vista Semanal - 7 Colunas */}
            <TabsContent value="week">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CalendarDays className="w-5 h-5 mr-2" />
                    Visualização Semanal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, index) => {
                      const dayTasks = getTasksForDay(day);
                      const isToday = day.toDateString() === new Date().toDateString();
                      
                      return (
                        <div key={index} className={`border border-slate-600 rounded-lg p-3 min-h-[200px] ${
                          isToday ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-600/20'
                        }`}>
                          <div className="text-center mb-3">
                            <div className="text-xs text-slate-400">
                              {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                            </div>
                            <div className={`text-lg font-semibold ${isToday ? 'text-blue-400' : 'text-white'}`}>
                              {day.getDate()}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            {dayTasks.map(task => (
                              <div key={task.id} className="p-2 bg-slate-500/30 rounded text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white font-medium truncate">{task.title}</span>
                                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority).charAt(0).toUpperCase()}
                                  </Badge>
                                </div>
                                {task.due_date && (
                                  <div className="text-slate-400">
                                    {formatTime(task.due_date)}
                                  </div>
                                )}
                                {task.status === 'pendente' && canEditTask(task) && (
                                  <Button 
                                    size="sm" 
                                    className="w-full mt-1 bg-green-600 hover:bg-green-700 text-white h-6 text-xs"
                                    onClick={() => updateTaskStatus(task.id, 'concluida')}
                                    disabled={updatingTask === task.id}
                                  >
                                    Concluir
                                  </Button>
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

            {/* Vista Mensal - Grade de Calendário */}
            <TabsContent value="month">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    {selectedDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Cabeçalho dos dias da semana */}
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-xs text-slate-400 py-2 font-medium">
                        {day}
                      </div>
                    ))}
                    
                    {/* Grade de dias */}
                    {monthDays.map((day, index) => {
                      const dayTasks = getTasksForDay(day);
                      const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                      const isToday = day.toDateString() === new Date().toDateString();
                      
                      return (
                        <div key={index} className={`border border-slate-600 rounded p-1 min-h-[100px] text-xs ${
                          isCurrentMonth 
                            ? isToday 
                              ? 'bg-blue-500/20 border-blue-500' 
                              : 'bg-slate-600/20' 
                            : 'bg-slate-800/20 text-slate-500'
                        }`}>
                          <div className={`text-center mb-1 ${isToday ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
                            {day.getDate()}
                          </div>
                          
                          <div className="space-y-1">
                            {dayTasks.slice(0, 2).map(task => (
                              <div key={task.id} className="p-1 bg-slate-500/30 rounded text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-medium truncate text-xs">{task.title}</span>
                                  <div className={`w-2 h-2 rounded-full ${
                                    task.priority === 'urgente' ? 'bg-red-500' :
                                    task.priority === 'alta' ? 'bg-orange-500' :
                                    task.priority === 'media' ? 'bg-yellow-500' :
                                    'bg-green-500'
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
    </div>
  );
};

export default TaskManager;
