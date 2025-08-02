import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, X, Filter, ChevronDown } from 'lucide-react';

interface FilterOptions {
  category: string;
  priority: string;
  status: string;
  resource: string;
  completed: string;
}

export function SearchFilter() {
  const { state, setSearchQuery } = useApp();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    priority: 'all',
    status: 'all',
    resource: 'all',
    completed: 'all'
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilters({
      category: 'all',
      priority: 'all',
      status: 'all',
      resource: 'all',
      completed: 'all'
    });
  };

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all');

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={state.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search tasks, test cases, or resource assignments..."
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
        />
        
        {(state.searchQuery || hasActiveFilters) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {hasActiveFilters && (
          <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
            Filters active
          </span>
        )}
      </div>

      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Categories</option>
              <option value="must-have">Must Have</option>
              <option value="should-have">Should Have</option>
              <option value="none">No Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Statuses</option>
              <option value="T.B.E.">To Be Executed</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Partial">Partial</option>
              <option value="Defer">Defer</option>
              <option value="R.I.">Requires Investigation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Resource</label>
            <select
              value={filters.resource}
              onChange={(e) => updateFilter('resource', e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Resources</option>
              <option value="EE">Essential Energy</option>
              <option value="PS">Professional Services</option>
              <option value="SP">Service Provider</option>
              <option value="OK">Other/OK</option>
              <option value="Vendor">Vendor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Completion</label>
            <select
              value={filters.completed}
              onChange={(e) => updateFilter('completed', e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Tasks</option>
              <option value="completed">Completed</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
        </div>
      )}

      {(state.searchQuery || hasActiveFilters) && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {state.searchQuery && (
            <span>Searching for: <span className="font-medium">"{state.searchQuery}"</span></span>
          )}
          {state.searchQuery && hasActiveFilters && <span> • </span>}
          {hasActiveFilters && <span>Advanced filters applied</span>}
        </div>
      )}
    </div>
  );
}
