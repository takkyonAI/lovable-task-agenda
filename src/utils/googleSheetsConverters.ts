
import { Task } from '../types/task';
import { User } from '../types/user';

// Converter dados da planilha para objeto Task
export const rowToTask = (row: any[]): Task => {
  return {
    id: row[0] || '',
    title: row[1] || '',
    description: row[2] || '',
    type: (row[3] as 'manual' | 'automated' | 'follow-up') || 'manual',
    priority: (row[4] as 'alta' | 'media' | 'baixa') || 'media',
    status: (row[5] as 'pendente' | 'concluido' | 'cancelado') || 'pendente',
    scheduledDate: row[6] ? new Date(row[6]) : new Date(),
    completedDate: row[7] ? new Date(row[7]) : undefined,
    category: row[8] || 'geral',
    estimatedTime: row[9] ? parseInt(row[9]) : undefined,
    createdAt: row[10] ? new Date(row[10]) : new Date(),
    updatedAt: row[11] ? new Date(row[11]) : new Date()
  };
};

// Converter objeto Task para array de valores para planilha
export const taskToRow = (task: Task): any[] => {
  return [
    task.id,
    task.title,
    task.description,
    task.type,
    task.priority,
    task.status,
    task.scheduledDate.toISOString(),
    task.completedDate?.toISOString() || '',
    task.category,
    task.estimatedTime?.toString() || '',
    task.createdAt.toISOString(),
    task.updatedAt.toISOString(),
    '' // Usuário ID - implementar quando necessário
  ];
};

// Converter dados da planilha para objeto User
export const rowToUser = (row: any[]): User => {
  return {
    id: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    role: (row[3] as 'admin' | 'user' | 'viewer') || 'user',
    createdAt: row[4] ? new Date(row[4]) : new Date(),
    lastLogin: row[5] ? new Date(row[5]) : undefined
  };
};

// Converter objeto User para array de valores para planilha
export const userToRow = (user: User): any[] => {
  return [
    user.id,
    user.name,
    user.email,
    user.role,
    user.createdAt.toISOString(),
    user.lastLogin?.toISOString() || ''
  ];
};
