import { Request, Response } from 'express';
export declare class UserController {
    static register(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getUserInfo(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateUserInfo(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateUserSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getUserStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static deleteAccount(req: Request, res: Response): Promise<void>;
    static uploadAvatar(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=userController.d.ts.map