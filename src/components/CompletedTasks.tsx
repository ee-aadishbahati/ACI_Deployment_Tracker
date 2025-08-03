import { useApp } from '../contexts/AppContext';
import { Task } from '../types';
import { CheckCircle2, Calendar, Clock, FileText } from 'lucide-react';
import { formatCompletionDate, formatWeekRange, isDateInCurrentWeek } from '../utils/dateUtils';

export function CompletedTasks() {
  const { getCompletedTasks, state, updateTaskState } = useApp();
  const completedTasks = getCompletedTasks();

  const handleUnmarkTask = async (taskId: string, fabricId: string) => {
    await updateTaskState(taskId, false, fabricId);
  };

  const getWeeklyProgress = () => {
    const completedThisWeek = completedTasks.filter(task => 
      task.completionDate && isDateInCurrentWeek(task.completionDate)
    );

    const inProcessTasks: Task[] = [];
    state.fabrics.forEach(fabric => {
      state.sections.forEach(section => {
        section.subsections.forEach(subsection => {
          subsection.tasks.forEach(task => {
            if (task.fabricSpecific || 
                (task.ndoCentralized && fabric.site === 'Tertiary') ||
                (!task.fabricSpecific && !task.ndoCentralized)) {
              const isCompleted = state.fabricStates[fabric.id]?.[task.id] || false;
              const noteModDate = state.fabricNoteModificationDates[fabric.id]?.[task.id];
              const hasNotes = state.fabricNotes[fabric.id]?.[task.id]?.trim();
              
              if (!isCompleted && hasNotes && noteModDate && isDateInCurrentWeek(noteModDate)) {
                inProcessTasks.push({
                  ...task,
                  checked: false,
                  notes: state.fabricNotes[fabric.id]?.[task.id] || '',
                  category: state.taskCategories[fabric.id]?.[task.id] || 'none',
                  fabricId: fabric.id,
                  fabricName: fabric.name,
                  sectionTitle: section.title,
                  subsectionTitle: subsection.title,
                  noteModificationDate: noteModDate
                });
              }
            }
          });
        });
      });
    });

    return { completedThisWeek, inProcessTasks };
  };

  const { completedThisWeek, inProcessTasks } = getWeeklyProgress();

  const groupTasksByFabric = (tasks: Task[]) => {
    const grouped: { [fabricId: string]: { fabricName: string; tasks: Task[] } } = {};
    
    tasks.forEach(task => {
      if (!grouped[task.fabricId!]) {
        grouped[task.fabricId!] = {
          fabricName: task.fabricName!,
          tasks: []
        };
      }
      grouped[task.fabricId!].tasks.push(task);
    });
    
    return grouped;
  };

  const completedGrouped = groupTasksByFabric(completedTasks);
  const weeklyCompletedGrouped = groupTasksByFabric(completedThisWeek);
  const inProcessGrouped = groupTasksByFabric(inProcessTasks);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Weekly Progress ({formatWeekRange()})
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-green-800 dark:text-green-200">
                Completed This Week ({completedThisWeek.length})
              </h3>
            </div>
            
            {Object.entries(weeklyCompletedGrouped).map(([fabricId, { fabricName, tasks }]) => (
              <div key={fabricId} className="mb-3 last:mb-0">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  {fabricName}
                </h4>
                <div className="space-y-1">
                  {tasks.map(task => (
                    <div key={`${task.fabricId}-${task.id}`} className="text-sm text-green-600 dark:text-green-400">
                      • {task.text}
                      {task.completionDate && (
                        <span className="text-xs text-green-500 ml-2">
                          ({formatCompletionDate(task.completionDate)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {completedThisWeek.length === 0 && (
              <p className="text-sm text-green-600 dark:text-green-400">No tasks completed this week</p>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                In Process This Week ({inProcessTasks.length})
              </h3>
            </div>
            
            {Object.entries(inProcessGrouped).map(([fabricId, { fabricName, tasks }]) => (
              <div key={fabricId} className="mb-3 last:mb-0">
                <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                  {fabricName}
                </h4>
                <div className="space-y-1">
                  {tasks.map(task => (
                    <div key={`${task.fabricId}-${task.id}`} className="text-sm text-yellow-600 dark:text-yellow-400">
                      • {task.text}
                      {task.noteModificationDate && (
                        <span className="text-xs text-yellow-500 ml-2">
                          (Last updated: {formatCompletionDate(task.noteModificationDate)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {inProcessTasks.length === 0 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">No tasks in process this week</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-6 w-6" />
            <h2 className="text-xl font-semibold">All Completed Tasks ({completedTasks.length})</h2>
          </div>
        </div>

        <div className="p-6">
          {Object.entries(completedGrouped).map(([fabricId, { fabricName, tasks }]) => (
            <div key={fabricId} className="mb-8 last:mb-0">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                {fabricName} ({tasks.length} tasks)
              </h3>
              
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={`${task.fabricId}-${task.id}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => handleUnmarkTask(task.id, task.fabricId!)}
                            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {task.text}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {task.sectionTitle} → {task.subsectionTitle}
                        </div>
                        
                        {task.notes && (
                          <div className="flex items-start space-x-2 mt-2">
                            <FileText className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {task.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        {task.completionDate && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatCompletionDate(task.completionDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {completedTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                No Completed Tasks
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Tasks marked as complete will appear here with their completion dates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
