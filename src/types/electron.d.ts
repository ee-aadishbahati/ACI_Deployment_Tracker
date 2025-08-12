export interface ElectronAPI {
  saveToLocal: (data: any) => Promise<{
    success: boolean;
    filePath?: string;
    filename?: string;
    error?: string;
  }>;
  getSavedWorkDir: () => Promise<string>;
  logError: (error: any) => Promise<{ success: boolean; error?: string }>;
  initDatabase: () => Promise<{ success: boolean; error?: string }>;
  migrateFromLocalStorage: (data: any) => Promise<{ success: boolean; error?: string }>;
  createBackup: () => Promise<{ success: boolean; backupPath?: string; error?: string }>;
  getDatabasePath: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
