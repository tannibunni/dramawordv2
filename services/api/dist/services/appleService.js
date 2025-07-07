"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleService = void 0;
const apple_signin_auth_1 = __importDefault(require("apple-signin-auth"));
const apple_1 = require("../config/apple");
class AppleService {
    static async verifyIdToken(idToken) {
        return apple_signin_auth_1.default.verifyIdToken(idToken, {
            audience: apple_1.appleConfig.clientId,
            ignoreExpiration: false,
        });
    }
}
exports.AppleService = AppleService;
//# sourceMappingURL=appleService.js.map