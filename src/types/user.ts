
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Senha opcional para manter compatibilidade
  role: 'admin' | 'franqueado' | 'vendedor';
  createdAt: Date;
  lastLogin?: Date;
  isActive?: boolean; // Para soft delete
}
