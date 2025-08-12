const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'), // Add icon if available
    show: false, // Don't show until ready
    titleBarStyle: 'default'
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  createMenu();
  setupIPC();
}

function setupIPC() {
  const savedWorkDir = path.join(app.getPath('userData'), 'SavedWork');
  if (!fs.existsSync(savedWorkDir)) {
    fs.mkdirSync(savedWorkDir, { recursive: true });
  }

  let databaseService = null;

  ipcMain.handle('save-to-local', async (event, data) => {
    try {
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T');
      const dateStr = timestamp[0];
      const timeStr = timestamp[1].split('.')[0];
      const filename = `aci-deployment-backup-${dateStr}-${timeStr}.json`;
      const filePath = path.join(savedWorkDir, filename);
      
      const exportData = {
        ...data,
        exportDate: now.toISOString(),
        version: '1.0.0'
      };
      
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      
      return {
        success: true,
        filePath: filePath,
        filename: filename
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('get-saved-work-dir', async () => {
    return path.join(app.getPath('userData'), 'SavedWork');
  });

  ipcMain.handle('init-database', async () => {
    try {
      if (!databaseService) {
        const { DatabaseService } = require('../src/services/DatabaseService');
        const dbPath = path.join(app.getPath('userData'), 'aci-deployment-tracker.db');
        databaseService = DatabaseService.getInstance({ dbPath });
      }
      return { success: true };
    } catch (error) {
      console.error('Database initialization error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('migrate-from-localstorage', async (event, data) => {
    try {
      if (!databaseService) {
        const { DatabaseService } = require('../src/services/DatabaseService');
        const dbPath = path.join(app.getPath('userData'), 'aci-deployment-tracker.db');
        databaseService = DatabaseService.getInstance({ dbPath });
      }
      
      databaseService.migrateFromLocalStorage(data);
      return { success: true };
    } catch (error) {
      console.error('Migration error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-backup', async () => {
    try {
      if (!databaseService) {
        return { success: false, error: 'Database not initialized' };
      }
      
      const backupPath = databaseService.createBackup();
      return { success: true, backupPath };
    } catch (error) {
      console.error('Backup error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-database-path', async () => {
    return path.join(app.getPath('userData'), 'aci-deployment-tracker.db');
  });

  ipcMain.handle('log-error', async (event, error) => {
    try {
      console.error('Application Error:', error);
      
      if (databaseService) {
        databaseService.logError(error);
      }
      
      return { success: true };
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
      return { success: false, error: dbError.message };
    }
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              localStorage.removeItem('aci-deployment-tracker-data');
              window.location.reload();
            `);
          }
        },
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              title: 'Export ACI Deployment Data',
              defaultPath: `aci-deployment-export-${new Date().toISOString().split('T')[0]}.json`,
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });

            if (!result.canceled) {
              mainWindow.webContents.executeJavaScript(`
                const exportData = {
                  fabricStates: JSON.parse(localStorage.getItem('aci-deployment-tracker-data') || '{}').fabricStates || {},
                  fabricNotes: JSON.parse(localStorage.getItem('aci-deployment-tracker-data') || '{}').fabricNotes || {},
                  testCaseStates: JSON.parse(localStorage.getItem('aci-deployment-tracker-data') || '{}').testCaseStates || {},
                  subChecklists: JSON.parse(localStorage.getItem('aci-deployment-tracker-data') || '{}').subChecklists || {},
                  exportDate: new Date().toISOString(),
                  version: '1.0.0'
                };
                require('fs').writeFileSync('${result.filePath.replace(/\\/g, '\\\\')}', JSON.stringify(exportData, null, 2));
              `).catch(() => {
                mainWindow.webContents.executeJavaScript(`
                  document.querySelector('[title="Export All Data"]').click();
                `);
              });
            }
          }
        },
        {
          label: 'Import Data',
          accelerator: 'CmdOrCtrl+I',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              title: 'Import ACI Deployment Data',
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ],
              properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.executeJavaScript(`
                document.querySelector('[title="Import Data"]').click();
              `);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.querySelector('button[title*="Dashboard"]')?.click();
            `);
          }
        },
        {
          label: 'Tasks',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.querySelector('button[title*="Tasks"]')?.click();
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 1);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 1);
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }
      ]
    },
    {
      label: 'Fabrics',
      submenu: [
        {
          label: 'North IT Fabric',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.querySelector('button[data-fabric="north-it"]')?.click();
            `);
          }
        },
        {
          label: 'North OT Fabric',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.querySelector('button[data-fabric="north-ot"]')?.click();
            `);
          }
        },
        {
          label: 'South IT Fabric',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.querySelector('button[data-fabric="south-it"]')?.click();
            `);
          }
        },
        {
          label: 'South OT Fabric',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.querySelector('button[data-fabric="south-ot"]')?.click();
            `);
          }
        },
        {
          label: 'Tertiary IT Fabric (NDO)',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.querySelector('button[data-fabric="tertiary-it"]')?.click();
            `);
          }
        },
        {
          label: 'Tertiary OT Fabric (NDO)',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.querySelector('button[data-fabric="tertiary-ot"]')?.click();
            `);
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About ACI Deployment Tracker',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About ACI Deployment Tracker',
              message: 'ACI Deployment Tracker v1.0.0',
              detail: 'Advanced Multi-Site Multi-Fabric ACI Deployment Management\n\nDeveloped for Essential Energy\n\nFeatures:\n• 6 ACI Fabric Support (IT/OT at North/South/Tertiary sites)\n• Centralized NDO Management\n• 863 Deployment Tasks\n• 184 Test Cases with Formal Methodology\n• Resource Assignment & Dependency Tracking\n• Progress Monitoring & Reporting'
            });
          }
        },
        {
          label: 'User Guide',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'User Guide',
              message: 'ACI Deployment Tracker User Guide',
              detail: 'Getting Started:\n\n1. Select your target fabric from the fabric selector\n2. Use the Dashboard view for overall progress monitoring\n3. Switch to Tasks view for detailed task management\n4. Create sub-checklists for team delegation\n5. Export/import data for backup and sharing\n\nKeyboard Shortcuts:\n• Ctrl+1: Dashboard View\n• Ctrl+2: Tasks View\n• Ctrl+N: New Project\n• Ctrl+E: Export Data\n• Ctrl+I: Import Data\n• Ctrl+P: Print'
            });
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Hide ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
