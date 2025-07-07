import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CalendarDays, 
  Target, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Plus
} from 'lucide-react';
import { Task } from '@/types/task';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import GoogleSheetsConfig from '@/components/GoogleSheetsConfig';
import UserManagement from '@/components/UserManagement';
import LoginForm from '@/components/LoginForm';
import UserHeader from '@/components/UserHeader';

const AppContent = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'media' as const,
    category: 'vendas',
    scheduledDate: '',
    estimatedTime: ''
  });

  const googleSheets = useGoogleSheets();
  const { currentUser, canAccessGoogleConfig, canAccessUserManagement } = useAuth();

  // Carregar configuração e tarefas na inicialização
  useEffect(() => {
    googleSheets.loadConfig();
  }, []);

  useEffect(() => {
    if (googleSheets.isConfigured) {
      googleSheets.fetchTasks().then(setTasks);
    }
  }, [googleSheets.isConfigured]);

  // Agora que todos os hooks foram executados, podemos fazer a verificação de autenticação
  if (!currentUser) {
    return <LoginForm />;
  }

  const getTaskStats = () => {
    const total = tasks.length;
    const pendentes = tasks.filter(t => t.status === 'pendente').length;
    const concluidas = tasks.filter(t => t.status === 'concluido').length;
    const performance = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    
    return { total, pendentes, concluidas, performance };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'media': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'baixa': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-blue-500/20 text-blue-400';
      case 'concluido': return 'bg-green-500/20 text-green-400';
      case 'cancelado': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTasksForHour = (hour: number) => {
    return tasks.filter(task => {
      const taskHour = task.scheduledDate.getHours();
      const isToday = task.scheduledDate.toDateString() === selectedDate.toDateString();
      return isToday && taskHour === hour;
    });
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => 
      task.scheduledDate.toDateString() === day.toDateString()
    );
  };

  const getTasksForMonth = (month: number, year: number) => {
    return tasks.filter(task => 
      task.scheduledDate.getMonth() === month && 
      task.scheduledDate.getFullYear() === year
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getViewTitle = () => {
    switch (view) {
      case 'daily':
        return selectedDate.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'weekly':
        return `Semana de ${selectedDate.toLocaleDateString('pt-BR')}`;
      case 'monthly':
        return selectedDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
      case 'yearly':
        return selectedDate.getFullYear().toString();
      default:
        return '';
    }
  };

  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const getMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getYearMonths = () => {
    const year = selectedDate.getFullYear();
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  };

  const completeTask = async (taskId: string) => {
    try {
      const updatedTask = await googleSheets.updateTask(taskId, { 
        status: 'concluido', 
        completedDate: new Date(), 
        updatedAt: new Date() 
      });
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      console.error('Erro ao completar tarefa:', error);
    }
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.scheduledDate) return;

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        type: 'manual' as const,
        priority: newTask.priority,
        status: 'pendente' as const,
        scheduledDate: new Date(newTask.scheduledDate),
        category: newTask.category,
        estimatedTime: newTask.estimatedTime ? parseInt(newTask.estimatedTime) : undefined,
      };

      const createdTask = await googleSheets.addTask(taskData);
      setTasks(prev => [...prev, createdTask]);
      
      setNewTask({
        title: '',
        description: '',
        priority: 'media',
        category: 'vendas',
        scheduledDate: '',
        estimatedTime: ''
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  const stats = getTaskStats();
  const filteredTasks = tasks.filter(task => {
    const taskDate = task.scheduledDate.toDateString();
    const selectedDateStr = selectedDate.toDateString();
    
    switch (view) {
      case 'daily':
        return taskDate === selectedDateStr;
      case 'weekly':
        const weekDays = getWeekDays();
        return weekDays.some(day => day.toDateString() === taskDate);
      case 'monthly':
        return task.scheduledDate.getMonth() === selectedDate.getMonth() &&
               task.scheduledDate.getFullYear() === selectedDate.getFullYear();
      case 'yearly':
        return task.scheduledDate.getFullYear() === selectedDate.getFullYear();
      default:
        return true;
    }
  });

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();
  const yearMonths = getYearMonths();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header do Usuário */}
        <UserHeader />

        {/* Configuração Google Sheets - apenas para Admin */}
        {canAccessGoogleConfig() && (
          <GoogleSheetsConfig 
            onConfigSave={googleSheets.saveConfig}
            isConfigured={googleSheets.isConfigured}
          />
        )}

        {/* Gerenciamento de Usuários - apenas para Admin */}
        {canAccessUserManagement() && <UserManagement />}

        {/* Header */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Agenda de Tarefas</CardTitle>
                  <p className="text-slate-400 text-sm">Gerencie todas as suas tarefas e follow-ups</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Select value={view} onValueChange={(value: any) => setView(value)}>
                  <SelectTrigger className="w-40 bg-slate-700/80 border-slate-600 text-white font-medium shadow-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="daily" className="text-white hover:bg-slate-700">
                      📅 Diário
                    </SelectItem>
                    <SelectItem value="weekly" className="text-white hover:bg-slate-700">
                      📊 Semanal
                    </SelectItem>
                    <SelectItem value="monthly" className="text-white hover:bg-slate-700">
                      🗓️ Mensal
                    </SelectItem>
                    <SelectItem value="yearly" className="text-white hover:bg-slate-700">
                      📈 Anual
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Tarefa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Criar Nova Tarefa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title" className="text-slate-300">Título</Label>
                        <Input
                          id="title"
                          value={newTask.title}
                          onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-slate-700/50 border-slate-600 text-white"
                          placeholder="Ex: Ligação para cliente"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description" className="text-slate-300">Descrição</Label>
                        <Textarea
                          id="description"
                          value={newTask.description}
                          onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-slate-700/50 border-slate-600 text-white"
                          placeholder="Descreva a tarefa detalhadamente..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="priority" className="text-slate-300">Prioridade</Label>
                          <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger className="bg-slate-700/50 border-slate-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="media">Média</SelectItem>
                              <SelectItem value="baixa">Baixa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="category" className="text-slate-300">Categoria</Label>
                          <Select value={newTask.category} onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger className="bg-slate-700/50 border-slate-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="vendas">Vendas</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="suporte">Suporte</SelectItem>
                              <SelectItem value="admin">Administrativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="scheduledDate" className="text-slate-300">Data Agendada</Label>
                          <Input
                            id="scheduledDate"
                            type="datetime-local"
                            value={newTask.scheduledDate}
                            onChange={(e) => setNewTask(prev => ({ ...prev, scheduledDate: e.target.value }))}
                            className="bg-slate-700/50 border-slate-600 text-white"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="estimatedTime" className="text-slate-300">Tempo Estimado (min)</Label>
                          <Input
                            id="estimatedTime"
                            type="number"
                            value={newTask.estimatedTime}
                            onChange={(e) => setNewTask(prev => ({ ...prev, estimatedTime: e.target.value }))}
                            className="bg-slate-700/50 border-slate-600 text-white"
                            placeholder="30"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={createTask}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        Criar Tarefa
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Grid de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
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
          
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
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
          
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
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
          
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
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
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (view === 'daily') {
                    newDate.setDate(newDate.getDate() - 1);
                  } else if (view === 'weekly') {
                    newDate.setDate(newDate.getDate() - 7);
                  } else if (view === 'monthly') {
                    newDate.setMonth(newDate.getMonth() - 1);
                  } else if (view === 'yearly') {
                    newDate.setFullYear(newDate.getFullYear() - 1);
                  }
                  setSelectedDate(newDate);
                }}
              >
                ← Anterior
              </Button>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">{getViewTitle()}</h3>
                <p className="text-sm text-slate-400">{filteredTasks.length} tarefas</p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (view === 'daily') {
                    newDate.setDate(newDate.getDate() + 1);
                  } else if (view === 'weekly') {
                    newDate.setDate(newDate.getDate() + 7);
                  } else if (view === 'monthly') {
                    newDate.setMonth(newDate.getMonth() + 1);
                  } else if (view === 'yearly') {
                    newDate.setFullYear(newDate.getFullYear() + 1);
                  }
                  setSelectedDate(newDate);
                }}
              >
                Próximo →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visualizações do Calendário */}
        {view === 'daily' && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Agenda do Dia - {selectedDate.toLocaleDateString('pt-BR')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {[...Array(24)].map((_, hour) => {
                  const hourTasks = getTasksForHour(hour);
                  return (
                    <div key={hour} className="flex border-b border-slate-700/50">
                      <div className="w-16 text-sm text-slate-400 py-3 pr-4">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 min-h-[60px] py-2">
                        {hourTasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded border-l-4 border-blue-500 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-white text-sm">{task.title}</h4>
                                <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </Badge>
                                <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                  {task.status}
                                </Badge>
                              </div>
                              <p className="text-slate-400 text-xs">{task.description}</p>
                            </div>
                            {task.status === 'pendente' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white ml-2"
                                onClick={() => completeTask(task.id)}
                              >
                                <CheckCircle className="w-3 h-3" />
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
        )}

        {view === 'weekly' && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CalendarDays className="w-5 h-5 mr-2" />
                Visualização Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const dayTasks = getTasksForDay(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={index} className={`border border-slate-600 rounded-lg p-3 min-h-[200px] ${
                      isToday ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-700/20'
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
                          <div key={task.id} className="p-2 bg-slate-600/30 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-medium truncate">{task.title}</span>
                              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority.charAt(0).toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-slate-400">
                              {formatTime(task.scheduledDate)}
                            </div>
                            {task.status === 'pendente' && (
                              <Button 
                                size="sm" 
                                className="w-full mt-1 bg-green-600 hover:bg-green-700 text-white h-6 text-xs"
                                onClick={() => completeTask(task.id)}
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
        )}

        {view === 'monthly' && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CalendarDays className="w-5 h-5 mr-2" />
                {selectedDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-xs text-slate-400 py-2 font-medium">
                    {day}
                  </div>
                ))}
                
                {monthDays.map((day, index) => {
                  const dayTasks = getTasksForDay(day);
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={index} className={`border border-slate-600 rounded p-1 min-h-[100px] text-xs ${
                      isCurrentMonth 
                        ? isToday 
                          ? 'bg-blue-500/20 border-blue-500' 
                          : 'bg-slate-700/20' 
                        : 'bg-slate-800/20 text-slate-500'
                    }`}>
                      <div className={`text-center mb-1 ${isToday ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map(task => (
                          <div key={task.id} className="p-1 bg-slate-600/30 rounded text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium truncate text-xs">{task.title}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                task.priority === 'alta' ? 'bg-red-500' :
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
        )}

        {view === 'yearly' && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CalendarDays className="w-5 h-5 mr-2" />
                Visualização Anual - {selectedDate.getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {yearMonths.map((month, index) => {
                  const monthTasks = getTasksForMonth(month.getMonth(), month.getFullYear());
                  const isCurrentMonth = month.getMonth() === new Date().getMonth() && 
                                        month.getFullYear() === new Date().getFullYear();
                  
                  return (
                    <div key={index} className={`border border-slate-600 rounded-lg p-4 min-h-[150px] ${
                      isCurrentMonth ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-700/20'
                    }`}>
                      <div className="text-center mb-3">
                        <h3 className={`text-sm font-semibold ${
                          isCurrentMonth ? 'text-blue-400' : 'text-white'
                        }`}>
                          {month.toLocaleDateString('pt-BR', { month: 'long' })}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {monthTasks.length} tarefas
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        {monthTasks.slice(0, 3).map(task => (
                          <div key={task.id} className="p-2 bg-slate-600/30 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-medium truncate">{task.title}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                task.priority === 'alta' ? 'bg-red-500' :
                                task.priority === 'media' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}></div>
                            </div>
                            <div className="text-slate-400">
                              {task.scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </div>
                        ))}
                        {monthTasks.length > 3 && (
                          <div className="text-xs text-slate-400 text-center">
                            +{monthTasks.length - 3} mais
                          </div>
                        )}
                        {monthTasks.length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-4">
                            Nenhuma tarefa
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
