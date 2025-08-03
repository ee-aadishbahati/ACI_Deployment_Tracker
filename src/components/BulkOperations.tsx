import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskCategory } from '../types';
import { CheckSquare, Square, Star, AlertTriangle, Trash2, X } from 'lucide-react';

interface BulkOperationsProps {
  selectedTasks: string[];
  onSelectionChange: (taskIds: string[]) => void;
  onClose: () => void;
}

export function BulkOperations({ selectedTasks, onSelectionChange, onClose }: BulkOperationsProps) {
  const { updateTaskState, updateTaskCategory, updateTaskCategoryAcrossAllFabrics, getCurrentFabricTasks } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [applyToAllDatacenters, setApplyToAllDatacenters] = useState(false);

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
    if (applyToAllDatacenters) {
      const categoryLabel = category === 'must-have' ? 'Must Have' : category === 'should-have' ? 'Should Have' : 'Remove Priority';
      const confirmMessage = `This will apply the "${categoryLabel}" category to ${selectedTasks.length} task(s) across ALL applicable datacenters. This action cannot be undone. Continue?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setIsProcessing(true);
    try {
      if (applyToAllDatacenters) {
        await Promise.all(
          selectedTasks.map(taskId => updateTaskCategoryAcrossAllFabrics(taskId, category))
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

      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={applyToAllDatacenters}
            onChange={(e) => setApplyToAllDatacenters(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="text-gray-700 dark:text-gray-300">Apply to all applicable datacenters</span>
        </label>
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
