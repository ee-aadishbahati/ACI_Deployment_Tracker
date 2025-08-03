const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';

export interface AppData {
  fabricStates: Record<string, Record<string, boolean>>;
  fabricNotes: Record<string, Record<string, string>>;
  testCaseStates: Record<string, Record<string, any>>;
  taskCategories: Record<string, Record<string, string>>;
  subChecklists: Record<string, any>;
  currentFabric: string | null;
  lastSaved: string | null;
}

class ApiService {
  async getAllData(): Promise<AppData> {
    const response = await fetch(`${API_URL}/api/data`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    return response.json();
  }

  async updateAllData(data: AppData): Promise<AppData> {
    const response = await fetch(`${API_URL}/api/data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update data: ${response.statusText}`);
    }
    return response.json();
  }

  async updateTaskState(fabricId: string, taskId: string, checked: boolean): Promise<AppData> {
    const response = await fetch(`${API_URL}/api/fabric/${fabricId}/task/${taskId}/state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ checked }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update task state: ${response.statusText}`);
    }
    return response.json();
  }

  async updateTaskNotes(fabricId: string, taskId: string, notes: string): Promise<AppData> {
    const response = await fetch(`${API_URL}/api/fabric/${fabricId}/task/${taskId}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update task notes: ${response.statusText}`);
    }
    return response.json();
  }

  async updateTaskCategory(fabricId: string, taskId: string, category: string): Promise<AppData> {
    const response = await fetch(`${API_URL}/api/fabric/${fabricId}/task/${taskId}/category`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update task category: ${response.statusText}`);
    }
    return response.json();
  }

  async setCurrentFabric(fabricId: string): Promise<AppData> {
    const response = await fetch(`${API_URL}/api/fabric/${fabricId}/current`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error(`Failed to set current fabric: ${response.statusText}`);
    }
    return response.json();
  }
}

export const apiService = new ApiService();
