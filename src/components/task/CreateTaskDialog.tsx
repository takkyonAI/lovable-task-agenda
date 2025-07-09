import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Key } from 'lucide-react';
import UserSelector from '../UserSelector';

interface NewTask {
  title: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  priority: 'baixa' | 'media' | 'urgente';
  due_date: string;
  due_time: string;
  assigned_users: string[];
  is_private: boolean;
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
  /**
   * Extrai a parte da data de uma string para uso em input type="date"
   * 
   * Esta função foi otimizada durante a correção de timezone em 08/01/2025
   * para lidar com diferentes formatos de data que podem vir do banco.
   * 
   * @param dateString - String de data em vários formatos possíveis
   * @returns String no formato YYYY-MM-DD para input type="date"
   */
  const extractDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    // Se contém espaço (formato: "YYYY-MM-DD HH:MM:SS")
    if (dateString.includes(' ')) {
      return dateString.split(' ')[0];
    }
    
    // Se contém T (formato ISO: "YYYY-MM-DDTHH:MM:SS")
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Se já está no formato de data (YYYY-MM-DD)
    return dateString;
  };

  /**
   * Extrai a parte da data para operações internas
   * 
   * Similar ao extractDateForInput, mas também gera data atual se não fornecida.
   * Usa Date local para evitar problemas de timezone na geração da data atual.
   * 
   * @param dateString - String de data ou vazia
   * @returns String no formato YYYY-MM-DD
   */
  const extractDatePart = (dateString: string): string => {
    if (!dateString) {
      // Usar Date local em vez de UTC para evitar problemas de fuso horário
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Se contém espaço (formato: "YYYY-MM-DD HH:MM:SS")
    if (dateString.includes(' ')) {
      return dateString.split(' ')[0];
    }
    
    // Se contém T (formato ISO: "YYYY-MM-DDTHH:MM:SS")
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Se já está no formato de data (YYYY-MM-DD)
    return dateString;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taskDueDate" className="text-slate-300">Data de Vencimento</Label>
              <Input
                id="taskDueDate"
                type="date"
                value={extractDateForInput(newTask.due_date)}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  const timeValue = newTask.due_time || '09:00';
                  
                  if (dateValue) {
                    // Combina data e hora mantendo formato local
                    // Formato: "YYYY-MM-DD HH:MM:SS" (será convertido para timezone no useTaskManager)
                    const localDateTime = `${dateValue} ${timeValue}:00`;
                    onTaskChange({ ...newTask, due_date: localDateTime });
                  } else {
                    onTaskChange({ ...newTask, due_date: '' });
                  }
                }}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="taskDueTime" className="text-slate-300">Horário</Label>
              <Input
                id="taskDueTime"
                type="time"
                value={newTask.due_time}
                onChange={(e) => {
                  const timeValue = e.target.value;
                  const dateValue = extractDatePart(newTask.due_date);
                  
                  // Combina data e hora mantendo formato local
                  // Formato: "YYYY-MM-DD HH:MM:SS" (será convertido para timezone no useTaskManager)
                  const localDateTime = `${dateValue} ${timeValue}:00`;
                  onTaskChange({ ...newTask, due_time: timeValue, due_date: localDateTime });
                }}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Atribuir Usuários</Label>
            <UserSelector
              selectedUsers={newTask.assigned_users}
              onUsersChange={(users) => onTaskChange({ ...newTask, assigned_users: users })}
              placeholder="Buscar usuários para atribuir..."
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-400" />
              <div>
                <Label className="text-slate-300 font-medium">Tarefa Privada</Label>
                <p className="text-xs text-slate-400">Visível apenas para criador, atribuídos e admin/franqueados</p>
              </div>
            </div>
            <Switch
              checked={newTask.is_private}
              onCheckedChange={(checked) => onTaskChange({ ...newTask, is_private: checked })}
              className="data-[state=checked]:bg-amber-500"
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
