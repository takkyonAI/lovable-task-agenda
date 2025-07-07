
import React from 'react';
import UserHeader from '@/components/UserHeader';
import UserManagement from '@/components/UserManagement';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const Index = () => {
  const { canAccessUserManagement } = useSupabaseAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <UserHeader />
        
        <div className="space-y-6">
          {canAccessUserManagement() && (
            <UserManagement />
          )}
          
          {!canAccessUserManagement() && (
            <div className="text-center py-12">
              <div className="bg-slate-800/50 backdrop-blur-sm border-slate-700 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Bem-vindo ao Sistema!
                </h2>
                <p className="text-slate-400">
                  Você está logado com sucesso. Em breve, mais funcionalidades serão adicionadas.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
