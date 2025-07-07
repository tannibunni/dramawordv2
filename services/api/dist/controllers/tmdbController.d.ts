import { Request, Response } from 'express';
export declare class TMDBController {
    static searchShows(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getShowDetails(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getSeasonDetails(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getSimilarShows(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getPopularShows(req: Request, res: Response): Promise<void>;
    static getOnTheAirShows(req: Request, res: Response): Promise<void>;
    static getStatus(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=tmdbController.d.ts.map