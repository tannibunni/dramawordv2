import mongoose, { Document } from 'mongoose';
export interface ISearchHistory extends Document {
    word: string;
    definition: string;
    timestamp: Date;
    userId?: string;
}
export declare const SearchHistory: mongoose.Model<ISearchHistory, {}, {}, {}, mongoose.Document<unknown, {}, ISearchHistory, {}> & ISearchHistory & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=SearchHistory.d.ts.map