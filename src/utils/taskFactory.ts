import { Task, TestCase } from '../types';

export interface TaskOptions {
  fabricSpecific?: boolean;
  ndoCentralized?: boolean;
  testCase?: Partial<TestCase>;
}

export function createTask(
  id: string,
  text: string,
  options: TaskOptions = {}
): Task {
  const {
    fabricSpecific = false,
    ndoCentralized = false,
    testCase
  } = options;

  const task: Task = {
    id,
    text,
    checked: false,
    notes: '',
    fabricSpecific,
    ndoCentralized
  };

  if (testCase) {
    task.testCase = {
      tcId: testCase.tcId || `TC-${id}`,
      lead: testCase.lead || 'EE',
      witness: testCase.witness,
      priority: testCase.priority || 'Medium',
      risk: testCase.risk || 'Medium',
      effort: testCase.effort || 1,
      status: testCase.status || 'T.B.E.',
      preConditions: testCase.preConditions,
      expectedResults: testCase.expectedResults,
      dependencies: testCase.dependencies || [],
      evidenceRequired: testCase.evidenceRequired || false
    };
  }

  return task;
}

export function createFabricTask(
  id: string,
  text: string,
  tcId: string,
  options: Partial<TestCase> = {}
): Task {
  return createTask(id, text, {
    fabricSpecific: true,
    testCase: { tcId, ...options }
  });
}

export function createNdoTask(
  id: string,
  text: string,
  tcId: string,
  options: Partial<TestCase> = {}
): Task {
  return createTask(id, text, {
    ndoCentralized: true,
    testCase: { tcId, ...options }
  });
}

export function createGeneralTask(
  id: string,
  text: string,
  tcId?: string,
  options: Partial<TestCase> = {}
): Task {
  return createTask(id, text, {
    fabricSpecific: false,
    ndoCentralized: false,
    testCase: tcId ? { tcId, ...options } : undefined
  });
}
