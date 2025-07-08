import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, LogOut } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import UserManagement from '@/components/UserManagement';
import TaskManager from '@/components/TaskManager';
import UserHeader from '@/components/UserHeader';

const Index = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const { currentUser, logout, canAccessUserManagement } = useSupabaseAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto px-4 py-6">
        <UserHeader />
        
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Gerenciador de Tarefas Rockfeller Navegantes
              </h1>
              <p className="text-slate-300 text-sm sm:text-base">
                Bem-vindo, {currentUser.name}! Seu papel: {currentUser.role}
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-slate-800/50 text-white border-slate-600 hover:bg-slate-700/50 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${canAccessUserManagement() ? 'grid-cols-2' : 'grid-cols-1'} bg-slate-800/50 border-slate-700`}>
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tarefas</span>
              <span className="sm:hidden">Tasks</span>
            </TabsTrigger>
            {canAccessUserManagement() && (
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <TaskManager />
          </TabsContent>

          {canAccessUserManagement() && (
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Gerenciar Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
