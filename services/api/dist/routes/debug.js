"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const https_1 = __importDefault(require("https"));
const router = (0, express_1.Router)();
function getOutboundIP() {
    return new Promise((resolve, reject) => {
        https_1.default.get('https://ipinfo.io/json', (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const ipInfo = JSON.parse(data);
                    resolve(ipInfo.ip);
                }
                catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}
router.get('/outbound-ip', async (req, res) => {
    try {
        const ip = await getOutboundIP();
        res.json({
            success: true,
            outboundIP: ip,
            message: '请将此 IP 添加到 MongoDB Atlas 的 IP 白名单中',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get outbound IP',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/service-info', (req, res) => {
    res.json({
        success: true,
        service: 'DramaWord API',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 'not set',
        timestamp: new Date().toISOString(),
        headers: req.headers
    });
});
exports.default = router;
