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
const mongoose_1 = __importStar(require("mongoose"));
const UserVocabularySchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    wordId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'CloudWord',
        required: true
    },
    word: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    mastery: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    correctCount: {
        type: Number,
        default: 0
    },
    incorrectCount: {
        type: Number,
        default: 0
    },
    lastReviewDate: {
        type: Date,
        default: Date.now
    },
    nextReviewDate: {
        type: Date,
        default: Date.now
    },
    interval: {
        type: Number,
        default: 24
    },
    easeFactor: {
        type: Number,
        default: 2.5,
        min: 1.3,
        max: 2.5
    },
    consecutiveCorrect: {
        type: Number,
        default: 0
    },
    consecutiveIncorrect: {
        type: Number,
        default: 0
    },
    totalStudyTime: {
        type: Number,
        default: 0
    },
    averageResponseTime: {
        type: Number,
        default: 0
    },
    confidence: {
        type: Number,
        default: 3,
        min: 1,
        max: 5
    },
    notes: {
        type: String,
        default: ''
    },
    tags: [{
            type: String,
            trim: true
        }],
    sourceShow: {
        id: Number,
        name: String,
        status: String
    },
    collectedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
UserVocabularySchema.index({ userId: 1, wordId: 1 }, { unique: true });
UserVocabularySchema.index({ userId: 1, word: 1 });
UserVocabularySchema.index({ userId: 1, nextReviewDate: 1 });
UserVocabularySchema.index({ userId: 1, mastery: -1 });
UserVocabularySchema.methods.updateLearningProgress = function (isCorrect, responseTime, confidence) {
    this.reviewCount++;
    this.totalStudyTime += responseTime;
    this.averageResponseTime = (this.averageResponseTime * (this.reviewCount - 1) + responseTime) / this.reviewCount;
    if (confidence !== undefined) {
        this.confidence = confidence;
    }
    if (isCorrect) {
        this.correctCount++;
        this.consecutiveCorrect++;
        this.consecutiveIncorrect = 0;
        this.mastery = Math.min(100, this.mastery + 10);
        if (this.consecutiveCorrect >= 3) {
            this.interval = Math.min(this.interval * 1.5, 168);
        }
    }
    else {
        this.incorrectCount++;
        this.consecutiveIncorrect++;
        this.consecutiveCorrect = 0;
        this.mastery = Math.max(0, this.mastery - 5);
        this.interval = Math.max(1, this.interval * 0.5);
    }
    this.lastReviewDate = new Date();
    this.nextReviewDate = new Date(Date.now() + this.interval * 60 * 60 * 1000);
};
exports.default = mongoose_1.default.model('UserVocabulary', UserVocabularySchema);
