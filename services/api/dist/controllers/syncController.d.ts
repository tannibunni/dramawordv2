import { Request, Response } from 'express';
export declare class SyncController {
    static uploadData(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static downloadData(req: Request, res: Response): Promise<void>;
    static resolveConflicts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getSyncStatus(req: Request, res: Response): Promise<void>;
    static forceSync(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getSyncHistory(req: Request, res: Response): Promise<void>;
    static cleanupSyncData(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=syncController.d.ts.map