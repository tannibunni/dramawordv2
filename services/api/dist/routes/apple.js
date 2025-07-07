"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appleController_1 = require("../controllers/appleController");
const validateRequest_1 = require("../middleware/validateRequest");
const router = express_1.default.Router();
router.post('/login', (0, validateRequest_1.validateRequest)({
    body: { idToken: { type: 'string', required: true } }
}), appleController_1.AppleController.login);
exports.default = router;
//# sourceMappingURL=apple.js.map