
export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'manual' | 'automated' | 'follow-up';
  priority: 'alta' | 'media' | 'baixa';
  status: 'pendente' | 'concluido' | 'cancelado';
  scheduledDate: Date;
  completedDate?: Date;
  category: string;
  estimatedTime?: number;
  createdAt: Date;
  updatedAt: Date;
}
