import { useState } from 'react';
import { Task, TaskCategory } from '../types';
import { useDatabaseApp } from '../contexts/DatabaseAppContext';
import { ChevronDown, ChevronRight, User, Clock, AlertTriangle, CheckCircle, Plus, Star, MessageSquare } from 'lucide-react';
// import { TaskComments } from './TaskComments'; // TODO: Re-enable when database context is integrated

interface TaskItemProps {
  task: Task;
  sectionId: string;
  subsectionTitle: string;
  selected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
  bulkMode?: boolean;
}

export function TaskItem({ 
  task, 
  selected = false, 
  onSelect, 
  bulkMode = false 
}: TaskItemProps) {
  const { state, updateTaskState, updateTaskNotes, updateTaskCategory } = useDatabaseApp();
  const [showDetails, setShowDetails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    updateTaskState(task.id, checked);
  };

  const handleNotesChange = (notes: string) => {
    updateTaskNotes(task.id, notes);
  };

  const handleCategoryChange = (category: TaskCategory) => {
    updateTaskCategory(task.id, category);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Pass': return 'text-green-600 bg-green-50';
      case 'Fail': return 'text-red-600 bg-red-50';
      case 'Partial': return 'text-yellow-600 bg-yellow-50';
      case 'T.B.E.': return 'text-blue-600 bg-blue-50';
      case 'Defer': return 'text-purple-600 bg-purple-50';
      case 'R.I.': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category?: TaskCategory) => {
    switch (category) {
      case 'must-have': return 'text-red-600 bg-red-50 border-red-200';
      case 'should-have': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category?: TaskCategory) => {
    switch (category) {
      case 'must-have': return <Star className="h-3 w-3 fill-current" />;
      case 'should-have': return <AlertTriangle className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow ${
      selected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
    }`}>
      <div className="flex items-start space-x-3">
        {bulkMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(task.id, e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        )}
        <input
          type="checkbox"
          id={task.id}
          checked={task.checked}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <label
              htmlFor={task.id}
              className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer flex-1"
            >
              {task.text}
            </label>
            
            <div className="flex items-center space-x-2 ml-4">
              {task.category && task.category !== 'none' && (
                <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded border ${getCategoryColor(task.category)}`}>
                  {getCategoryIcon(task.category)}
                  <span className="capitalize">{task.category.replace('-', ' ')}</span>
                </div>
              )}
              
              {task.testCase && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center space-x-1 text-xs text-primary hover:text-primary-dark"
                >
                  {showDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>TC: {task.testCase.tcId}</span>
                </button>
              )}
              
              {task.ndoCentralized && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  NDO
                </span>
              )}
              
              {task.fabricSpecific && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Fabric
                </span>
              )}
              
              <select
                value={task.category || 'none'}
                onChange={(e) => handleCategoryChange(e.target.value as TaskCategory)}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                title="Set task priority category"
              >
                <option value="none">No Priority</option>
                <option value="must-have">Must Have</option>
                <option value="should-have">Should Have</option>
              </select>
              
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Add notes"
              >
                <Plus size={16} />
              </button>
              
              <button
                onClick={() => setShowComments(!showComments)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                title="Comments"
              >
                <MessageSquare size={16} />
                {/* TODO: Implement comment count when database context is integrated */}
              </button>
            </div>
          </div>

          {task.testCase && showDetails && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User size={14} className="text-gray-500 dark:text-gray-400" />
                    <span className="font-medium dark:text-gray-300">Lead:</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {task.testCase.lead}
                    </span>
                    {task.testCase.witness && (
                      <>
                        <span className="text-gray-500 dark:text-gray-400">Witness:</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                          {task.testCase.witness}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle size={14} className="text-gray-500 dark:text-gray-400" />
                      <span className="font-medium dark:text-gray-300">Priority:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.testCase.priority)}`}>
                        {task.testCase.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="font-medium dark:text-gray-300">Risk:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.testCase.risk)}`}>
                        {task.testCase.risk}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock size={14} className="text-gray-500 dark:text-gray-400" />
                      <span className="font-medium dark:text-gray-300">Effort:</span>
                      <span className="text-gray-700 dark:text-gray-300">{task.testCase.effort}h</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <CheckCircle size={14} className="text-gray-500 dark:text-gray-400" />
                      <span className="font-medium dark:text-gray-300">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.testCase.status)}`}>
                        {task.testCase.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  {task.testCase.preConditions && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Pre-conditions:</span>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{task.testCase.preConditions}</p>
                    </div>
                  )}
                  
                  {task.testCase.expectedResults && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Expected Results:</span>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{task.testCase.expectedResults}</p>
                    </div>
                  )}
                  
                  {task.testCase.dependencies && task.testCase.dependencies.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Dependencies:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.testCase.dependencies.map((dep, index) => {
                          const depTestCase = state.testCaseStates[state.currentFabric]?.[dep];
                          const isDepCompleted = depTestCase?.status === 'Pass';
                          
                          return (
                            <span 
                              key={index} 
                              className={`px-2 py-1 rounded text-xs ${
                                isDepCompleted 
                                  ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300' 
                                  : 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'
                              }`}
                              title={isDepCompleted ? 'Dependency completed' : 'Dependency not completed'}
                            >
                              {dep} {isDepCompleted ? '✓' : '⚠'}
                            </span>
                          );
                        })}
                      </div>
                      {task.testCase.dependencies.some(dep => {
                        const depTestCase = state.testCaseStates[state.currentFabric]?.[dep];
                        return depTestCase?.status !== 'Pass';
                      }) && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                          <div className="flex items-center space-x-1 text-yellow-700 dark:text-yellow-300">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Complete dependencies before marking this task as done</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showNotes && (
            <div className="mt-3">
              <textarea
                value={task.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add notes for this task..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
              />
            </div>
          )}

          {showComments && (
            <div className="mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
              {/* TODO: Implement TaskComments when database context is integrated */}
              <p className="text-sm text-gray-500 dark:text-gray-400">Comments feature coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
