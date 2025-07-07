
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/user';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRole: User['role']) => boolean;
  canAccessUserManagement: () => boolean;
  canAccessGoogleConfig: () => boolean;
  canAccessSheetSetup: () => boolean;
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

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('current_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Por enquanto, simulação de login
      // Em produção, isso seria integrado com o Google Sheets ou outro sistema
      const mockUser: User = {
        id: '1',
        name: 'Administrador',
        email: email,
        role: email.includes('admin') ? 'admin' : 
              email.includes('franqueado') ? 'franqueado' : 'vendedor',
        createdAt: new Date(),
        lastLogin: new Date()
      };

      setCurrentUser(mockUser);
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
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

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      hasPermission,
      canAccessUserManagement,
      canAccessGoogleConfig,
      canAccessSheetSetup
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
