
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter } from 'lucide-react';

interface TaskFiltersProps {
  activeFilter: 'all' | 'today' | 'week' | 'month' | 'overdue';
  onFilterChange: (filter: 'all' | 'today' | 'week' | 'month' | 'overdue') => void;
  getFilterCount: (filter: 'all' | 'today' | 'week' | 'month' | 'overdue') => number;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  activeFilter,
  onFilterChange,
  getFilterCount
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-slate-300 text-sm font-medium">Filtrar por:</span>
      </div>
      <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
            Todas ({getFilterCount('all')})
          </TabsTrigger>
          <TabsTrigger value="today" className="data-[state=active]:bg-purple-600">
            Hoje ({getFilterCount('today')})
          </TabsTrigger>
          <TabsTrigger value="week" className="data-[state=active]:bg-purple-600">
            Semana ({getFilterCount('week')})
          </TabsTrigger>
          <TabsTrigger value="month" className="data-[state=active]:bg-purple-600">
            Mês ({getFilterCount('month')})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-red-600">
            🚨 Atrasadas ({getFilterCount('overdue')})
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TaskFilters;
