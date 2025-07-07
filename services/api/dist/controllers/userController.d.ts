import { Request, Response } from 'express';
export declare class UserController {
    static register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getUserInfo(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateUserInfo(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateUserSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getUserStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static deleteAccount(req: Request, res: Response): Promise<void>;
    static uploadAvatar(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=userController.d.ts.map