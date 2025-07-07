export interface ISyncData {
    userId: string;
    learningRecords: any[];
    searchHistory: any[];
    userSettings: any;
    lastSyncTime: Date;
    deviceId: string;
}
export interface ISyncResult {
    success: boolean;
    message: string;
    data?: {
        learningRecords: any[];
        searchHistory: any[];
        userSettings: any;
        conflicts?: any[];
    };
    errors?: string[];
}
export type ConflictResolution = 'local' | 'remote' | 'merge' | 'manual';
export declare class SyncService {
    private static instance;
    private constructor();
    static getInstance(): SyncService;
    uploadData(userId: string, syncData: ISyncData): Promise<ISyncResult>;
    downloadData(userId: string): Promise<ISyncResult>;
    private syncLearningRecords;
    private syncSearchHistory;
    private syncUserSettings;
    private hasConflict;
    private mergeRecords;
    private mergeSettings;
    resolveConflicts(userId: string, conflicts: any[], resolution: ConflictResolution): Promise<ISyncResult>;
    getSyncStatus(userId: string): Promise<{
        lastSyncTime: Date | null;
        hasUnsyncedData: boolean;
        conflicts: any[];
    }>;
}
declare const _default: SyncService;
export default _default;
//# sourceMappingURL=syncService.d.ts.map