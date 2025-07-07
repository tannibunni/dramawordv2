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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    nickname: {
        type: String,
        required: true,
        trim: true,
        maxlength: 30
    },
    avatar: {
        type: String,
        default: null
    },
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    auth: {
        loginType: {
            type: String,
            enum: ['phone', 'wechat', 'apple', 'guest'],
            required: true
        },
        phoneNumber: {
            type: String,
            required: false,
            unique: true,
            sparse: true
        },
        wechatId: {
            type: String,
            required: false,
            unique: true,
            sparse: true
        },
        wechatOpenId: {
            type: String,
            required: false,
            unique: true,
            sparse: true
        },
        wechatUnionId: {
            type: String,
            required: false,
            unique: true,
            sparse: true
        },
        wechatNickname: {
            type: String,
            required: false
        },
        wechatAvatar: {
            type: String,
            required: false
        },
        wechatAccessToken: {
            type: String,
            required: false
        },
        wechatRefreshToken: {
            type: String,
            required: false
        },
        wechatTokenExpiresAt: {
            type: Date,
            required: false
        },
        appleId: {
            type: String,
            required: false,
            unique: true,
            sparse: true
        },
        guestId: {
            type: String,
            required: false,
            unique: true,
            sparse: true
        },
        lastLoginAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    learningStats: {
        totalWordsLearned: {
            type: Number,
            default: 0
        },
        totalReviews: {
            type: Number,
            default: 0
        },
        currentStreak: {
            type: Number,
            default: 0
        },
        longestStreak: {
            type: Number,
            default: 0
        },
        averageAccuracy: {
            type: Number,
            default: 0
        },
        totalStudyTime: {
            type: Number,
            default: 0
        },
        lastStudyDate: {
            type: Date,
            default: null
        },
        level: {
            type: Number,
            default: 1
        },
        experience: {
            type: Number,
            default: 0
        }
    },
    settings: {
        notifications: {
            dailyReminder: {
                type: Boolean,
                default: true
            },
            reviewReminder: {
                type: Boolean,
                default: true
            },
            achievementNotification: {
                type: Boolean,
                default: true
            }
        },
        learning: {
            dailyGoal: {
                type: Number,
                default: 20,
                min: 5,
                max: 100
            },
            reviewInterval: {
                type: Number,
                default: 24,
                min: 1,
                max: 168
            },
            autoPlayAudio: {
                type: Boolean,
                default: true
            },
            showPhonetic: {
                type: Boolean,
                default: true
            }
        },
        privacy: {
            shareProgress: {
                type: Boolean,
                default: false
            },
            showInLeaderboard: {
                type: Boolean,
                default: true
            }
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        language: {
            type: String,
            enum: ['zh-CN', 'en-US'],
            default: 'zh-CN'
        }
    }
}, {
    timestamps: true
});
UserSchema.index({ username: 1 });
UserSchema.index({ 'auth.phoneNumber': 1 });
UserSchema.index({ 'auth.wechatId': 1 });
UserSchema.index({ 'auth.wechatOpenId': 1 });
UserSchema.index({ 'auth.wechatUnionId': 1 });
UserSchema.index({ 'auth.appleId': 1 });
UserSchema.index({ 'auth.guestId': 1 });
UserSchema.index({ 'learningStats.level': -1 });
UserSchema.index({ 'learningStats.experience': -1 });
UserSchema.index({ 'learningStats.currentStreak': -1 });
UserSchema.virtual('levelName').get(function () {
    const levels = [
        '初学者', '入门者', '学习者', '进阶者', '熟练者',
        '专家', '大师', '传奇', '神话', '传说'
    ];
    return levels[Math.min(this.learningStats.level - 1, levels.length - 1)];
});
UserSchema.virtual('experienceToNextLevel').get(function () {
    const currentLevel = this.learningStats.level;
    const currentExp = this.learningStats.experience;
    const nextLevelExp = currentLevel * 100;
    return Math.max(0, nextLevelExp - currentExp);
});
UserSchema.methods.updateLearningStats = function (stats) {
    Object.assign(this.learningStats, stats);
    return this.save();
};
UserSchema.methods.addExperience = function (exp) {
    this.learningStats.experience += exp;
    const currentLevel = this.learningStats.level;
    const requiredExp = currentLevel * 100;
    if (this.learningStats.experience >= requiredExp) {
        this.learningStats.level += 1;
        this.learningStats.experience -= requiredExp;
    }
    return this.save();
};
UserSchema.methods.updateStudyStreak = function () {
    const today = new Date();
    const lastStudy = this.learningStats.lastStudyDate;
    if (!lastStudy) {
        this.learningStats.currentStreak = 1;
    }
    else {
        const daysDiff = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
            this.learningStats.currentStreak += 1;
        }
        else if (daysDiff > 1) {
            this.learningStats.currentStreak = 1;
        }
    }
    if (this.learningStats.currentStreak > this.learningStats.longestStreak) {
        this.learningStats.longestStreak = this.learningStats.currentStreak;
    }
    this.learningStats.lastStudyDate = today;
    return this.save();
};
exports.User = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map