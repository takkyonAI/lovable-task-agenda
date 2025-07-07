
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Shield, Eye, UserX } from 'lucide-react';
import { User } from '@/types/user';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as const
  });

  const googleSheets = useGoogleSheets();

  useEffect(() => {
    if (googleSheets.isConfigured) {
      googleSheets.fetchUsers().then(setUsers);
    }
  }, [googleSheets.isConfigured]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'user': return 'bg-blue-500/20 text-blue-400';
      case 'viewer': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'viewer': return <Eye className="w-4 h-4" />;
      default: return <UserX className="w-4 h-4" />;
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;

    try {
      const createdUser = await googleSheets.addUser(newUser);
      setUsers(prev => [...prev, createdUser]);
      
      setNewUser({
        name: '',
        email: '',
        role: 'user'
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
    }
  };

  if (!googleSheets.isConfigured) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="p-6 text-center">
          <UserX className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Configure o Google Sheets primeiro para gerenciar usuários</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Gerenciamento de Usuários</CardTitle>
              <p className="text-slate-400 text-sm">Controle de acesso e permissões</p>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Adicionar Usuário</DialogTitle>
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
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleAddUser}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Adicionar Usuário
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {users.map(user => (
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
                  {user.role === 'admin' ? 'Administrador' : 
                   user.role === 'user' ? 'Usuário' : 'Visualizador'}
                </Badge>
                {user.lastLogin && (
                  <span className="text-xs text-slate-400">
                    Último acesso: {user.lastLogin.toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <UserX className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum usuário cadastrado</p>
              <p className="text-slate-500 text-sm">Adicione o primeiro usuário para começar</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
