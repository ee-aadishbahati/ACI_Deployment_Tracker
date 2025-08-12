import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import { AppState, Task, SubChecklist, FabricProgress, TaskCategory, DependencyStatus, AppContextType, AppAction, Subsection } from '../types';
import { fabricsData } from '../data/fabricsData';
import { sectionsData } from '../data/sectionsData';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';


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
  users: {
    'default-user': {
      id: 'default-user',
      username: 'admin',
      email: 'admin@example.com',
      displayName: 'Administrator',
      role: 'admin',
      fabricAccess: ['north-it', 'north-ot', 'south-it', 'south-ot', 'tertiary-it', 'tertiary-ot'],
      isOnline: true
    }
  },
  currentUser: 'default-user',
  taskComments: {},
  notifications: [],
  taskTemplates: [],
  isLoading: true
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
      const { taskId: updateNoteTaskId, notes, fabricId: updateNoteFabricId } = action.payload;
      return {
        ...state,
        fabricNotes: {
          ...state.fabricNotes,
          [updateNoteFabricId]: {
            ...state.fabricNotes[updateNoteFabricId],
            [updateNoteTaskId]: notes
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
    
    case 'ADD_TASK':
      const { sectionId, subsectionTitle, task } = action.payload;
      return {
        ...state,
        sections: state.sections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                subsections: section.subsections.map(subsection =>
                  subsection.title === subsectionTitle
                    ? { ...subsection, tasks: [...subsection.tasks, task] }
                    : subsection
                )
              }
            : section
        )
      };
    
    case 'ADD_SUBSECTION':
      const { sectionId: newSectionId, subsection } = action.payload;
      return {
        ...state,
        sections: state.sections.map(section =>
          section.id === newSectionId
            ? { ...section, subsections: [...section.subsections, subsection] }
            : section
        )
      };
    
    case 'LOAD_DATA':
      console.log('=== LOAD_DATA REDUCER DEBUG ===');
      console.log('Current state before load:', state);
      console.log('Payload to load:', action.payload);
      
      const validatedPayload = {
        ...action.payload,
        fabricStates: action.payload.fabricStates || {},
        fabricNotes: action.payload.fabricNotes || {},
        fabricCompletionDates: action.payload.fabricCompletionDates || {},
        fabricNoteModificationDates: action.payload.fabricNoteModificationDates || {},
        testCaseStates: action.payload.testCaseStates || {},
        subChecklists: action.payload.subChecklists || {},
        taskCategories: action.payload.taskCategories || {},
        taskKanbanStatus: action.payload.taskKanbanStatus || {},
        users: action.payload.users || state.users,
        currentUser: action.payload.currentUser || state.currentUser,
        taskComments: action.payload.taskComments || {},
        notifications: action.payload.notifications || [],
        taskTemplates: action.payload.taskTemplates || []
      };
      
      const loadedState = { 
        ...state, 
        ...validatedPayload,
        sections: action.payload.sections || state.sections
      };
      console.log('New state after load:', loadedState);
      console.log('fabricStates in new state:', loadedState.fabricStates);
      console.log('fabricStates keys:', Object.keys(loadedState.fabricStates || {}));
      console.log('Sample fabricState for north-it:', loadedState.fabricStates?.['north-it']);
      return loadedState;
    
    case 'UPDATE_TASK_COMPLETION_DATE':
      const { taskId: completionTaskId, completionDate, fabricId: completionFabricId } = action.payload;
      return {
        ...state,
        fabricCompletionDates: {
          ...state.fabricCompletionDates,
          [completionFabricId]: {
            ...state.fabricCompletionDates[completionFabricId],
            ...(completionDate 
              ? { [completionTaskId]: completionDate }
              : Object.fromEntries(
                  Object.entries(state.fabricCompletionDates[completionFabricId] || {})
                    .filter(([id]) => id !== completionTaskId)
                )
            )
          }
        }
      };
    
    case 'UPDATE_NOTE_MODIFICATION_DATE':
      const { taskId: modNoteTaskId, modificationDate, fabricId: modNoteFabricId } = action.payload;
      return {
        ...state,
        fabricNoteModificationDates: {
          ...state.fabricNoteModificationDates,
          [modNoteFabricId]: {
            ...state.fabricNoteModificationDates[modNoteFabricId],
            [modNoteTaskId]: modificationDate
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
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    case 'ADD_USER':
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.id]: action.payload
        }
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.id]: action.payload
        }
      };
    
    case 'ADD_COMMENT':
      const comment = {
        ...action.payload,
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      return {
        ...state,
        taskComments: {
          ...state.taskComments,
          [action.payload.taskId]: [
            ...(state.taskComments[action.payload.taskId] || []),
            comment
          ]
        }
      };
    
    case 'UPDATE_COMMENT':
      return {
        ...state,
        taskComments: {
          ...state.taskComments,
          [action.payload.taskId]: (state.taskComments[action.payload.taskId] || []).map(c =>
            c.id === action.payload.id ? { ...action.payload, edited: new Date() } : c
          )
        }
      };
    
    case 'DELETE_COMMENT':
      return {
        ...state,
        taskComments: {
          ...state.taskComments,
          [action.payload.taskId]: (state.taskComments[action.payload.taskId] || []).filter(c =>
            c.id !== action.payload.commentId
          )
        }
      };
    
    case 'ADD_NOTIFICATION':
      const notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      return {
        ...state,
        notifications: [notification, ...state.notifications]
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      };
    
    case 'ADD_TASK_TEMPLATE':
      const template = {
        ...action.payload,
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      };
      return {
        ...state,
        taskTemplates: [...state.taskTemplates, template]
      };
    
    case 'DELETE_TASK_TEMPLATE':
      return {
        ...state,
        taskTemplates: state.taskTemplates.filter(t => t.id !== action.payload)
      };
    
    case 'CLONE_TASKS_ACROSS_FABRICS':
      const { taskIds, sourceFabricId, targetFabricIds } = action.payload;
      let clonedState = { ...state };
      
      targetFabricIds.forEach(targetFabricId => {
        taskIds.forEach(taskId => {
          const sourceTaskState = state.fabricStates[sourceFabricId]?.[taskId];
          const sourceTaskNotes = state.fabricNotes[sourceFabricId]?.[taskId];
          const sourceTaskCategory = state.taskCategories[sourceFabricId]?.[taskId];
          const sourceTaskKanbanStatus = state.taskKanbanStatus[sourceFabricId]?.[taskId];
          
          if (sourceTaskState !== undefined) {
            clonedState = {
              ...clonedState,
              fabricStates: {
                ...clonedState.fabricStates,
                [targetFabricId]: {
                  ...clonedState.fabricStates[targetFabricId],
                  [taskId]: sourceTaskState
                }
              }
            };
          }
          
          if (sourceTaskNotes) {
            clonedState = {
              ...clonedState,
              fabricNotes: {
                ...clonedState.fabricNotes,
                [targetFabricId]: {
                  ...clonedState.fabricNotes[targetFabricId],
                  [taskId]: sourceTaskNotes
                }
              }
            };
          }
          
          if (sourceTaskCategory) {
            clonedState = {
              ...clonedState,
              taskCategories: {
                ...clonedState.taskCategories,
                [targetFabricId]: {
                  ...clonedState.taskCategories[targetFabricId],
                  [taskId]: sourceTaskCategory
                }
              }
            };
          }
          
          if (sourceTaskKanbanStatus) {
            clonedState = {
              ...clonedState,
              taskKanbanStatus: {
                ...clonedState.taskKanbanStatus,
                [targetFabricId]: {
                  ...clonedState.taskKanbanStatus[targetFabricId],
                  [taskId]: sourceTaskKanbanStatus
                }
              }
            };
          }
        });
      });
      
      return clonedState;
    
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
    onTaskKanbanUpdate: (fabricId: string, taskId: string, kanbanStatus: string) => {
      dispatch({
        type: 'UPDATE_TASK_KANBAN_STATUS',
        payload: { taskId, kanbanStatus, fabricId }
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
      console.error('localStorage is not available:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('=== HYBRID API DATA LOADING DEBUG ===');
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const data = await apiService.getAllData();
        console.log('1. Data loaded from API:', data);
        console.log('2. fabricStates from API:', data.fabricStates);
        
        const hasInitializedData = Object.keys(data.fabricStates).length > 0;
        console.log('3. Backend has initialized data:', hasInitializedData);
        
        let finalData;
        
        if (!hasInitializedData) {
          console.log('4. Backend not initialized, checking localStorage for existing data');
          
          const savedData = localStorage.getItem('aci-deployment-tracker-data');
          let existingData = null;
          if (savedData) {
            try {
              existingData = JSON.parse(savedData);
              console.log('4a. Found existing localStorage data to preserve:', existingData);
            } catch (parseError) {
              console.error('Error parsing existing localStorage data:', parseError);
            }
          }
          
          const initializationData = {
            fabrics: state.fabrics,
            sections: state.sections,
            existingData: existingData
          };
          
          finalData = await apiService.initializeBackend(initializationData);
          console.log('5. Backend initialized with data:', finalData);
          console.log('6. fabricStates after initialization:', finalData.fabricStates);
        } else {
          console.log('4. Using existing backend data');
          finalData = data;
        }
        
        const newState = {
          fabricStates: finalData.fabricStates,
          fabricNotes: finalData.fabricNotes,
          fabricCompletionDates: finalData.fabricCompletionDates,
          fabricNoteModificationDates: finalData.fabricNoteModificationDates,
          testCaseStates: finalData.testCaseStates,
          subChecklists: finalData.subChecklists,
          taskCategories: finalData.taskCategories as any,
          currentFabric: finalData.currentFabric || undefined
        };
        
        console.log('7. Dispatching LOAD_DATA with payload:', newState);
        dispatch({ type: 'LOAD_DATA', payload: newState });
        
        setTimeout(() => {
          dispatch({ type: 'SET_LOADING', payload: false });
          console.log('8. Loading state set to false');
        }, 100); // Small delay to ensure state update is processed
      } catch (error) {
        console.error('Error loading/initializing data from API:', error);
        console.log('9. Falling back to localStorage');
        
        const savedData = localStorage.getItem('aci-deployment-tracker-data');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            console.log('10. Parsed localStorage data:', parsedData);
            dispatch({ type: 'LOAD_DATA', payload: parsedData });
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
          }
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      
      setHasLoadedFromStorage(true);
      console.log('11. Initial load completed, enabling saves');
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (!hasLoadedFromStorage) {
      console.log('=== SKIPPING SAVE - NOT YET LOADED FROM STORAGE ===');
      return;
    }
    
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available, skipping save operation');
      return;
    }

    const dataToSave = {
      fabricStates: state.fabricStates,
      fabricNotes: state.fabricNotes,
      fabricCompletionDates: state.fabricCompletionDates,
      fabricNoteModificationDates: state.fabricNoteModificationDates,
      testCaseStates: state.testCaseStates,
      subChecklists: state.subChecklists,
      taskCategories: state.taskCategories,
      taskKanbanStatus: state.taskKanbanStatus,
      currentFabric: state.currentFabric,
      users: state.users,
      currentUser: state.currentUser,
      taskComments: state.taskComments,
      notifications: state.notifications,
      taskTemplates: state.taskTemplates,
      lastSaved: new Date().toISOString()
    };
    
    console.log('=== SAVING TO LOCALSTORAGE DEBUG ===');
    console.log('Data being saved:', dataToSave);
    console.log('fabricStates being saved:', state.fabricStates);
    
    try {
      const dataString = JSON.stringify(dataToSave);
      localStorage.setItem('aci-deployment-tracker-data', dataString);
      console.log('Data saved to localStorage successfully');
      
      const verification = localStorage.getItem('aci-deployment-tracker-data');
      if (!verification) {
        console.error('localStorage save verification failed - data not found after save');
      } else {
        console.log('localStorage save verified successfully');
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [hasLoadedFromStorage, state.fabricStates, state.fabricNotes, state.fabricCompletionDates, state.fabricNoteModificationDates, state.testCaseStates, state.subChecklists, state.taskCategories, state.taskKanbanStatus, state.currentFabric]);

  const lastSavedStateRef = useRef<string>('');
  
  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    
    const autoSaveInterval = setInterval(async () => {
      const currentStateData = {
        fabricStates: state.fabricStates,
        fabricNotes: state.fabricNotes,
        fabricCompletionDates: state.fabricCompletionDates,
        fabricNoteModificationDates: state.fabricNoteModificationDates,
        testCaseStates: state.testCaseStates,
        subChecklists: state.subChecklists,
        taskCategories: state.taskCategories,
        taskKanbanStatus: state.taskKanbanStatus,
        currentFabric: state.currentFabric
      };
      
      const currentStateString = JSON.stringify(currentStateData);
      
      if (currentStateString !== lastSavedStateRef.current) {
        try {
          const dataToSave = {
            ...currentStateData,
            users: state.users,
            currentUser: state.currentUser,
            taskComments: state.taskComments,
            notifications: state.notifications,
            taskTemplates: state.taskTemplates,
            lastSaved: new Date().toISOString()
          };
          
          console.log('Auto-saving changes to backend (15s interval)');
          await apiService.updateAllData(dataToSave);
          lastSavedStateRef.current = currentStateString;
          console.log('Auto-save to backend completed successfully');
        } catch (error) {
          console.error('Auto-save to backend failed:', error);
        }
      }
    }, 15000); // 15 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [hasLoadedFromStorage, state.fabricStates, state.fabricNotes, state.fabricCompletionDates, state.fabricNoteModificationDates, state.testCaseStates, state.subChecklists, state.taskCategories, state.taskKanbanStatus, state.currentFabric]);

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
            const isCompleted = state.fabricStates[state.currentFabric]?.[task.id] || false;
            if (!isCompleted) {
              allTasks.push({
                ...task,
                checked: false,
                notes: state.fabricNotes[state.currentFabric]?.[task.id] || '',
                category: state.taskCategories[state.currentFabric]?.[task.id] || 'none'
              });
            }
          }
        });
      });
    });

    return allTasks;
  };

  const getCompletedTasks = (): Task[] => {
    const allCompletedTasks: Task[] = [];
    
    state.fabrics.forEach(fabric => {
      state.sections.forEach(section => {
        section.subsections.forEach(subsection => {
          subsection.tasks.forEach(task => {
            if (task.fabricSpecific || 
                (task.ndoCentralized && fabric.site === 'Tertiary') ||
                (!task.fabricSpecific && !task.ndoCentralized)) {
              const isCompleted = state.fabricStates[fabric.id]?.[task.id] || false;
              if (isCompleted) {
                allCompletedTasks.push({
                  ...task,
                  checked: true,
                  notes: state.fabricNotes[fabric.id]?.[task.id] || '',
                  category: state.taskCategories[fabric.id]?.[task.id] || 'none',
                  fabricId: fabric.id,
                  fabricName: fabric.name,
                  completionDate: state.fabricCompletionDates[fabric.id]?.[task.id] || '',
                  sectionTitle: section.title,
                  subsectionTitle: subsection.title
                });
              }
            }
          });
        });
      });
    });

    return allCompletedTasks.sort((a, b) => {
      const dateA = new Date(a.completionDate || '');
      const dateB = new Date(b.completionDate || '');
      return dateB.getTime() - dateA.getTime();
    });
  };

  const getFabricProgress = (fabricId: string): FabricProgress => {
    console.log('=== GET FABRIC PROGRESS DEBUG ===');
    console.log('1. fabricId:', fabricId);
    console.log('2. state.fabricStates:', state.fabricStates);
    console.log('3. state.isLoading:', state.isLoading);
    
    if (state.isLoading || !state.fabricStates || Object.keys(state.fabricStates).length === 0) {
      console.log('4. Data is still loading or fabricStates is empty, returning default values');
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
    
    console.log('4. state.fabricStates[fabricId]:', state.fabricStates[fabricId]);
    console.log('5. state.sections length:', state.sections.length);
    
    const fabric = state.fabrics.find(f => f.id === fabricId);
    if (!fabric) {
      console.log('6. Fabric not found for fabricId:', fabricId);
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
            const isCompleted = state.fabricStates[fabricId]?.[task.id];
            if (isCompleted) {
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

    console.log('6. Final counts for', fabricId, ':', {
      totalTasks,
      completedTasks,
      totalTestCases,
      completedTestCases,
      highPriorityPending
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
    
    if (checked) {
      const task = findTaskById(taskId);
      if (task?.testCase?.dependencies) {
        const unmetDependencies = task.testCase.dependencies.filter(depId => {
          const depTestCase = state.testCaseStates[targetFabricId]?.[depId];
          return depTestCase?.status !== 'Pass';
        });
        
        if (unmetDependencies.length > 0) {
          console.warn(`Cannot complete task ${taskId}: unmet dependencies ${unmetDependencies.join(', ')}`);
          return;
        }
      }
    }
    
    try {
      await apiService.updateTaskState(targetFabricId, taskId, checked);
      
      dispatch({
        type: 'UPDATE_TASK_STATE',
        payload: { taskId, checked, fabricId: targetFabricId }
      });

      dispatch({
        type: 'UPDATE_TASK_COMPLETION_DATE',
        payload: { 
          taskId, 
          completionDate: checked ? new Date().toISOString() : null, 
          fabricId: targetFabricId 
        }
      });
    } catch (error) {
      console.error('Error updating task state:', error);
      dispatch({
        type: 'UPDATE_TASK_STATE',
        payload: { taskId, checked, fabricId: targetFabricId }
      });

      dispatch({
        type: 'UPDATE_TASK_COMPLETION_DATE',
        payload: { 
          taskId, 
          completionDate: checked ? new Date().toISOString() : null, 
          fabricId: targetFabricId 
        }
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

      if (notes.trim()) {
        dispatch({
          type: 'UPDATE_NOTE_MODIFICATION_DATE',
          payload: { taskId, modificationDate: new Date().toISOString(), fabricId: targetFabricId }
        });
      }
    } catch (error) {
      console.error('Error updating task notes:', error);
      dispatch({
        type: 'UPDATE_TASK_NOTES',
        payload: { taskId, notes, fabricId: targetFabricId }
      });

      if (notes.trim()) {
        dispatch({
          type: 'UPDATE_NOTE_MODIFICATION_DATE',
          payload: { taskId, modificationDate: new Date().toISOString(), fabricId: targetFabricId }
        });
      }
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
      console.error('Error updating task category:', error);
      dispatch({
        type: 'UPDATE_TASK_CATEGORY',
        payload: { taskId, category, fabricId: targetFabricId }
      });
    }
  };

  const updateTaskStateAcrossSelectedFabrics = async (taskId: string, checked: boolean, fabricIds: string[]) => {
    const task = findTaskById(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    const selectedFabrics = state.fabrics.filter(fabric => fabricIds.includes(fabric.id));

    try {
      await Promise.all(
        selectedFabrics.map(fabric => 
          apiService.updateTaskState(fabric.id, taskId, checked)
        )
      );
      
      selectedFabrics.forEach(fabric => {
        dispatch({
          type: 'UPDATE_TASK_STATE',
          payload: { taskId, checked, fabricId: fabric.id }
        });
        dispatch({
          type: 'UPDATE_TASK_COMPLETION_DATE',
          payload: { 
            taskId, 
            completionDate: checked ? new Date().toISOString() : null, 
            fabricId: fabric.id 
          }
        });
      });
    } catch (error) {
      console.error('Error updating task state across selected fabrics:', error);
      selectedFabrics.forEach(fabric => {
        dispatch({
          type: 'UPDATE_TASK_STATE',
          payload: { taskId, checked, fabricId: fabric.id }
        });
        dispatch({
          type: 'UPDATE_TASK_COMPLETION_DATE',
          payload: { 
            taskId, 
            completionDate: checked ? new Date().toISOString() : null, 
            fabricId: fabric.id 
          }
        });
      });
    }
  };

  const updateTaskCategoryAcrossSelectedFabrics = async (taskId: string, category: TaskCategory, fabricIds: string[]) => {
    const task = findTaskById(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    const selectedFabrics = state.fabrics.filter(fabric => fabricIds.includes(fabric.id));

    try {
      await Promise.all(
        selectedFabrics.map(fabric => 
          apiService.updateTaskCategory(fabric.id, taskId, category)
        )
      );
      
      selectedFabrics.forEach(fabric => {
        dispatch({
          type: 'UPDATE_TASK_CATEGORY',
          payload: { taskId, category, fabricId: fabric.id }
        });
      });
    } catch (error) {
      console.error('Error updating task category across selected fabrics:', error);
      selectedFabrics.forEach(fabric => {
        dispatch({
          type: 'UPDATE_TASK_CATEGORY',
          payload: { taskId, category, fabricId: fabric.id }
        });
      });
    }
  };

  const updateTaskCategoryAcrossAllFabrics = async (taskId: string, category: TaskCategory) => {
    const task = findTaskById(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    const applicableFabrics = state.fabrics.filter(fabric => {
      if (task.fabricSpecific) {
        return fabric.id === state.currentFabric;
      } else if (task.ndoCentralized) {
        return fabric.site === 'Tertiary';
      } else {
        return true;
      }
    });

    try {
      await Promise.all(
        applicableFabrics.map(fabric => 
          apiService.updateTaskCategory(fabric.id, taskId, category)
        )
      );
      
      applicableFabrics.forEach(fabric => {
        dispatch({
          type: 'UPDATE_TASK_CATEGORY',
          payload: { taskId, category, fabricId: fabric.id }
        });
      });
    } catch (error) {
      console.error('Error updating task category across fabrics:', error);
      applicableFabrics.forEach(fabric => {
        dispatch({
          type: 'UPDATE_TASK_CATEGORY',
          payload: { taskId, category, fabricId: fabric.id }
        });
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

  const findTaskById = (taskId: string): Task | undefined => {
    for (const section of state.sections) {
      for (const subsection of section.subsections) {
        const task = subsection.tasks.find(t => t.id === taskId);
        if (task) return task;
      }
    }
    return undefined;
  };

  const addTask = async (sectionId: string, subsectionTitle: string, taskData: {
    text: string;
    fabricSpecific: boolean;
    ndoCentralized: boolean;
    testCaseId?: string;
  }) => {
    const createDeterministicId = (text: string): string => {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return `task-${Math.abs(hash).toString(36)}`;
    };

    const newTask: Task = {
      id: createDeterministicId(taskData.text),
      text: taskData.text,
      checked: false,
      notes: '',
      fabricSpecific: taskData.fabricSpecific,
      ndoCentralized: taskData.ndoCentralized,
      addedToSubChecklist: false
    };

    dispatch({ type: 'ADD_TASK', payload: { sectionId, subsectionTitle, task: newTask } });
    
    try {
      await apiService.addTask(sectionId, subsectionTitle, newTask);
    } catch (error) {
      console.error('Error saving new task:', error);
    }
  };

  const addSubsection = async (sectionId: string, subsectionTitle: string) => {
    const newSubsection: Subsection = {
      title: subsectionTitle,
      tasks: []
    };

    dispatch({ type: 'ADD_SUBSECTION', payload: { sectionId, subsection: newSubsection } });
    
    try {
      await apiService.addSubsection(sectionId, newSubsection);
    } catch (error) {
      console.error('Error saving new subsection:', error);
    }
  };

  const getDependencyStatus = (fabricId: string, taskId: string): DependencyStatus => {
    const task = findTaskById(taskId);
    const unmetDependencies: string[] = [];
    const dependentTasks: string[] = [];
    
    if (task?.testCase?.dependencies) {
      task.testCase.dependencies.forEach(depId => {
        const depTestCase = state.testCaseStates[fabricId]?.[depId];
        if (depTestCase?.status !== 'Pass') {
          unmetDependencies.push(depId);
        }
      });
    }
    
    state.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        subsection.tasks.forEach(t => {
          if (t.testCase?.dependencies?.includes(task?.testCase?.tcId || '')) {
            dependentTasks.push(t.testCase.tcId);
          }
        });
      });
    });
    
    return {
      canComplete: unmetDependencies.length === 0,
      unmetDependencies,
      dependentTasks
    };
  };

  const updateTaskKanbanStatus = async (taskId: string, kanbanStatus: string, fabricId?: string) => {
    const targetFabricId = fabricId || state.currentFabric;
    
    console.log('Frontend: Updating kanban status for task', taskId, 'to', kanbanStatus, 'in fabric', targetFabricId);
    
    try {
      await apiService.updateTaskKanbanStatus(targetFabricId, taskId, kanbanStatus);
      console.log('Frontend: Successfully updated kanban status via API');
      
      dispatch({
        type: 'UPDATE_TASK_KANBAN_STATUS',
        payload: { taskId, kanbanStatus, fabricId: targetFabricId }
      });
    } catch (error) {
      console.error('Frontend: Error updating task kanban status via API:', error);
      console.log('Frontend: Falling back to local update only');
      
      dispatch({
        type: 'UPDATE_TASK_KANBAN_STATUS',
        payload: { taskId, kanbanStatus, fabricId: targetFabricId }
      });
      
      console.warn('Kanban status updated locally only. Changes may not persist if you refresh the page.');
    }
  };

  const setCurrentUser = (userId: string) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: userId });
  };

  const addUser = (user: any) => {
    dispatch({ type: 'ADD_USER', payload: user });
  };

  const updateUser = (user: any) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const addComment = async (comment: any) => {
    try {
      dispatch({ type: 'ADD_COMMENT', payload: comment });
      
      if (comment.mentions && comment.mentions.length > 0) {
        comment.mentions.forEach((mentionedUserId: string) => {
          if (mentionedUserId !== state.currentUser) {
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                userId: mentionedUserId,
                type: 'mention',
                taskId: comment.taskId,
                fabricId: comment.fabricId,
                message: `${state.users[state.currentUser]?.displayName || 'Someone'} mentioned you in a comment`,
                read: false,
                fromUserId: state.currentUser
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const updateComment = async (comment: any) => {
    try {
      dispatch({ type: 'UPDATE_COMMENT', payload: comment });
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const deleteComment = async (commentId: string, taskId: string) => {
    try {
      dispatch({ type: 'DELETE_COMMENT', payload: { commentId, taskId } });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const getTaskComments = (taskId: string) => {
    return state.taskComments[taskId] || [];
  };

  const addNotification = (notification: any) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const markNotificationRead = (notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS', payload: undefined });
  };

  const getUnreadNotifications = () => {
    return state.notifications.filter(n => !n.read && n.userId === state.currentUser);
  };

  const addTaskTemplate = (template: any) => {
    dispatch({ type: 'ADD_TASK_TEMPLATE', payload: template });
  };

  const deleteTaskTemplate = (templateId: string) => {
    dispatch({ type: 'DELETE_TASK_TEMPLATE', payload: templateId });
  };

  const cloneTasksAcrossFabrics = async (taskIds: string[], sourceFabricId: string, targetFabricIds: string[]) => {
    try {
      dispatch({
        type: 'CLONE_TASKS_ACROSS_FABRICS',
        payload: { taskIds, sourceFabricId, targetFabricIds }
      });
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          userId: state.currentUser,
          type: 'task_update',
          taskId: taskIds[0],
          fabricId: sourceFabricId,
          message: `Successfully cloned ${taskIds.length} task(s) to ${targetFabricIds.length} fabric(s)`,
          read: false
        }
      });
    } catch (error) {
      console.error('Error cloning tasks across fabrics:', error);
    }
  };

  const contextValue: AppContextType = {
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
    addTask,
    addSubsection,
    setCurrentFabric,
    setSearchQuery,
    saveSubChecklist,
    loadSubChecklist,
    deleteSubChecklist,
    getDependencyStatus,
    findTaskById,
    setCurrentUser,
    addUser,
    updateUser,
    addComment,
    updateComment,
    deleteComment,
    getTaskComments,
    addNotification,
    markNotificationRead,
    clearNotifications,
    getUnreadNotifications,
    addTaskTemplate,
    deleteTaskTemplate,
    cloneTasksAcrossFabrics
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
