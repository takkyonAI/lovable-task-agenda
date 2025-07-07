
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  due_date?: string;
  assigned_users: string[];
  created_by: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}
