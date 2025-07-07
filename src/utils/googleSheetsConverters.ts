
import { Task } from '../types/task';
import { User } from '../types/user';

export const rowToTask = (row: any[]): Task => {
  const statusMap: { [key: string]: Task['status'] } = {
    'pending': 'pendente',
    'in-progress': 'em_andamento',
    'completed': 'concluida',
    'cancelled': 'cancelada'
  };

  const priorityMap: { [key: string]: Task['priority'] } = {
    'high': 'alta',
    'medium': 'media',
    'low': 'baixa',
    'urgent': 'urgente'
  };

  return {
    id: row[0] || '',
    title: row[1] || '',
    description: row[2] || '',
    status: statusMap[row[3]] || 'pendente',
    priority: priorityMap[row[4]] || 'media',
    due_date: row[5] || undefined,
    assigned_users: row[6] ? row[6].split(',') : [],
    created_by: row[7] || '',
    created_at: row[8] ? new Date(row[8]) : new Date(),
    updated_at: row[9] ? new Date(row[9]) : new Date(),
    completed_at: row[10] ? new Date(row[10]) : undefined
  };
};

export const taskToRow = (task: Task): any[] => {
  return [
    task.id,
    task.title,
    task.description || '',
    task.status,
    task.priority,
    task.due_date || '',
    task.assigned_users.join(','),
    task.created_by,
    task.created_at.toISOString(),
    task.updated_at.toISOString(),
    task.completed_at ? task.completed_at.toISOString() : ''
  ];
};

export const rowToUser = (row: any[]): User => {
  return {
    id: row[0] || '',
    user_id: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    role: (row[3] || 'vendedor') as User['role'],
    is_active: row[4] !== undefined ? row[4] === 'true' : true,
    created_at: row[5] ? new Date(row[5]) : new Date(),
    last_login: row[6] ? new Date(row[6]) : undefined
  };
};

export const userToRow = (user: User): any[] => {
  return [
    user.id,
    user.name,
    user.email,
    user.role,
    user.is_active ? 'true' : 'false',
    user.created_at.toISOString(),
    user.last_login ? user.last_login.toISOString() : ''
  ];
};
