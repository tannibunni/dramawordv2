export interface WechatAccessTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
    unionid?: string;
    errcode?: number;
    errmsg?: string;
}
export interface WechatUserInfoResponse {
    openid: string;
    nickname: string;
    sex: number;
    province: string;
    city: string;
    country: string;
    headimgurl: string;
    privilege: string[];
    unionid?: string;
    errcode?: number;
    errmsg?: string;
}
export interface WechatTokenCheckResponse {
    errcode: number;
    errmsg: string;
}
export declare class WechatService {
    static getAuthUrl(redirectUri: string, state?: string): string;
    static getAccessToken(code: string): Promise<WechatAccessTokenResponse>;
    static getUserInfo(accessToken: string, openid: string): Promise<WechatUserInfoResponse>;
    static refreshAccessToken(refreshToken: string): Promise<WechatAccessTokenResponse>;
    static checkAccessToken(accessToken: string, openid: string): Promise<boolean>;
    static login(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
        openid: string;
        unionid?: string;
        userInfo: WechatUserInfoResponse;
        expires_in: number;
    }>;
    static validateLoginParams(code: string): boolean;
    static generateState(): string;
    static validateState(state: string): boolean;
}
//# sourceMappingURL=wechatService.d.ts.map