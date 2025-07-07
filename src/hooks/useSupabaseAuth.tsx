
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  authUser: SupabaseUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createUser: (userData: { name: string; email: string; role: User['role'] }) => Promise<boolean>;
  hasPermission: (requiredRole: User['role']) => boolean;
  canAccessUserManagement: () => boolean;
  getAllUsers: () => Promise<User[]>;
  refreshProfile: () => Promise<void>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  toggleUserStatus: (userId: string) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hierarquia de permissões
const roleHierarchy = {
  admin: 7,
  franqueado: 6,
  supervisor_adm: 5,
  coordenador: 4,
  assessora_adm: 3,
  professor: 2,
  vendedor: 1
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setAuthUser(session?.user ?? null);
        
        if (session?.user) {
          // Buscar perfil do usuário
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setCurrentUser(null);
        }
        
        setLoading(false);
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return;
      }

      if (data) {
        const userProfile: User = {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role,
          is_active: data.is_active,
          password_hash: data.password_hash,
          created_at: new Date(data.created_at),
          last_login: data.last_login ? new Date(data.last_login) : undefined
        };
        setCurrentUser(userProfile);
        
        // Atualizar último login
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  const refreshProfile = async () => {
    if (authUser) {
      await fetchUserProfile(authUser.id);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro no login:', error);
        toast({
          title: "Erro no Login",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: name
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no Cadastro",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      if (data.user && !data.session) {
        toast({
          title: "Verifique seu Email",
          description: "Foi enviado um link de confirmação para seu email.",
        });
      }

      return true;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setAuthUser(null);
    setSession(null);
  };

  const createUser = async (userData: { name: string; email: string; role: User['role'] }): Promise<boolean> => {
    try {
      // Criar usuário no auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: Math.random().toString(36), // Senha temporária
        email_confirm: true,
        user_metadata: {
          full_name: userData.name
        }
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Atualizar o perfil com o papel correto
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ role: userData.role })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Erro ao atualizar perfil:', profileError);
        }
      }

      toast({
        title: "Usuário Criado",
        description: `${userData.name} foi criado com sucesso`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return false;
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
      }

      return data.map(user => ({
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        password_hash: user.password_hash,
        created_at: new Date(user.created_at),
        last_login: user.last_login ? new Date(user.last_login) : undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  };

  const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return false;
    }
  };

  const toggleUserStatus = async (userId: string): Promise<boolean> => {
    try {
      // Buscar usuário atual
      const { data: userData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('is_active')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar usuário:', fetchError);
        return false;
      }

      // Alternar status
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !userData.is_active })
        .eq('id', userId);

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      return false;
    }
  };

  const hasPermission = (requiredRole: User['role']): boolean => {
    if (!currentUser) return false;
    
    const userLevel = roleHierarchy[currentUser.role];
    const requiredLevel = roleHierarchy[requiredRole];
    
    return userLevel >= requiredLevel;
  };

  const canAccessUserManagement = (): boolean => {
    return hasPermission('franqueado');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      authUser,
      session,
      login,
      signUp,
      logout,
      createUser,
      hasPermission,
      canAccessUserManagement,
      getAllUsers,
      refreshProfile,
      changePassword,
      deleteUser,
      toggleUserStatus,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
