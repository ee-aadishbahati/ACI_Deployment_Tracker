# Critical Issues Implementation Plan - ACI Deployment Tracker

## Overview

This document outlines the detailed implementation plan to address the three critical technical debt issues identified in the ACI Deployment Tracker application:

1. **Data Persistence Limitations** - Replace localStorage with SQLite database
2. **Missing Error Handling** - Implement comprehensive error handling and recovery
3. **Scalability Concerns** - Replace timestamp-based ID generation with UUIDs

## Timeline: 2 Weeks (10 Working Days)

### Week 1: Foundation & Database Implementation
- Days 1-3: SQLite database implementation
- Days 4-5: Error handling framework

### Week 2: ID System & Integration
- Days 6-7: UUID implementation and data migration
- Days 8-9: Integration testing and validation
- Day 10: Documentation and deployment preparation

---

## Critical Issue #1: Data Persistence Implementation

### Current State Analysis
- **Location**: `src/contexts/AppContext.tsx` lines 114-135
- **Problem**: Application relies solely on localStorage for data persistence
- **Risk**: Data loss on browser cache clear or application corruption

### Implementation Plan

#### Step 1: Add SQLite Dependencies (Day 1)
```bash
npm install better-sqlite3 @types/better-sqlite3
npm install --save-dev electron-rebuild
```

#### Step 2: Create Database Schema (Day 1)
**File**: `src/database/schema.sql`
```sql
-- Fabrics table
CREATE TABLE IF NOT EXISTS fabrics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    site TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    fabric_specific BOOLEAN DEFAULT 1,
    ndo_centralized BOOLEAN DEFAULT 0,
    section_id TEXT NOT NULL,
    subsection_title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task states per fabric
CREATE TABLE IF NOT EXISTS task_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    fabric_id TEXT NOT NULL,
    checked BOOLEAN DEFAULT 0,
    notes TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (fabric_id) REFERENCES fabrics(id),
    UNIQUE(task_id, fabric_id)
);

-- Test cases
CREATE TABLE IF NOT EXISTS test_cases (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    tc_id TEXT NOT NULL,
    lead TEXT NOT NULL,
    witness TEXT,
    priority TEXT NOT NULL,
    risk TEXT NOT NULL,
    effort INTEGER NOT NULL,
    status TEXT DEFAULT 'T.B.E.',
    rtm_id TEXT,
    pre_conditions TEXT,
    expected_results TEXT,
    actual_results TEXT,
    evidence_required BOOLEAN DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Sub-checklists
CREATE TABLE IF NOT EXISTS sub_checklists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fabric_id TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fabric_id) REFERENCES fabrics(id)
);

-- Sub-checklist items
CREATE TABLE IF NOT EXISTS sub_checklist_items (
    id TEXT PRIMARY KEY,
    sub_checklist_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    checked BOOLEAN DEFAULT 0,
    notes TEXT DEFAULT '',
    FOREIGN KEY (sub_checklist_id) REFERENCES sub_checklists(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_states_fabric ON task_states(fabric_id);
CREATE INDEX IF NOT EXISTS idx_task_states_task ON task_states(task_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_task ON test_cases(task_id);
```

