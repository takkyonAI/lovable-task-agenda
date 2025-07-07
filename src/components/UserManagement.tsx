
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Crown, Shield, User as UserIcon, UserX, Mail, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { User } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const UserManagement: React.FC = () => {
  const [confirmedUsers, setConfirmedUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'vendedor' as const
  });
  const [confirmationData, setConfirmationData] = useState({
    email: '',
    code: ''
  });

  const { canAccessUserManagement, createUser, confirmUser, pendingUsers, getAllUsers, refreshUsers } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      await refreshUsers();
      const users = getAllUsers();
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

  // Verificar se o usuário tem permissão para acessar este componente
  if (!canAccessUserManagement()) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'franqueado': return 'bg-blue-500/20 text-blue-400';
      case 'vendedor': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'franqueado': return <Shield className="w-4 h-4" />;
      case 'vendedor': return <UserIcon className="w-4 h-4" />;
      default: return <UserX className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'franqueado': return 'Franqueado';
      case 'vendedor': return 'Vendedor';
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

    try {
      const success = await createUser(newUser);
      if (success) {
        toast({
          title: "Usuário Criado",
          description: `Um email de confirmação foi enviado para ${newUser.email}`,
        });
        
        setNewUser({
          name: '',
          email: '',
          role: 'vendedor'
        });
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar usuário",
        variant: "destructive"
      });
    }
  };

  const handleConfirmUser = async () => {
    if (!confirmationData.email || !confirmationData.code) {
      toast({
        title: "Erro",
        description: "Preencha o email e o código de confirmação",
        variant: "destructive"
      });
      return;
    }

    try {
      const success = await confirmUser(confirmationData.email, confirmationData.code);
      if (success) {
        toast({
          title: "Usuário Confirmado",
          description: "Usuário confirmado com sucesso!",
        });
        
        // Recarregar usuários
        await loadUsers();
        
        setConfirmationData({ email: '', code: '' });
        setIsConfirmDialogOpen(false);
      } else {
        toast({
          title: "Erro",
          description: "Código de confirmação inválido",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar usuário",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Usuários Confirmados */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Usuários Ativos</CardTitle>
                <p className="text-slate-400 text-sm">Usuários confirmados no sistema</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={loadUsers}
                disabled={isLoading}
                variant="outline" 
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white"
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

              <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Confirmar Usuário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="confirmEmail" className="text-slate-300">Email</Label>
                      <Input
                        id="confirmEmail"
                        type="email"
                        value={confirmationData.email}
                        onChange={(e) => setConfirmationData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmCode" className="text-slate-300">Código de Confirmação</Label>
                      <Input
                        id="confirmCode"
                        value={confirmationData.code}
                        onChange={(e) => setConfirmationData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="XXXXXX"
                        maxLength={6}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleConfirmUser}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Confirmar Usuário
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Criar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="userName" className="text-slate-300">Nome</Label>
                      <Input
                        id="userName"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="Nome do usuário"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="userEmail" className="text-slate-300">Email</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="userRole" className="text-slate-300">Papel</Label>
                      <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="franqueado">Franqueado</SelectItem>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleCreateUser}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Convite por Email
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
              <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-600/50 rounded-lg">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{user.name}</h4>
                    <p className="text-sm text-slate-400">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={`${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  {user.lastLogin && (
                    <span className="text-xs text-slate-400">
                      Último acesso: {user.lastLogin.toLocaleDateString('pt-BR')}
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

      {/* Usuários Pendentes */}
      {pendingUsers.length > 0 && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Usuários Pendentes</CardTitle>
                <p className="text-slate-400 text-sm">Aguardando confirmação por email</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {pendingUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Mail className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{user.name}</h4>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      {getRoleLabel(user.role)}
                    </Badge>
                    <span className="text-xs text-yellow-400 font-mono">
                      Código: {user.confirmationCode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;
