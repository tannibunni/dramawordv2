"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const syncController_1 = require("../controllers/syncController");
const auth_1 = require("../middleware/auth");
const validateRequest_1 = require("../middleware/validateRequest");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.post('/upload', (0, validateRequest_1.validateRequest)({
    body: {
        learningRecords: { type: 'array', required: true },
        searchHistory: { type: 'array', required: false },
        userSettings: { type: 'object', required: false }
    }
}), syncController_1.SyncController.uploadData);
router.get('/download', syncController_1.SyncController.downloadData);
router.post('/force', (0, validateRequest_1.validateRequest)({
    body: {
        learningRecords: { type: 'array', required: true },
        searchHistory: { type: 'array', required: false },
        userSettings: { type: 'object', required: false }
    }
}), syncController_1.SyncController.forceSync);
router.post('/resolve-conflicts', (0, validateRequest_1.validateRequest)({
    body: {
        conflicts: { type: 'array', required: true },
        resolution: { type: 'string', required: true, enum: ['local', 'remote', 'merge', 'manual'] }
    }
}), syncController_1.SyncController.resolveConflicts);
router.get('/status', syncController_1.SyncController.getSyncStatus);
router.get('/history', (0, validateRequest_1.validateRequest)({
    query: {
        page: { type: 'number', required: false, min: 1 },
        limit: { type: 'number', required: false, min: 1, max: 100 }
    }
}), syncController_1.SyncController.getSyncHistory);
router.delete('/cleanup', (0, validateRequest_1.validateRequest)({
    query: {
        days: { type: 'number', required: false, min: 1, max: 365 }
    }
}), syncController_1.SyncController.cleanupSyncData);
exports.default = router;
//# sourceMappingURL=sync.js.map