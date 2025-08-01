import { useApp } from '../contexts/AppContext';
import { Search, X } from 'lucide-react';

export function SearchFilter() {
  const { state, setSearchQuery } = useApp();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={state.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search tasks, test cases, or resource assignments..."
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
        />
        
        {state.searchQuery && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {state.searchQuery && (
        <div className="mt-2 text-sm text-gray-600">
          Searching for: <span className="font-medium">"{state.searchQuery}"</span>
        </div>
      )}
    </div>
  );
}
