import { Section, Task } from '../types';
import { useApp } from '../contexts/AppContext';
import { TaskItem } from './TaskItem';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TaskSectionProps {
  section: Section;
  selectedTasks?: string[];
  onTaskSelect?: (taskId: string, selected: boolean) => void;
  bulkMode?: boolean;
}

export function TaskSection({ 
  section, 
  selectedTasks = [], 
  onTaskSelect, 
  bulkMode = false 
}: TaskSectionProps) {
  const { state, dispatch } = useApp();
  const currentFabric = state.fabrics.find(f => f.id === state.currentFabric);
  
  const toggleSection = () => {
    dispatch({ type: 'TOGGLE_SECTION', payload: section.id });
  };

  const getFilteredTasks = (tasks: Task[]): Task[] => {
    if (!state.searchQuery) return tasks;
    
    return tasks.filter(task =>
      task.text.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (task.testCase?.tcId.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
      (task.testCase?.lead.toLowerCase().includes(state.searchQuery.toLowerCase()))
    );
  };

  const getSectionTasks = (): Task[] => {
    const allTasks: Task[] = [];
    
    section.subsections.forEach(subsection => {
      subsection.tasks.forEach(task => {
        if (!currentFabric) return;
        
        if (task.fabricSpecific || 
            (task.ndoCentralized && currentFabric.site === 'Tertiary') ||
            (!task.fabricSpecific && !task.ndoCentralized)) {
          
          const isCompleted = state.fabricStates[state.currentFabric]?.[task.id] || false;
          
          if (!isCompleted) {
            const taskWithState = {
              ...task,
              checked: false,
              notes: state.fabricNotes[state.currentFabric]?.[task.id] || ''
            };
            
            allTasks.push(taskWithState);
          }
        }
      });
    });
    
    return getFilteredTasks(allTasks);
  };

  const sectionTasks = getSectionTasks();
  const completedTasks = sectionTasks.filter(task => task.checked).length;
  const totalTasks = sectionTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (sectionTasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg mb-6 overflow-hidden border border-gray-200 dark:border-gray-700">
      <div
        className="bg-blue-600 text-white p-4 cursor-pointer hover:bg-blue-700 transition-colors"
        onClick={toggleSection}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {section.expanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
            <h2 className="text-lg font-semibold">{section.title}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              {completedTasks}/{totalTasks} tasks ({completionPercentage}%)
            </div>
            <div className="w-24 bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {section.expanded && (
        <div className="p-6">
          
          {section.subsections.map((subsection, subsectionIndex) => {
            const subsectionTasks = getFilteredTasks(
              subsection.tasks.filter(task => {
                if (!currentFabric) return false;
                
                const isCompleted = state.fabricStates[state.currentFabric]?.[task.id] || false;
                
                return !isCompleted && (task.fabricSpecific || 
                       (task.ndoCentralized && currentFabric.site === 'Tertiary') ||
                       (!task.fabricSpecific && !task.ndoCentralized));
              }).map(task => ({
                ...task,
                checked: false,
                notes: state.fabricNotes[state.currentFabric]?.[task.id] || ''
              }))
            );

            if (subsectionTasks.length === 0) return null;

            const subsectionCompleted = subsectionTasks.filter(task => task.checked).length;
            const subsectionTotal = subsectionTasks.length;
            const subsectionPercentage = subsectionTotal > 0 ? Math.round((subsectionCompleted / subsectionTotal) * 100) : 0;

            return (
              <div key={subsectionIndex} className="mb-8 last:mb-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {subsection.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{subsectionCompleted}/{subsectionTotal}</span>
                    <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${subsectionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {subsectionTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      sectionId={section.id}
                      subsectionTitle={subsection.title}
                      selected={selectedTasks.includes(task.id)}
                      onSelect={onTaskSelect}
                      bulkMode={bulkMode}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
