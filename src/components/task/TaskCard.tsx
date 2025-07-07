
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  actionButtons: React.ReactNode;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getStatusLabel: (status: string) => string;
  getPriorityLabel: (priority: string) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  actionButtons,
  getStatusColor,
  getPriorityColor,
  getStatusLabel,
  getPriorityLabel
}) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600 hover:bg-slate-700/40 transition-colors">
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
          {task.completed_at && (
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>Concluído: {task.completed_at.toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        {task.assigned_users && task.assigned_users.length > 0 && (
          <div className="mt-2">
            <span className="text-xs text-slate-400">
              Atribuído a: {task.assigned_users.length} usuário(s)
            </span>
          </div>
        )}
      </div>

      <div className="ml-4">
        {actionButtons}
      </div>
    </div>
  );
};

export default TaskCard;
