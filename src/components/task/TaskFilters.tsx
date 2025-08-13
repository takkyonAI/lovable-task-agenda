
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
        <div className="w-full max-w-4xl">{/* Filtros responsivos */}
          <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-muted border border-border dark:bg-slate-800/50 dark:border-slate-700">
              <TabsTrigger value="all" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Todas ({getFilterCount('all')})
              </TabsTrigger>
              <TabsTrigger value="today" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Hoje ({getFilterCount('today')})
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Semana ({getFilterCount('week')})
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Mês ({getFilterCount('month')})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs sm:text-sm data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground dark:data-[state=active]:bg-red-600">
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
