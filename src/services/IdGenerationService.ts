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

    public static generateFabricId(): string {
        let id: string;
        do {
            id = `fabric-${uuidv4()}`;
        } while (this.usedIds.has(id));
        
        this.usedIds.add(id);
        return id;
    }

    public static generateGenericId(prefix: string = 'id'): string {
        let id: string;
        do {
            id = `${prefix}-${uuidv4()}`;
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

    public static registerExistingIds(ids: string[]): void {
        ids.forEach(id => this.usedIds.add(id));
    }

    public static clearRegistry(): void {
        this.usedIds.clear();
    }

    public static getRegisteredIds(): string[] {
        return Array.from(this.usedIds);
    }
}
