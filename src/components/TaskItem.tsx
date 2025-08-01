import { useState } from 'react';
import { Task } from '../types';
import { useApp } from '../contexts/AppContext';
import { ChevronDown, ChevronRight, User, Clock, AlertTriangle, CheckCircle, Plus } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  sectionId: string;
  subsectionTitle: string;
}

export function TaskItem({ task }: TaskItemProps) {
  const { updateTaskState, updateTaskNotes } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    updateTaskState(task.id, checked);
  };

  const handleNotesChange = (notes: string) => {
    updateTaskNotes(task.id, notes);
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

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
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
              className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
            >
              {task.text}
            </label>
            
            <div className="flex items-center space-x-2 ml-4">
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
              
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-gray-400 hover:text-gray-600"
                title="Add notes"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {task.testCase && showDetails && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User size={14} className="text-gray-500" />
                    <span className="font-medium">Lead:</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {task.testCase.lead}
                    </span>
                    {task.testCase.witness && (
                      <>
                        <span className="text-gray-500">Witness:</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                          {task.testCase.witness}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle size={14} className="text-gray-500" />
                      <span className="font-medium">Priority:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.testCase.priority)}`}>
                        {task.testCase.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Risk:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.testCase.risk)}`}>
                        {task.testCase.risk}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock size={14} className="text-gray-500" />
                      <span className="font-medium">Effort:</span>
                      <span className="text-gray-700">{task.testCase.effort}h</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <CheckCircle size={14} className="text-gray-500" />
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.testCase.status)}`}>
                        {task.testCase.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  {task.testCase.preConditions && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Pre-conditions:</span>
                      <p className="text-gray-600 text-xs mt-1">{task.testCase.preConditions}</p>
                    </div>
                  )}
                  
                  {task.testCase.expectedResults && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Expected Results:</span>
                      <p className="text-gray-600 text-xs mt-1">{task.testCase.expectedResults}</p>
                    </div>
                  )}
                  
                  {task.testCase.dependencies && task.testCase.dependencies.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Dependencies:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.testCase.dependencies.map((dep, index) => (
                          <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                            {dep}
                          </span>
                        ))}
                      </div>
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
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                rows={3}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
