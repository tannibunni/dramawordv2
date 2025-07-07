"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const validateRequest_1 = require("../middleware/validateRequest");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.post('/register', (0, validateRequest_1.validateRequest)({
    body: {
        username: { type: 'string', required: true, minLength: 3, maxLength: 20 },
        nickname: { type: 'string', required: true, maxLength: 30 },
        loginType: { type: 'string', required: true, enum: ['phone', 'wechat', 'apple', 'guest'] },
        phoneNumber: { type: 'string', required: false },
        wechatId: { type: 'string', required: false },
        appleId: { type: 'string', required: false },
        guestId: { type: 'string', required: false }
    }
}), userController_1.UserController.register);
router.post('/login', (0, validateRequest_1.validateRequest)({
    body: {
        loginType: { type: 'string', required: true, enum: ['phone', 'wechat', 'apple', 'guest'] },
        phoneNumber: { type: 'string', required: false },
        wechatId: { type: 'string', required: false },
        appleId: { type: 'string', required: false },
        guestId: { type: 'string', required: false }
    }
}), userController_1.UserController.login);
router.get('/profile', auth_1.authenticateToken, userController_1.UserController.getUserInfo);
router.put('/profile', auth_1.authenticateToken, (0, validateRequest_1.validateRequest)({
    body: {
        nickname: { type: 'string', required: false, maxLength: 30 },
        avatar: { type: 'string', required: false },
        email: { type: 'string', required: false, format: 'email' }
    }
}), userController_1.UserController.updateUserInfo);
router.put('/settings', auth_1.authenticateToken, (0, validateRequest_1.validateRequest)({
    body: {
        settings: { type: 'object', required: true }
    }
}), userController_1.UserController.updateUserSettings);
router.get('/stats', auth_1.authenticateToken, userController_1.UserController.getUserStats);
router.delete('/account', auth_1.authenticateToken, userController_1.UserController.deleteAccount);
router.post('/avatar', auth_1.authenticateToken, upload_1.uploadAvatar.single('avatar'), userController_1.UserController.uploadAvatar);
exports.default = router;
//# sourceMappingURL=user.js.map