#### Step 3: Create Database Service (Day 2)
**File**: `src/services/DatabaseService.ts`
```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { AppState, Task, Fabric, TestCase, SubChecklist } from '../types';

export class DatabaseService {
    private db: Database.Database;
    private static instance: DatabaseService;

    private constructor() {
        const userDataPath = app.getPath('userData');
        const dbPath = path.join(userDataPath, 'aci-deployment-tracker.db');
        
        this.db = new Database(dbPath);
        this.initializeDatabase();
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    private initializeDatabase(): void {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        this.db.exec(schema);
        
        // Initialize with default fabrics if empty
        this.initializeDefaultData();
    }

    private initializeDefaultData(): void {
        const fabricCount = this.db.prepare('SELECT COUNT(*) as count FROM fabrics').get() as { count: number };
        
        if (fabricCount.count === 0) {
            const insertFabric = this.db.prepare(`
                INSERT INTO fabrics (id, name, site, type, description) 
                VALUES (?, ?, ?, ?, ?)
            `);
            
            // Insert default fabrics from fabricsData
            const fabrics = [
                ['north-it', 'North IT Fabric', 'North', 'IT', 'IT infrastructure fabric at North data center'],
                ['north-ot', 'North OT Fabric', 'North', 'OT', 'Operational Technology fabric at North data center'],
                ['south-it', 'South IT Fabric', 'South', 'IT', 'IT infrastructure fabric at South data center'],
                ['south-ot', 'South OT Fabric', 'South', 'OT', 'Operational Technology fabric at South data center'],
                ['tertiary-it', 'Tertiary IT Fabric', 'Tertiary', 'IT', 'IT infrastructure fabric at Tertiary data center (NDO host)'],
                ['tertiary-ot', 'Tertiary OT Fabric', 'Tertiary', 'OT', 'Operational Technology fabric at Tertiary data center (NDO managed)']
            ];
            
            const insertMany = this.db.transaction((fabrics) => {
                for (const fabric of fabrics) {
                    insertFabric.run(...fabric);
                }
            });
            
            insertMany(fabrics);
        }
    }

    // Task state operations
    public updateTaskState(taskId: string, fabricId: string, checked: boolean): void {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO task_states (task_id, fabric_id, checked, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(taskId, fabricId, checked);
    }

    public updateTaskNotes(taskId: string, fabricId: string, notes: string): void {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO task_states (task_id, fabric_id, notes, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(taskId, fabricId, notes);
    }

    public getTaskStates(fabricId: string): { [taskId: string]: { checked: boolean; notes: string } } {
        const stmt = this.db.prepare(`
            SELECT task_id, checked, notes 
            FROM task_states 
            WHERE fabric_id = ?
        `);
        
        const rows = stmt.all(fabricId) as Array<{
            task_id: string;
            checked: number;
            notes: string;
        }>;
        
        const result: { [taskId: string]: { checked: boolean; notes: string } } = {};
        rows.forEach(row => {
            result[row.task_id] = {
                checked: Boolean(row.checked),
                notes: row.notes || ''
            };
        });
        
        return result;
    }

    // Sub-checklist operations
    public saveSubChecklist(name: string, items: any[], fabricId: string): void {
        const transaction = this.db.transaction(() => {
            const checklistId = this.generateUUID();
            
            // Insert sub-checklist
            const insertChecklist = this.db.prepare(`
                INSERT INTO sub_checklists (id, name, fabric_id, created_date, last_modified)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);
            insertChecklist.run(checklistId, name, fabricId);
            
            // Insert items
            const insertItem = this.db.prepare(`
                INSERT INTO sub_checklist_items (id, sub_checklist_id, task_id, checked, notes)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            items.forEach(item => {
                insertItem.run(this.generateUUID(), checklistId, item.id, item.checked, item.notes);
            });
        });
        
        transaction();
    }

    public getSubChecklists(): { [name: string]: SubChecklist } {
        const stmt = this.db.prepare(`
            SELECT sc.*, sci.task_id, sci.checked, sci.notes as item_notes
            FROM sub_checklists sc
            LEFT JOIN sub_checklist_items sci ON sc.id = sci.sub_checklist_id
            ORDER BY sc.name, sci.id
        `);
        
        const rows = stmt.all();
        const result: { [name: string]: SubChecklist } = {};
        
        // Group by checklist name and build structure
        // Implementation details...
        
        return result;
    }

    // Backup and restore operations
    public createBackup(): string {
        const backupPath = path.join(app.getPath('userData'), 'backups');
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupPath, `backup-${timestamp}.db`);
        
        this.db.backup(backupFile);
        return backupFile;
    }

    public restoreFromBackup(backupPath: string): void {
        // Implementation for restore functionality
    }

    // Migration from localStorage
    public migrateFromLocalStorage(localStorageData: any): void {
        const transaction = this.db.transaction(() => {
            // Migrate fabric states
            if (localStorageData.fabricStates) {
                Object.entries(localStorageData.fabricStates).forEach(([fabricId, tasks]: [string, any]) => {
                    Object.entries(tasks).forEach(([taskId, checked]: [string, any]) => {
                        this.updateTaskState(taskId, fabricId, Boolean(checked));
                    });
                });
            }
            
            // Migrate fabric notes
            if (localStorageData.fabricNotes) {
                Object.entries(localStorageData.fabricNotes).forEach(([fabricId, tasks]: [string, any]) => {
                    Object.entries(tasks).forEach(([taskId, notes]: [string, any]) => {
                        this.updateTaskNotes(taskId, fabricId, String(notes));
                    });
                });
            }
            
            // Migrate sub-checklists
            if (localStorageData.subChecklists) {
                Object.entries(localStorageData.subChecklists).forEach(([name, checklist]: [string, any]) => {
                    this.saveSubChecklist(name, checklist.items, checklist.fabricId);
                });
            }
        });
        
        transaction();
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public close(): void {
        this.db.close();
    }
}
```

#### Step 4: Update Electron Main Process (Day 2)
**File**: `electron/main.js` - Add database initialization
```javascript
const { DatabaseService } = require('../dist/services/DatabaseService');

// Add after app.whenReady()
app.whenReady().then(() => {
    // Initialize database
    const dbService = DatabaseService.getInstance();
    
    createWindow();
});

// Add IPC handlers for database operations
ipcMain.handle('db-update-task-state', async (event, taskId, fabricId, checked) => {
    const dbService = DatabaseService.getInstance();
    dbService.updateTaskState(taskId, fabricId, checked);
});

ipcMain.handle('db-update-task-notes', async (event, taskId, fabricId, notes) => {
    const dbService = DatabaseService.getInstance();
    dbService.updateTaskNotes(taskId, fabricId, notes);
});

ipcMain.handle('db-get-task-states', async (event, fabricId) => {
    const dbService = DatabaseService.getInstance();
    return dbService.getTaskStates(fabricId);
});

ipcMain.handle('db-create-backup', async () => {
    const dbService = DatabaseService.getInstance();
    return dbService.createBackup();
});

ipcMain.handle('db-migrate-from-localstorage', async (event, data) => {
    const dbService = DatabaseService.getInstance();
    dbService.migrateFromLocalStorage(data);
});
```

#### Step 5: Update Preload Script (Day 2)
**File**: `electron/preload.js`
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveToLocal: (data) => ipcRenderer.invoke('save-to-local', data),
    getSavedWorkDir: () => ipcRenderer.invoke('get-saved-work-dir'),
    
    // Database operations
    dbUpdateTaskState: (taskId, fabricId, checked) => 
        ipcRenderer.invoke('db-update-task-state', taskId, fabricId, checked),
    dbUpdateTaskNotes: (taskId, fabricId, notes) => 
        ipcRenderer.invoke('db-update-task-notes', taskId, fabricId, notes),
    dbGetTaskStates: (fabricId) => 
        ipcRenderer.invoke('db-get-task-states', fabricId),
    dbCreateBackup: () => 
        ipcRenderer.invoke('db-create-backup'),
    dbMigrateFromLocalStorage: (data) => 
        ipcRenderer.invoke('db-migrate-from-localstorage', data)
});
```

#### Step 6: Update App Context (Day 3)
**File**: `src/contexts/AppContext.tsx` - Replace localStorage with database calls
```typescript
// Add database service integration
const updateTaskState = async (taskId: string, checked: boolean, fabricId?: string) => {
    const targetFabricId = fabricId || state.currentFabric;
    
    try {
        if (window.electronAPI?.dbUpdateTaskState) {
            await window.electronAPI.dbUpdateTaskState(taskId, targetFabricId, checked);
        }
        
        dispatch({
            type: 'UPDATE_TASK_STATE',
            payload: { taskId, checked, fabricId: targetFabricId }
        });
    } catch (error) {
        console.error('Failed to update task state:', error);
        // Fallback to localStorage
        dispatch({
            type: 'UPDATE_TASK_STATE',
            payload: { taskId, checked, fabricId: targetFabricId }
        });
    }
};

