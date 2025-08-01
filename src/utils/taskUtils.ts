
// Função utilitária para determinar se uma tarefa está atrasada
export const isTaskOverdue = (task: { due_date?: string; status: string }) => {
  if (!task.due_date) return false;
  if (task.status === 'concluida' || task.status === 'cancelada') return false;
  
  const now = new Date();
  const taskDate = new Date(task.due_date);
  return taskDate < now;
};

export const getStatusColor = (status: string, task?: { due_date?: string; status: string }) => {
  // Se a tarefa está atrasada, sempre mostrar em vermelho
  if (task && isTaskOverdue(task)) {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }

  switch (status) {
    case 'pendente': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'em_andamento': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'concluida': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'cancelada': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'baixa': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'media': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'urgente': return 'bg-red-600/20 text-red-500 border-red-600/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const getStatusLabel = (status: string, task?: { due_date?: string; status: string }) => {
  // Se a tarefa está atrasada, sempre mostrar "Atrasada"
  if (task && isTaskOverdue(task)) {
    return 'Atrasada';
  }

  switch (status) {
    case 'pendente': return 'Pendente';
    case 'em_andamento': return 'Em Andamento';
    case 'concluida': return 'Concluída';
    case 'cancelada': return 'Cancelada';
    default: return status;
  }
};

export const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'baixa': return 'Baixa';
    case 'media': return 'Média';
    case 'urgente': return 'Urgente';
    default: return priority;
  }
};
