
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
      <div className="flex justify-end">
        <div className="w-full max-w-4xl">{/* RESPONSIVE FILTERS FORCE UPDATE */}
          <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-slate-800/50 border-slate-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm">
                Todas ({getFilterCount('all')})
              </TabsTrigger>
              <TabsTrigger value="today" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm">
                Hoje ({getFilterCount('today')})
              </TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm">
                Semana ({getFilterCount('week')})
              </TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm">
                Mês ({getFilterCount('month')})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="data-[state=active]:bg-red-600 text-xs sm:text-sm">
                Atrasadas ({getFilterCount('overdue')})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TaskFilters;
