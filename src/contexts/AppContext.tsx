import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AppState, Task, SubChecklist, FabricProgress, TaskCategory } from '../types';
import { fabricsData } from '../data/fabricsData';
import { sectionsData } from '../data/sectionsData';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { logger } from '../utils/logger';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getCurrentFabricTasks: () => Task[];
  getFabricProgress: (fabricId: string) => FabricProgress;
  updateTaskState: (taskId: string, checked: boolean, fabricId?: string) => void;
  updateTaskNotes: (taskId: string, notes: string, fabricId?: string) => void;
  updateTaskCategory: (taskId: string, category: TaskCategory, fabricId?: string) => void;
  setCurrentFabric: (fabricId: string) => void;
  setSearchQuery: (query: string) => void;
  saveSubChecklist: (name: string, items: any[]) => void;
  loadSubChecklist: (name: string) => void;
  deleteSubChecklist: (name: string) => void;
}

type AppAction = 
  | { type: 'SET_CURRENT_FABRIC'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'UPDATE_TASK_STATE'; payload: { taskId: string; checked: boolean; fabricId: string } }
  | { type: 'UPDATE_TASK_NOTES'; payload: { taskId: string; notes: string; fabricId: string } }
  | { type: 'UPDATE_TASK_CATEGORY'; payload: { taskId: string; category: TaskCategory; fabricId: string } }
  | { type: 'SAVE_SUB_CHECKLIST'; payload: { name: string; checklist: SubChecklist } }
  | { type: 'DELETE_SUB_CHECKLIST'; payload: string }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'TOGGLE_SECTION'; payload: string };

