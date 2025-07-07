
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import TaskFilters from './task/TaskFilters';
import TaskCard from './task/TaskCard';
import TaskActionButtons from './task/TaskActionButtons';
import CreateTaskDialog from './task/CreateTaskDialog';
import { useTaskManager } from '@/hooks/useTaskManager';
import { getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '@/utils/taskUtils';

const TaskManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pendente' as const,
    priority: 'media' as const,
    due_date: '',
    assigned_users: [] as string[]
  });

  const {
    filteredTasks,
    isLoading,
    updatingTask,
    activeFilter,
    setActiveFilter,
    getFilterCount,
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
                <p className="text-slate-400 text-sm">Crie e gerencie tarefas com atribuições</p>
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
          <TaskFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            getFilterCount={getFilterCount}
          />

          <div className="space-y-4">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                actionButtons={
                  canEditTask(task) ? (
                    <TaskActionButtons
                      task={task}
                      isUpdating={updatingTask === task.id}
                      onUpdateStatus={updateTaskStatus}
                    />
                  ) : null
                }
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                getStatusLabel={getStatusLabel}
                getPriorityLabel={getPriorityLabel}
              />
            ))}
            
            {filteredTasks.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">
                  {activeFilter === 'all' ? 'Nenhuma tarefa encontrada' : `Nenhuma tarefa encontrada para ${activeFilter === 'today' ? 'hoje' : activeFilter === 'week' ? 'esta semana' : 'este mês'}`}
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  {activeFilter === 'all' ? 'Crie sua primeira tarefa clicando no botão acima' : 'Tente alterar o filtro ou criar uma nova tarefa'}
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-slate-400 mt-2">Carregando tarefas...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManager;
