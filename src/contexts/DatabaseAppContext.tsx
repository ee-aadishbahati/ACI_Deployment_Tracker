import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AppState, Task, SubChecklist, FabricProgress, AppAction, TaskCategory, TaskComment } from '../types';
import { fabricsData } from '../data/fabricsData';
import { sectionsData } from '../data/sectionsData';
import { ErrorHandler, ErrorType } from '../utils/ErrorHandler';
import { useNotifications } from '../components/common/NotificationSystem';

interface DatabaseAppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getCurrentFabricTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getFabricProgress: (fabricId: string) => FabricProgress;
  updateTaskState: (taskId: string, checked: boolean, fabricId?: string) => Promise<void>;
  updateTaskStateAcrossSelectedFabrics: (taskId: string, checked: boolean, fabricIds: string[]) => Promise<void>;
  updateTaskNotes: (taskId: string, notes: string, fabricId?: string) => Promise<void>;
  updateTaskCategory: (taskId: string, category: TaskCategory, fabricId?: string) => Promise<void>;
  updateTaskCategoryAcrossSelectedFabrics: (taskId: string, category: TaskCategory, fabricIds: string[]) => Promise<void>;
  updateTaskCategoryAcrossAllFabrics: (taskId: string, category: TaskCategory) => Promise<void>;
  updateTaskKanbanStatus: (taskId: string, kanbanStatus: string, fabricId?: string) => Promise<void>;
  getTaskComments: (taskId: string) => TaskComment[];
  addComment: (comment: TaskComment) => Promise<void>;
  updateComment: (comment: TaskComment) => Promise<void>;
  deleteComment: (commentId: string, taskId: string) => Promise<void>;
  findTaskById: (taskId: string) => Task | undefined;
  cloneTasksAcrossFabrics: (taskIds: string[], sourceFabricId: string, targetFabricIds: string[]) => Promise<void>;
  addTask: (sectionId: string, subsectionTitle: string, taskData: any) => Promise<void>;
  addSubsection: (sectionId: string, subsectionTitle: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  getUnreadNotifications: () => any[];
  setCurrentFabric: (fabricId: string) => void;
  setSearchQuery: (query: string) => void;
  saveSubChecklist: (name: string, items: any[]) => Promise<void>;
  loadSubChecklist: (name: string) => void;
  deleteSubChecklist: (name: string) => Promise<void>;
  createBackup: () => Promise<string | null>;
  isReady: boolean;
}

const initialState: AppState = {
  fabrics: fabricsData,
  sections: sectionsData,
  currentFabric: 'north-it',
  searchQuery: '',
  subChecklists: {},
  fabricStates: {},
  fabricNotes: {},
  fabricCompletionDates: {},
  fabricNoteModificationDates: {},
  testCaseStates: {},
  taskCategories: {},
  taskKanbanStatus: {},
  users: {},
  currentUser: 'default-user',
  taskComments: {},
  notifications: [],
  taskTemplates: [],
  isLoading: false
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_FABRIC':
      return { ...state, currentFabric: action.payload };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'UPDATE_TASK_STATE':
      const { taskId, checked, fabricId } = action.payload;
      return {
        ...state,
        fabricStates: {
          ...state.fabricStates,
          [fabricId]: {
            ...state.fabricStates[fabricId],
            [taskId]: checked
          }
        }
      };
    
    case 'UPDATE_TASK_NOTES':
      const { taskId: noteTaskId, notes, fabricId: noteFabricId } = action.payload;
      return {
        ...state,
        fabricNotes: {
          ...state.fabricNotes,
          [noteFabricId]: {
            ...state.fabricNotes[noteFabricId],
            [noteTaskId]: notes
          }
        }
      };
    
    case 'SAVE_SUB_CHECKLIST':
      return {
        ...state,
        subChecklists: {
          ...state.subChecklists,
          [action.payload.name]: action.payload.checklist
        }
      };
    
    case 'DELETE_SUB_CHECKLIST':
      const { [action.payload]: deleted, ...remainingChecklists } = state.subChecklists;
      return {
        ...state,
        subChecklists: remainingChecklists
      };
    
    case 'TOGGLE_SECTION':
      return {
        ...state,
        sections: state.sections.map(section =>
          section.id === action.payload
            ? { ...section, expanded: !section.expanded }
            : section
        )
      };
    
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'UPDATE_TASK_CATEGORY':
      const { taskId: catTaskId, category, fabricId: catFabricId } = action.payload;
      return {
        ...state,
        taskCategories: {
          ...state.taskCategories,
          [catFabricId]: {
            ...state.taskCategories[catFabricId],
            [catTaskId]: category
          }
        }
      };
    
    case 'UPDATE_TASK_KANBAN_STATUS':
      const { taskId: kanbanTaskId, kanbanStatus, fabricId: kanbanFabricId } = action.payload;
      return {
        ...state,
        taskKanbanStatus: {
          ...state.taskKanbanStatus,
          [kanbanFabricId]: {
            ...state.taskKanbanStatus[kanbanFabricId],
            [kanbanTaskId]: kanbanStatus
          }
        }
      };
    
    case 'ADD_COMMENT':
      return {
        ...state,
        taskComments: {
          ...state.taskComments,
          [action.payload.taskId]: [
            ...(state.taskComments[action.payload.taskId] || []),
            action.payload
          ]
        }
      };
    
    case 'UPDATE_COMMENT':
      return {
        ...state,
        taskComments: {
          ...state.taskComments,
          [action.payload.taskId]: (state.taskComments[action.payload.taskId] || []).map(comment =>
            comment.id === action.payload.id ? action.payload : comment
          )
        }
      };
    
    case 'DELETE_COMMENT':
      return {
        ...state,
        taskComments: {
          ...state.taskComments,
          [action.payload.taskId]: (state.taskComments[action.payload.taskId] || []).filter(
            comment => comment.id !== action.payload.commentId
          )
        }
      };
    
    default:
      return state;
  }
}

