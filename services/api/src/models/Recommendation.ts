import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendation extends Document {
  tmdbShowId: number;
  title: string;
  originalTitle: string;
  backdropUrl: string;
  posterUrl: string;
  recommendation: {
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    language: 'zh-CN' | 'en-US';
    category: string[];
    tags: string[];
  };
  metadata: {
    genre: string[];
    rating: number;
    year: number;
    status: 'active' | 'inactive' | 'draft';
    priority: number; // 推荐优先级 1-10
    views: number;
    likes: number;
  };
  author: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>({
  tmdbShowId: {
    type: Number,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  originalTitle: {
    type: String,
    required: true,
  },
  backdropUrl: {
    type: String,
    required: true,
  },
  posterUrl: {
    type: String,
    required: true,
  },
  recommendation: {
    text: {
      type: String,
      required: true,
      maxlength: 500,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    language: {
      type: String,
      enum: ['zh-CN', 'en-US'],
      default: 'zh-CN',
    },
    category: [{
      type: String,
      enum: ['comedy', 'drama', 'crime', 'mystery', 'romance', 'action', 'sci-fi', 'horror', 'documentary'],
    }],
    tags: [String],
  },
  metadata: {
    genre: [String],
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    year: Number,
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'draft',
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  author: {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
}, {
  timestamps: true,
});

// 索引优化
RecommendationSchema.index({ 'metadata.status': 1, 'metadata.priority': -1 });
RecommendationSchema.index({ 'recommendation.language': 1, 'metadata.status': 1 });
RecommendationSchema.index({ 'recommendation.difficulty': 1, 'metadata.status': 1 });

export default mongoose.model<IRecommendation>('Recommendation', RecommendationSchema); 