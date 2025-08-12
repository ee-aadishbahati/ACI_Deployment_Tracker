const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveToLocal: (data) => ipcRenderer.invoke('save-to-local', data),
  getSavedWorkDir: () => ipcRenderer.invoke('get-saved-work-dir'),
  logError: (error) => ipcRenderer.invoke('log-error', error),
  initDatabase: () => ipcRenderer.invoke('init-database'),
  migrateFromLocalStorage: (data) => ipcRenderer.invoke('migrate-from-localstorage', data),
  createBackup: () => ipcRenderer.invoke('create-backup'),
  getDatabasePath: () => ipcRenderer.invoke('get-database-path')
});