// Similar updates for updateTaskNotes and other database operations
```

---

## Critical Issue #2: Error Handling Implementation

### Current State Analysis
- **Problem**: Insufficient error handling throughout the application
- **Risk**: Application crashes and poor user experience
- **Locations**: Multiple files, particularly API operations and file I/O

### Implementation Plan

#### Step 1: Create Error Handling Framework (Day 4)
**File**: `src/utils/ErrorHandler.ts`
```typescript
export enum ErrorType {
    DATABASE_ERROR = 'DATABASE_ERROR',
    FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
    type: ErrorType;
    message: string;
    details?: any;
    timestamp: Date;
    stack?: string;
}

export class ErrorHandler {
    private static errorLog: AppError[] = [];
    private static maxLogSize = 1000;

    public static logError(error: AppError): void {
        this.errorLog.unshift(error);
        
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }
        
        console.error('Application Error:', error);
        
        // Send to main process for persistent logging
        if (window.electronAPI?.logError) {
            window.electronAPI.logError(error);
        }
    }

    public static createError(
        type: ErrorType, 
        message: string, 
        details?: any, 
        originalError?: Error
    ): AppError {
        return {
            type,
            message,
            details,
            timestamp: new Date(),
            stack: originalError?.stack
        };
    }

    public static handleDatabaseError(error: any, operation: string): AppError {
        const appError = this.createError(
            ErrorType.DATABASE_ERROR,
            `Database operation failed: ${operation}`,
            { operation, originalError: error.message },
            error
        );
        
        this.logError(appError);
        return appError;
    }

    public static handleFileSystemError(error: any, operation: string): AppError {
        const appError = this.createError(
            ErrorType.FILE_SYSTEM_ERROR,
            `File system operation failed: ${operation}`,
            { operation, originalError: error.message },
            error
        );
        
        this.logError(appError);
        return appError;
    }

    public static getErrorLog(): AppError[] {
        return [...this.errorLog];
    }

    public static clearErrorLog(): void {
        this.errorLog = [];
    }
}
```

#### Step 2: Create Error Boundary Component (Day 4)
**File**: `src/components/ErrorBoundary.tsx`
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler, ErrorType } from '../utils/ErrorHandler';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const appError = ErrorHandler.createError(
            ErrorType.UNKNOWN_ERROR,
            'React component error boundary triggered',
            { errorInfo, componentStack: errorInfo.componentStack },
            error
        );
        
        ErrorHandler.logError(appError);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <div className="text-red-600 text-center mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 text-center mb-6">
                            The application encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => this.setState({ hasError: false })}
                                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
```

