
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, User, Edit, History } from 'lucide-react';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  actionButtons: React.ReactNode;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getStatusLabel: (status: string) => string;
  getPriorityLabel: (priority: string) => string;
  getUserName: (userId: string) => string;
  canEditTask?: (() => boolean) | boolean;
  onEditTask?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  actionButtons,
  getStatusColor,
  getPriorityColor,
  getStatusLabel,
  getPriorityLabel,
  getUserName,
  canEditTask,
  onEditTask
}) => {
  const handleEditClick = () => {
    if (onEditTask) {
      onEditTask(task);
    }
  };

  // Verifica se pode editar - pode ser uma função ou um boolean
  const canEdit = typeof canEditTask === 'function' ? canEditTask() : canEditTask;

  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/60 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-white text-sm">{task.title}</h4>
            {canEdit && (
              <button
                onClick={handleEditClick}
                className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                title="Editar tarefa"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {task.description && (
            <p className="text-xs text-slate-300 mb-2">{task.description}</p>
          )}
          
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={`${getStatusColor(task.status)} text-xs`}>
              {getStatusLabel(task.status)}
            </Badge>
            <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
              {getPriorityLabel(task.priority)}
            </Badge>
          </div>

          <div className="space-y-1 text-xs text-slate-400">
            {task.due_date && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Vence: {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            
            {task.assigned_users && task.assigned_users.length > 0 && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Atribuído: {task.assigned_users.map(userId => getUserName(userId)).join(', ')}</span>
              </div>
            )}
          </div>

          {/* Histórico de edição */}
          {task.edited_by && task.edited_at && (
            <div className="mt-2 pt-2 border-t border-slate-600">
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <History className="w-3 h-3" />
                <span>Editado por</span>
                <span className="text-amber-400 font-medium">{getUserName(task.edited_by)}</span>
                <span>em</span>
                <span className="text-slate-300">
                  {task.edited_at.toLocaleDateString('pt-BR')} às {task.edited_at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="ml-2">
          {actionButtons}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
