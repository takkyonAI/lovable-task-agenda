
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
  selectedPriority: 'all' | 'baixa' | 'media' | 'urgente';
  onPriorityChange: (priority: 'all' | 'baixa' | 'media' | 'urgente') => void;
  userProfiles: Record<string, UserProfile>;
  onClearFilters: () => void;
}

const AdvancedTaskFilters: React.FC<AdvancedTaskFiltersProps> = ({
  selectedUser,
  onUserChange,
  selectedAccessLevel,
  onAccessLevelChange,
  selectedPriority,
  onPriorityChange,
  userProfiles,
  onClearFilters
}) => {
  const { currentUser } = useSupabaseAuth();

  // Todos os usuários autenticados podem usar os filtros avançados
  const canUseAdvancedFilters = currentUser && currentUser.role;

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
    { value: 'assessora', label: 'Assessora' },
    { value: 'estagiario', label: 'Estagiário' },
    { value: 'professor', label: 'Professor' },
    { value: 'vendedor', label: 'Vendedor' }
  ];

  const priorities = [
    { value: 'all', label: 'Todas as Prioridades' },
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'urgente', label: 'Urgente' }
  ];

  const userList = Object.values(userProfiles).sort((a, b) => a.name.localeCompare(b.name));

  const hasActiveFilters = selectedUser !== 'all' || selectedAccessLevel !== 'all' || selectedPriority !== 'all';

  return (
    <Card className="mb-4 bg-muted/40 border border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground/80 text-sm font-medium">Filtros Avançados</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm mb-2 block">Filtrar por Usuário Atribuído</Label>
            <Select value={selectedUser} onValueChange={onUserChange}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Selecionar usuário atribuído..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
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
            <Label className="text-muted-foreground text-sm mb-2 block">Filtrar por Nível de Acesso</Label>
            <Select value={selectedAccessLevel} onValueChange={onAccessLevelChange}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Selecionar nível de acesso..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {accessLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm mb-2 block">Filtrar por Prioridade</Label>
            <Select value={selectedPriority} onValueChange={onPriorityChange}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Selecionar prioridade..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
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
