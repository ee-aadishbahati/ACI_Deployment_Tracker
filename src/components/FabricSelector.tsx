import { useDatabaseApp } from '../contexts/DatabaseAppContext';
import { Fabric } from '../types';

export function FabricSelector() {
  const { state, setCurrentFabric, getFabricProgress } = useDatabaseApp();

  const getFabricStatusColor = (fabricId: string) => {
    const progress = getFabricProgress(fabricId);
    const completionRate = progress.totalTasks > 0 ? progress.completedTasks / progress.totalTasks : 0;
    
    if (completionRate === 1) return 'bg-green-500';
    if (completionRate >= 0.7) return 'bg-yellow-500';
    if (completionRate >= 0.3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const groupedFabrics = state.fabrics.reduce((acc, fabric) => {
    if (!acc[fabric.site]) {
      acc[fabric.site] = [];
    }
    acc[fabric.site].push(fabric);
    return acc;
  }, {} as Record<string, Fabric[]>);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">ACI Fabric Selection</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(groupedFabrics).map(([site, fabrics]) => (
          <div key={site} className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3 text-center">
              {site} Data Center
              {site === 'Tertiary' && (
                <span className="block text-sm text-blue-600 font-normal">
                  (NDO Host Site)
                </span>
              )}
            </h3>
            
            <div className="space-y-2">
              {fabrics.map(fabric => {
                const progress = getFabricProgress(fabric.id);
                const isSelected = state.currentFabric === fabric.id;
                
                return (
                  <button
                    key={fabric.id}
                    onClick={() => setCurrentFabric(fabric.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 bg-gray-50 hover:border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-medium">{fabric.type} Fabric</div>
                        <div className="text-xs opacity-75">
                          {progress.completedTasks}/{progress.totalTasks} tasks
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getFabricStatusColor(fabric.id)}`}
                          title={`${Math.round((progress.completedTasks / progress.totalTasks) * 100)}% complete`}
                        />
                        {progress.highPriorityPending > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1 rounded">
                            {progress.highPriorityPending}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>70%+ Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>30%+ Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Starting</span>
          </div>
        </div>
      </div>
    </div>
  );
}
