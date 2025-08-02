export interface ProgressStats {
  total: number;
  completed: number;
  percentage: number;
}

export function calculateProgress(completed: number, total: number): ProgressStats {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}

export function calculateTaskProgress(tasks: Array<{ checked: boolean }>): ProgressStats {
  const total = tasks.length;
  const completed = tasks.filter(task => task.checked).length;
  return calculateProgress(completed, total);
}

export function calculateTestCaseProgress(
  testCases: Array<{ status?: string }>
): ProgressStats {
  const total = testCases.length;
  const completed = testCases.filter(tc => tc.status === 'Pass').length;
  return calculateProgress(completed, total);
}

export function aggregateProgress(progressList: ProgressStats[]): ProgressStats {
  const totalTasks = progressList.reduce((sum, p) => sum + p.total, 0);
  const totalCompleted = progressList.reduce((sum, p) => sum + p.completed, 0);
  return calculateProgress(totalCompleted, totalTasks);
}
