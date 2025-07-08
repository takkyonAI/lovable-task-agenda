export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'franqueado' | 'vendedor' | 'professor' | 'coordenador' | 'assessora_adm' | 'supervisor_adm';
  is_active: boolean;
  password_hash?: string;
  created_at: Date;
  last_login?: Date;
  first_login_completed?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
}
