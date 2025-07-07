import { Task } from '../types/task';
import { User } from '../types/user';

export const rowToTask = (row: any[]): Task => {
  // Mapear status de inglês para português
  const statusMap: { [key: string]: 'pendente' | 'concluido' | 'cancelado' } = {
    'pending': 'pendente',
    'in-progress': 'pendente',
    'completed': 'concluido',
    'cancelled': 'cancelado'
  };

  // Mapear prioridade de inglês para português
  const priorityMap: { [key: string]: 'alta' | 'media' | 'baixa' } = {
    'high': 'alta',
    'medium': 'media',
    'low': 'baixa'
  };

  // Mapear tipo de tarefa
  const typeMap: { [key: string]: 'manual' | 'automated' | 'follow-up' } = {
    'manual': 'manual',
    'automated': 'automated',
    'follow-up': 'follow-up'
  };

  return {
    id: row[0] || '',
    title: row[1] || '',
    description: row[2] || '',
    type: typeMap[row[3]] || 'manual',
    priority: priorityMap[row[4]] || 'media',
    status: statusMap[row[5]] || 'pendente',
    scheduledDate: row[6] ? new Date(row[6]) : new Date(),
    completedDate: row[7] ? new Date(row[7]) : undefined,
    category: row[8] || '',
    estimatedTime: row[9] ? parseFloat(row[9]) : undefined,
    createdAt: row[10] ? new Date(row[10]) : new Date(),
    updatedAt: row[11] ? new Date(row[11]) : new Date()
  };
};

export const taskToRow = (task: Task): any[] => {
  return [
    task.id,
    task.title,
    task.description,
    task.type,
    task.priority,
    task.status,
    task.scheduledDate.toISOString(),
    task.completedDate ? task.completedDate.toISOString() : '',
    task.category,
    task.estimatedTime?.toString() || '',
    task.createdAt.toISOString(),
    task.updatedAt.toISOString()
  ];
};

// Converter linha da planilha para User
export const rowToUser = (row: any[]): User => {
  return {
    id: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    role: (row[3] || 'vendedor') as User['role'],
    createdAt: row[4] ? new Date(row[4]) : new Date(),
    lastLogin: row[5] ? new Date(row[5]) : undefined,
    password: row[6] || undefined,
    isActive: row[7] !== undefined ? row[7] === 'true' : true
  };
};

// Converter User para linha da planilha
export const userToRow = (user: User): any[] => {
  return [
    user.id,
    user.name,
    user.email,
    user.role,
    user.createdAt.toISOString(),
    user.lastLogin ? user.lastLogin.toISOString() : '',
    user.password || '',
    user.isActive !== false ? 'true' : 'false'
  ];
};
