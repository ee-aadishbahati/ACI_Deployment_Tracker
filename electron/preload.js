const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveToLocal: (data) => ipcRenderer.invoke('save-to-local', data),
  getSavedWorkDir: () => ipcRenderer.invoke('get-saved-work-dir')
});
