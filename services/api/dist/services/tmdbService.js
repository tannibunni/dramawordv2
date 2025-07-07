"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TMDBService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
class TMDBService {
    static getAuthHeaders() {
        if (TMDB_ACCESS_TOKEN) {
            return {
                'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            };
        }
        else if (TMDB_API_KEY) {
            return {
                'Content-Type': 'application/json'
            };
        }
        else {
            throw new Error('TMDB API credentials not configured');
        }
    }
    static getAuthParams() {
        if (TMDB_API_KEY) {
            return { api_key: TMDB_API_KEY };
        }
        return {};
    }
    static async searchShows(query, page = 1) {
        try {
            const params = new URLSearchParams({
                query,
                page: page.toString(),
                include_adult: 'false',
                language: 'zh-CN',
                ...this.getAuthParams()
            });
            const response = await axios_1.default.get(`${TMDB_BASE_URL}/search/tv?${params.toString()}`, { headers: this.getAuthHeaders() });
            const data = response.data;
            logger_1.logger.info(`TMDB search successful: "${query}" - ${data.results.length} results`);
            return data;
        }
        catch (error) {
            logger_1.logger.error('TMDB search failed:', error);
            throw new Error(`Failed to search shows: ${error}`);
        }
    }
    static async getShowDetails(showId) {
        try {
            const params = new URLSearchParams({
                language: 'zh-CN',
                ...this.getAuthParams()
            });
            const response = await axios_1.default.get(`${TMDB_BASE_URL}/tv/${showId}?${params.toString()}`, { headers: this.getAuthHeaders() });
            logger_1.logger.info(`TMDB show details retrieved: ID ${showId}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`TMDB get show details failed for ID ${showId}:`, error);
            throw new Error(`Failed to get show details: ${error}`);
        }
    }
    static async getSeasonDetails(showId, seasonNumber) {
        try {
            const params = new URLSearchParams({
                language: 'zh-CN',
                ...this.getAuthParams()
            });
            const response = await axios_1.default.get(`${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}?${params.toString()}`, { headers: this.getAuthHeaders() });
            logger_1.logger.info(`TMDB season details retrieved: Show ${showId}, Season ${seasonNumber}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`TMDB get season details failed: Show ${showId}, Season ${seasonNumber}:`, error);
            throw new Error(`Failed to get season details: ${error}`);
        }
    }
    static async getSimilarShows(showId, page = 1) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                language: 'zh-CN',
                ...this.getAuthParams()
            });
            const response = await axios_1.default.get(`${TMDB_BASE_URL}/tv/${showId}/similar?${params.toString()}`, { headers: this.getAuthHeaders() });
            const data = response.data;
            logger_1.logger.info(`TMDB similar shows retrieved: Show ${showId} - ${data.results.length} results`);
            return data;
        }
        catch (error) {
            logger_1.logger.error(`TMDB get similar shows failed for ID ${showId}:`, error);
            throw new Error(`Failed to get similar shows: ${error}`);
        }
    }
    static async getPopularShows(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                language: 'zh-CN',
                ...this.getAuthParams()
            });
            const response = await axios_1.default.get(`${TMDB_BASE_URL}/tv/popular?${params.toString()}`, { headers: this.getAuthHeaders() });
            const data = response.data;
            logger_1.logger.info(`TMDB popular shows retrieved: ${data.results.length} results`);
            return data;
        }
        catch (error) {
            logger_1.logger.error('TMDB get popular shows failed:', error);
            throw new Error(`Failed to get popular shows: ${error}`);
        }
    }
    static async getOnTheAirShows(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                language: 'zh-CN',
                ...this.getAuthParams()
            });
            const response = await axios_1.default.get(`${TMDB_BASE_URL}/tv/on_the_air?${params.toString()}`, { headers: this.getAuthHeaders() });
            const data = response.data;
            logger_1.logger.info(`TMDB on the air shows retrieved: ${data.results.length} results`);
            return data;
        }
        catch (error) {
            logger_1.logger.error('TMDB get on the air shows failed:', error);
            throw new Error(`Failed to get on the air shows: ${error}`);
        }
    }
    static getImageUrl(path, size = 'w500') {
        if (!path)
            return '';
        return `https://image.tmdb.org/t/p/${size}${path}`;
    }
    static checkConfiguration() {
        const hasApiKey = !!TMDB_API_KEY;
        const hasAccessToken = !!TMDB_ACCESS_TOKEN;
        const isConfigured = hasApiKey || hasAccessToken;
        logger_1.logger.info(`TMDB Configuration: API Key=${hasApiKey}, Access Token=${hasAccessToken}, Configured=${isConfigured}`);
        return { hasApiKey, hasAccessToken, isConfigured };
    }
}
exports.TMDBService = TMDBService;
