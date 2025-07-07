
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
}
