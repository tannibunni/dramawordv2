import mongoose, { Schema, Document } from 'mongoose';

export interface IUserShow extends Document {
  id: number;
  name: string;
  status: 'watching' | 'completed' | 'plan_to_watch';
  wordCount: number;
  lastWatched?: string;
  icon?: string;
  poster_path?: string;
  backdrop_path?: string;
  original_name?: string;
  genres?: any[];
  genre_ids?: number[];
  vote_average?: number;
  [key: string]: any;
}

export interface IUserShowList extends Document {
  userId: string;
  shows: IUserShow[];
  updatedAt: Date;
}

const UserShowSchema = new Schema<IUserShow>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['watching', 'completed', 'plan_to_watch'], required: true },
  wordCount: { type: Number, default: 0 },
  lastWatched: { type: String },
  icon: { type: String },
  poster_path: { type: String },
  backdrop_path: { type: String },
  original_name: { type: String },
  genres: { type: Array },
  genre_ids: { type: Array },
  vote_average: { type: Number },
  // 允许存储任意TMDBShow字段
}, { _id: false });

const UserShowListSchema = new Schema<IUserShowList>({
  userId: { type: String, required: true, unique: true },
  shows: { type: [UserShowSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUserShowList>('UserShowList', UserShowListSchema); 