import { Request, Response } from 'express';
export declare class WechatController {
    static login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static checkToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getAuthUrl(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static unbind(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=wechatController.d.ts.map