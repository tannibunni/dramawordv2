"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const User_1 = require("../models/User");
const UserLearningRecord_1 = require("../models/UserLearningRecord");
const SearchHistory_1 = require("../models/SearchHistory");
class SyncService {
    constructor() { }
    static getInstance() {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }
    async uploadData(userId, syncData) {
        try {
            const user = await User_1.User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在',
                    errors: ['User not found']
                };
            }
            const result = {
                success: true,
                message: '数据上传成功',
                data: {
                    learningRecords: [],
                    searchHistory: [],
                    userSettings: {}
                }
            };
            if (syncData.learningRecords && syncData.learningRecords.length > 0) {
                const learningResult = await this.syncLearningRecords(userId, syncData.learningRecords);
                result.data.learningRecords = learningResult;
            }
            if (syncData.searchHistory && syncData.searchHistory.length > 0) {
                const historyResult = await this.syncSearchHistory(userId, syncData.searchHistory);
                result.data.searchHistory = historyResult;
            }
            if (syncData.userSettings) {
                const settingsResult = await this.syncUserSettings(userId, syncData.userSettings);
                result.data.userSettings = settingsResult;
            }
            await User_1.User.findByIdAndUpdate(userId, { 'auth.lastLoginAt': new Date() });
            return result;
        }
        catch (error) {
            return {
                success: false,
                message: '数据上传失败',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async downloadData(userId) {
        try {
            const user = await User_1.User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在',
                    errors: ['User not found']
                };
            }
            const learningRecords = await UserLearningRecord_1.UserLearningRecord.findOne({ userId });
            const searchHistory = await SearchHistory_1.SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(100);
            const userSettings = user.settings;
            return {
                success: true,
                message: '数据下载成功',
                data: {
                    learningRecords: learningRecords ? learningRecords.records : [],
                    searchHistory: searchHistory,
                    userSettings: userSettings
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: '数据下载失败',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async syncLearningRecords(userId, localRecords) {
        let userLearningRecord = await UserLearningRecord_1.UserLearningRecord.findOne({ userId });
        if (!userLearningRecord) {
            userLearningRecord = new UserLearningRecord_1.UserLearningRecord({
                userId,
                records: [],
                totalWords: 0,
                totalReviews: 0,
                averageMastery: 0,
                lastStudyDate: new Date()
            });
        }
        const conflicts = [];
        const syncedRecords = [];
        for (const localRecord of localRecords) {
            const existingRecord = userLearningRecord.records.find((r) => r.word === localRecord.word);
            if (existingRecord) {
                if (this.hasConflict(existingRecord, localRecord)) {
                    conflicts.push({
                        word: localRecord.word,
                        local: localRecord,
                        remote: existingRecord
                    });
                    const mergedRecord = this.mergeRecords(existingRecord, localRecord);
                    Object.assign(existingRecord, mergedRecord);
                }
                else {
                    const mergedRecord = this.mergeRecords(existingRecord, localRecord);
                    Object.assign(existingRecord, mergedRecord);
                }
            }
            else {
                userLearningRecord.records.push(localRecord);
                userLearningRecord.totalWords += 1;
            }
            syncedRecords.push(localRecord);
        }
        if (userLearningRecord.records.length > 0) {
            const totalMastery = userLearningRecord.records.reduce((sum, record) => sum + record.mastery, 0);
            userLearningRecord.averageMastery = Math.round(totalMastery / userLearningRecord.records.length);
        }
        else {
            userLearningRecord.averageMastery = 0;
        }
        await userLearningRecord.save();
        return syncedRecords;
    }
    async syncSearchHistory(userId, localHistory) {
        const syncedHistory = [];
        for (const localItem of localHistory) {
            const existingItem = await SearchHistory_1.SearchHistory.findOne({
                userId,
                word: localItem.word,
                timestamp: localItem.timestamp
            });
            if (!existingItem) {
                const newHistory = new SearchHistory_1.SearchHistory({
                    userId,
                    word: localItem.word,
                    definition: localItem.definition,
                    timestamp: localItem.timestamp
                });
                await newHistory.save();
                syncedHistory.push(newHistory);
            }
        }
        return syncedHistory;
    }
    async syncUserSettings(userId, localSettings) {
        const user = await User_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const mergedSettings = this.mergeSettings(user.settings, localSettings);
        user.settings = mergedSettings;
        if (!user.settings.privacy) {
            user.settings.privacy = {
                shareProgress: false,
                showInLeaderboard: true
            };
        }
        await user.save();
        return mergedSettings;
    }
    hasConflict(remoteRecord, localRecord) {
        const remoteTime = new Date(remoteRecord.lastReviewDate).getTime();
        const localTime = new Date(localRecord.lastReviewDate).getTime();
        const timeDiff = Math.abs(remoteTime - localTime);
        return timeDiff < 3600000 &&
            remoteRecord.reviewCount > 0 &&
            localRecord.reviewCount > 0;
    }
    mergeRecords(remoteRecord, localRecord) {
        const merged = { ...remoteRecord };
        merged.reviewCount = Math.max(remoteRecord.reviewCount, localRecord.reviewCount);
        merged.correctCount = Math.max(remoteRecord.correctCount, localRecord.correctCount);
        merged.incorrectCount = Math.max(remoteRecord.incorrectCount, localRecord.incorrectCount);
        const remoteTime = new Date(remoteRecord.lastReviewDate).getTime();
        const localTime = new Date(localRecord.lastReviewDate).getTime();
        merged.lastReviewDate = remoteTime > localTime ? remoteRecord.lastReviewDate : localRecord.lastReviewDate;
        merged.mastery = Math.round((remoteRecord.mastery + localRecord.mastery) / 2);
        merged.totalStudyTime = remoteRecord.totalStudyTime + localRecord.totalStudyTime;
        const totalReviews = remoteRecord.reviewCount + localRecord.reviewCount;
        if (totalReviews > 0) {
            merged.averageResponseTime = Math.round((remoteRecord.averageResponseTime * remoteRecord.reviewCount +
                localRecord.averageResponseTime * localRecord.reviewCount) / totalReviews);
        }
        const allTags = new Set([...remoteRecord.tags, ...localRecord.tags]);
        merged.tags = Array.from(allTags);
        if (localRecord.notes && (!remoteRecord.notes || localRecord.notes.length > remoteRecord.notes.length)) {
            merged.notes = localRecord.notes;
        }
        return merged;
    }
    mergeSettings(remoteSettings, localSettings) {
        const merged = { ...remoteSettings };
        if (localSettings.notifications) {
            merged.notifications = {
                ...remoteSettings.notifications,
                ...localSettings.notifications
            };
        }
        if (localSettings.learning) {
            merged.learning = {
                ...remoteSettings.learning,
                ...localSettings.learning
            };
        }
        if (localSettings.privacy) {
            merged.privacy = {
                ...remoteSettings.privacy,
                ...localSettings.privacy
            };
        }
        if (localSettings.theme) {
            merged.theme = localSettings.theme;
        }
        if (localSettings.language) {
            merged.language = localSettings.language;
        }
        return merged;
    }
    async resolveConflicts(userId, conflicts, resolution) {
        try {
            const userLearningRecord = await UserLearningRecord_1.UserLearningRecord.findOne({ userId });
            if (!userLearningRecord) {
                return {
                    success: false,
                    message: '学习记录不存在',
                    errors: ['Learning record not found']
                };
            }
            for (const conflict of conflicts) {
                const record = userLearningRecord.records.find((r) => r.word === conflict.word);
                if (!record)
                    continue;
                switch (resolution) {
                    case 'local':
                        Object.assign(record, conflict.local);
                        break;
                    case 'remote':
                        Object.assign(record, conflict.remote);
                        break;
                    case 'merge':
                        const merged = this.mergeRecords(conflict.remote, conflict.local);
                        Object.assign(record, merged);
                        break;
                    case 'manual':
                        break;
                }
            }
            if (userLearningRecord.records.length > 0) {
                const totalMastery = userLearningRecord.records.reduce((sum, record) => sum + record.mastery, 0);
                userLearningRecord.averageMastery = Math.round(totalMastery / userLearningRecord.records.length);
            }
            else {
                userLearningRecord.averageMastery = 0;
            }
            await userLearningRecord.save();
            return {
                success: true,
                message: '冲突解决成功',
                data: {
                    learningRecords: userLearningRecord.records,
                    searchHistory: [],
                    userSettings: {}
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: '冲突解决失败',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async getSyncStatus(userId) {
        try {
            const user = await User_1.User.findById(userId);
            if (!user) {
                return {
                    lastSyncTime: null,
                    hasUnsyncedData: false,
                    conflicts: []
                };
            }
            const learningRecord = await UserLearningRecord_1.UserLearningRecord.findOne({ userId });
            const searchHistory = await SearchHistory_1.SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(10);
            return {
                lastSyncTime: user.auth.lastLoginAt,
                hasUnsyncedData: !!(learningRecord || searchHistory.length > 0),
                conflicts: []
            };
        }
        catch (error) {
            return {
                lastSyncTime: null,
                hasUnsyncedData: false,
                conflicts: []
            };
        }
    }
}
exports.SyncService = SyncService;
exports.default = SyncService.getInstance();
