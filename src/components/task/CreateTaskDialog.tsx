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
  priority: 'baixa' | 'media' | 'urgente';
  due_date: string;
  due_time: string;
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
  // Função auxiliar para extrair a data no formato correto para o input
  const extractDateForInput = (dateString: string): string => {
    console.log('🔍 DEBUG extractDateForInput - Input:', dateString);
    
    if (!dateString) {
      console.log('🔍 DEBUG extractDateForInput - Empty string, returning empty');
      return '';
    }
    
    // Se contém espaço (formato: "YYYY-MM-DD HH:MM:SS")
    if (dateString.includes(' ')) {
      const result = dateString.split(' ')[0];
      console.log('🔍 DEBUG extractDateForInput - Space format, result:', result);
      return result;
    }
    
    // Se contém T (formato ISO: "YYYY-MM-DDTHH:MM:SS")
    if (dateString.includes('T')) {
      const result = dateString.split('T')[0];
      console.log('🔍 DEBUG extractDateForInput - ISO format, result:', result);
      return result;
    }
    
    // Se já está no formato de data (YYYY-MM-DD)
    console.log('🔍 DEBUG extractDateForInput - Already in date format, result:', dateString);
    return dateString;
  };

  // Função auxiliar para extrair a data base para operações
  const extractDatePart = (dateString: string): string => {
    console.log('🔍 DEBUG extractDatePart - Input:', dateString);
    
    if (!dateString) {
      // Usar Date local em vez de UTC para evitar problemas de fuso horário
      const today = new Date();
      console.log('🔍 DEBUG extractDatePart - Today object:', today);
      console.log('🔍 DEBUG extractDatePart - Today ISO:', today.toISOString());
      console.log('🔍 DEBUG extractDatePart - Today locale string:', today.toLocaleDateString());
      
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      
      console.log('🔍 DEBUG extractDatePart - Components:', { year, month, day });
      console.log('🔍 DEBUG extractDatePart - Result:', result);
      return result;
    }
    
    // Se contém espaço (formato: "YYYY-MM-DD HH:MM:SS")
    if (dateString.includes(' ')) {
      const result = dateString.split(' ')[0];
      console.log('🔍 DEBUG extractDatePart - Space format, result:', result);
      return result;
    }
    
    // Se contém T (formato ISO: "YYYY-MM-DDTHH:MM:SS")
    if (dateString.includes('T')) {
      const result = dateString.split('T')[0];
      console.log('🔍 DEBUG extractDatePart - ISO format, result:', result);
      return result;
    }
    
    // Se já está no formato de data (YYYY-MM-DD)
    console.log('🔍 DEBUG extractDatePart - Already in date format, result:', dateString);
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
                  
                  console.log('🔍 DEBUG Date onChange - Input value:', dateValue);
                  console.log('🔍 DEBUG Date onChange - Current time:', timeValue);
                  console.log('🔍 DEBUG Date onChange - Current newTask.due_date:', newTask.due_date);
                  
                  if (dateValue) {
                    // Mantém a data local sem conversão de timezone
                    const localDateTime = `${dateValue} ${timeValue}:00`;
                    console.log('🔍 DEBUG Date onChange - New localDateTime:', localDateTime);
                    onTaskChange({ ...newTask, due_date: localDateTime });
                  } else {
                    console.log('🔍 DEBUG Date onChange - Empty date, clearing');
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
                  
                  console.log('🔍 DEBUG Time onChange - Input value:', timeValue);
                  console.log('🔍 DEBUG Time onChange - Current date:', dateValue);
                  console.log('🔍 DEBUG Time onChange - Current newTask.due_date:', newTask.due_date);
                  
                  // Mantém a data local sem conversão de timezone
                  const localDateTime = `${dateValue} ${timeValue}:00`;
                  console.log('🔍 DEBUG Time onChange - New localDateTime:', localDateTime);
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
