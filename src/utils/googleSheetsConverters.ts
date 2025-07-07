
import { Task } from '../types/task';
import { User } from '../types/user';

export const rowToTask = (row: any[]): Task => {
  return {
    id: row[0] || '',
    title: row[1] || '',
    description: row[2] || '',
    status: (row[3] as 'pending' | 'in-progress' | 'completed') || 'pending',
    priority: (row[4] as 'low' | 'medium' | 'high') || 'medium',
    assignedTo: row[5] || '',
    dueDate: row[6] ? new Date(row[6]) : undefined,
    createdAt: row[7] ? new Date(row[7]) : new Date(),
    updatedAt: row[8] ? new Date(row[8]) : new Date(),
    tags: row[9] ? row[9].split(',').map((tag: string) => tag.trim()) : [],
    category: row[10] || '',
    estimatedHours: row[11] ? parseFloat(row[11]) : undefined,
    actualHours: row[12] ? parseFloat(row[12]) : undefined
  };
};

export const taskToRow = (task: Task): any[] => {
  return [
    task.id,
    task.title,
    task.description,
    task.status,
    task.priority,
    task.assignedTo,
    task.dueDate ? task.dueDate.toISOString() : '',
    task.createdAt.toISOString(),
    task.updatedAt.toISOString(),
    task.tags ? task.tags.join(', ') : '',
    task.category,
    task.estimatedHours?.toString() || '',
    task.actualHours?.toString() || ''
  ];
};

export const rowToUser = (row: any[]): User => {
  return {
    id: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    role: (row[3] as 'admin' | 'franqueado' | 'vendedor') || 'vendedor',
    createdAt: row[4] ? new Date(row[4]) : new Date(),
    lastLogin: row[5] ? new Date(row[5]) : undefined
  };
};

export const userToRow = (user: User): any[] => {
  return [
    user.id,
    user.name,
    user.email,
    user.role,
    user.createdAt.toISOString(),
    user.lastLogin ? user.lastLogin.toISOString() : ''
  ];
};
