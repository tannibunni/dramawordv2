"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLearningRecord = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserLearningRecordSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    records: [{
            word: {
                type: String,
                required: true,
                lowercase: true,
                trim: true
            },
            mastery: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
                default: 0
            },
            reviewCount: {
                type: Number,
                default: 0,
                min: 0
            },
            correctCount: {
                type: Number,
                default: 0,
                min: 0
            },
            incorrectCount: {
                type: Number,
                default: 0,
                min: 0
            },
            lastReviewDate: {
                type: Date,
                default: Date.now
            },
            nextReviewDate: {
                type: Date,
                required: true
            },
            interval: {
                type: Number,
                default: 24,
                min: 1
            },
            easeFactor: {
                type: Number,
                default: 2.5,
                min: 1.3,
                max: 5.0
            },
            consecutiveCorrect: {
                type: Number,
                default: 0,
                min: 0
            },
            consecutiveIncorrect: {
                type: Number,
                default: 0,
                min: 0
            },
            totalStudyTime: {
                type: Number,
                default: 0,
                min: 0
            },
            averageResponseTime: {
                type: Number,
                default: 0,
                min: 0
            },
            confidence: {
                type: Number,
                default: 3,
                min: 1,
                max: 5
            },
            notes: {
                type: String,
                maxlength: 500
            },
            tags: [{
                    type: String,
                    trim: true
                }]
        }],
    totalWords: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    averageMastery: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastStudyDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
