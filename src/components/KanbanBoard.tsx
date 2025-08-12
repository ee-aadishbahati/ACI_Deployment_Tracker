import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Task } from '../types';
import { useApp } from '../contexts/AppContext';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';
import { Search, Filter } from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 border-gray-300' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 border-blue-300' },
  { id: 'testing', title: 'Testing', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'complete', title: 'Complete', color: 'bg-green-100 border-green-300' },
] as const;

export function KanbanBoard() {
  const { state, updateTaskKanbanStatus } = useApp();
  const [activeTask, setActiveTask] = useState<(Task & { checked: boolean; kanbanStatus: string; notes: string }) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const currentFabric = state.fabrics.find(f => f.id === state.currentFabric);

  const getAllTasks = (): (Task & { checked: boolean; kanbanStatus: string; notes: string })[] => {
    const allTasks: (Task & { checked: boolean; kanbanStatus: string; notes: string })[] = [];
    
    state.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        subsection.tasks.forEach(task => {
          if (!currentFabric) return;
          
          if (task.fabricSpecific || 
              (task.ndoCentralized && currentFabric.site === 'Tertiary') ||
              (!task.fabricSpecific && !task.ndoCentralized)) {
            
            const isCompleted = state.fabricStates[state.currentFabric]?.[task.id] || false;
            const taskWithState = {
              ...task,
              checked: isCompleted,
              notes: state.fabricNotes[state.currentFabric]?.[task.id] || '',
              kanbanStatus: state.taskKanbanStatus[state.currentFabric]?.[task.id] || (isCompleted ? 'complete' : 'todo')
            } as Task & { checked: boolean; kanbanStatus: string; notes: string };
            
            allTasks.push(taskWithState);
          }
        });
      });
    });
    
    return allTasks;
  };

  const getFilteredTasks = (tasks: (Task & { checked: boolean; kanbanStatus: string; notes: string })[]): (Task & { checked: boolean; kanbanStatus: string; notes: string })[] => {
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.testCase?.tcId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.testCase?.lead.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = filterCategory === 'all' || 
        task.category === filterCategory ||
        (filterCategory === 'none' && !task.category);
      
      return matchesSearch && matchesCategory;
    });
  };

  const getTasksByColumn = (columnId: string): (Task & { checked: boolean; kanbanStatus: string; notes: string })[] => {
    const allTasks = getAllTasks();
    const filteredTasks = getFilteredTasks(allTasks);
    return filteredTasks.filter(task => task.kanbanStatus === columnId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = getAllTasks().find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Kanban: Drag ended', { active: active.id, over: over?.id });
    
    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as string;
    
    console.log('Kanban: Updating task status', { taskId, newStatus });
    
    if (KANBAN_COLUMNS.some(col => col.id === newStatus)) {
      updateTaskKanbanStatus(taskId, newStatus);
    }
    
    setActiveTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Kanban Board
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Drag and drop tasks to update their status
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Fabric: {currentFabric?.name}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Categories</option>
              <option value="must-have">Must Have</option>
              <option value="should-have">Should Have</option>
              <option value="none">No Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {KANBAN_COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={getTasksByColumn(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanTaskCard task={activeTask} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
