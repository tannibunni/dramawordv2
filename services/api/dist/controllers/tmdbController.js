"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TMDBController = void 0;
const tmdbService_1 = require("../services/tmdbService");
const logger_1 = require("../utils/logger");
class TMDBController {
    static async searchShows(req, res) {
        try {
            const { query, page = 1 } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Query parameter is required'
                });
            }
            const results = await tmdbService_1.TMDBService.searchShows(query, parseInt(page));
            logger_1.logger.info(`TMDB search successful: "${query}" - ${results.results.length} results`);
            res.json({
                success: true,
                data: results
            });
        }
        catch (error) {
            logger_1.logger.error('TMDB search failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search shows'
            });
        }
    }
    static async getShowDetails(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Show ID is required'
                });
            }
            const showId = parseInt(id);
            if (isNaN(showId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid show ID'
                });
            }
            const show = await tmdbService_1.TMDBService.getShowDetails(showId);
            res.json({
                success: true,
                data: show
            });
        }
        catch (error) {
            logger_1.logger.error('TMDB show details failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get show details'
            });
        }
    }
    static async getSeasonDetails(req, res) {
        try {
            const { id, seasonNumber } = req.params;
            if (!id || !seasonNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Show ID and season number are required'
                });
            }
            const showId = parseInt(id);
            const season = parseInt(seasonNumber);
            if (isNaN(showId) || isNaN(season)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid show ID or season number'
                });
            }
            const seasonDetails = await tmdbService_1.TMDBService.getSeasonDetails(showId, season);
            res.json({
                success: true,
                data: seasonDetails
            });
        }
        catch (error) {
            logger_1.logger.error('TMDB season details failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get season details'
            });
        }
    }
    static async getSimilarShows(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Show ID is required'
                });
            }
            const showId = parseInt(id);
            if (isNaN(showId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid show ID'
                });
            }
            const similarShows = await tmdbService_1.TMDBService.getSimilarShows(showId);
            res.json({
                success: true,
                data: similarShows
            });
        }
        catch (error) {
            logger_1.logger.error('TMDB similar shows failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get similar shows'
            });
        }
    }
    static async getPopularShows(req, res) {
        try {
            const { page = 1 } = req.query;
            const results = await tmdbService_1.TMDBService.getPopularShows(parseInt(page));
            res.json({
                success: true,
                data: results
            });
        }
        catch (error) {
            logger_1.logger.error('TMDB popular shows failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get popular shows'
            });
        }
    }
    static async getOnTheAirShows(req, res) {
        try {
            const { page = 1 } = req.query;
            const results = await tmdbService_1.TMDBService.getOnTheAirShows(parseInt(page));
            res.json({
                success: true,
                data: results
            });
        }
        catch (error) {
            logger_1.logger.error('TMDB on-the-air shows failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get on-the-air shows'
            });
        }
    }
    static async getStatus(req, res) {
        try {
            const status = {
                configured: !!process.env.TMDB_API_KEY,
                apiKey: process.env.TMDB_API_KEY ? '***' + process.env.TMDB_API_KEY.slice(-4) : 'not set'
            };
            res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            logger_1.logger.error('TMDB status check failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check TMDB status'
            });
        }
    }
}
exports.TMDBController = TMDBController;
