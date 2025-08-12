import React from 'react';
import { useDatabaseApp } from '../contexts/DatabaseAppContext';
import { Task, TaskCategory } from '../types';
import { Star, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';

export function PriorityCategories() {
  const { state, updateTaskCategory } = useDatabaseApp();
  
  const currentFabric = state.fabrics.find(f => f.id === state.currentFabric);
  
  const getAllTasks = (): Task[] => {
    if (!currentFabric) return [];

    const allTasks: Task[] = [];
    state.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        subsection.tasks.forEach(task => {
          if (task.fabricSpecific || 
              (task.ndoCentralized && currentFabric.site === 'Tertiary') ||
              (!task.fabricSpecific && !task.ndoCentralized)) {
            allTasks.push({
              ...task,
              checked: state.fabricStates[state.currentFabric]?.[task.id] || false,
              notes: state.fabricNotes[state.currentFabric]?.[task.id] || '',
              category: state.taskCategories[state.currentFabric]?.[task.id] || 'none'
            });
          }
        });
      });
    });
    return allTasks;
  };

  const allTasks = getAllTasks();
  const mustHaveTasks = allTasks.filter(task => task.category === 'must-have');
  const shouldHaveTasks = allTasks.filter(task => task.category === 'should-have');
  const unassignedTasks = allTasks.filter(task => task.category === 'none');

  const handleCategoryChange = (taskId: string, category: TaskCategory) => {
    updateTaskCategory(taskId, category);
  };

  const getCategoryStats = (tasks: Task[]) => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.checked).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const mustHaveStats = getCategoryStats(mustHaveTasks);
  const shouldHaveStats = getCategoryStats(shouldHaveTasks);

  const TaskList = ({ tasks, title, icon, color }: {
    tasks: Task[];
    title: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className={`px-6 py-4 border-b border-gray-200 ${color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <div className="text-white text-sm">
            {getCategoryStats(tasks).completed} / {getCategoryStats(tasks).total} 
            ({getCategoryStats(tasks).percentage}%)
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No tasks assigned to this category yet
          </p>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  {task.checked ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.checked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.text}
                  </p>
                  {task.notes && (
                    <p className="text-xs text-gray-500 mt-1">{task.notes}</p>
                  )}
                  {task.testCase && (
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {task.testCase.tcId}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.testCase.priority === 'High' ? 'bg-red-100 text-red-800' :
                        task.testCase.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.testCase.priority}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={task.category}
                    onChange={(e) => handleCategoryChange(task.id, e.target.value as TaskCategory)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Unassigned</option>
                    <option value="must-have">Must Have</option>
                    <option value="should-have">Should Have</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current Fabric Info */}
      <div className="bg-white shadow-lg rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Priority Categories: {currentFabric?.name}
            </h2>
            <p className="text-sm text-gray-600">
              Organize tasks by priority for focused deployment planning
              {currentFabric?.site === 'Tertiary' && (
                <span className="ml-2 text-blue-600 font-medium">
                  • NDO Management Site
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Priority Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Star className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Must Have Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {mustHaveStats.completed} / {mustHaveStats.total}
              </p>
              <p className="text-sm text-gray-500">{mustHaveStats.percentage}% Complete</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Should Have Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {shouldHaveStats.completed} / {shouldHaveStats.total}
              </p>
              <p className="text-sm text-gray-500">{shouldHaveStats.percentage}% Complete</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Circle className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Unassigned Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{unassignedTasks.length}</p>
              <p className="text-sm text-gray-500">Need categorization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskList
          tasks={mustHaveTasks}
          title="Must Have Tasks"
          icon={<Star className="h-5 w-5" />}
          color="bg-red-600"
        />
        
        <TaskList
          tasks={shouldHaveTasks}
          title="Should Have Tasks"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="bg-yellow-600"
        />
      </div>

      {/* Unassigned Tasks */}
      {unassignedTasks.length > 0 && (
        <TaskList
          tasks={unassignedTasks}
          title="Unassigned Tasks"
          icon={<Circle className="h-5 w-5" />}
          color="bg-gray-600"
        />
      )}
    </div>
  );
}