UserLearningRecordSchema.index({ userId: 1 });
UserLearningRecordSchema.index({ 'records.word': 1 });
UserLearningRecordSchema.index({ 'records.nextReviewDate': 1 });
UserLearningRecordSchema.index({ 'records.mastery': -1 });
UserLearningRecordSchema.index({ lastStudyDate: -1 });
UserLearningRecordSchema.virtual('wordsToReview').get(function () {
    const now = new Date();
    return this.records.filter(record => record.nextReviewDate <= now).length;
});
UserLearningRecordSchema.virtual('masteredWords').get(function () {
    return this.records.filter(record => record.mastery >= 80).length;
});
UserLearningRecordSchema.virtual('learningWords').get(function () {
    return this.records.filter(record => record.mastery >= 20 && record.mastery < 80).length;
});
UserLearningRecordSchema.virtual('newWords').get(function () {
    return this.records.filter(record => record.mastery < 20).length;
});
UserLearningRecordSchema.methods.addOrUpdateWord = function (word, initialData) {
    const existingRecord = this.records.find((record) => record.word === word.toLowerCase());
    if (existingRecord) {
        Object.assign(existingRecord, initialData);
    }
    else {
        const newRecord = {
            word: word.toLowerCase(),
            mastery: 0,
            reviewCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            lastReviewDate: new Date(),
            nextReviewDate: new Date(),
            interval: 24,
            easeFactor: 2.5,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            totalStudyTime: 0,
            averageResponseTime: 0,
            confidence: 3,
            tags: [],
            ...initialData
        };
        this.records.push(newRecord);
        this.totalWords += 1;
    }
    this.updateAverageMastery();
    return this.save();
};
UserLearningRecordSchema.methods.updateReviewResult = function (word, isCorrect, responseTime, confidence) {
    const record = this.records.find((r) => r.word === word.toLowerCase());
    if (!record) {
        throw new Error(`Word ${word} not found in learning records`);
    }
    record.reviewCount += 1;
    record.lastReviewDate = new Date();
    record.totalStudyTime += responseTime;
    record.averageResponseTime = (record.averageResponseTime * (record.reviewCount - 1) + responseTime) / record.reviewCount;
    record.confidence = confidence;
    if (isCorrect) {
        record.correctCount += 1;
        record.consecutiveCorrect += 1;
        record.consecutiveIncorrect = 0;
        const masteryIncrease = Math.min(20, 10 + record.consecutiveCorrect * 2);
        record.mastery = Math.min(100, record.mastery + masteryIncrease);
        if (record.consecutiveCorrect >= 3) {
            record.interval = Math.min(168, record.interval * record.easeFactor);
            record.easeFactor = Math.min(5.0, record.easeFactor + 0.1);
        }
    }
    else {
        record.incorrectCount += 1;
        record.consecutiveIncorrect += 1;
        record.consecutiveCorrect = 0;
        const masteryDecrease = Math.min(record.mastery, 15 + record.consecutiveIncorrect * 5);
        record.mastery = Math.max(0, record.mastery - masteryDecrease);
        record.interval = Math.max(1, record.interval / 2);
        record.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
    }
    record.nextReviewDate = new Date(Date.now() + record.interval * 60 * 60 * 1000);
    this.totalReviews += 1;
    this.lastStudyDate = new Date();
    this.updateAverageMastery();
    return this.save();
};
UserLearningRecordSchema.methods.updateAverageMastery = function () {
    if (this.records.length > 0) {
        const totalMastery = this.records.reduce((sum, record) => sum + record.mastery, 0);
        this.averageMastery = Math.round(totalMastery / this.records.length);
    }
    else {
        this.averageMastery = 0;
    }
};
UserLearningRecordSchema.methods.getWordsToReview = function (limit) {
    const now = new Date();
    const wordsToReview = this.records
        .filter((record) => record.nextReviewDate <= now)
        .sort((a, b) => {
        const aOverdue = now.getTime() - a.nextReviewDate.getTime();
        const bOverdue = now.getTime() - b.nextReviewDate.getTime();
        if (aOverdue !== bOverdue) {
            return bOverdue - aOverdue;
        }
        if (a.mastery !== b.mastery) {
            return a.mastery - b.mastery;
        }
        return a.reviewCount - b.reviewCount;
    });
    return limit ? wordsToReview.slice(0, limit) : wordsToReview;
};
UserLearningRecordSchema.methods.getLearningSuggestions = function () {
    const suggestions = [];
    const lowMasteryWords = this.records.filter((r) => r.mastery < 30);
    if (lowMasteryWords.length > 0) {
        suggestions.push({
            type: 'mastery',
            message: `有 ${lowMasteryWords.length} 个单词掌握度较低，建议重点复习`,
            priority: 'high'
        });
    }
    const consecutiveIncorrectWords = this.records.filter((r) => r.consecutiveIncorrect >= 3);
    if (consecutiveIncorrectWords.length > 0) {
        suggestions.push({
            type: 'consecutive_incorrect',
            message: `有 ${consecutiveIncorrectWords.length} 个单词连续错误，需要重新学习`,
            priority: 'high'
        });
    }
    if (this.wordsToReview > 0) {
        suggestions.push({
            type: 'review',
            message: `有 ${this.wordsToReview} 个单词需要复习`,
            priority: 'medium'
        });
    }
    const lastStudy = this.lastStudyDate;
    const daysSinceLastStudy = Math.floor((Date.now() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastStudy > 3) {
        suggestions.push({
            type: 'consistency',
            message: `已经 ${daysSinceLastStudy} 天没有学习，建议保持学习习惯`,
            priority: 'medium'
        });
    }
    return suggestions;
};
UserLearningRecordSchema.statics.getUserStats = function (userId) {
    return this.findOne({ userId }).then((record) => {
        if (!record)
            return null;
        const now = new Date();
        const wordsToReview = record.records.filter((r) => r.nextReviewDate <= now).length;
        const masteredWords = record.records.filter((r) => r.mastery >= 80).length;
        const learningWords = record.records.filter((r) => r.mastery >= 20 && r.mastery < 80).length;
        const newWords = record.records.filter((r) => r.mastery < 20).length;
        return {
            totalWords: record.totalWords,
            totalReviews: record.totalReviews,
            averageMastery: record.averageMastery,
            wordsToReview,
            masteredWords,
            learningWords,
            newWords,
            lastStudyDate: record.lastStudyDate
        };
    });
};
exports.UserLearningRecord = mongoose_1.default.model('UserLearningRecord', UserLearningRecordSchema);
