import mongoose, { Document } from 'mongoose';
export interface ILearningRecord {
    word: string;
    mastery: number;
    reviewCount: number;
    correctCount: number;
    incorrectCount: number;
    lastReviewDate: Date;
    nextReviewDate: Date;
    interval: number;
    easeFactor: number;
    consecutiveCorrect: number;
    consecutiveIncorrect: number;
    totalStudyTime: number;
    averageResponseTime: number;
    confidence: number;
    notes?: string;
    tags: string[];
}
export interface IUserLearningRecord extends Document {
    userId: string;
    records: ILearningRecord[];
    totalWords: number;
    totalReviews: number;
    averageMastery: number;
    lastStudyDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserLearningRecord: mongoose.Model<IUserLearningRecord, {}, {}, {}, mongoose.Document<unknown, {}, IUserLearningRecord, {}> & IUserLearningRecord & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=UserLearningRecord.d.ts.map