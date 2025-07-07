
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Play, CheckCircle, X } from 'lucide-react';
import { Task } from '@/types/task';

interface TaskActionButtonsProps {
  task: Task;
  isUpdating: boolean;
  onUpdateStatus: (taskId: string, status: Task['status']) => void;
}

const TaskActionButtons: React.FC<TaskActionButtonsProps> = ({
  task,
  isUpdating,
  onUpdateStatus
}) => {
  switch (task.status) {
    case 'pendente':
      return (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateStatus(task.id, 'em_andamento')}
            disabled={isUpdating}
            className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating}
                className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
              >
                <X className="w-3 h-3" />
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
                size="sm"
                variant="outline"
                disabled={isUpdating}
                className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
                ) : (
                  <CheckCircle className="w-3 h-3" />
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
                size="sm"
                variant="outline"
                disabled={isUpdating}
                className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
              >
                <X className="w-3 h-3" />
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

    case 'concluida':
    case 'cancelada':
    default:
      return null;
  }
};

export default TaskActionButtons;
