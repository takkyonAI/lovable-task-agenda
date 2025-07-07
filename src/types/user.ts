
export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'franqueado' | 'vendedor';
  is_active: boolean;
  password_hash?: string;
  created_at: Date;
  last_login?: Date;
}

export interface AuthUser {
  id: string;
  email: string;
}
