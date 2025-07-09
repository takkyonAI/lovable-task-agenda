
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h4 className="font-medium text-gray-900">{task.title}</h4>
              <Badge className={`${getStatusColor(task.status)} border`}>
                {getStatusLabel(task.status)}
              </Badge>
              <Badge className={`${getPriorityColor(task.priority)} border`}>
                {getPriorityLabel(task.priority)}
              </Badge>
              {canEdit && (
                <button
                  onClick={handleEditClick}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Editar tarefa"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {task.description && (
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
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

            {/* Histórico de edição */}
            {task.edited_by && task.edited_at && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <History className="w-3 h-3" />
                  <span>Editado por</span>
                  <span className="text-amber-600 font-medium">{getUserName(task.edited_by)}</span>
                  <span>em</span>
                  <span className="text-gray-700">
                    {task.edited_at.toLocaleDateString('pt-BR')} às {task.edited_at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}

            {task.assigned_users && task.assigned_users.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>Atribuído a:</span>
                  <span className="text-gray-700">
                    {task.assigned_users.map(userId => getUserName(userId)).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="ml-4">
            {actionButtons}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
