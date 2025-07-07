import { Request, Response } from 'express';
export declare const searchWord: (req: Request, res: Response) => Promise<void>;
export declare const getPopularWords: (req: Request, res: Response) => Promise<void>;
export declare const getRecentSearches: (req: Request, res: Response) => Promise<void>;
export declare const saveSearchHistory: (req: Request, res: Response) => Promise<void>;
export declare const wordController: {
    searchWord: (req: Request, res: Response) => Promise<void>;
    getPopularWords: (req: Request, res: Response) => Promise<void>;
    getRecentSearches: (req: Request, res: Response) => Promise<void>;
    saveSearchHistory: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=wordController.d.ts.map