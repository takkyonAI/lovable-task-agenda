import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Calendar, Clock, Users, ShieldCheck, RefreshCw, Wifi, WifiOff, User, ChevronLeft, ChevronRight, CheckCircle, Bug } from 'lucide-react';
import CreateTaskDialog from './task/CreateTaskDialog';
import EditTaskDialog from './task/EditTaskDialog';
import TaskCard from './task/TaskCard';
import TaskFilters from './task/TaskFilters';
import AdvancedTaskFilters from './task/AdvancedTaskFilters';
import TaskDetailsModal from './task/TaskDetailsModal';
import { DiagnosticPanel } from './DiagnosticPanel';
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
  
  // 🔧 CORREÇÃO: Estado para painel de diagnóstico
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

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
      
      // 🚫 DESABILITADO: Interval removido para evitar piscar
      updateTimeAgo(); // Executar apenas uma vez
      // const interval = setInterval(updateTimeAgo, 1000);
      // return () => clearInterval(interval);
      
      console.log('🚫 REAL-TIME STATUS: Interval DESABILITADO para evitar piscar');
      return () => {};
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
            className={`bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 flex flex-col h-[300px] sm:h-[900px] ${
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
            <div 
              className="flex-1 p-2 sm:p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 h-[220px] max-h-[220px] sm:h-[800px] sm:max-h-[800px]"
            >
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
                      data-task-id={task.id}
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
                    data-task-id={task.id}
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

  // 🔧 CORREÇÃO DIRETA: Forçar funcionamento de cliques como fallback
  useEffect(() => {
    const forceClickFunctionality = () => {
      console.log('🔧 APLICANDO CORREÇÃO DIRETA DE CLIQUES');
      
      // Aguardar um pouco para garantir que os componentes estão renderizados
      setTimeout(() => {
        // 1. Adicionar event listeners nativos para task cards
        const taskCards = document.querySelectorAll('[class*="cursor-pointer"]');
        console.log(`🔧 Encontrados ${taskCards.length} elementos clicáveis`);
        
        taskCards.forEach((card, index) => {
          // Remover listeners antigos se existirem
          const newCard = card.cloneNode(true);
          card.parentNode?.replaceChild(newCard, card);
          
          // Adicionar novo listener nativo
          newCard.addEventListener('click', (e) => {
            console.log(`🖱️ CLIQUE NATIVO FUNCIONANDO - Card ${index}`);
            
            // Tentar encontrar dados da tarefa
            const taskElement = e.currentTarget.closest('[data-task-id]') || e.currentTarget;
            const taskId = taskElement.getAttribute('data-task-id');
            
            if (taskId) {
              console.log(`🔧 Abrindo tarefa ${taskId}`);
              // Encontrar a tarefa nos dados
              const task = tasks.find(t => t.id === taskId);
              if (task) {
                setSelectedTask(task);
                setIsTaskDetailsOpen(true);
              }
            } else {
              console.log('⚠️ Task ID não encontrado, tentando fallback');
              // Fallback: usar o primeiro card clicável
              if (tasks.length > 0) {
                setSelectedTask(tasks[0]);
                setIsTaskDetailsOpen(true);
              }
            }
          });
        });
        
        // 2. Adicionar event listeners para botões
        const buttons = document.querySelectorAll('button');
        console.log(`🔧 Encontrados ${buttons.length} botões`);
        
        buttons.forEach((button, index) => {
          if (!button.getAttribute('data-native-listener')) {
            button.setAttribute('data-native-listener', 'true');
            
            // Adicionar listener nativo como backup
            button.addEventListener('click', (e) => {
              console.log(`🖱️ CLIQUE NATIVO EM BOTÃO ${index} - ${button.textContent?.substring(0, 20)}`);
              
              // Se o botão não está respondendo ao React, forçar ação
              if (!e.defaultPrevented) {
                const buttonText = button.textContent?.toLowerCase() || '';
                
                // Identificar tipo de botão e forçar ação
                if (buttonText.includes('criar') || buttonText.includes('nova')) {
                  console.log('🔧 Forçando abertura de criar tarefa');
                  setIsCreateDialogOpen(true);
                } else if (buttonText.includes('filtro') || buttonText.includes('filter')) {
                  console.log('🔧 Botão de filtro detectado');
                } else if (buttonText.includes('debug') || buttonText.includes('diagnóstico')) {
                  console.log('🔧 Forçando abertura de diagnóstico');
                  setIsDiagnosticOpen(true);
                }
              }
            });
          }
        });
        
        // 3. Adicionar event listeners para dropdowns/selects
        const selects = document.querySelectorAll('select, [role="combobox"], [role="listbox"]');
        console.log(`🔧 Encontrados ${selects.length} elementos select`);
        
        selects.forEach((select, index) => {
          if (!select.getAttribute('data-native-listener')) {
            select.setAttribute('data-native-listener', 'true');
            
            select.addEventListener('click', (e) => {
              console.log(`🖱️ CLIQUE NATIVO EM SELECT ${index}`);
              
              // Forçar abertura do dropdown se não estiver funcionando
              if (select.tagName === 'SELECT') {
                select.focus();
                select.click();
              }
            });
            
            select.addEventListener('change', (e) => {
              console.log(`🔧 MUDANÇA NATIVA EM SELECT ${index}:`, e.target.value);
            });
          }
        });
        
        // 4. Adicionar listener global de emergência
        const emergencyClickHandler = (e) => {
          console.log('🚨 CLIQUE DE EMERGÊNCIA DETECTADO:', {
            target: e.target.tagName,
            className: e.target.className,
            text: e.target.textContent?.substring(0, 30)
          });
          
          // Se é um elemento que deveria ser clicável mas não está respondendo
          const clickableElements = ['BUTTON', 'A', 'DIV'];
          if (clickableElements.includes(e.target.tagName)) {
            const classList = e.target.className || '';
            
            if (classList.includes('cursor-pointer') || classList.includes('task-card')) {
              console.log('🔧 Elemento clicável detectado, forçando ação');
              
              // Tentar encontrar dados da tarefa mais próxima
              const taskData = e.target.closest('[data-task-id]');
              if (taskData && tasks.length > 0) {
                const taskId = taskData.getAttribute('data-task-id');
                const task = tasks.find(t => t.id === taskId) || tasks[0];
                setSelectedTask(task);
                setIsTaskDetailsOpen(true);
              }
            }
          }
        };
        
        // Adicionar listener global apenas se não existir
        if (!document.body.getAttribute('data-emergency-listener')) {
          document.body.setAttribute('data-emergency-listener', 'true');
          document.addEventListener('click', emergencyClickHandler, true);
        }
        
        console.log('✅ CORREÇÃO DIRETA DE CLIQUES APLICADA');
        
      }, 2000); // Aguardar 2 segundos para garantir renderização
    };
    
    // Executar correção direta apenas uma vez
    forceClickFunctionality();
    
    // 🚫 DESABILITADO: Interval removido para evitar piscar das notificações
    // const interval = setInterval(forceClickFunctionality, 10000); // A cada 10 segundos
    
    console.log('🚫 FORCE CLICK: Interval DESABILITADO para evitar piscar');
    
    return () => {
      console.log('🧹 FORCE CLICK: Cleanup - sem intervals para limpar');
    };
  }, [tasks, setSelectedTask, setIsTaskDetailsOpen, setIsCreateDialogOpen, setIsDiagnosticOpen]);

  // 🔧 CORREÇÃO: Adicionar tratamento específico para erro DOM que causa tela roxa
  useEffect(() => {
    const handleDOMError = (error: any) => {
      if (error.message && error.message.includes('removeChild')) {
        console.warn('🔧 CORREÇÃO DOM: Erro removeChild detectado - forçando limpeza de estilo');
        
        // Forçar limpeza de estilos que podem estar causando a tela roxa
        const bodyEl = document.body;
        if (bodyEl) {
          bodyEl.style.background = '';
          bodyEl.style.backgroundColor = '';
          bodyEl.classList.remove('bg-purple-600', 'bg-purple-500', 'bg-purple-700');
        }
        
        // Verificar se algum elemento está com fundo roxo incorreto
        const elementsWithPurple = document.querySelectorAll('[class*="bg-purple"]:not([class*="bg-purple-500/20"]):not([class*="data-[state=active]"])');
        elementsWithPurple.forEach(el => {
          console.warn('🔧 CORREÇÃO: Removendo fundo roxo incorreto de:', el);
          el.classList.remove('bg-purple-600', 'bg-purple-500', 'bg-purple-700');
        });
        
        // Verificar se o container principal está com problema
        const mainContainer = document.querySelector('.min-h-screen');
        if (mainContainer) {
          mainContainer.classList.remove('bg-purple-600', 'bg-purple-500', 'bg-purple-700');
        }
        
        return true; // Indica que o erro foi tratado
      }
      return false;
    };

    // Adicionar handler para erros DOM
    const originalError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (handleDOMError(error)) {
        return true; // Prevenir propagação do erro
      }
      return originalError ? originalError(message, source, lineno, colno, error) : false;
    };

    // Adicionar handler para promise rejections
    const originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      if (handleDOMError(event.reason)) {
        event.preventDefault();
        return;
      }
      if (originalUnhandledRejection) {
        return originalUnhandledRejection.call(window, event);
      }
    };

    // Cleanup
    return () => {
      window.onerror = originalError;
      window.onunhandledrejection = originalUnhandledRejection;
    };
  }, []);

  // 🔧 CORREÇÃO FILTROS: Interceptar mudanças de filtro para prevenir tela roxa
  const handleUserFilterChange = (userId: string) => {
    console.log('🔧 FILTRO USUÁRIO: Aplicando filtro para usuário:', userId);
    
    // Verificar se a tela está roxa antes de aplicar filtro
    const bodyStyle = window.getComputedStyle(document.body);
    const hasIncorrectPurple = bodyStyle.backgroundColor.includes('147, 51, 234') || // purple-600
                               bodyStyle.backgroundColor.includes('168, 85, 247') || // purple-500
                               bodyStyle.backgroundColor.includes('126, 34, 206');   // purple-700
    
    if (hasIncorrectPurple) {
      console.warn('🔧 CORREÇÃO: Tela roxa detectada antes do filtro - corrigindo');
      document.body.style.background = '';
      document.body.style.backgroundColor = '';
    }
    
    // Aplicar filtro normalmente
    setSelectedUser(userId);
    
    // Verificar após aplicar filtro
    setTimeout(() => {
      const bodyStyleAfter = window.getComputedStyle(document.body);
      const hasIncorrectPurpleAfter = bodyStyleAfter.backgroundColor.includes('147, 51, 234') || 
                                      bodyStyleAfter.backgroundColor.includes('168, 85, 247') || 
                                      bodyStyleAfter.backgroundColor.includes('126, 34, 206');
      
      if (hasIncorrectPurpleAfter) {
        console.warn('🔧 CORREÇÃO: Tela roxa detectada após filtro - corrigindo');
        document.body.style.background = '';
        document.body.style.backgroundColor = '';
        
        // Forçar re-render limpando o filtro e reaplicando
        const tempUser = selectedUser;
        setSelectedUser('all');
        setTimeout(() => {
          setSelectedUser(tempUser);
        }, 100);
      }
    }, 100);
  };

  // 🔧 CORREÇÃO FILTROS: Interceptar mudanças de filtro de nível para prevenir tela roxa
  const handleAccessLevelFilterChange = (level: string) => {
    console.log('🔧 FILTRO NÍVEL: Aplicando filtro para nível:', level);
    
    // Verificar se a tela está roxa antes de aplicar filtro
    const bodyStyle = window.getComputedStyle(document.body);
    const hasIncorrectPurple = bodyStyle.backgroundColor.includes('147, 51, 234') || 
                               bodyStyle.backgroundColor.includes('168, 85, 247') || 
                               bodyStyle.backgroundColor.includes('126, 34, 206');
    
    if (hasIncorrectPurple) {
      console.warn('🔧 CORREÇÃO: Tela roxa detectada antes do filtro de nível - corrigindo');
      document.body.style.background = '';
      document.body.style.backgroundColor = '';
    }
    
    // Aplicar filtro normalmente
    setSelectedAccessLevel(level);
    
    // Verificar após aplicar filtro
    setTimeout(() => {
      const bodyStyleAfter = window.getComputedStyle(document.body);
      const hasIncorrectPurpleAfter = bodyStyleAfter.backgroundColor.includes('147, 51, 234') || 
                                      bodyStyleAfter.backgroundColor.includes('168, 85, 247') || 
                                      bodyStyleAfter.backgroundColor.includes('126, 34, 206');
      
      if (hasIncorrectPurpleAfter) {
        console.warn('🔧 CORREÇÃO: Tela roxa detectada após filtro de nível - corrigindo');
        document.body.style.background = '';
        document.body.style.backgroundColor = '';
      }
    }, 100);
  };

  // 🔧 DIAGNÓSTICO AUTOMÁTICO AVANÇADO: Sistema melhorado para detectar problemas de cliques
  useEffect(() => {
    const runAdvancedClickDiagnostic = () => {
      console.log('🔧 === DIAGNÓSTICO AVANÇADO DE CLIQUES - TaskManager ===');
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.log('👤 Usuário atual:', currentUser?.email);
      console.log('📊 Tasks carregadas:', tasks.length);
      console.log('🎯 Filtros ativos:', { activeFilter, selectedUser, selectedStatus, selectedPriority });
      
      // 1. Verificar erros críticos salvos
      const checkSavedErrors = () => {
        const lastError = localStorage.getItem('last-error');
        const criticalError = localStorage.getItem('critical-dom-error');
        
        if (lastError) {
          console.log('❌ Último erro salvo:', JSON.parse(lastError));
        }
        
        if (criticalError) {
          console.log('🚨 Erro crítico DOM detectado:', JSON.parse(criticalError));
          
          // Se há erro crítico, tentar recuperar
          console.log('🔧 Tentando recuperar funcionalidade de cliques...');
          
          // Aguardar um pouco e tentar restaurar event listeners
          setTimeout(() => {
            const buttons = document.querySelectorAll('button, [role="button"]');
            console.log(`🔧 Encontrados ${buttons.length} botões, tentando restaurar listeners...`);
            
            buttons.forEach((btn, index) => {
              if (btn && typeof btn.addEventListener === 'function') {
                // Adicionar listener temporário para verificar se funciona
                btn.addEventListener('click', (e) => {
                  console.log(`✅ Botão ${index} funcionando após recuperação`);
                }, { once: true });
              }
            });
          }, 500);
        }
      };
      
      // 2. Criar botão de teste mais robusto
      const createAdvancedTestButton = () => {
        const testButton = document.createElement('button');
        testButton.textContent = '🔧 Teste Avançado';
        testButton.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 99999;
          background: linear-gradient(45deg, #ff4444, #ff6666);
          color: white;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
          transition: all 0.3s ease;
        `;
        
        let clickCount = 0;
        let errorCount = 0;
        
        const handleTestClick = (e) => {
          clickCount++;
          console.log(`🖱️ TESTE AVANÇADO CLIQUE #${clickCount}:`, {
            target: e.target,
            currentTarget: e.currentTarget,
            coordinates: { x: e.clientX, y: e.clientY },
            timestamp: new Date().toISOString(),
            eventPhase: e.eventPhase,
            bubbles: e.bubbles,
            cancelable: e.cancelable,
            defaultPrevented: e.defaultPrevented,
            isTrusted: e.isTrusted
          });
          
          testButton.textContent = `✅ Clique ${clickCount}`;
          testButton.style.background = 'linear-gradient(45deg, #44ff44, #66ff66)';
          
          setTimeout(() => {
            testButton.textContent = '🔧 Teste Avançado';
            testButton.style.background = 'linear-gradient(45deg, #ff4444, #ff6666)';
          }, 1000);
          
          if (clickCount >= 5) {
            testButton.remove();
            console.log('✅ Event listeners funcionando normalmente após 5 cliques');
          }
        };
        
        // Adicionar múltiplos tipos de listeners
        testButton.addEventListener('click', handleTestClick);
        testButton.addEventListener('mousedown', (e) => {
          console.log('🖱️ MouseDown detectado:', e.type);
        });
        testButton.addEventListener('mouseup', (e) => {
          console.log('🖱️ MouseUp detectado:', e.type);
        });
        
        // Adicionar listener de erro
        testButton.addEventListener('error', (e) => {
          errorCount++;
          console.error(`❌ Erro no botão de teste #${errorCount}:`, e);
        });
        
        document.body.appendChild(testButton);
        
        // Remover após 45 segundos
        setTimeout(() => {
          if (testButton.parentNode) {
            testButton.parentNode.removeChild(testButton);
            console.log('🗑️ Botão de teste avançado removido');
          }
        }, 45000);
      };
      
      // 3. Verificar componentes específicos problemáticos
      const checkProblematicComponents = () => {
        // Verificar dropdowns/selects
        const dropdowns = document.querySelectorAll('select, [role="combobox"], [role="listbox"]');
        console.log(`🔍 Dropdowns encontrados: ${dropdowns.length}`);
        
        dropdowns.forEach((dropdown, index) => {
          const rect = dropdown.getBoundingClientRect();
          const style = window.getComputedStyle(dropdown);
          
          console.log(`Dropdown ${index}:`, {
            visible: rect.width > 0 && rect.height > 0,
            position: rect,
            disabled: dropdown.disabled,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            pointerEvents: style.pointerEvents,
            zIndex: style.zIndex
          });
          
          // Verificar se dropdown tem opções
          if (dropdown.options) {
            console.log(`  - Opções: ${dropdown.options.length}`);
          }
        });
        
        // Verificar cards de tarefas
        const taskCards = document.querySelectorAll('[data-testid*="task"], .task-card, [class*="task"]');
        console.log(`🔍 Task cards encontrados: ${taskCards.length}`);
        
        taskCards.forEach((card, index) => {
          if (index < 5) { // Verificar apenas os primeiros 5
            const rect = card.getBoundingClientRect();
            console.log(`Task card ${index}:`, {
              visible: rect.width > 0 && rect.height > 0,
              position: rect,
              className: card.className,
              clickable: card.style.cursor || window.getComputedStyle(card).cursor
            });
          }
        });
      };
      
      // 4. Monitorar erros em tempo real
      const setupErrorMonitoring = () => {
        let jsErrorCount = 0;
        let promiseErrorCount = 0;
        
        const errorHandler = (e) => {
          jsErrorCount++;
          console.error(`🚨 ERRO JS #${jsErrorCount} DURANTE DIAGNÓSTICO:`, {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            error: e.error,
            timestamp: new Date().toISOString()
          });
          
          // Se for erro de DOM, alertar
          if (e.message.includes('removeChild') || e.message.includes('Node')) {
            console.error('🚨 ERRO DOM CRÍTICO DETECTADO EM TEMPO REAL!');
            localStorage.setItem('critical-dom-error-realtime', JSON.stringify({
              error: e.message,
              timestamp: new Date().toISOString(),
              detected: 'real-time'
            }));
          }
        };
        
        const promiseErrorHandler = (e) => {
          promiseErrorCount++;
          console.error(`🚨 PROMISE REJEITADA #${promiseErrorCount}:`, {
            reason: e.reason,
            timestamp: new Date().toISOString()
          });
        };
        
        window.addEventListener('error', errorHandler);
        window.addEventListener('unhandledrejection', promiseErrorHandler);
        
        // Cleanup após 5 minutos
        setTimeout(() => {
          window.removeEventListener('error', errorHandler);
          window.removeEventListener('unhandledrejection', promiseErrorHandler);
          console.log('🔧 Monitoramento de erros finalizado');
        }, 300000);
      };
      
      // 5. Verificar overlays que podem estar bloqueando cliques
      const checkBlockingOverlays = () => {
        const elementsAtCenter = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        console.log('🎯 Elementos no centro da tela:', elementsAtCenter.map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          zIndex: window.getComputedStyle(el).zIndex,
          position: window.getComputedStyle(el).position,
          pointerEvents: window.getComputedStyle(el).pointerEvents
        })));
        
        // Verificar elementos suspeitos
        const suspiciousElements = document.querySelectorAll('*');
        let suspiciousCount = 0;
        
        suspiciousElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          
          // Elemento com z-index muito alto
          if (parseInt(style.zIndex) > 9999) {
            suspiciousCount++;
            console.warn(`⚠️ Elemento suspeito (z-index alto): ${el.tagName}.${el.className}`);
          }
          
          // Elemento grande e transparente
          if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8 && 
              (style.opacity === '0' || style.visibility === 'hidden')) {
            suspiciousCount++;
            console.warn(`⚠️ Elemento suspeito (overlay invisível): ${el.tagName}.${el.className}`);
          }
        });
        
        console.log(`🔍 Total de elementos suspeitos encontrados: ${suspiciousCount}`);
      };
      
      // 6. Configurar listener global avançado
      const setupAdvancedGlobalListener = () => {
        let globalClickCount = 0;
        let lastClickTime = 0;
        
        const advancedGlobalListener = (e) => {
          globalClickCount++;
          const currentTime = Date.now();
          const timeSinceLastClick = currentTime - lastClickTime;
          
          console.log(`🖱️ CLIQUE GLOBAL AVANÇADO #${globalClickCount}:`, {
            target: {
              tagName: e.target.tagName,
              className: e.target.className,
              id: e.target.id,
              textContent: e.target.textContent?.substring(0, 50)
            },
            coordinates: { x: e.clientX, y: e.clientY },
            timing: {
              timestamp: new Date().toISOString(),
              timeSinceLastClick: timeSinceLastClick
            },
            event: {
              type: e.type,
              bubbles: e.bubbles,
              cancelable: e.cancelable,
              defaultPrevented: e.defaultPrevented,
              eventPhase: e.eventPhase,
              isTrusted: e.isTrusted
            },
            path: e.composedPath?.()?.slice(0, 5).map(el => ({
              tagName: el.tagName,
              className: el.className,
              id: el.id
            }))
          });
          
          lastClickTime = currentTime;
        };
        
        document.addEventListener('click', advancedGlobalListener, true);
        
        // Cleanup após 10 minutos
        setTimeout(() => {
          document.removeEventListener('click', advancedGlobalListener, true);
          console.log(`🔧 Listener global avançado removido após capturar ${globalClickCount} cliques`);
        }, 600000);
      };
      
      // Executar todos os diagnósticos
      console.log('🚀 Executando diagnósticos...');
      
      checkSavedErrors();
      setupErrorMonitoring();
      
      setTimeout(() => {
        checkProblematicComponents();
        checkBlockingOverlays();
        setupAdvancedGlobalListener();
        
        console.log('✅ DIAGNÓSTICO AVANÇADO COMPLETO');
        console.log('📊 Monitore o console por alguns minutos para ver resultados');
      }, 1000);
    };
    
    // Executar diagnóstico após componente carregar
    const timer = setTimeout(runAdvancedClickDiagnostic, 1000);
    
    return () => clearTimeout(timer);
  }, [currentUser, tasks.length]);

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

            {/* 🔧 CORREÇÃO: Botão de diagnóstico */}
            <Button
              onClick={() => setIsDiagnosticOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white"
              title="Diagnóstico do Sistema"
            >
              <Bug className="w-4 h-4" />
              Debug
            </Button>
          </div>
        </div>

        {/* Filtros avançados */}
        <AdvancedTaskFilters
          selectedUser={selectedUser}
          onUserChange={handleUserFilterChange}
          selectedAccessLevel={selectedAccessLevel}
          onAccessLevelChange={handleAccessLevelFilterChange}
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

      {/* 🔧 CORREÇÃO: Painel de diagnóstico */}
      <DiagnosticPanel
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        userEmail={currentUser?.email}
      />
    </div>
  );
};

export default TaskManager;
