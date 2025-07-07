
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Crown, Shield, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const UserHeader: React.FC = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'franqueado': return <Shield className="w-4 h-4" />;
      case 'vendedor': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'franqueado': return 'bg-blue-500/20 text-blue-400';
      case 'vendedor': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
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

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
              {getRoleIcon(currentUser.role)}
            </div>
            <div>
              <h2 className="font-semibold text-white">{currentUser.name}</h2>
              <p className="text-slate-400 text-sm">{currentUser.email}</p>
            </div>
            <Badge className={`${getRoleColor(currentUser.role)}`}>
              {getRoleLabel(currentUser.role)}
            </Badge>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserHeader;
