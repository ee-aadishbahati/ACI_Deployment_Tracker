export type FabricType = 'IT' | 'OT';
export type SiteType = 'North' | 'South' | 'Tertiary';
export type Priority = 'High' | 'Medium' | 'Low';
export type Risk = 'High' | 'Medium' | 'Low';
export type ExecutionStatus = 'T.B.E.' | 'Pass' | 'Fail' | 'Partial' | 'Defer' | 'R.I.';
export type ResourceRole = 'EE' | 'PS' | 'SP' | 'OK' | 'Vendor';
export type TaskCategory = 'must-have' | 'should-have' | 'none';
export type UserRole = 'admin' | 'manager' | 'engineer' | 'viewer';
export type NotificationType = 'mention' | 'comment' | 'task_update';

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
  fabricId?: string;
  fabricName?: string;
  completionDate?: string;
  sectionTitle?: string;
  subsectionTitle?: string;
  noteModificationDate?: string;
  kanbanStatus?: 'todo' | 'in-progress' | 'testing' | 'complete';
  dueDate?: string;
  assignedTo?: string;
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
  fabricCompletionDates: { [fabricId: string]: { [taskId: string]: string } };
  fabricNoteModificationDates: { [fabricId: string]: { [taskId: string]: string } };
  testCaseStates: { [fabricId: string]: { [tcId: string]: TestCase } };
  taskCategories: { [fabricId: string]: { [taskId: string]: TaskCategory } };
  taskKanbanStatus: { [fabricId: string]: { [taskId: string]: string } };
  users: { [userId: string]: User };
  currentUser: string;
  taskComments: { [taskId: string]: TaskComment[] };
  notifications: Notification[];
  taskTemplates: TaskTemplate[];
  isLoading: boolean;
}

export type AppAction = 
  | { type: 'SET_CURRENT_FABRIC'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'UPDATE_TASK_STATE'; payload: { taskId: string; checked: boolean; fabricId: string } }
  | { type: 'UPDATE_TASK_NOTES'; payload: { taskId: string; notes: string; fabricId: string } }
  | { type: 'UPDATE_TASK_CATEGORY'; payload: { taskId: string; category: TaskCategory; fabricId: string } }
  | { type: 'UPDATE_TASK_COMPLETION_DATE'; payload: { taskId: string; completionDate: string | null; fabricId: string } }
  | { type: 'UPDATE_NOTE_MODIFICATION_DATE'; payload: { taskId: string; modificationDate: string; fabricId: string } }
  | { type: 'UPDATE_TASK_KANBAN_STATUS'; payload: { taskId: string; kanbanStatus: string; fabricId: string } }
  | { type: 'ADD_TASK'; payload: { sectionId: string; subsectionTitle: string; task: Task } }
  | { type: 'ADD_SUBSECTION'; payload: { sectionId: string; subsection: Subsection } }
  | { type: 'SAVE_SUB_CHECKLIST'; payload: { name: string; checklist: SubChecklist } }
  | { type: 'DELETE_SUB_CHECKLIST'; payload: string }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'TOGGLE_SECTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_USER'; payload: string }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'ADD_COMMENT'; payload: TaskComment }
  | { type: 'UPDATE_COMMENT'; payload: TaskComment }
  | { type: 'DELETE_COMMENT'; payload: { commentId: string; taskId: string } }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS'; payload: void }
  | { type: 'ADD_TASK_TEMPLATE'; payload: TaskTemplate }
  | { type: 'DELETE_TASK_TEMPLATE'; payload: string }
  | { type: 'CLONE_TASKS_ACROSS_FABRICS'; payload: { taskIds: string[]; sourceFabricId: string; targetFabricIds: string[] } };

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

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  fabricAccess: string[];
  avatar?: string;
  isOnline?: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  fabricId: string;
  userId: string;
  content: string;
  mentions: string[];
  timestamp: Date;
  parentCommentId?: string;
  edited?: Date;
  attachments?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  taskId: string;
  fabricId: string;
  message: string;
  read: boolean;
  timestamp: Date;
  fromUserId?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  fabricType?: FabricType;
  siteType?: SiteType;
  createdBy: string;
  createdAt: Date;
  tags?: string[];
}

export interface AppContextType {
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
  addTask: (sectionId: string, subsectionTitle: string, taskData: { text: string; fabricSpecific: boolean; ndoCentralized: boolean; testCaseId?: string }) => Promise<void>;
  addSubsection: (sectionId: string, subsectionTitle: string) => Promise<void>;
  setCurrentFabric: (fabricId: string) => void;
  setSearchQuery: (query: string) => void;
  saveSubChecklist: (name: string, items: any[]) => void;
  loadSubChecklist: () => void;
  deleteSubChecklist: (name: string) => void;
  getDependencyStatus: (fabricId: string, taskId: string) => DependencyStatus;
  findTaskById: (taskId: string) => Task | undefined;
  setCurrentUser: (userId: string) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  addComment: (comment: Omit<TaskComment, 'id' | 'timestamp'>) => Promise<void>;
  updateComment: (comment: TaskComment) => Promise<void>;
  deleteComment: (commentId: string, taskId: string) => Promise<void>;
  getTaskComments: (taskId: string) => TaskComment[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  getUnreadNotifications: () => Notification[];
  addTaskTemplate: (template: Omit<TaskTemplate, 'id' | 'createdAt'>) => void;
  deleteTaskTemplate: (templateId: string) => void;
  cloneTasksAcrossFabrics: (taskIds: string[], sourceFabricId: string, targetFabricIds: string[]) => Promise<void>;
}
