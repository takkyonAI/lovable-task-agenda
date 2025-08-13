import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, LogOut, Bell } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import UserManagement from '@/components/UserManagement';
import TaskManager from '@/components/TaskManager';
import UserHeader from '@/components/UserHeader';
import NotificationTestPanel from '@/components/NotificationTestPanel';

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
    <div className="h-screen w-full bg-background text-foreground overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <UserHeader />
        
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Gerenciador de Tarefas Rockfeller Navegantes
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Bem-vindo, {currentUser.name}! Seu papel: {currentUser.role}
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-primary text-primary-foreground hover:opacity-90 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${canAccessUserManagement() ? 'grid-cols-3' : 'grid-cols-2'} bg-muted border border-border`}>
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tarefas</span>
              <span className="sm:hidden">Tarefas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Notificações</span>
              <span className="sm:hidden">Notific.</span>
            </TabsTrigger>
            {canAccessUserManagement() && (
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">Usuários</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <TaskManager />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationTestPanel />
          </TabsContent>

          {canAccessUserManagement() && (
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-card backdrop-blur-sm border border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
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
