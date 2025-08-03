export type FabricType = 'IT' | 'OT';
export type SiteType = 'North' | 'South' | 'Tertiary';
export type Priority = 'High' | 'Medium' | 'Low';
export type Risk = 'High' | 'Medium' | 'Low';
export type ExecutionStatus = 'T.B.E.' | 'Pass' | 'Fail' | 'Partial' | 'Defer' | 'R.I.';
export type ResourceRole = 'EE' | 'PS' | 'SP' | 'OK' | 'Vendor';
export type TaskCategory = 'must-have' | 'should-have' | 'none';

export interface Fabric {
  id: string;
  name: string;
  site: SiteType;
  type: FabricType;
  description: string;
}

export interface TestCase {
  tcId: string;
  lead: ResourceRole;
  witness?: ResourceRole;
  priority: Priority;
  risk: Risk;
  effort: number; // hours
  status: ExecutionStatus;
  rtmId?: string;
  dependencies?: string[];
  vendorDependencies?: string[];
  preConditions?: string;
  expectedResults?: string;
  actualResults?: string;
  dryRunStatus?: ExecutionStatus;
  evidenceRequired: boolean;
  screenshots?: string[];
  notes?: string;
}

export interface Task {
  id: string;
  text: string;
  checked: boolean;
  notes: string;
  testCase?: TestCase;
  fabricSpecific: boolean;
  ndoCentralized: boolean;
  siteSpecific?: SiteType[];
  fabricTypeSpecific?: FabricType[];
  dependencies?: string[];
  addedToSubChecklist?: boolean;
  category?: TaskCategory;
}

export interface Subsection {
  title: string;
  tasks: Task[];
}

export interface Section {
  id: string;
  title: string;
  subsections: Subsection[];
  expanded?: boolean;
}

export interface SubChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  notes: string;
  fabricId?: string;
  testCase?: TestCase;
}

export interface SubChecklist {
  name: string;
  items: SubChecklistItem[];
  fabricId?: string;
  createdDate: string;
  lastModified: string;
}

export interface FabricProgress {
  fabricId: string;
  totalTasks: number;
  completedTasks: number;
  totalTestCases: number;
  completedTestCases: number;
  highPriorityPending: number;
  criticalIssues: number;
}

export interface AppState {
  fabrics: Fabric[];
  sections: Section[];
  currentFabric: string;
  searchQuery: string;
  subChecklists: { [key: string]: SubChecklist };
  fabricStates: { [fabricId: string]: { [taskId: string]: boolean } };
  fabricNotes: { [fabricId: string]: { [taskId: string]: string } };
  testCaseStates: { [fabricId: string]: { [tcId: string]: TestCase } };
  taskCategories: { [fabricId: string]: { [taskId: string]: TaskCategory } };
}

export type AppAction = 
  | { type: 'SET_CURRENT_FABRIC'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'UPDATE_TASK_STATE'; payload: { taskId: string; checked: boolean; fabricId: string } }
  | { type: 'UPDATE_TASK_NOTES'; payload: { taskId: string; notes: string; fabricId: string } }
  | { type: 'UPDATE_TASK_CATEGORY'; payload: { taskId: string; category: TaskCategory; fabricId: string } }
  | { type: 'ADD_TASK'; payload: { sectionId: string; subsectionTitle: string; task: Task } }
  | { type: 'ADD_SUBSECTION'; payload: { sectionId: string; subsection: Subsection } }
  | { type: 'SAVE_SUB_CHECKLIST'; payload: { name: string; checklist: SubChecklist } }
  | { type: 'DELETE_SUB_CHECKLIST'; payload: string }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'TOGGLE_SECTION'; payload: string };

export interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ProgressSnapshot {
  date: string;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercentage: number;
  fabricId?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface DependencyStatus {
  canComplete: boolean;
  unmetDependencies: string[];
  dependentTasks: string[];
}

export interface DependencyValidationResult {
  isValid: boolean;
  blockedBy: string[];
  blocks: string[];
  message?: string;
}

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getCurrentFabricTasks: () => Task[];
  getFabricProgress: (fabricId: string) => FabricProgress;
  updateTaskState: (taskId: string, checked: boolean, fabricId?: string) => Promise<void>;
  updateTaskNotes: (taskId: string, notes: string, fabricId?: string) => Promise<void>;
  updateTaskCategory: (taskId: string, category: TaskCategory, fabricId?: string) => Promise<void>;
  updateTaskCategoryAcrossSelectedFabrics: (taskId: string, category: TaskCategory, fabricIds: string[]) => Promise<void>;
  updateTaskCategoryAcrossAllFabrics: (taskId: string, category: TaskCategory) => Promise<void>;
  addTask: (sectionId: string, subsectionTitle: string, taskData: { text: string; fabricSpecific: boolean; ndoCentralized: boolean; testCaseId?: string }) => Promise<void>;
  addSubsection: (sectionId: string, subsectionTitle: string) => Promise<void>;
  setCurrentFabric: (fabricId: string) => void;
  setSearchQuery: (query: string) => void;
  saveSubChecklist: (name: string, items: any[]) => void;
  loadSubChecklist: () => void;
  deleteSubChecklist: (name: string) => void;
  getDependencyStatus: (fabricId: string, taskId: string) => DependencyStatus;
  findTaskById: (taskId: string) => Task | undefined;
}
