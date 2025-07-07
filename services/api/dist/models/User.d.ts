import mongoose, { Document } from 'mongoose';
export interface IUserLearningStats {
    totalWordsLearned: number;
    totalReviews: number;
    currentStreak: number;
    longestStreak: number;
    averageAccuracy: number;
    totalStudyTime: number;
    lastStudyDate: Date;
    level: number;
    experience: number;
}
export interface IUserSettings {
    notifications: {
        dailyReminder: boolean;
        reviewReminder: boolean;
        achievementNotification: boolean;
    };
    learning: {
        dailyGoal: number;
        reviewInterval: number;
        autoPlayAudio: boolean;
        showPhonetic: boolean;
    };
    privacy: {
        shareProgress: boolean;
        showInLeaderboard: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-CN' | 'en-US';
}
export interface IUserAuth {
    loginType: 'phone' | 'wechat' | 'apple' | 'guest';
    phoneNumber?: string;
    wechatId?: string;
    wechatOpenId?: string;
    wechatUnionId?: string;
    wechatNickname?: string;
    wechatAvatar?: string;
    wechatAccessToken?: string;
    wechatRefreshToken?: string;
    wechatTokenExpiresAt?: Date;
    appleId?: string;
    guestId?: string;
    lastLoginAt: Date;
    isActive: boolean;
}
export interface IUser extends Document {
    username: string;
    nickname: string;
    avatar?: string;
    email?: string;
    auth: IUserAuth;
    learningStats: IUserLearningStats;
    settings: IUserSettings;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map