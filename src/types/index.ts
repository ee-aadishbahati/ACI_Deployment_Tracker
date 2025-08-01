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

export interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
