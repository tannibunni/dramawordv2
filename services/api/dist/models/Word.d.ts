import mongoose, { Document } from 'mongoose';
export interface IWordDefinition {
    partOfSpeech: string;
    definition: string;
    examples: Array<{
        english: string;
        chinese: string;
    }>;
}
export interface IWord extends Document {
    word: string;
    phonetic: string;
    definitions: IWordDefinition[];
    searchCount: number;
    lastSearched: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Word: mongoose.Model<IWord, {}, {}, {}, mongoose.Document<unknown, {}, IWord, {}> & IWord & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Word.d.ts.map