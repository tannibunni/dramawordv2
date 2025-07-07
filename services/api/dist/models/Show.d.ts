import mongoose, { Document } from 'mongoose';
export interface IEpisode {
    episodeNumber: number;
    seasonNumber: number;
    title: string;
    overview: string;
    airDate: Date;
    stillPath?: string;
    runtime?: number;
    words: string[];
}
export interface IShow extends Document {
    tmdbId: number;
    title: string;
    originalTitle: string;
    overview: string;
    posterPath: string;
    backdropPath: string;
    firstAirDate: Date;
    lastAirDate?: Date;
    numberOfSeasons: number;
    numberOfEpisodes: number;
    status: 'Returning Series' | 'Ended' | 'Canceled' | 'In Production';
    type: 'Scripted' | 'Documentary' | 'Reality' | 'News' | 'Talk Show';
    genres: string[];
    networks: string[];
    productionCompanies: string[];
    originCountry: string[];
    originalLanguage: string;
    popularity: number;
    voteAverage: number;
    voteCount: number;
    episodes: IEpisode[];
    totalWords: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Show: mongoose.Model<IShow, {}, {}, {}, mongoose.Document<unknown, {}, IShow, {}> & IShow & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Show.d.ts.map