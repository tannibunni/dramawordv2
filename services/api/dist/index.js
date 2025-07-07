"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('🔧 Environment check:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./config/database");
const wordRoutes_1 = require("./routes/wordRoutes");
const user_1 = __importDefault(require("./routes/user"));
const sync_1 = __importDefault(require("./routes/sync"));
const wechat_1 = __importDefault(require("./routes/wechat"));
const apple_1 = __importDefault(require("./routes/apple"));
const tmdb_1 = __importDefault(require("./routes/tmdb"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static('uploads'));
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`);
    next();
});
app.use('/api/words', wordRoutes_1.wordRoutes);
app.use('/api/users', user_1.default);
app.use('/api/sync', sync_1.default);
app.use('/api/wechat', wechat_1.default);
app.use('/api/apple', apple_1.default);
app.use('/api/tmdb', tmdb_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use((err, req, res, next) => {
    logger_1.logger.error('API Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
const startServer = async () => {
    try {
        await (0, database_1.connectDatabase)();
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 API Server running on port ${PORT}`);
            logger_1.logger.info(`📡 Health check: http://localhost:${PORT}/health`);
            logger_1.logger.info(`👥 User API: http://localhost:${PORT}/api/users`);
            logger_1.logger.info(`🔄 Sync API: http://localhost:${PORT}/api/sync`);
            logger_1.logger.info(`💬 WeChat API: http://localhost:${PORT}/api/wechat`);
            logger_1.logger.info(`🎬 TMDB API: http://localhost:${PORT}/api/tmdb`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
