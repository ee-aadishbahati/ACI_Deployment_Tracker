import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskCategory, Fabric } from '../types';
import { CheckSquare, Square, Star, AlertTriangle, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';

interface BulkOperationsProps {
  selectedTasks: string[];
  onSelectionChange: (taskIds: string[]) => void;
  onClose: () => void;
}

export function BulkOperations({ selectedTasks, onSelectionChange, onClose }: BulkOperationsProps) {
  const { updateTaskState, updateTaskCategory, updateTaskCategoryAcrossSelectedFabrics, getCurrentFabricTasks, state, getFabricProgress } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [showFabricSelection, setShowFabricSelection] = useState(false);

  const allTasks = getCurrentFabricTasks();

  console.log('BulkOperations rendered with selectedTasks:', selectedTasks);
  console.log('BulkOperations selectedTasks.length:', selectedTasks.length);
  console.log('BulkOperations allTasks.length:', allTasks.length);

  const handleBulkComplete = async (completed: boolean) => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedTasks.map(taskId => updateTaskState(taskId, completed))
      );
      onSelectionChange([]);
    } catch (error) {
      console.error('Error updating tasks:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCategory = async (category: TaskCategory) => {
    if (selectedFabrics.length > 0) {
      const categoryLabel = category === 'must-have' ? 'Must Have' : category === 'should-have' ? 'Should Have' : 'Remove Priority';
      const fabricNames = selectedFabrics.map(fabricId => 
        state.fabrics.find(f => f.id === fabricId)?.name || fabricId
      ).join(', ');
      const confirmMessage = `This will apply the "${categoryLabel}" category to ${selectedTasks.length} task(s) across the following fabrics: ${fabricNames}. This action cannot be undone. Continue?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setIsProcessing(true);
    try {
      if (selectedFabrics.length > 0) {
        await Promise.all(
          selectedTasks.map(taskId => updateTaskCategoryAcrossSelectedFabrics(taskId, category, selectedFabrics))
        );
      } else {
        await Promise.all(
          selectedTasks.map(taskId => updateTaskCategory(taskId, category))
        );
      }
      onSelectionChange([]);
    } catch (error) {
      console.error('Error updating task categories:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAll = () => {
    const allTaskIds = allTasks.map(task => task.id);
    onSelectionChange(allTaskIds);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const handleFabricToggle = (fabricId: string) => {
    setSelectedFabrics(prev => 
      prev.includes(fabricId) 
        ? prev.filter(id => id !== fabricId)
        : [...prev, fabricId]
    );
  };

  const handleSelectAllFabrics = () => {
    setSelectedFabrics(state.fabrics.map(f => f.id));
  };

  const handleDeselectAllFabrics = () => {
    setSelectedFabrics([]);
  };

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

  if (selectedTasks.length === 0) {
    console.log('BulkOperations returning null due to empty selectedTasks');
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center space-x-2 mb-3">
        <button
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          Select All ({allTasks.length})
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={handleDeselectAll}
          className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400"
        >
          Deselect All
        </button>
      </div>

      <div className="mb-3">
        <button
          onClick={() => setShowFabricSelection(!showFabricSelection)}
          className="flex items-center justify-between w-full text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <span>
            Apply to specific fabrics {selectedFabrics.length > 0 && `(${selectedFabrics.length} selected)`}
          </span>
          {showFabricSelection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {showFabricSelection && (
          <div className="mt-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Select Fabrics:</span>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAllFabrics}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleDeselectAllFabrics}
                  className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(groupedFabrics).map(([site, fabrics]) => (
                <div key={site} className="space-y-1">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {site} Data Center
                  </div>
                  {fabrics.map(fabric => {
                    const progress = getFabricProgress(fabric.id);
                    const isSelected = selectedFabrics.includes(fabric.id);
                    
                    return (
                      <label
                        key={fabric.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFabricToggle(fabric.id)}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex items-center justify-between flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                              {fabric.type} Fabric
                            </span>
                            <div
                              className={`w-2 h-2 rounded-full ${getFabricStatusColor(fabric.id)}`}
                              title={`${Math.round((progress.completedTasks / progress.totalTasks) * 100)}% complete`}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {progress.completedTasks}/{progress.totalTasks}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleBulkComplete(true)}
          disabled={isProcessing}
          className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          <CheckSquare className="h-4 w-4" />
          <span>Mark Complete</span>
        </button>

        <button
          onClick={() => handleBulkComplete(false)}
          disabled={isProcessing}
          className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
        >
          <Square className="h-4 w-4" />
          <span>Mark Incomplete</span>
        </button>

        <div className="h-6 w-px bg-gray-300"></div>

        <button
          onClick={() => handleBulkCategory('must-have')}
          disabled={isProcessing}
          className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          <Star className="h-4 w-4" />
          <span>Must Have</span>
        </button>

        <button
          onClick={() => handleBulkCategory('should-have')}
          disabled={isProcessing}
          className="flex items-center space-x-1 px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 text-sm"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Should Have</span>
        </button>

        <button
          onClick={() => handleBulkCategory('none')}
          disabled={isProcessing}
          className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
        >
          <Trash2 className="h-4 w-4" />
          <span>Remove Priority</span>
        </button>
      </div>
    </div>
  );
}
