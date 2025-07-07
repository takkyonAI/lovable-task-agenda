
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'franqueado' | 'vendedor';
  createdAt: Date;
  lastLogin?: Date;
}
