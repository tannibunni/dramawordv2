"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatService = void 0;
const axios_1 = __importDefault(require("axios"));
const wechat_1 = require("../config/wechat");
const logger_1 = require("../utils/logger");
class WechatService {
    static getAuthUrl(redirectUri, state) {
        const params = new URLSearchParams({
            appid: wechat_1.wechatConfig.appId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: wechat_1.wechatConfig.scope,
            state: state || wechat_1.wechatConfig.state,
        });
        return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
    }
    static async getAccessToken(code) {
        try {
            const params = new URLSearchParams({
                appid: wechat_1.wechatConfig.appId,
                secret: wechat_1.wechatConfig.appSecret,
                code: code,
                grant_type: 'authorization_code',
            });
            const response = await axios_1.default.get(`${wechat_1.wechatConfig.api.accessToken}?${params.toString()}`);
            const data = response.data;
            if (data.errcode) {
                const errorMessage = wechat_1.wechatErrorCodes[String(data.errcode)] || data.errmsg || '未知错误';
                logger_1.logger.error(`微信获取access_token失败: ${data.errcode} - ${errorMessage}`);
                throw new Error(`微信登录失败: ${errorMessage}`);
            }
            logger_1.logger.info(`微信获取access_token成功: openid=${data.openid}`);
            return data;
        }
        catch (error) {
            logger_1.logger.error('微信获取access_token异常:', error);
            throw new Error('微信登录服务异常');
        }
    }
    static async getUserInfo(accessToken, openid) {
        try {
            const params = new URLSearchParams({
                access_token: accessToken,
                openid: openid,
                lang: 'zh_CN',
            });
            const response = await axios_1.default.get(`${wechat_1.wechatConfig.api.userInfo}?${params.toString()}`);
            const data = response.data;
            if (data.errcode) {
                const errorMessage = wechat_1.wechatErrorCodes[String(data.errcode)] || data.errmsg || '未知错误';
                logger_1.logger.error(`微信获取用户信息失败: ${data.errcode} - ${errorMessage}`);
                throw new Error(`获取用户信息失败: ${errorMessage}`);
            }
            logger_1.logger.info(`微信获取用户信息成功: nickname=${data.nickname}`);
            return data;
        }
        catch (error) {
            logger_1.logger.error('微信获取用户信息异常:', error);
            throw new Error('获取用户信息异常');
        }
    }
    static async refreshAccessToken(refreshToken) {
        try {
            const params = new URLSearchParams({
                appid: wechat_1.wechatConfig.appId,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            });
            const response = await axios_1.default.get(`${wechat_1.wechatConfig.api.refreshToken}?${params.toString()}`);
            const data = response.data;
            if (data.errcode) {
                const errorMessage = wechat_1.wechatErrorCodes[String(data.errcode)] || data.errmsg || '未知错误';
                logger_1.logger.error(`微信刷新access_token失败: ${data.errcode} - ${errorMessage}`);
                throw new Error(`刷新token失败: ${errorMessage}`);
            }
            logger_1.logger.info(`微信刷新access_token成功: openid=${data.openid}`);
            return data;
        }
        catch (error) {
            logger_1.logger.error('微信刷新access_token异常:', error);
            throw new Error('刷新token异常');
        }
    }
    static async checkAccessToken(accessToken, openid) {
        try {
            const params = new URLSearchParams({
                access_token: accessToken,
                openid: openid,
            });
            const response = await axios_1.default.get(`${wechat_1.wechatConfig.api.checkToken}?${params.toString()}`);
            const data = response.data;
            if (data.errcode === 0) {
                logger_1.logger.info(`微信access_token有效: openid=${openid}`);
                return true;
            }
            else {
                logger_1.logger.warn(`微信access_token无效: ${data.errcode} - ${data.errmsg}`);
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error('微信检查access_token异常:', error);
            return false;
        }
    }
    static async login(code) {
        try {
            const tokenResponse = await this.getAccessToken(code);
            const userInfo = await this.getUserInfo(tokenResponse.access_token, tokenResponse.openid);
            logger_1.logger.info(`微信登录成功: openid=${tokenResponse.openid}, nickname=${userInfo.nickname}`);
            return {
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                openid: tokenResponse.openid,
                unionid: tokenResponse.unionid || undefined,
                userInfo,
                expires_in: tokenResponse.expires_in,
            };
        }
        catch (error) {
            logger_1.logger.error('微信登录流程异常:', error);
            throw error;
        }
    }
    static validateLoginParams(code) {
        if (!code || typeof code !== 'string' || code.length === 0) {
            return false;
        }
        return true;
    }
    static generateState() {
        return `${wechat_1.wechatConfig.state}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    static validateState(state) {
        if (!state || typeof state !== 'string') {
            return false;
        }
        return state.startsWith(wechat_1.wechatConfig.state);
    }
}
exports.WechatService = WechatService;
