
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, User, Play, X } from 'lucide-react';
import { Task } from '@/types/task';
import { getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '@/utils/taskUtils';
import { formatDateToBR, formatDateTimeToBR } from '@/utils/dateUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, status: Task['status']) => void;
  canEdit: boolean;
  isUpdating: boolean;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
  canEdit,
  isUpdating
}) => {
  if (!task) return null;

  const renderActionButtons = () => {
    if (!canEdit) return null;

    switch (task.status) {
      case 'pendente':
        return (
          <div className="flex space-x-2">
            <Button
              onClick={() => onUpdateStatus(task.id, 'em_andamento')}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isUpdating}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Cancelar Tarefa</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Tem certeza que deseja cancelar esta tarefa? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                    Voltar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUpdateStatus(task.id, 'cancelada')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancelar Tarefa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );

      case 'em_andamento':
        return (
          <div className="flex space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Concluir
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Concluir Tarefa</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Tem certeza que deseja marcar esta tarefa como concluída?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                    Voltar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUpdateStatus(task.id, 'concluida')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Concluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isUpdating}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Cancelar Tarefa</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Tem certeza que deseja cancelar esta tarefa? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                    Voltar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUpdateStatus(task.id, 'cancelada')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancelar Tarefa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(task.status)} border`}>
              {getStatusLabel(task.status)}
            </Badge>
            <Badge className={`${getPriorityColor(task.priority)} border`}>
              {getPriorityLabel(task.priority)}
            </Badge>
          </div>

          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Descrição</h4>
              <p className="text-slate-400">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Criado em: {formatDateToBR(task.created_at)}</span>
              </div>
              
              {task.due_date && (
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Vence em: {formatDateTimeToBR(task.due_date)}</span>
                </div>
              )}
              
              {task.completed_at && (
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Concluído em: {formatDateToBR(task.completed_at)}</span>
                </div>
              )}
            </div>

            {task.assigned_users && task.assigned_users.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 text-sm text-slate-300 mb-2">
                  <User className="w-4 h-4" />
                  <span>Atribuído a:</span>
                </div>
                <p className="text-sm text-slate-400">
                  {task.assigned_users.length} usuário(s)
                </p>
              </div>
            )}
          </div>

          {renderActionButtons() && (
            <div className="pt-4 border-t border-slate-600">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Ações</h4>
              {renderActionButtons()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
