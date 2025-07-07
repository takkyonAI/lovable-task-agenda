import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { validateEmail, validatePassword, validateName, sanitizeInput, generateSecurePassword } from '@/utils/inputValidation';

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
  getVisibleUsers: () => Promise<User[]>;
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
        setSession(session);
        setAuthUser(session?.user ?? null);
        
        if (session?.user) {
          // Buscar perfil do usuário com delay para evitar problemas de timing
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 100);
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
        // Se o perfil não existir, tentar criar um básico
        if (error.code === 'PGRST116') {
          const { data: authData } = await supabase.auth.getUser();
          if (authData.user) {
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: userId,
                name: authData.user.user_metadata?.full_name || authData.user.email || 'Usuário',
                email: authData.user.email || '',
                role: 'vendedor',
                is_active: true
              });
            
            if (!insertError) {
              // Tentar buscar novamente após criar
              setTimeout(() => fetchUserProfile(userId), 500);
            }
          }
        }
        return;
      }

      if (data) {
        const userProfile: User = {
          id: data.id as string,
          user_id: data.user_id as string,
          name: data.name as string,
          email: data.email as string,
          role: data.role as User['role'],
          is_active: data.is_active as boolean,
          password_hash: data.password_hash as string,
          created_at: new Date(data.created_at as string),
          last_login: data.last_login ? new Date(data.last_login as string) : undefined
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
      // Validate input
      if (!validateEmail(email)) {
        toast({
          title: "Erro no Login",
          description: "Por favor, insira um email válido",
          variant: "destructive"
        });
        return false;
      }

      if (!password || password.length < 6) {
        toast({
          title: "Erro no Login",
          description: "Senha deve ter pelo menos 6 caracteres",
          variant: "destructive"
        });
        return false;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizeInput(email),
        password
      });

      if (error) {
        toast({
          title: "Erro no Login",
          description: "Credenciais inválidas. Verifique seu email e senha.",
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
      // Validate inputs
      if (!validateEmail(email)) {
        toast({
          title: "Erro no Cadastro",
          description: "Por favor, insira um email válido",
          variant: "destructive"
        });
        return false;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        toast({
          title: "Erro no Cadastro",
          description: passwordValidation.message,
          variant: "destructive"
        });
        return false;
      }

      if (!validateName(name)) {
        toast({
          title: "Erro no Cadastro",
          description: "Nome deve ter entre 2 e 100 caracteres",
          variant: "destructive"
        });
        return false;
      }

      const { data, error } = await supabase.auth.signUp({
        email: sanitizeInput(email),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: sanitizeInput(name)
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
      // Validate inputs
      if (!validateEmail(userData.email)) {
        toast({
          title: "Erro",
          description: "Por favor, insira um email válido",
          variant: "destructive"
        });
        return false;
      }

      if (!validateName(userData.name)) {
        toast({
          title: "Erro",  
          description: "Nome deve ter entre 2 e 100 caracteres",
          variant: "destructive"
        });
        return false;
      }

      const securePassword = generateSecurePassword();

      // Primeiro tentar criar o usuário no auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizeInput(userData.email),
        password: securePassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: sanitizeInput(userData.name)
          }
        }
      });

      if (authError) {
        toast({
          title: "Erro",
          description: authError.message,
          variant: "destructive"
        });
        return false;
      }

      if (!authData.user) {
        toast({
          title: "Erro",
          description: "Falha ao criar usuário",
          variant: "destructive"
        });
        return false;
      }

      // Aguardar um pouco para o trigger criar o perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar o perfil com o papel correto
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          role: userData.role,
          name: sanitizeInput(userData.name)
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        // Tentar criar o perfil manualmente se a atualização falhar
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            name: sanitizeInput(userData.name),
            email: sanitizeInput(userData.email),
            role: userData.role,
            is_active: true
          });

        if (insertError) {
          toast({
            title: "Erro",
            description: "Falha ao criar perfil do usuário",
            variant: "destructive"
          });
          return false;
        }
      }

      toast({
        title: "Usuário Criado",
        description: `${userData.name} foi criado com sucesso! Senha temporária: ${securePassword}`,
      });

      return true;
    } catch (error) {
      console.error('Erro geral ao criar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar usuário",
        variant: "destructive"
      });
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

      return (data || []).map((user: any) => ({
        id: user.id as string,
        user_id: user.user_id as string,
        name: user.name as string,
        email: user.email as string,
        role: user.role as User['role'],
        is_active: user.is_active as boolean,
        password_hash: user.password_hash as string,
        created_at: new Date(user.created_at as string),
        last_login: user.last_login ? new Date(user.last_login as string) : undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  };

  const getVisibleUsers = async (): Promise<User[]> => {
    try {
      if (!currentUser) return [];

      // Implementar lógica de visibilidade baseada na hierarquia de papéis
      const currentUserLevel = roleHierarchy[currentUser.role];
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários visíveis:', error);
        return [];
      }

      // Filtrar usuários baseado na hierarquia
      return (data || [])
        .filter((user: any) => {
          const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy];
          return currentUserLevel >= userLevel;
        })
        .map((user: any) => ({
          id: user.id as string,
          user_id: user.user_id as string,
          name: user.name as string,
          email: user.email as string,
          role: user.role as User['role'],
          is_active: user.is_active as boolean,
          password_hash: user.password_hash as string,
          created_at: new Date(user.created_at as string),
          last_login: user.last_login ? new Date(user.last_login as string) : undefined
        }));
    } catch (error) {
      console.error('Erro ao buscar usuários visíveis:', error);
      return [];
    }
  };

  const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        toast({
          title: "Erro",
          description: passwordValidation.message,
          variant: "destructive"
        });
        return false;
      }

      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: { userId, newPassword }
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao alterar senha",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao alterar senha",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao excluir usuário",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir usuário",
        variant: "destructive"
      });
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
        .update({ is_active: !(userData as any).is_active })
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
      getVisibleUsers,
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
