import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Clock } from 'lucide-react';
import { Task } from '@/types/task';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import UserSelector from './UserSelector';

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pendente' as const,
    priority: 'media' as const,
    due_date: '',
    assigned_users: [] as string[]
  });

  const { currentUser } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (taskError) {
        console.error('Erro ao carregar tarefas:', taskError);
        toast({
          title: "Erro",
          description: "Erro ao carregar tarefas",
          variant: "destructive"
        });
        return;
      }

      if (taskData) {
        const formattedTasks: Task[] = taskData.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          due_date: task.due_date || undefined,
          assigned_users: task.assigned_users || [],
          created_by: task.created_by,
          created_at: new Date(task.created_at),
          updated_at: new Date(task.updated_at),
          completed_at: task.completed_at ? new Date(task.completed_at) : undefined
        }));

        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar tarefas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Erro",
        description: "Título da tarefa é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description || null,
          status: newTask.status,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          assigned_users: newTask.assigned_users,
          created_by: currentUser.user_id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar tarefa",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso",
      });

      setNewTask({
        title: '',
        description: '',
        status: 'pendente',
        priority: 'media',
        due_date: '',
        assigned_users: []
      });
      setIsCreateDialogOpen(false);
      await loadTasks();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar tarefa",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'em_andamento': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'concluida': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'media': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'alta': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'urgente': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_andamento': return 'Em Andamento';
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'Baixa';
      case 'media': return 'Média';
      case 'alta': return 'Alta';
      case 'urgente': return 'Urgente';
      default: return priority;
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
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Nova Tarefa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="taskTitle" className="text-slate-300">Título</Label>
                    <Input
                      id="taskTitle"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder="Título da tarefa"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="taskDescription" className="text-slate-300">Descrição</Label>
                    <Textarea
                      id="taskDescription"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder="Descrição da tarefa"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taskStatus" className="text-slate-300">Status</Label>
                      <Select value={newTask.status} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="taskPriority" className="text-slate-300">Prioridade</Label>
                      <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="taskDueDate" className="text-slate-300">Data de Vencimento</Label>
                    <Input
                      id="taskDueDate"
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Atribuir Usuários</Label>
                    <UserSelector
                      selectedUsers={newTask.assigned_users}
                      onUsersChange={(users) => setNewTask(prev => ({ ...prev, assigned_users: users }))}
                      placeholder="Buscar usuários para atribuir..."
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCreateTask}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Tarefa
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600 hover:bg-slate-700/40 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-white">{task.title}</h4>
                    <Badge className={`${getStatusColor(task.status)} border`}>
                      {getStatusLabel(task.status)}
                    </Badge>
                    <Badge className={`${getPriorityColor(task.priority)} border`}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-slate-400 mb-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    {task.due_date && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Vence: {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Criado: {task.created_at.toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {task.assigned_users && task.assigned_users.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-400">
                        Atribuído a: {task.assigned_users.length} usuário(s)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {tasks.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Nenhuma tarefa encontrada</p>
                <p className="text-slate-500 text-sm mt-2">Crie sua primeira tarefa clicando no botão acima</p>
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