const DatabaseAppContext = createContext<DatabaseAppContextType | undefined>(undefined);

export function DatabaseAppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isReady, setIsReady] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (window.electronAPI && 'initDatabase' in window.electronAPI) {
        const result = await window.electronAPI.initDatabase();
        
        if (result.success) {
          await migrateFromLocalStorage();
          setIsReady(true);
          
          addNotification({
            type: 'success',
            title: 'Database Ready',
            message: 'SQLite database initialized successfully'
          });
        } else {
          throw new Error(result.error || 'Database initialization failed');
        }
      } else {
        await loadFromLocalStorage();
        setIsReady(true);
      }
    } catch (error) {
      const appError = ErrorHandler.createError(
        ErrorType.DATABASE_ERROR,
        'Failed to initialize database',
        { error: error instanceof Error ? error.message : String(error) }
      );
      
      ErrorHandler.logError(appError);
      
      addNotification({
        type: 'error',
        title: 'Database Error',
        message: 'Failed to initialize database. Falling back to localStorage.',
        persistent: true
      });
      
      await loadFromLocalStorage();
      setIsReady(true);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const migrateFromLocalStorage = async () => {
    try {
      const savedData = localStorage.getItem('aci-deployment-tracker-data');
      if (savedData && window.electronAPI && 'migrateFromLocalStorage' in window.electronAPI) {
        const parsedData = JSON.parse(savedData);
        const result = await window.electronAPI.migrateFromLocalStorage(parsedData);
        
        if (result.success) {
          dispatch({ type: 'LOAD_DATA', payload: parsedData });
          
          addNotification({
            type: 'success',
            title: 'Migration Complete',
            message: 'Data successfully migrated from localStorage to SQLite database'
          });
          
          localStorage.removeItem('aci-deployment-tracker-data');
        }
      }
    } catch (error) {
      ErrorHandler.handleMigrationError(error, 'migrateFromLocalStorage');
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      const savedData = localStorage.getItem('aci-deployment-tracker-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      }
    } catch (error) {
      ErrorHandler.handleFileSystemError(error, 'loadFromLocalStorage');
    }
  };

  const saveToLocalStorage = (dataToSave: any) => {
    try {
      localStorage.setItem('aci-deployment-tracker-data', JSON.stringify(dataToSave));
    } catch (error) {
      ErrorHandler.handleFileSystemError(error, 'saveToLocalStorage');
    }
  };

  useEffect(() => {
    if (!isReady) return;
    
    const dataToSave = {
      fabricStates: state.fabricStates,
      fabricNotes: state.fabricNotes,
      testCaseStates: state.testCaseStates,
      subChecklists: state.subChecklists,
      currentFabric: state.currentFabric
    };
    
    if (window.electronAPI && 'initDatabase' in window.electronAPI) {
    } else {
      saveToLocalStorage(dataToSave);
    }
  }, [state.fabricStates, state.fabricNotes, state.testCaseStates, state.subChecklists, state.currentFabric, isReady]);

  const getCurrentFabricTasks = (): Task[] => {
    const currentFabric = state.fabrics.find(f => f.id === state.currentFabric);
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
              notes: state.fabricNotes[state.currentFabric]?.[task.id] || ''
            });
          }
        });
      });
    });

    return allTasks;
  };

  const getFabricProgress = (fabricId: string): FabricProgress => {
    const fabric = state.fabrics.find(f => f.id === fabricId);
    if (!fabric) {
      return {
        fabricId,
        totalTasks: 0,
        completedTasks: 0,
        totalTestCases: 0,
        completedTestCases: 0,
        highPriorityPending: 0,
        criticalIssues: 0
      };
    }

    let totalTasks = 0;
    let completedTasks = 0;
    let totalTestCases = 0;
    let completedTestCases = 0;
    let highPriorityPending = 0;

    state.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        subsection.tasks.forEach(task => {
          if (task.fabricSpecific || 
              (task.ndoCentralized && fabric.site === 'Tertiary') ||
              (!task.fabricSpecific && !task.ndoCentralized)) {
            totalTasks++;
            if (state.fabricStates[fabricId]?.[task.id]) {
              completedTasks++;
            }
            
            if (task.testCase) {
              totalTestCases++;
              const testCaseState = state.testCaseStates[fabricId]?.[task.testCase.tcId];
              if (testCaseState?.status === 'Pass') {
                completedTestCases++;
              }
              if (task.testCase.priority === 'High' && testCaseState?.status === 'T.B.E.') {
                highPriorityPending++;
              }
            }
          }
        });
      });
    });

    return {
      fabricId,
      totalTasks,
      completedTasks,
      totalTestCases,
      completedTestCases,
      highPriorityPending,
      criticalIssues: 0
    };
  };

  const updateTaskState = async (taskId: string, checked: boolean, fabricId?: string): Promise<void> => {
    const targetFabricId = fabricId || state.currentFabric;
    
    try {
      dispatch({
        type: 'UPDATE_TASK_STATE',
        payload: { taskId, checked, fabricId: targetFabricId }
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'updateTaskState');
      
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update task state. Please try again.'
      });
      
      throw error;
    }
  };

  const updateTaskNotes = async (taskId: string, notes: string, fabricId?: string): Promise<void> => {
    const targetFabricId = fabricId || state.currentFabric;
    
    try {
      dispatch({
        type: 'UPDATE_TASK_NOTES',
        payload: { taskId, notes, fabricId: targetFabricId }
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'updateTaskNotes');
      
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update task notes. Please try again.'
      });
      
      throw error;
    }
  };

  const setCurrentFabric = (fabricId: string) => {
    dispatch({ type: 'SET_CURRENT_FABRIC', payload: fabricId });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const saveSubChecklist = async (name: string, items: any[]): Promise<void> => {
    try {
      const checklist: SubChecklist = {
        name,
        items,
        fabricId: state.currentFabric,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      dispatch({ type: 'SAVE_SUB_CHECKLIST', payload: { name, checklist } });
      
      addNotification({
        type: 'success',
        title: 'Checklist Saved',
        message: `Sub-checklist "${name}" saved successfully`
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'saveSubChecklist');
      
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save sub-checklist. Please try again.'
      });
      
      throw error;
    }
  };

  const loadSubChecklist = () => {
  };

  const deleteSubChecklist = async (name: string): Promise<void> => {
    try {
      dispatch({ type: 'DELETE_SUB_CHECKLIST', payload: name });
      
      addNotification({
        type: 'success',
        title: 'Checklist Deleted',
        message: `Sub-checklist "${name}" deleted successfully`
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'deleteSubChecklist');
      
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete sub-checklist. Please try again.'
      });
      
      throw error;
    }
  };

  const createBackup = async (): Promise<string | null> => {
    try {
      if (window.electronAPI && 'createBackup' in window.electronAPI) {
        const result = await window.electronAPI.createBackup();
        
        if (result.success) {
          addNotification({
            type: 'success',
            title: 'Backup Created',
            message: `Database backup created successfully at ${result.backupPath}`
          });
          
          return result.backupPath || null;
        } else {
          throw new Error(result.error || 'Backup creation failed');
        }
      }
      
      return null;
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'createBackup');
      
      addNotification({
        type: 'error',
        title: 'Backup Failed',
        message: 'Failed to create database backup. Please try again.'
      });
      
      return null;
    }
  };

  const getCompletedTasks = (): Task[] => {
    const allCompletedTasks: Task[] = [];
    
    state.fabrics.forEach(fabric => {
      state.sections.forEach(section => {
        section.subsections.forEach(subsection => {
          subsection.tasks.forEach(task => {
            if (state.fabricStates[fabric.id]?.[task.id]) {
              allCompletedTasks.push({
                ...task,
                checked: true,
                notes: state.fabricNotes[fabric.id]?.[task.id] || '',
                fabricId: fabric.id
              });
            }
          });
        });
      });
    });
    
    return allCompletedTasks;
  };

  const updateTaskCategory = async (taskId: string, category: TaskCategory, fabricId?: string): Promise<void> => {
    const targetFabricId = fabricId || state.currentFabric;
    
    try {
      dispatch({
        type: 'UPDATE_TASK_CATEGORY',
        payload: { taskId, category, fabricId: targetFabricId }
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'updateTaskCategory');
      
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update task category. Please try again.'
      });
      
      throw error;
    }
  };

  const updateTaskStateAcrossSelectedFabrics = async (taskId: string, checked: boolean, fabricIds: string[]): Promise<void> => {
    try {
      await Promise.all(
        fabricIds.map(fabricId => updateTaskState(taskId, checked, fabricId))
      );
      
      addNotification({
        type: 'success',
        title: 'Bulk Update Complete',
        message: `Task updated across ${fabricIds.length} fabric(s)`
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'updateTaskStateAcrossSelectedFabrics');
      
      addNotification({
        type: 'error',
        title: 'Bulk Update Failed',
        message: 'Failed to update task across selected fabrics. Please try again.'
      });
      
      throw error;
    }
  };

  const updateTaskCategoryAcrossSelectedFabrics = async (taskId: string, category: TaskCategory, fabricIds: string[]): Promise<void> => {
    try {
      await Promise.all(
        fabricIds.map(fabricId => updateTaskCategory(taskId, category, fabricId))
      );
      
      addNotification({
        type: 'success',
        title: 'Bulk Category Update Complete',
        message: `Task category updated across ${fabricIds.length} fabric(s)`
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'updateTaskCategoryAcrossSelectedFabrics');
      
      addNotification({
        type: 'error',
        title: 'Bulk Category Update Failed',
        message: 'Failed to update task category across selected fabrics. Please try again.'
      });
      
      throw error;
    }
  };

  const updateTaskCategoryAcrossAllFabrics = async (taskId: string, category: TaskCategory): Promise<void> => {
    const task = findTaskById(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    const applicableFabrics = state.fabrics.filter(fabric => 
      task.fabricSpecific || 
      (task.ndoCentralized && fabric.site === 'Tertiary') ||
      (!task.fabricSpecific && !task.ndoCentralized)
    );

    try {
      await Promise.all(
        applicableFabrics.map(fabric => updateTaskCategory(taskId, category, fabric.id))
      );
      
      addNotification({
        type: 'success',
        title: 'Global Category Update Complete',
        message: `Task category updated across all applicable fabrics`
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'updateTaskCategoryAcrossAllFabrics');
      
      addNotification({
        type: 'error',
        title: 'Global Category Update Failed',
        message: 'Failed to update task category across all fabrics. Please try again.'
      });
      
      throw error;
    }
  };

  const updateTaskKanbanStatus = async (taskId: string, kanbanStatus: string, fabricId?: string): Promise<void> => {
    const targetFabricId = fabricId || state.currentFabric;
    
    try {
      dispatch({
        type: 'UPDATE_TASK_KANBAN_STATUS',
        payload: { taskId, kanbanStatus, fabricId: targetFabricId }
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'updateTaskKanbanStatus');
      
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update task kanban status. Please try again.'
      });
      
      throw error;
    }
  };

  const getTaskComments = (taskId: string): TaskComment[] => {
    return state.taskComments[taskId] || [];
  };

  const addComment = async (comment: TaskComment): Promise<void> => {
    try {
      dispatch({ type: 'ADD_COMMENT', payload: comment });
      
      addNotification({
        type: 'success',
        title: 'Comment Added',
        message: 'Comment added successfully'
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'addComment');
      
      addNotification({
        type: 'error',
        title: 'Comment Failed',
        message: 'Failed to add comment. Please try again.'
      });
      
      throw error;
    }
  };

  const updateComment = async (comment: TaskComment): Promise<void> => {
    try {
      dispatch({ type: 'UPDATE_COMMENT', payload: comment });
      
      addNotification({
        type: 'success',
        title: 'Comment Updated',
        message: 'Comment updated successfully'
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'updateComment');
      
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update comment. Please try again.'
      });
      
      throw error;
    }
  };

  const deleteComment = async (commentId: string, taskId: string): Promise<void> => {
    try {
      dispatch({ type: 'DELETE_COMMENT', payload: { commentId, taskId } });
      
      addNotification({
        type: 'success',
        title: 'Comment Deleted',
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'deleteComment');
      
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete comment. Please try again.'
      });
      
      throw error;
    }
  };

  const findTaskById = (taskId: string): Task | undefined => {
    for (const section of state.sections) {
      for (const subsection of section.subsections) {
        const task = subsection.tasks.find(t => t.id === taskId);
        if (task) return task;
      }
    }
    return undefined;
  };

  const cloneTasksAcrossFabrics = async (taskIds: string[], sourceFabricId: string, targetFabricIds: string[]): Promise<void> => {
    try {
      for (const taskId of taskIds) {
        const sourceState = state.fabricStates[sourceFabricId]?.[taskId];
        const sourceNotes = state.fabricNotes[sourceFabricId]?.[taskId];
        const sourceCategory = state.taskCategories[sourceFabricId]?.[taskId];
        
        for (const targetFabricId of targetFabricIds) {
          if (sourceState !== undefined) {
            await updateTaskState(taskId, sourceState, targetFabricId);
          }
          if (sourceNotes) {
            await updateTaskNotes(taskId, sourceNotes, targetFabricId);
          }
          if (sourceCategory) {
            await updateTaskCategory(taskId, sourceCategory, targetFabricId);
          }
        }
      }
      
      addNotification({
        type: 'success',
        title: 'Tasks Cloned',
        message: `Successfully cloned ${taskIds.length} task(s) to ${targetFabricIds.length} fabric(s)`
      });
    } catch (error) {
      ErrorHandler.handleDatabaseError(error, 'cloneTasksAcrossFabrics');
      
      addNotification({
        type: 'error',
        title: 'Clone Failed',
        message: 'Failed to clone tasks across fabrics. Please try again.'
      });
      
      throw error;
    }
  };

  const addTask = async (_sectionId: string, _subsectionTitle: string, _taskData: any): Promise<void> => {
    console.log('addTask not yet implemented in DatabaseAppContext');
    addNotification({
      type: 'info',
      title: 'Feature Coming Soon',
      message: 'Task creation will be available in a future update'
    });
  };

  const addSubsection = async (_sectionId: string, _subsectionTitle: string): Promise<void> => {
    console.log('addSubsection not yet implemented in DatabaseAppContext');
    addNotification({
      type: 'info',
      title: 'Feature Coming Soon',
      message: 'Subsection creation will be available in a future update'
    });
  };

  const markNotificationRead = (_notificationId: string): void => {
    console.log('markNotificationRead not yet implemented in DatabaseAppContext');
  };

  const clearNotifications = (): void => {
    console.log('clearNotifications not yet implemented in DatabaseAppContext');
  };

  const getUnreadNotifications = (): any[] => {
    return [];
  };

  const contextValue: DatabaseAppContextType = {
    state,
    dispatch,
    getCurrentFabricTasks,
    getCompletedTasks,
    getFabricProgress,
    updateTaskState,
    updateTaskStateAcrossSelectedFabrics,
    updateTaskNotes,
    updateTaskCategory,
    updateTaskCategoryAcrossSelectedFabrics,
    updateTaskCategoryAcrossAllFabrics,
    updateTaskKanbanStatus,
    getTaskComments,
    addComment,
    updateComment,
    deleteComment,
    findTaskById,
    cloneTasksAcrossFabrics,
    addTask,
    addSubsection,
    markNotificationRead,
    clearNotifications,
    getUnreadNotifications,
    setCurrentFabric,
    setSearchQuery,
    saveSubChecklist,
    loadSubChecklist,
    deleteSubChecklist,
    createBackup,
    isReady
  };

  return (
    <DatabaseAppContext.Provider value={contextValue}>
      {children}
    </DatabaseAppContext.Provider>
  );
}

export function useDatabaseApp() {
  const context = useContext(DatabaseAppContext);
  if (context === undefined) {
    throw new Error('useDatabaseApp must be used within a DatabaseAppProvider');
  }
  return context;
}
