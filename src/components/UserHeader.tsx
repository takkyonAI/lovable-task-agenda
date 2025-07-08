import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Crown, Shield, User, GraduationCap, UserCheck, FileText, UserCog } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import NotificationCenter from './NotificationCenter';

const UserHeader: React.FC = () => {
  const { currentUser, logout } = useSupabaseAuth();

  if (!currentUser) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'franqueado': return <Shield className="w-4 h-4" />;
      case 'vendedor': return <User className="w-4 h-4" />;
      case 'professor': return <GraduationCap className="w-4 h-4" />;
      case 'coordenador': return <UserCheck className="w-4 h-4" />;
      case 'assessora_adm': return <FileText className="w-4 h-4" />;
      case 'supervisor_adm': return <UserCog className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
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

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
              {getRoleIcon(currentUser.role)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-white truncate">{currentUser.name}</h2>
              <p className="text-slate-400 text-sm truncate">{currentUser.email}</p>
            </div>
            <Badge className={`${getRoleColor(currentUser.role)} whitespace-nowrap`}>
              {getRoleLabel(currentUser.role)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <NotificationCenter />
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserHeader;
