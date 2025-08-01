export interface ElectronAPI {
  saveToLocal: (data: any) => Promise<{
    success: boolean;
    filePath?: string;
    filename?: string;
    error?: string;
  }>;
  getSavedWorkDir: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
