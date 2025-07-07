"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wechatController_1 = require("../controllers/wechatController");
const auth_1 = require("../middleware/auth");
const validateRequest_1 = require("../middleware/validateRequest");
const router = express_1.default.Router();
router.post('/login', (0, validateRequest_1.validateRequest)({
    body: {
        code: { type: 'string', required: true },
        state: { type: 'string', required: false }
    }
}), wechatController_1.WechatController.login);
router.post('/refresh', (0, validateRequest_1.validateRequest)({
    body: {
        refreshToken: { type: 'string', required: true }
    }
}), wechatController_1.WechatController.refreshToken);
router.post('/check-token', (0, validateRequest_1.validateRequest)({
    body: {
        accessToken: { type: 'string', required: true },
        openid: { type: 'string', required: true }
    }
}), wechatController_1.WechatController.checkToken);
router.post('/auth-url', (0, validateRequest_1.validateRequest)({
    body: {
        redirectUri: { type: 'string', required: true },
        state: { type: 'string', required: false }
    }
}), wechatController_1.WechatController.getAuthUrl);
router.post('/unbind', auth_1.authenticateToken, wechatController_1.WechatController.unbind);
exports.default = router;
