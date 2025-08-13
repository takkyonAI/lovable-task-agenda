import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Crown, Shield, User, GraduationCap, UserCheck, FileText, UserCog } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import NotificationCenter from './NotificationCenter';
import Logo from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
    <Card className="mb-6 border bg-primary text-primary-foreground dark:bg-slate-800/50 dark:border-slate-700">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-12">
              <Logo size="xs" variant="icon" className="w-24 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-primary-foreground dark:text-white">
              Daily Control - <span className="font-normal">Navegantes</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="hidden sm:block font-medium text-primary-foreground dark:text-white max-w-[220px] truncate">
              {currentUser.name}
            </span>
            <ThemeToggle />
            <NotificationCenter />
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 dark:bg-slate-700/50 dark:border-slate-600 dark:hover:bg-slate-600/50 dark:text-white w-full sm:w-auto"
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
