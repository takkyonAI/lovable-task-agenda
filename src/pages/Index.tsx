
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Settings, BarChart3, LogOut, User, Shield, Crown, GraduationCap, UserCheck, FileText, UserCog } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import UserManagement from '@/components/UserManagement';
import TaskManager from '@/components/TaskManager';
import UserHeader from '@/components/UserHeader';

const Index = () => {
  const navigate = useNavigate();
  const { currentUser, logout, canAccessUserManagement, loading } = useSupabaseAuth();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <UserHeader />
        
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="tasks" className="data-[state=active]:bg-purple-600">
              <Calendar className="w-4 h-4 mr-2" />
              Tarefas
            </TabsTrigger>
            {canAccessUserManagement() && (
              <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
                <Users className="w-4 h-4 mr-2" />
                Usuários
              </TabsTrigger>
            )}
            <TabsTrigger value="reports" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <TaskManager />
          </TabsContent>

          {canAccessUserManagement() && (
            <TabsContent value="users" className="mt-6">
              <UserManagement />
            </TabsContent>
          )}

          <TabsContent value="reports" className="mt-6">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Relatórios e Análises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Funcionalidade de relatórios em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
