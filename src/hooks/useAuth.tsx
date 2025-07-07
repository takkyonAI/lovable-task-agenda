import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/user';
import { useGoogleSheets } from './useGoogleSheets';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (userData: { name: string; email: string; role: User['role']; password?: string }) => Promise<boolean>;
  hasPermission: (requiredRole: User['role']) => boolean;
  canAccessUserManagement: () => boolean;
  canAccessGoogleConfig: () => boolean;
  canAccessSheetSetup: () => boolean;
  pendingUsers: Array<{ name: string; email: string; role: User['role']; confirmationCode: string; password?: string }>;
  confirmUser: (email: string, code: string) => Promise<boolean>;
  getAllUsers: () => User[];
  refreshUsers: () => Promise<void>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  toggleUserStatus: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hierarquia de permissões
const roleHierarchy = {
  admin: 3,
  franqueado: 2,
  vendedor: 1
};

// Função utilitária para converter strings de data em objetos Date
const convertDatesToObjects = (user: any): User => {
  return {
    ...user,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingUsers, setPendingUsers] = useState<Array<{ name: string; email: string; role: User['role']; confirmationCode: string; password?: string }>>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const googleSheets = useGoogleSheets();

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
          const userWithDates = convertDatesToObjects(user);
          console.log('Usuário com datas convertidas:', userWithDates);
          setCurrentUser(userWithDates);
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
    } catch (error) {
      console.error('Erro no useEffect do AuthProvider:', error);
    }
  }, []);

  // Carregar usuários do Google Sheets quando a configuração estiver pronta
  useEffect(() => {
    if (googleSheets.isConfigured) {
      initializeAndMigrateUsers();
    }
  }, [googleSheets.isConfigured]);

  const initializeAndMigrateUsers = async () => {
    try {
      console.log('Inicializando e migrando usuários para Google Sheets...');
      
      // Buscar usuários existentes no Google Sheets
      const sheetsUsers = await googleSheets.fetchUsers();
      console.log('Usuários no Google Sheets:', sheetsUsers.length);
      
      // Verificar se precisa migrar o admin do localStorage
      const adminExists = sheetsUsers.some(user => user.role === 'admin');
      
      if (!adminExists) {
        console.log('Admin não encontrado no Google Sheets, criando...');
        
        // Verificar se existe admin no localStorage para migrar
        const localStorageUsers = localStorage.getItem('confirmed_users');
        let adminUser: Omit<User, 'id' | 'createdAt'>;
        
        if (localStorageUsers) {
          try {
            const users = JSON.parse(localStorageUsers);
            const existingAdmin = users.find((u: User) => u.role === 'admin');
            
            if (existingAdmin) {
              console.log('Migrando admin do localStorage para Google Sheets');
              adminUser = {
                name: existingAdmin.name,
                email: existingAdmin.email,
                role: 'admin',
                lastLogin: existingAdmin.lastLogin ? new Date(existingAdmin.lastLogin) : new Date()
              };
            } else {
              throw new Error('Admin não encontrado no localStorage');
            }
          } catch (error) {
            console.log('Criando admin padrão');
            adminUser = {
              name: 'Administrador Principal',
              email: 'wadevenga@hotmail.com',
              role: 'admin',
              lastLogin: new Date()
            };
          }
        } else {
          console.log('Criando admin padrão');
          adminUser = {
            name: 'Administrador Principal',
            email: 'wadevenga@hotmail.com',
            role: 'admin',
            lastLogin: new Date()
          };
        }
        
        // Adicionar admin ao Google Sheets
        await googleSheets.addUser(adminUser);
        console.log('Usuário admin adicionado ao Google Sheets:', adminUser.email);
      }
      
      // Atualizar lista de usuários
      await refreshUsers();
    } catch (error) {
      console.error('Erro ao inicializar usuários:', error);
      
      // Fallback para localStorage se Google Sheets falhar
      const existingUsers = localStorage.getItem('confirmed_users');
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
        console.log('Usuário admin criado no localStorage como fallback');
      }
    }
  };

  const refreshUsers = async () => {
    try {
      if (googleSheets.isConfigured) {
        console.log('Carregando usuários do Google Sheets...');
        const users = await googleSheets.fetchUsers();
        setAllUsers(users);
        console.log('Usuários carregados do Google Sheets:', users.length);
      } else {
        // Fallback para localStorage
        try {
          const confirmedUsers = localStorage.getItem('confirmed_users');
          if (confirmedUsers) {
            const users = JSON.parse(confirmedUsers);
            const usersWithDates = users.map((user: any) => convertDatesToObjects(user));
            setAllUsers(usersWithDates);
          }
        } catch (error) {
          console.error('Erro ao carregar usuários do localStorage:', error);
          setAllUsers([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const getAllUsers = (): User[] => {
    return allUsers;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Tentativa de login para:', email);
    
    try {
      await refreshUsers();
      console.log('Usuários disponíveis para login:', allUsers);
      
      const user = allUsers.find(u => u.email === email && u.isActive !== false);
      console.log('Usuário encontrado:', user);
      
      if (user) {
        // Se o usuário tem senha definida, verificar
        if (user.password && user.password !== password) {
          console.log('Senha incorreta');
          return false;
        }
        
        const updatedUser = { ...user, lastLogin: new Date() };
        console.log('Atualizando usuário atual:', updatedUser);
        
        setCurrentUser(updatedUser);
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        
        // Atualizar no Google Sheets se configurado
        if (googleSheets.isConfigured) {
          try {
            await googleSheets.updateUser(user.id, { lastLogin: new Date() });
            console.log('Último login atualizado no Google Sheets');
          } catch (error) {
            console.error('Erro ao atualizar último login no Google Sheets:', error);
          }
        } else {
          // Atualizar no localStorage
          const updatedUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
          localStorage.setItem('confirmed_users', JSON.stringify(updatedUsers));
        }
        
        console.log('Login realizado com sucesso');
        return true;
      }

      console.log('Login falhou - usuário não encontrado ou inativo');
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const createUser = async (userData: { name: string; email: string; role: User['role']; password?: string }): Promise<boolean> => {
    try {
      // Se a senha não foi fornecida, gerar código de confirmação
      if (!userData.password) {
        const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const pendingUser = {
          ...userData,
          confirmationCode
        };

        const updatedPendingUsers = [...pendingUsers, pendingUser];
        setPendingUsers(updatedPendingUsers);
        localStorage.setItem('pending_users', JSON.stringify(updatedPendingUsers));

        console.log(`EMAIL ENVIADO PARA: ${userData.email}`);
        console.log(`CÓDIGO DE CONFIRMAÇÃO: ${confirmationCode}`);
        console.log(`Olá ${userData.name}, use o código ${confirmationCode} para confirmar sua conta.`);

        return true;
      } else {
        // Criar usuário diretamente com senha
        const newUserData: Omit<User, 'id' | 'createdAt'> = {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          password: userData.password,
          isActive: true
        };

        if (googleSheets.isConfigured) {
          await googleSheets.addUser(newUserData);
          console.log('Usuário adicionado ao Google Sheets:', userData.email);
        } else {
          const newUser: User = {
            ...newUserData,
            id: Date.now().toString(),
            createdAt: new Date()
          };

          const confirmedUsers = localStorage.getItem('confirmed_users');
          const users: User[] = confirmedUsers ? JSON.parse(confirmedUsers) : [];
          users.push(newUser);
          localStorage.setItem('confirmed_users', JSON.stringify(users));
        }

        await refreshUsers();
        return true;
      }
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

      const newUserData: Omit<User, 'id' | 'createdAt'> = {
        name: pendingUser.name,
        email: pendingUser.email,
        role: pendingUser.role,
        password: pendingUser.password,
        isActive: true
      };

      if (googleSheets.isConfigured) {
        await googleSheets.addUser(newUserData);
        console.log('Usuário adicionado ao Google Sheets:', email);
      } else {
        // Fallback para localStorage
        const newUser: User = {
          ...newUserData,
          id: Date.now().toString(),
          createdAt: new Date()
        };

        const confirmedUsers = localStorage.getItem('confirmed_users');
        const users: User[] = confirmedUsers ? JSON.parse(confirmedUsers) : [];
        users.push(newUser);
        localStorage.setItem('confirmed_users', JSON.stringify(users));
      }

      // Remover da lista de pendentes
      const updatedPendingUsers = pendingUsers.filter(u => u.email !== email);
      setPendingUsers(updatedPendingUsers);
      localStorage.setItem('pending_users', JSON.stringify(updatedPendingUsers));

      await refreshUsers();
      console.log('Usuário confirmado com sucesso:', email);
      return true;
    } catch (error) {
      console.error('Erro ao confirmar usuário:', error);
      return false;
    }
  };

  const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      if (googleSheets.isConfigured) {
        await googleSheets.updateUser(userId, { password: newPassword });
        console.log('Senha atualizada no Google Sheets para usuário:', userId);
      } else {
        const confirmedUsers = localStorage.getItem('confirmed_users');
        if (confirmedUsers) {
          const users: User[] = JSON.parse(confirmedUsers);
          const updatedUsers = users.map(user => 
            user.id === userId ? { ...user, password: newPassword } : user
          );
          localStorage.setItem('confirmed_users', JSON.stringify(updatedUsers));
        }
      }

      await refreshUsers();
      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      if (userId === currentUser?.id) {
        console.error('Não é possível excluir o próprio usuário');
        return false;
      }

      if (googleSheets.isConfigured) {
        await googleSheets.deleteUser(userId);
        console.log('Usuário excluído do Google Sheets:', userId);
      } else {
        const confirmedUsers = localStorage.getItem('confirmed_users');
        if (confirmedUsers) {
          const users: User[] = JSON.parse(confirmedUsers);
          const filteredUsers = users.filter(user => user.id !== userId);
          localStorage.setItem('confirmed_users', JSON.stringify(filteredUsers));
        }
      }

      await refreshUsers();
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return false;
    }
  };

  const toggleUserStatus = async (userId: string): Promise<boolean> => {
    try {
      if (userId === currentUser?.id) {
        console.error('Não é possível desativar o próprio usuário');
        return false;
      }

      const user = allUsers.find(u => u.id === userId);
      if (!user) return false;

      const newStatus = !user.isActive;

      if (googleSheets.isConfigured) {
        await googleSheets.updateUser(userId, { isActive: newStatus });
        console.log('Status do usuário atualizado no Google Sheets:', userId, newStatus);
      } else {
        const confirmedUsers = localStorage.getItem('confirmed_users');
        if (confirmedUsers) {
          const users: User[] = JSON.parse(confirmedUsers);
          const updatedUsers = users.map(user => 
            user.id === userId ? { ...user, isActive: newStatus } : user
          );
          localStorage.setItem('confirmed_users', JSON.stringify(updatedUsers));
        }
      }

      await refreshUsers();
      return true;
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
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
      confirmUser,
      getAllUsers,
      refreshUsers,
      changePassword,
      deleteUser,
      toggleUserStatus
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
