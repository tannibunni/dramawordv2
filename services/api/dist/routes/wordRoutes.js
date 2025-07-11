"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wordController_1 = require("../controllers/wordController");
const router = (0, express_1.Router)();
router.post('/search', wordController_1.searchWord);
router.get('/popular', wordController_1.getPopularWords);
router.get('/recent-searches', wordController_1.getRecentSearches);
router.post('/history', wordController_1.saveSearchHistory);
router.delete('/clear-all', wordController_1.clearAllData);
router.delete('/clear-user-history', wordController_1.clearUserHistory);
router.get('/user/vocabulary', wordController_1.getUserVocabulary);
router.post('/user/vocabulary', wordController_1.addToUserVocabulary);
router.put('/user/progress', wordController_1.updateWordProgress);
router.delete('/user/vocabulary', wordController_1.removeFromUserVocabulary);
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Word routes are working!',
        timestamp: new Date().toISOString()
    });
});
router.get('/debug/environment', wordController_1.checkEnvironment);
router.get('/debug/openai', wordController_1.testOpenAI);
exports.default = router;
