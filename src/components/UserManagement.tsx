import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Crown, Shield, User as UserIcon, UserX, Mail, CheckCircle, Clock, RefreshCw, Trash2, UserMinus, Eye, EyeOff, GraduationCap, UserCheck, FileText, UserCog } from 'lucide-react';
import { User } from '@/types/user';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import PasswordManagement from './PasswordManagement';

const UserManagement: React.FC = () => {
  const [confirmedUsers, setConfirmedUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'vendedor' as const,
  });

  const { 
    canAccessUserManagement, 
    createUser, 
    getAllUsers, 
    refreshProfile,
    changePassword,
    deleteUser,
    toggleUserStatus,
    currentUser
  } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const users = await getAllUsers();
      setConfirmedUsers(users);
      console.log('Usuários carregados no UserManagement:', users.length);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAccessUserManagement()) {
    return null;
  }

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'franqueado': return <Shield className="w-4 h-4" />;
      case 'vendedor': return <UserIcon className="w-4 h-4" />;
      case 'professor': return <GraduationCap className="w-4 h-4" />;
      case 'coordenador': return <UserCheck className="w-4 h-4" />;
      case 'assessora_adm': return <FileText className="w-4 h-4" />;
      case 'supervisor_adm': return <UserCog className="w-4 h-4" />;
      default: return <UserX className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'franqueado': return 'Franqueado';
      case 'vendedor': return 'Vendedor';
      case 'professor': return 'Professor';
      case 'coordenador': return 'Coordenador';
      case 'assessora_adm': return 'Assessora ADM';
      case 'supervisor_adm': return 'Supervisor ADM';
      default: return role;
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      };

      const success = await createUser(userData);
      if (success) {
        setNewUser({
          name: '',
          email: '',
          role: 'vendedor',
        });
        setIsAddDialogOpen(false);
        await loadUsers();
      }
    } catch (error) {
      console.error('Erro ao criar usuário no componente:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar usuário",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode excluir sua própria conta",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      try {
        const success = await deleteUser(userId);
        if (success) {
          toast({
            title: "Usuário Excluído",
            description: `${userName} foi excluído com sucesso`,
          });
          await loadUsers();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir usuário",
          variant: "destructive"
        });
      }
    }
  };

  const handleToggleUserStatus = async (userId: string, userName: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode alterar o status da sua própria conta",
        variant: "destructive"
      });
      return;
    }

    const action = currentStatus ? 'desativar' : 'ativar';
    if (confirm(`Tem certeza que deseja ${action} o usuário "${userName}"?`)) {
      try {
        const success = await toggleUserStatus(userId);
        if (success) {
          toast({
            title: "Status Alterado",
            description: `${userName} foi ${currentStatus ? 'desativado' : 'ativado'} com sucesso`,
          });
          await loadUsers();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao alterar status do usuário",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Usuários Ativos</CardTitle>
                <p className="text-slate-400 text-sm">Usuários confirmados no sistema</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={loadUsers}
                disabled={isLoading}
                variant="outline" 
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </>
                )}
              </Button>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Criar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="userName" className="text-slate-300">Nome *</Label>
                      <Input
                        id="userName"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="Nome completo do usuário"
                        disabled={isCreating}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="userEmail" className="text-slate-300">Email *</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="email@exemplo.com"
                        disabled={isCreating}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="userRole" className="text-slate-300">Papel</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}
                        disabled={isCreating}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="franqueado">Franqueado</SelectItem>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="coordenador">Coordenador</SelectItem>
                          <SelectItem value="assessora_adm">Assessora ADM</SelectItem>
                          <SelectItem value="supervisor_adm">Supervisor ADM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleCreateUser}
                      disabled={isCreating}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Usuário
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {confirmedUsers.map(user => (
              <div key={user.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border gap-4 ${
                user.is_active === false 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-slate-700/30 border-slate-600'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    user.is_active === false ? 'bg-red-500/20' : 'bg-slate-600/50'
                  }`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium truncate ${
                        user.is_active === false ? 'text-red-300 line-through' : 'text-white'
                      }`}>
                        {user.name}
                      </h4>
                      {user.is_active === false && (
                        <Badge className="bg-red-500/20 text-red-400">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Badge className={`${getRoleColor(user.role)} whitespace-nowrap`}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  
                  {user.id !== currentUser?.id && (
                    <div className="flex flex-wrap gap-2">
                      <PasswordManagement userId={user.id} userName={user.name} />
                      
                      <Button
                        onClick={() => handleToggleUserStatus(user.id, user.name, user.is_active !== false)}
                        variant="outline"
                        size="sm"
                        className={`text-xs ${user.is_active === false 
                          ? "bg-green-500/20 border-green-500/30 hover:bg-green-500/30 text-green-400"
                          : "bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30 text-yellow-400"
                        }`}
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        {user.is_active === false ? 'Ativar' : 'Desativar'}
                      </Button>
                      
                      <Button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        variant="outline"
                        size="sm"
                        className="bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-400 text-xs"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  )}
                  
                  {user.last_login && (
                    <span className="text-xs text-slate-400">
                      Último acesso: {user.last_login.toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {confirmedUsers.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <UserX className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum usuário ativo</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-400">Carregando usuários...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
