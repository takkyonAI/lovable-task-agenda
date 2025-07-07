
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import UserSelector from '../UserSelector';

interface NewTask {
  title: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  due_date: string;
  assigned_users: string[];
}

interface CreateTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newTask: NewTask;
  onTaskChange: (task: NewTask) => void;
  onCreateTask: () => void;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  isOpen,
  onOpenChange,
  newTask,
  onTaskChange,
  onCreateTask
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              onChange={(e) => onTaskChange({ ...newTask, title: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Título da tarefa"
            />
          </div>
          
          <div>
            <Label htmlFor="taskDescription" className="text-slate-300">Descrição</Label>
            <Textarea
              id="taskDescription"
              value={newTask.description}
              onChange={(e) => onTaskChange({ ...newTask, description: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Descrição da tarefa"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taskStatus" className="text-slate-300">Status</Label>
              <Select value={newTask.status} onValueChange={(value: any) => onTaskChange({ ...newTask, status: value })}>
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
              <Select value={newTask.priority} onValueChange={(value: any) => onTaskChange({ ...newTask, priority: value })}>
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
              onChange={(e) => onTaskChange({ ...newTask, due_date: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300">Atribuir Usuários</Label>
            <UserSelector
              selectedUsers={newTask.assigned_users}
              onUsersChange={(users) => onTaskChange({ ...newTask, assigned_users: users })}
              placeholder="Buscar usuários para atribuir..."
            />
          </div>
          
          <Button 
            onClick={onCreateTask}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Tarefa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