#### Step 3: Create Notification System (Day 4)
**File**: `src/components/NotificationSystem.tsx`
```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
    persistent?: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Date.now().toString();
        const newNotification = { ...notification, id };
        
        setNotifications(prev => [...prev, newNotification]);
        
        if (!notification.persistent && notification.duration !== 0) {
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration || 5000);
        }
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            removeNotification,
            clearAll
        }}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
}

function NotificationContainer() {
    const { notifications, removeNotification } = useNotifications();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map(notification => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
}

function NotificationItem({ notification, onClose }: { 
    notification: Notification; 
    onClose: () => void; 
}) {
    const getIcon = () => {
        switch (notification.type) {
            case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'info': return <Info className="h-5 w-5 text-blue-600" />;
        }
    };

    const getBackgroundColor = () => {
        switch (notification.type) {
            case 'success': return 'bg-green-50 border-green-200';
            case 'error': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-yellow-50 border-yellow-200';
            case 'info': return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className={`max-w-sm w-full border rounded-lg p-4 shadow-lg ${getBackgroundColor()}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                        {notification.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                    </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
```

#### Step 4: Update App Context with Error Handling (Day 5)
**File**: `src/contexts/AppContext.tsx` - Add comprehensive error handling
```typescript
import { ErrorHandler, ErrorType } from '../utils/ErrorHandler';
import { useNotifications } from '../components/NotificationSystem';

// Update all database operations with error handling
const updateTaskState = async (taskId: string, checked: boolean, fabricId?: string) => {
    const targetFabricId = fabricId || state.currentFabric;
    
    try {
        if (window.electronAPI?.dbUpdateTaskState) {
            await window.electronAPI.dbUpdateTaskState(taskId, targetFabricId, checked);
        }
        
        dispatch({
            type: 'UPDATE_TASK_STATE',
            payload: { taskId, checked, fabricId: targetFabricId }
        });
        
    } catch (error) {
        const appError = ErrorHandler.handleDatabaseError(error, 'updateTaskState');
        
        // Show user notification
        addNotification({
            type: 'error',
            title: 'Failed to update task',
            message: 'The task state could not be saved. Please try again.',
            duration: 5000
        });
        
        // Fallback to localStorage
        try {
            dispatch({
                type: 'UPDATE_TASK_STATE',
                payload: { taskId, checked, fabricId: targetFabricId }
            });
            
            addNotification({
                type: 'warning',
                title: 'Using local storage',
                message: 'Task saved locally. Changes may not persist.',
                duration: 3000
            });
        } catch (fallbackError) {
            ErrorHandler.logError(ErrorHandler.createError(
                ErrorType.UNKNOWN_ERROR,
                'Both database and localStorage failed',
                { originalError: error, fallbackError },
                fallbackError as Error
            ));
        }
    }
};
```

#### Step 5: Update Main App Component (Day 5)
**File**: `src/App.tsx` - Wrap with error boundary and notification provider
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';

function App() {
    return (
        <ErrorBoundary>
            <NotificationProvider>
                <AppProvider>
                    <AppContent />
                </AppProvider>
            </NotificationProvider>
        </ErrorBoundary>
    );
}
```

---

## Critical Issue #3: UUID Implementation

### Current State Analysis
- **Location**: `src/data/sectionsData.ts` line 7
- **Problem**: Task ID generation uses timestamp + random string
- **Risk**: Potential ID collisions in high-frequency usage

### Implementation Plan

#### Step 1: Install UUID Library (Day 6)
```bash
npm install uuid @types/uuid
```

#### Step 2: Create ID Generation Service (Day 6)
**File**: `src/services/IdGenerationService.ts`
```typescript
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class IdGenerationService {
    private static usedIds = new Set<string>();

    public static generateTaskId(): string {
        let id: string;
        do {
            id = `task-${uuidv4()}`;
        } while (this.usedIds.has(id));
        
        this.usedIds.add(id);
        return id;
    }

    public static generateTestCaseId(): string {
        let id: string;
        do {
            id = `tc-${uuidv4()}`;
        } while (this.usedIds.has(id));
        
        this.usedIds.add(id);
        return id;
    }

    public static generateSubChecklistId(): string {
        let id: string;
        do {
            id = `subchecklist-${uuidv4()}`;
        } while (this.usedIds.has(id));
        
        this.usedIds.add(id);
        return id;
    }

    public static isValidId(id: string): boolean {
        const parts = id.split('-');
        if (parts.length < 2) return false;
        
        const uuidPart = parts.slice(1).join('-');
        return uuidValidate(uuidPart);
    }

    public static registerExistingId(id: string): void {
        this.usedIds.add(id);
    }

    public static clearRegistry(): void {
        this.usedIds.clear();
    }
}
```

#### Step 3: Create Migration Service (Day 6)
**File**: `src/services/MigrationService.ts`
```typescript
import { IdGenerationService } from './IdGenerationService';
import { DatabaseService } from './DatabaseService';

export interface MigrationResult {
    success: boolean;
    migratedTasks: number;
    errors: string[];
}

export class MigrationService {
    private static idMapping = new Map<string, string>();

    public static async migrateTaskIds(): Promise<MigrationResult> {
        const result: MigrationResult = {
            success: false,
            migratedTasks: 0,
            errors: []
        };

        try {
            const dbService = DatabaseService.getInstance();
            
            // Get all existing tasks with old IDs
            const existingTasks = await this.getExistingTasks();
            
            // Create mapping of old IDs to new UUIDs
            existingTasks.forEach(task => {
                if (!IdGenerationService.isValidId(task.id)) {
                    const newId = IdGenerationService.generateTaskId();
                    this.idMapping.set(task.id, newId);
                }
            });

            // Update tasks with new IDs
            await this.updateTaskIds(dbService);
            
            // Update references in task states
            await this.updateTaskStateReferences(dbService);
            
            // Update references in sub-checklists
            await this.updateSubChecklistReferences(dbService);

            result.success = true;
            result.migratedTasks = this.idMapping.size;
            
        } catch (error) {
            result.errors.push(`Migration failed: ${error.message}`);
        }

        return result;
    }

    private static async getExistingTasks(): Promise<Array<{ id: string; text: string }>> {
        // Implementation to get existing tasks from database
        return [];
    }

    private static async updateTaskIds(dbService: DatabaseService): Promise<void> {
        // Implementation to update task IDs in database
    }

    private static async updateTaskStateReferences(dbService: DatabaseService): Promise<void> {
        // Implementation to update task state references
    }

    private static async updateSubChecklistReferences(dbService: DatabaseService): Promise<void> {
        // Implementation to update sub-checklist references
    }

    public static getIdMapping(): Map<string, string> {
        return new Map(this.idMapping);
    }
}
```

#### Step 4: Update Task Creation (Day 7)
**File**: `src/data/sectionsData.ts` - Replace ID generation
```typescript
import { IdGenerationService } from '../services/IdGenerationService';

function createTaskWithTestCase(text: string, fabricSpecific: boolean = true, ndoCentralized: boolean = false): Task {
    const testCase = testCasesMapping[text];
    return {
        id: IdGenerationService.generateTaskId(), // Replace old generation
        text,
        checked: false,
        notes: '',
        testCase,
        fabricSpecific,
        ndoCentralized,
        addedToSubChecklist: false
    };
}
```

#### Step 5: Add Migration UI Component (Day 7)
**File**: `src/components/MigrationDialog.tsx`
```typescript
import React, { useState } from 'react';
import { MigrationService } from '../services/MigrationService';
import { useNotifications } from './NotificationSystem';

interface MigrationDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MigrationDialog({ isOpen, onClose }: MigrationDialogProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { addNotification } = useNotifications();

    const runMigration = async () => {
        setIsRunning(true);
        try {
            const migrationResult = await MigrationService.migrateTaskIds();
            setResult(migrationResult);
            
            if (migrationResult.success) {
                addNotification({
                    type: 'success',
                    title: 'Migration Completed',
                    message: `Successfully migrated ${migrationResult.migratedTasks} tasks to UUID format.`,
                    duration: 5000
                });
            } else {
                addNotification({
                    type: 'error',
                    title: 'Migration Failed',
                    message: 'Some errors occurred during migration. Check the details below.',
                    duration: 7000
                });
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Migration Error',
                message: 'An unexpected error occurred during migration.',
                duration: 5000
            });
        } finally {
            setIsRunning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Database Migration</h2>
                
                <p className="text-gray-600 mb-6">
                    This will migrate all task IDs to use UUID format for better uniqueness and scalability.
                </p>
                
                {result && (
                    <div className={`p-4 rounded-lg mb-4 ${
                        result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                        <h3 className="font-medium">Migration Result:</h3>
                        <p>Tasks migrated: {result.migratedTasks}</p>
                        {result.errors.length > 0 && (
                            <div className="mt-2">
                                <p className="font-medium">Errors:</p>
                                <ul className="list-disc list-inside">
                                    {result.errors.map((error, index) => (
                                        <li key={index} className="text-sm">{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isRunning}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {result ? 'Close' : 'Cancel'}
                    </button>
                    {!result && (
                        <button
                            onClick={runMigration}
                            disabled={isRunning}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isRunning ? 'Migrating...' : 'Start Migration'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
```

---

## Integration & Testing Plan (Days 8-10)

### Day 8: Integration Testing
1. **Database Integration Testing**
   - Test all CRUD operations
   - Verify data consistency
   - Test backup and restore functionality

2. **Error Handling Testing**
   - Simulate database failures
   - Test error boundary functionality
   - Verify notification system

3. **Migration Testing**
   - Test ID migration with sample data
   - Verify data integrity after migration
   - Test rollback procedures

### Day 9: User Acceptance Testing
1. **End-to-End Testing**
   - Complete workflow testing
   - Multi-fabric operations
   - Sub-checklist functionality

2. **Performance Testing**
   - Database query performance
   - Large dataset handling
   - Memory usage optimization

3. **Error Recovery Testing**
   - Database corruption scenarios
   - Network failure simulation
   - Application crash recovery

### Day 10: Documentation & Deployment
1. **Update Documentation**
   - API documentation
   - Database schema documentation
   - Migration procedures

2. **Deployment Preparation**
   - Build configuration updates
   - Distribution package testing
   - Installation procedures

3. **User Training Materials**
   - Migration guide for existing users
   - New feature documentation
   - Troubleshooting guide

---

## Risk Mitigation Strategies

### Data Loss Prevention
- **Automatic Backups**: Create backup before any migration
- **Rollback Procedures**: Ability to revert to previous state
- **Data Validation**: Verify data integrity at each step

### Compatibility Issues
- **Gradual Migration**: Support both old and new ID formats during transition
- **Fallback Mechanisms**: localStorage fallback if database fails
- **Version Compatibility**: Maintain backward compatibility

### Performance Impact
- **Database Indexing**: Proper indexes for query performance
- **Batch Operations**: Process large datasets in batches
- **Memory Management**: Efficient memory usage patterns

---

## Success Metrics

### Technical Metrics
- **Data Persistence**: 100% data retention across application restarts
- **Error Recovery**: 95% successful error recovery without data loss
- **Performance**: Database operations complete within 100ms
- **Reliability**: Zero ID collisions in production usage

### User Experience Metrics
- **Error Notifications**: Clear, actionable error messages
- **Recovery Time**: Less than 30 seconds to recover from errors
- **Migration Time**: Complete migration in under 5 minutes
- **User Satisfaction**: Improved stability and reliability

---

## Post-Implementation Monitoring

### Week 1 After Deployment
- Monitor error logs and user feedback
- Track database performance metrics
- Verify backup and restore procedures

### Week 2-4 After Deployment
- Analyze usage patterns and performance
- Collect user feedback on improvements
- Plan next phase enhancements

### Ongoing Maintenance
- Regular database maintenance and optimization
- Error log analysis and improvements
- Performance monitoring and tuning

---

## Conclusion

This implementation plan addresses all three critical issues with a comprehensive, phased approach that minimizes risk while maximizing reliability and user experience. The plan includes proper error handling, data persistence, and scalability improvements that will significantly enhance the application's robustness and maintainability.

The 2-week timeline is aggressive but achievable with focused development effort. Each phase builds upon the previous one, ensuring a stable foundation before adding complexity.
