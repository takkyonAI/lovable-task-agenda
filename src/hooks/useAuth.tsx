import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/user';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (userData: { name: string; email: string; role: User['role'] }) => Promise<boolean>;
  hasPermission: (requiredRole: User['role']) => boolean;
  canAccessUserManagement: () => boolean;
  canAccessGoogleConfig: () => boolean;
  canAccessSheetSetup: () => boolean;
  pendingUsers: Array<{ name: string; email: string; role: User['role']; confirmationCode: string }>;
  confirmUser: (email: string, code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hierarquia de permissões
const roleHierarchy = {
  admin: 3,
  franqueado: 2,
  vendedor: 1
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingUsers, setPendingUsers] = useState<Array<{ name: string; email: string; role: User['role']; confirmationCode: string }>>([]);

  useEffect(() => {
    console.log('AuthProvider - useEffect iniciado');
    
    try {
      // Verificar se há usuário logado no localStorage
      const savedUser = localStorage.getItem('current_user');
      console.log('savedUser:', savedUser);
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          console.log('Usuário carregado do localStorage:', user);
          setCurrentUser(user);
        } catch (error) {
          console.error('Erro ao fazer parse do usuário salvo:', error);
          localStorage.removeItem('current_user');
        }
      }

      // Carregar usuários pendentes
      const savedPendingUsers = localStorage.getItem('pending_users');
      if (savedPendingUsers) {
        try {
          const pending = JSON.parse(savedPendingUsers);
          console.log('Usuários pendentes carregados:', pending);
          setPendingUsers(pending);
        } catch (error) {
          console.error('Erro ao carregar usuários pendentes:', error);
        }
      }

      // Criar o primeiro usuário admin se não existir
      const existingUsers = localStorage.getItem('confirmed_users');
      console.log('Usuários existentes:', existingUsers);
      
      if (!existingUsers) {
        const adminUser: User = {
          id: 'admin-1',
          name: 'Administrador Principal',
          email: 'wadevenga@hotmail.com',
          role: 'admin',
          createdAt: new Date(),
          lastLogin: new Date()
        };
        localStorage.setItem('confirmed_users', JSON.stringify([adminUser]));
        console.log('Usuário admin criado:', adminUser.email);
      }
    } catch (error) {
      console.error('Erro no useEffect do AuthProvider:', error);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Tentativa de login para:', email);
    
    try {
      // Verificar usuários confirmados
      const confirmedUsers = localStorage.getItem('confirmed_users');
      console.log('Usuários confirmados no localStorage:', confirmedUsers);
      
      if (confirmedUsers) {
        const users: User[] = JSON.parse(confirmedUsers);
        console.log('Lista de usuários:', users);
        
        const user = users.find(u => u.email === email);
        console.log('Usuário encontrado:', user);
        
        if (user) {
          const updatedUser = { ...user, lastLogin: new Date() };
          console.log('Atualizando usuário atual:', updatedUser);
          
          setCurrentUser(updatedUser);
          localStorage.setItem('current_user', JSON.stringify(updatedUser));
          
          // Atualizar no array de usuários confirmados
          const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
          localStorage.setItem('confirmed_users', JSON.stringify(updatedUsers));
          
          console.log('Login realizado com sucesso');
          return true;
        }
      }

      console.log('Login falhou - usuário não encontrado');
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const createUser = async (userData: { name: string; email: string; role: User['role'] }): Promise<boolean> => {
    try {
      // Gerar código de confirmação
      const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const pendingUser = {
        ...userData,
        confirmationCode
      };

      const updatedPendingUsers = [...pendingUsers, pendingUser];
      setPendingUsers(updatedPendingUsers);
      localStorage.setItem('pending_users', JSON.stringify(updatedPendingUsers));

      // Simular envio de email (em produção, isso seria feito pelo backend)
      console.log(`EMAIL ENVIADO PARA: ${userData.email}`);
      console.log(`CÓDIGO DE CONFIRMAÇÃO: ${confirmationCode}`);
      console.log(`Olá ${userData.name}, use o código ${confirmationCode} para confirmar sua conta.`);

      return true;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return false;
    }
  };

  const confirmUser = async (email: string, code: string): Promise<boolean> => {
    try {
      const pendingUser = pendingUsers.find(u => u.email === email && u.confirmationCode === code);
      
      if (!pendingUser) {
        return false;
      }

      // Criar usuário confirmado
      const newUser: User = {
        id: Date.now().toString(),
        name: pendingUser.name,
        email: pendingUser.email,
        role: pendingUser.role,
        createdAt: new Date()
      };

      // Adicionar aos usuários confirmados
      const confirmedUsers = localStorage.getItem('confirmed_users');
      const users: User[] = confirmedUsers ? JSON.parse(confirmedUsers) : [];
      users.push(newUser);
      localStorage.setItem('confirmed_users', JSON.stringify(users));

      // Remover da lista de pendentes
      const updatedPendingUsers = pendingUsers.filter(u => u.email !== email);
      setPendingUsers(updatedPendingUsers);
      localStorage.setItem('pending_users', JSON.stringify(updatedPendingUsers));

      console.log('Usuário confirmado com sucesso:', email);
      return true;
    } catch (error) {
      console.error('Erro ao confirmar usuário:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_user');
  };

  const hasPermission = (requiredRole: User['role']): boolean => {
    if (!currentUser) return false;
    
    const userLevel = roleHierarchy[currentUser.role];
    const requiredLevel = roleHierarchy[requiredRole];
    
    return userLevel >= requiredLevel;
  };

  const canAccessUserManagement = (): boolean => {
    return hasPermission('admin');
  };

  const canAccessGoogleConfig = (): boolean => {
    return hasPermission('admin');
  };

  const canAccessSheetSetup = (): boolean => {
    return hasPermission('admin');
  };

  console.log('AuthProvider renderizando com currentUser:', currentUser);

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      createUser,
      hasPermission,
      canAccessUserManagement,
      canAccessGoogleConfig,
      canAccessSheetSetup,
      pendingUsers,
      confirmUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
