import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';
import { useApp } from '../contexts/AppContext';
import { 
  User, 
  Clock, 
  AlertTriangle, 
  Star, 
  Calendar,
  MessageSquare,
  GripVertical
} from 'lucide-react';

interface KanbanTaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export function KanbanTaskCard({ task, isDragging = false }: KanbanTaskCardProps) {
  const { updateTaskNotes, updateTaskCategory } = useApp();
  const [showNotes, setShowNotes] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'must-have': return 'text-red-600 bg-red-50 border-red-200';
      case 'should-have': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'must-have': return <Star className="h-3 w-3 fill-current" />;
      case 'should-have': return <AlertTriangle className="h-3 w-3" />;
      default: return null;
    }
  };

  const handleNotesChange = (notes: string) => {
    updateTaskNotes(task.id, notes);
  };

  const handleCategoryChange = (category: string) => {
    updateTaskCategory(task.id, category as any);
  };

  if (isDragging || isSortableDragging) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-blue-500 p-4 opacity-50 rotate-3">
        <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
          {task.text}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-2"
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
          {task.category && task.category !== 'none' && (
            <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded border ${getCategoryColor(task.category)}`}>
              {getCategoryIcon(task.category)}
              <span className="capitalize">{task.category.replace('-', ' ')}</span>
            </div>
          )}
        </div>
        
        {task.testCase && (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            TC: {task.testCase.tcId}
          </span>
        )}
      </div>

      {/* Task Content */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-3 mb-2">
          {task.text}
        </h4>
        
        {/* Task Details */}
        {task.testCase && (
          <div className="space-y-2">
            <div className="flex items-center space-x-4 text-xs">
              {task.testCase.lead && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">{task.testCase.lead}</span>
                </div>
              )}
              
              {task.testCase.effort && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">{task.testCase.effort}h</span>
                </div>
              )}
            </div>
            
            {task.testCase.priority && (
              <div className="flex items-center space-x-1">
                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.testCase.priority)}`}>
                  {task.testCase.priority} Priority
                </span>
              </div>
            )}
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center space-x-1 mt-2">
            <Calendar className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Assigned To */}
        {task.assignedTo && (
          <div className="flex items-center space-x-1 mt-1">
            <User className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Assigned: {task.assignedTo}
            </span>
          </div>
        )}
      </div>

      {/* Task Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <select
            value={task.category || 'none'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="none">No Priority</option>
            <option value="must-have">Must Have</option>
            <option value="should-have">Should Have</option>
          </select>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowNotes(!showNotes);
          }}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
            task.notes ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
          }`}
          title={task.notes ? 'View notes' : 'Add notes'}
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>

      {/* Notes Section */}
      {showNotes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <textarea
            value={task.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes for this task..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={2}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
