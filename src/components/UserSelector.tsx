
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, Crown, Shield, User as UserIcon, GraduationCap, UserCheck, FileText, UserCog } from 'lucide-react';
import { User } from '@/types/user';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface UserSelectorProps {
  selectedUsers: string[];
  onUsersChange: (userIds: string[]) => void;
  placeholder?: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUsers,
  onUsersChange,
  placeholder = "Digite para buscar usuários..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { getVisibleUsers } = useSupabaseAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = availableUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
      setIsOpen(true);
    } else {
      setFilteredUsers([]);
      setIsOpen(false);
    }
  }, [searchTerm, availableUsers]);

  const loadUsers = async () => {
    try {
      const users = await getVisibleUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3" />;
      case 'franqueado': return <Shield className="w-3 h-3" />;
      case 'vendedor': return <UserIcon className="w-3 h-3" />;
      case 'professor': return <GraduationCap className="w-3 h-3" />;
      case 'coordenador': return <UserCheck className="w-3 h-3" />;
      case 'assessora_adm': return <FileText className="w-3 h-3" />;
      case 'supervisor_adm': return <UserCog className="w-3 h-3" />;
      default: return <UserIcon className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'franqueado': return 'bg-blue-500/20 text-blue-400';
      case 'vendedor': return 'bg-green-500/20 text-green-400';
      case 'professor': return 'bg-purple-500/20 text-purple-400';
      case 'coordenador': return 'bg-orange-500/20 text-orange-400';
      case 'assessora_adm': return 'bg-pink-500/20 text-pink-400';
      case 'supervisor_adm': return 'bg-indigo-500/20 text-indigo-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleSelectUser = (userId: string) => {
    if (!selectedUsers.includes(userId)) {
      onUsersChange([...selectedUsers, userId]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    onUsersChange(selectedUsers.filter(id => id !== userId));
  };

  const getSelectedUserDetails = () => {
    return availableUsers.filter(user => selectedUsers.includes(user.user_id));
  };

  return (
    <div className="relative">
      <div className="space-y-2">
        {/* Usuários selecionados */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {getSelectedUserDetails().map(user => (
              <Badge 
                key={user.user_id} 
                className={`${getRoleColor(user.role)} flex items-center gap-1`}
              >
                {getRoleIcon(user.role)}
                {user.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveUser(user.user_id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Campo de busca */}
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="bg-slate-700/50 border-slate-600 text-white"
          />

          {/* Lista de sugestões */}
          {isOpen && filteredUsers.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border-slate-700 max-h-60 overflow-y-auto">
              <CardContent className="p-2">
                {filteredUsers
                  .filter(user => !selectedUsers.includes(user.user_id))
                  .map(user => (
                    <Button
                      key={user.user_id}
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto text-left hover:bg-slate-700/50"
                      onClick={() => handleSelectUser(user.user_id)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-sm text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
