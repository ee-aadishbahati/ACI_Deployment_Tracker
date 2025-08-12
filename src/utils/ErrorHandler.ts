export enum ErrorType {
    DATABASE_ERROR = 'DATABASE_ERROR',
    FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    MIGRATION_ERROR = 'MIGRATION_ERROR',
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
        
        if (window.electronAPI && 'logError' in window.electronAPI) {
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

    public static handleValidationError(message: string, details?: any): AppError {
        const appError = this.createError(
            ErrorType.VALIDATION_ERROR,
            message,
            details
        );
        
        this.logError(appError);
        return appError;
    }

    public static handleMigrationError(error: any, operation: string): AppError {
        const appError = this.createError(
            ErrorType.MIGRATION_ERROR,
            `Migration operation failed: ${operation}`,
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

    public static getErrorsByType(type: ErrorType): AppError[] {
        return this.errorLog.filter(error => error.type === type);
    }

    public static getRecentErrors(count: number = 10): AppError[] {
        return this.errorLog.slice(0, count);
    }
}