const initialState: AppState = {
  fabrics: fabricsData,
  sections: sectionsData,
  currentFabric: 'north-it',
  searchQuery: '',
  subChecklists: {},
  fabricStates: {},
  fabricNotes: {},
  testCaseStates: {},
  taskCategories: {}
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
      logger.debug('Loading data from API/localStorage', action.payload);
      
      const validatedPayload = {
        ...action.payload,
        fabricStates: action.payload.fabricStates || {},
        fabricNotes: action.payload.fabricNotes || {},
        testCaseStates: action.payload.testCaseStates || {},
        subChecklists: action.payload.subChecklists || {},
        taskCategories: action.payload.taskCategories || {}
      };
      
      const newState = { ...state, ...validatedPayload };
      logger.debug('Data loaded successfully', { fabricCount: Object.keys(newState.fabricStates).length });
      return newState;
    
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  useWebSocket({
    onTaskStateUpdate: (fabricId: string, taskId: string, checked: boolean) => {
      dispatch({
        type: 'UPDATE_TASK_STATE',
        payload: { taskId, checked, fabricId }
      });
    },
    onTaskNotesUpdate: (fabricId: string, taskId: string, notes: string) => {
      dispatch({
        type: 'UPDATE_TASK_NOTES',
        payload: { taskId, notes, fabricId }
      });
    },
    onTaskCategoryUpdate: (fabricId: string, taskId: string, category: string) => {
      dispatch({
        type: 'UPDATE_TASK_CATEGORY',
        payload: { taskId, category: category as TaskCategory, fabricId }
      });
    },
  });

  const isLocalStorageAvailable = () => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      logger.error('localStorage is not available', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiService.getAllData();
        logger.info('Data loaded from API successfully');
        dispatch({ type: 'LOAD_DATA', payload: {
          fabricStates: data.fabricStates,
          fabricNotes: data.fabricNotes,
          testCaseStates: data.testCaseStates,
          subChecklists: data.subChecklists,
          taskCategories: data.taskCategories as any,
          currentFabric: data.currentFabric || undefined
        } });
      } catch (error) {
        logger.warn('API unavailable, falling back to localStorage', error);
        
        const savedData = localStorage.getItem('aci-deployment-tracker-data');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            logger.info('Data loaded from localStorage successfully');
            dispatch({ type: 'LOAD_DATA', payload: parsedData });
          } catch (parseError) {
            logger.error('Error parsing localStorage data', parseError);
          }
        }
      }
      
      setHasLoadedFromStorage(true);
      logger.debug('Initial data load completed');
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (!hasLoadedFromStorage) {
      return;
    }
    
    if (!isLocalStorageAvailable()) {
      logger.warn('localStorage is not available, skipping save operation');
      return;
    }

    const dataToSave = {
      fabricStates: state.fabricStates,
      fabricNotes: state.fabricNotes,
      testCaseStates: state.testCaseStates,
      subChecklists: state.subChecklists,
      taskCategories: state.taskCategories,
      currentFabric: state.currentFabric,
      lastSaved: new Date().toISOString()
    };
    
    try {
      const dataString = JSON.stringify(dataToSave);
      localStorage.setItem('aci-deployment-tracker-data', dataString);
      logger.debug('Data saved to localStorage successfully');
      
      const verification = localStorage.getItem('aci-deployment-tracker-data');
      if (!verification) {
        logger.error('localStorage save verification failed');
      }
    } catch (error) {
      logger.error('Error saving to localStorage', error);
    }
  }, [hasLoadedFromStorage, state.fabricStates, state.fabricNotes, state.testCaseStates, state.subChecklists, state.taskCategories, state.currentFabric]);

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
              notes: state.fabricNotes[state.currentFabric]?.[task.id] || '',
              category: state.taskCategories[state.currentFabric]?.[task.id] || 'none'
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

  const updateTaskState = async (taskId: string, checked: boolean, fabricId?: string) => {
    const targetFabricId = fabricId || state.currentFabric;
    
    try {
      await apiService.updateTaskState(targetFabricId, taskId, checked);
      
      dispatch({
        type: 'UPDATE_TASK_STATE',
        payload: { taskId, checked, fabricId: targetFabricId }
      });
    } catch (error) {
      logger.error('Error updating task state via API, updating locally', error);
      dispatch({
        type: 'UPDATE_TASK_STATE',
        payload: { taskId, checked, fabricId: targetFabricId }
      });
    }
  };

  const updateTaskNotes = async (taskId: string, notes: string, fabricId?: string) => {
    const targetFabricId = fabricId || state.currentFabric;
    
    try {
      await apiService.updateTaskNotes(targetFabricId, taskId, notes);
      
      dispatch({
        type: 'UPDATE_TASK_NOTES',
        payload: { taskId, notes, fabricId: targetFabricId }
      });
    } catch (error) {
      logger.error('Error updating task notes via API, updating locally', error);
      dispatch({
        type: 'UPDATE_TASK_NOTES',
        payload: { taskId, notes, fabricId: targetFabricId }
      });
    }
  };

  const updateTaskCategory = async (taskId: string, category: TaskCategory, fabricId?: string) => {
    const targetFabricId = fabricId || state.currentFabric;
    
    try {
      await apiService.updateTaskCategory(targetFabricId, taskId, category);
      
      dispatch({
        type: 'UPDATE_TASK_CATEGORY',
        payload: { taskId, category, fabricId: targetFabricId }
      });
    } catch (error) {
      logger.error('Error updating task category via API, updating locally', error);
      dispatch({
        type: 'UPDATE_TASK_CATEGORY',
        payload: { taskId, category, fabricId: targetFabricId }
      });
    }
  };

  const setCurrentFabric = (fabricId: string) => {
    dispatch({ type: 'SET_CURRENT_FABRIC', payload: fabricId });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const saveSubChecklist = (name: string, items: any[]) => {
    const checklist: SubChecklist = {
      name,
      items,
      fabricId: state.currentFabric,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    dispatch({ type: 'SAVE_SUB_CHECKLIST', payload: { name, checklist } });
  };

  const loadSubChecklist = () => {
  };

  const deleteSubChecklist = (name: string) => {
    dispatch({ type: 'DELETE_SUB_CHECKLIST', payload: name });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    getCurrentFabricTasks,
    getFabricProgress,
    updateTaskState,
    updateTaskNotes,
    updateTaskCategory,
    setCurrentFabric,
    setSearchQuery,
    saveSubChecklist,
    loadSubChecklist,
    deleteSubChecklist
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
