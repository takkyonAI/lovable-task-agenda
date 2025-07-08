
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  priority: 'baixa' | 'media' | 'urgente';
  due_date?: string;
  assigned_users: string[];
  created_by: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface NewTask {
  title: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  priority: 'baixa' | 'media' | 'urgente';
  due_date: string;
  due_time: string;
  assigned_users: string[];
}
