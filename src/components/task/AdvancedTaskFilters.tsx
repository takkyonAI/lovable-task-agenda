
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface UserProfile {
  user_id: string;
  name: string;
  role: string;
}

interface AdvancedTaskFiltersProps {
  selectedUser: string;
  onUserChange: (userId: string) => void;
  selectedAccessLevel: string;
  onAccessLevelChange: (level: string) => void;
  userProfiles: Record<string, UserProfile>;
  onClearFilters: () => void;
}

const AdvancedTaskFilters: React.FC<AdvancedTaskFiltersProps> = ({
  selectedUser,
  onUserChange,
  selectedAccessLevel,
  onAccessLevelChange,
  userProfiles,
  onClearFilters
}) => {
  const { currentUser } = useSupabaseAuth();

  // Verificar se o usuário tem permissão para ver os filtros avançados
  const canUseAdvancedFilters = currentUser && 
    ['admin', 'franqueado', 'supervisor_adm', 'coordenador'].includes(currentUser.role);

  if (!canUseAdvancedFilters) {
    return null;
  }

  const accessLevels = [
    { value: 'all', label: 'Todos os Níveis' },
    { value: 'admin', label: 'Administrador' },
    { value: 'franqueado', label: 'Franqueado' },
    { value: 'coordenador', label: 'Coordenador' },
    { value: 'supervisor_adm', label: 'Supervisor ADM' },
    { value: 'assessora_adm', label: 'Assessora ADM' },
    { value: 'professor', label: 'Professor' },
    { value: 'vendedor', label: 'Vendedor' }
  ];

  const userList = Object.values(userProfiles).sort((a, b) => a.name.localeCompare(b.name));

  const hasActiveFilters = selectedUser !== 'all' || selectedAccessLevel !== 'all';

  return (
    <Card className="bg-slate-700/30 border-slate-600 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 text-sm font-medium">Filtros Avançados</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-slate-400 hover:text-white hover:bg-slate-600/50"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300 text-sm mb-2 block">Filtrar por Usuário</Label>
            <Select value={selectedUser} onValueChange={onUserChange}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Selecionar usuário..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos os usuários</SelectItem>
                {userList.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300 text-sm mb-2 block">Filtrar por Nível de Acesso</Label>
            <Select value={selectedAccessLevel} onValueChange={onAccessLevelChange}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Selecionar nível..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {accessLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedTaskFilters;
