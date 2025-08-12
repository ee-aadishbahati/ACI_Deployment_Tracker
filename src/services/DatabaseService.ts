import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { SubChecklist } from '../types';
import { ErrorHandler } from '../utils/ErrorHandler';
import { IdGenerationService } from './IdGenerationService';

export interface DatabaseConfig {
    dbPath?: string;
    enableWAL?: boolean;
    enableForeignKeys?: boolean;
}

export class DatabaseService {
    private db: Database.Database;
    private static instance: DatabaseService;
    private isInitialized = false;

    private constructor(config: DatabaseConfig = {}) {
        try {
            const dbPath = config.dbPath || path.join(process.cwd(), 'aci-deployment-tracker.db');
            
            this.db = new Database(dbPath);
            
            if (config.enableWAL !== false) {
                this.db.pragma('journal_mode = WAL');
            }
            
            if (config.enableForeignKeys !== false) {
                this.db.pragma('foreign_keys = ON');
            }
            
            this.initializeDatabase();
            this.isInitialized = true;
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'DatabaseService constructor');
            throw error;
        }
    }

    public static getInstance(config?: DatabaseConfig): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService(config);
        }
        return DatabaseService.instance;
    }

    private initializeDatabase(): void {
        try {
            const schemaPath = path.join(__dirname, '../database/schema.sql');
            let schema: string;
            
            try {
                schema = fs.readFileSync(schemaPath, 'utf8');
            } catch (error) {
                schema = this.getInlineSchema();
            }
            
            this.db.exec(schema);
            
            this.initializeDefaultData();
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'initializeDatabase');
            throw error;
        }
    }

    private getInlineSchema(): string {
        return `
            -- Fabrics table
            CREATE TABLE IF NOT EXISTS fabrics (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                site TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Tasks table
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                fabric_specific BOOLEAN DEFAULT 1,
                ndo_centralized BOOLEAN DEFAULT 0,
                section_id TEXT NOT NULL,
                subsection_title TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sub_checklist_id) REFERENCES sub_checklists(id),
                FOREIGN KEY (task_id) REFERENCES tasks(id)
            );

            -- Application settings
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Error logs
            CREATE TABLE IF NOT EXISTS error_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                error_type TEXT NOT NULL,
                message TEXT NOT NULL,
                details TEXT,
                stack_trace TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_task_states_fabric ON task_states(fabric_id);
            CREATE INDEX IF NOT EXISTS idx_task_states_task ON task_states(task_id);
            CREATE INDEX IF NOT EXISTS idx_sub_checklist_items_checklist ON sub_checklist_items(sub_checklist_id);
            CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_tasks_section ON tasks(section_id);
        `;
    }

    private initializeDefaultData(): void {
        try {
            const fabricCount = this.db.prepare('SELECT COUNT(*) as count FROM fabrics').get() as { count: number };
            
            if (fabricCount.count === 0) {
                const insertFabric = this.db.prepare(`
                    INSERT INTO fabrics (id, name, site, type, description) 
                    VALUES (?, ?, ?, ?, ?)
                `);
                
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
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'initializeDefaultData');
        }
    }

    public updateTaskState(taskId: string, fabricId: string, checked: boolean): void {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO task_states (task_id, fabric_id, checked, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(taskId, fabricId, checked ? 1 : 0);
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'updateTaskState');
            throw error;
        }
    }

    public updateTaskNotes(taskId: string, fabricId: string, notes: string): void {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO task_states (task_id, fabric_id, notes, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(taskId, fabricId, notes);
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'updateTaskNotes');
            throw error;
        }
    }

    public getTaskStates(fabricId: string): { [taskId: string]: { checked: boolean; notes: string } } {
        try {
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
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'getTaskStates');
            return {};
        }
    }

    public getAllTaskStates(): { [fabricId: string]: { [taskId: string]: { checked: boolean; notes: string } } } {
        try {
            const stmt = this.db.prepare(`
                SELECT fabric_id, task_id, checked, notes 
                FROM task_states
            `);
            
            const rows = stmt.all() as Array<{
                fabric_id: string;
                task_id: string;
                checked: number;
                notes: string;
            }>;
            
            const result: { [fabricId: string]: { [taskId: string]: { checked: boolean; notes: string } } } = {};
            
            rows.forEach(row => {
                if (!result[row.fabric_id]) {
                    result[row.fabric_id] = {};
                }
                result[row.fabric_id][row.task_id] = {
                    checked: Boolean(row.checked),
                    notes: row.notes || ''
                };
            });
            
            return result;
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'getAllTaskStates');
            return {};
        }
    }

    public saveSubChecklist(name: string, items: any[], fabricId: string): void {
        const transaction = this.db.transaction(() => {
            try {
                const checklistId = IdGenerationService.generateSubChecklistId();
                
                const insertChecklist = this.db.prepare(`
                    INSERT INTO sub_checklists (id, name, fabric_id, created_date, last_modified)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `);
                insertChecklist.run(checklistId, name, fabricId);
                
                const insertItem = this.db.prepare(`
                    INSERT INTO sub_checklist_items (id, sub_checklist_id, task_id, checked, notes)
                    VALUES (?, ?, ?, ?, ?)
                `);
                
                items.forEach(item => {
                    insertItem.run(
                        IdGenerationService.generateGenericId('item'), 
                        checklistId, 
                        item.id, 
                        item.checked ? 1 : 0, 
                        item.notes || ''
                    );
                });
            } catch (error) {
                ErrorHandler.handleDatabaseError(error, 'saveSubChecklist transaction');
                throw error;
            }
        });
        
        try {
            transaction();
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'saveSubChecklist');
            throw error;
        }
    }

    public getSubChecklists(): { [name: string]: SubChecklist } {
        try {
            const stmt = this.db.prepare(`
                SELECT sc.name, sc.fabric_id, sc.created_date, sc.last_modified,
                       sci.task_id, sci.checked, sci.notes as item_notes
                FROM sub_checklists sc
                LEFT JOIN sub_checklist_items sci ON sc.id = sci.sub_checklist_id
                ORDER BY sc.name, sci.id
            `);
            
            const rows = stmt.all() as Array<{
                name: string;
                fabric_id: string;
                created_date: string;
                last_modified: string;
                task_id: string | null;
                checked: number | null;
                item_notes: string | null;
            }>;
            
            const result: { [name: string]: SubChecklist } = {};
            
            rows.forEach(row => {
                if (!result[row.name]) {
                    result[row.name] = {
                        name: row.name,
                        fabricId: row.fabric_id,
                        createdDate: row.created_date,
                        lastModified: row.last_modified,
                        items: []
                    };
                }
                
                if (row.task_id) {
                    result[row.name].items.push({
                        id: row.task_id,
                        text: '', // Will be populated from task data
                        checked: Boolean(row.checked),
                        notes: row.item_notes || '',
                        fabricId: row.fabric_id
                    });
                }
            });
            
            return result;
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'getSubChecklists');
            return {};
        }
    }

    public deleteSubChecklist(name: string): void {
        const transaction = this.db.transaction(() => {
            try {
                const getIdStmt = this.db.prepare('SELECT id FROM sub_checklists WHERE name = ?');
                const checklist = getIdStmt.get(name) as { id: string } | undefined;
                
                if (checklist) {
                    const deleteItemsStmt = this.db.prepare('DELETE FROM sub_checklist_items WHERE sub_checklist_id = ?');
                    deleteItemsStmt.run(checklist.id);
                    
                    const deleteChecklistStmt = this.db.prepare('DELETE FROM sub_checklists WHERE id = ?');
                    deleteChecklistStmt.run(checklist.id);
                }
            } catch (error) {
                ErrorHandler.handleDatabaseError(error, 'deleteSubChecklist transaction');
                throw error;
            }
        });
        
        try {
            transaction();
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'deleteSubChecklist');
            throw error;
        }
    }

    public createBackup(): string {
        try {
            const backupDir = path.join(process.cwd(), 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `backup-${timestamp}.db`);
            
            this.db.backup(backupFile);
            return backupFile;
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'createBackup');
            throw error;
        }
    }

    public migrateFromLocalStorage(localStorageData: any): void {
        const transaction = this.db.transaction(() => {
            try {
                if (localStorageData.fabricStates) {
                    Object.entries(localStorageData.fabricStates).forEach(([fabricId, tasks]: [string, any]) => {
                        Object.entries(tasks).forEach(([taskId, checked]: [string, any]) => {
                            this.updateTaskState(taskId, fabricId, Boolean(checked));
                        });
                    });
                }
                
                if (localStorageData.fabricNotes) {
                    Object.entries(localStorageData.fabricNotes).forEach(([fabricId, tasks]: [string, any]) => {
                        Object.entries(tasks).forEach(([taskId, notes]: [string, any]) => {
                            this.updateTaskNotes(taskId, fabricId, String(notes));
                        });
                    });
                }
                
                if (localStorageData.subChecklists) {
                    Object.entries(localStorageData.subChecklists).forEach(([name, checklist]: [string, any]) => {
                        this.saveSubChecklist(name, checklist.items, checklist.fabricId);
                    });
                }
            } catch (error) {
                ErrorHandler.handleMigrationError(error, 'migrateFromLocalStorage transaction');
                throw error;
            }
        });
        
        try {
            transaction();
        } catch (error) {
            ErrorHandler.handleMigrationError(error, 'migrateFromLocalStorage');
            throw error;
        }
    }

    public logError(error: any): void {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO error_logs (error_type, message, details, stack_trace, timestamp)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);
            
            stmt.run(
                error.type || 'UNKNOWN_ERROR',
                error.message || 'Unknown error',
                JSON.stringify(error.details || {}),
                error.stack || null
            );
        } catch (dbError) {
            console.error('Failed to log error to database:', dbError);
        }
    }

    public getSetting(key: string): string | null {
        try {
            const stmt = this.db.prepare('SELECT value FROM app_settings WHERE key = ?');
            const result = stmt.get(key) as { value: string } | undefined;
            return result?.value || null;
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'getSetting');
            return null;
        }
    }

    public setSetting(key: string, value: string): void {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO app_settings (key, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(key, value);
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'setSetting');
            throw error;
        }
    }

    public isReady(): boolean {
        return this.isInitialized;
    }

    public close(): void {
        try {
            if (this.db) {
                this.db.close();
            }
        } catch (error) {
            ErrorHandler.handleDatabaseError(error, 'close');
        }
    }
}
