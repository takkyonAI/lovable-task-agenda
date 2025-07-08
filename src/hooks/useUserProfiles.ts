
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export const useUserProfiles = () => {
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserProfiles();
  }, []);

  const loadUserProfiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, name, email, role');

      if (error) {
        console.error('Erro ao carregar perfis de usuários:', error);
        return;
      }

      if (data) {
        const profilesMap = data.reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, UserProfile>);
        
        setUserProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Erro ao carregar perfis de usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (userId: string): string => {
    return userProfiles[userId]?.name || 'Usuário não encontrado';
  };

  const getUsersByIds = (userIds: string[]): UserProfile[] => {
    return userIds.map(id => userProfiles[id]).filter(Boolean);
  };

  return {
    userProfiles,
    isLoading,
    getUserName,
    getUsersByIds,
    loadUserProfiles
  };
};
