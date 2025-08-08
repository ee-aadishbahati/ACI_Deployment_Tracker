import { Task, Subsection } from '../types';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
const IS_PRODUCTION = (import.meta as any).env.MODE === 'production';

const HAS_CUSTOM_API_URL = !!(import.meta as any).env.VITE_API_URL;

export interface AppData {
  fabricStates: Record<string, Record<string, boolean>>;
  fabricNotes: Record<string, Record<string, string>>;
  fabricCompletionDates: Record<string, Record<string, string>>;
  fabricNoteModificationDates: Record<string, Record<string, string>>;
  testCaseStates: Record<string, Record<string, any>>;
  taskCategories: Record<string, Record<string, string>>;
  subChecklists: Record<string, any>;
  currentFabric: string | null;
  lastSaved: string | null;
}

class ApiService {
  private async makeRequest(url: string, options?: RequestInit): Promise<Response | null> {
    console.log('API Request Debug:', {
      url,
      API_URL,
      IS_PRODUCTION,
      HAS_CUSTOM_API_URL,
      MODE: (import.meta as any).env.MODE,
      VITE_API_URL: (import.meta as any).env.VITE_API_URL
    });
    
    if (IS_PRODUCTION && !HAS_CUSTOM_API_URL) {
      console.log('Production mode: Skipping API call to', url, '(no custom API URL)');
      return null;
    }
    
    try {
      return await fetch(url, options);
    } catch (error) {
      console.warn('API request failed:', error);
      return null;
    }
  }

  async getAllData(): Promise<AppData> {
    const response = await this.makeRequest(`${API_URL}/api/data`);
    if (!response || !response.ok) {
      throw new Error(`Failed to fetch data: ${response?.statusText || 'No response'}`);
    }
    return response.json();
  }

  async updateAllData(data: AppData): Promise<AppData> {
    const response = await this.makeRequest(`${API_URL}/api/data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response || !response.ok) {
      throw new Error(`Failed to update data: ${response?.statusText || 'No response'}`);
    }
    return response.json();
  }

  async updateTaskState(fabricId: string, taskId: string, checked: boolean): Promise<AppData> {
    const response = await this.makeRequest(`${API_URL}/api/fabric/${fabricId}/task/${taskId}/state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ checked }),
    });
    if (!response || !response.ok) {
      throw new Error(`Failed to update task state: ${response?.statusText || 'No response'}`);
    }
    return response.json();
  }

  async updateTaskNotes(fabricId: string, taskId: string, notes: string): Promise<AppData> {
    const response = await this.makeRequest(`${API_URL}/api/fabric/${fabricId}/task/${taskId}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
    if (!response || !response.ok) {
      throw new Error(`Failed to update task notes: ${response?.statusText || 'No response'}`);
    }
    return response.json();
  }

  async updateTaskCategory(fabricId: string, taskId: string, category: string): Promise<AppData> {
    const response = await this.makeRequest(`${API_URL}/api/fabric/${fabricId}/task/${taskId}/category`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category }),
    });
    if (!response || !response.ok) {
      throw new Error(`Failed to update task category: ${response?.statusText || 'No response'}`);
    }
    return response.json();
  }

  async setCurrentFabric(fabricId: string): Promise<AppData> {
    const response = await this.makeRequest(`${API_URL}/api/fabric/${fabricId}/current`, {
      method: 'PATCH',
    });
    if (!response || !response.ok) {
      throw new Error(`Failed to set current fabric: ${response?.statusText || 'No response'}`);
    }
    return response.json();
  }

  async addTask(sectionId: string, subsectionTitle: string, task: Task): Promise<AppData> {
    const response = await this.makeRequest(`${API_URL}/api/section/${sectionId}/subsection/${encodeURIComponent(subsectionTitle)}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response || !response.ok) {
      throw new Error(`Failed to add task: ${response?.statusText || 'No response'}`);
    }
    return response.json();
  }

  async addSubsection(sectionId: string, subsection: Subsection): Promise<AppData> {
    const response = await this.makeRequest(`${API_URL}/api/section/${sectionId}/subsection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subsection),
    });
    if (!response || !response.ok) {
      throw new Error(`Failed to add subsection: ${response?.statusText || 'No response'}`);
    }
    return response.json();
  }

  async initializeBackend(frontendData: any): Promise<AppData> {
    const response = await this.makeRequest(`${API_URL}/api/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(frontendData),
    });
    if (!response || !response.ok) {
      throw new Error(`Failed to initialize backend: ${response?.statusText || 'No response'}`);
    }
    return response.json();
  }
}

export const apiService = new ApiService();
