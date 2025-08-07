import mongoose, { Schema, Document } from 'mongoose';

// 剧集信息接口
export interface IEpisode {
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  overview: string;
  airDate: Date;
  stillPath?: string;
  runtime?: number;
  words: string[]; // 关联的单词列表
}

// 剧集文档接口
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

// 剧集模式
const ShowSchema = new Schema<IShow>({
  tmdbId: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalTitle: {
    type: String,
    required: true,
    trim: true
  },
  overview: {
    type: String,
    required: true,
    maxlength: 2000
  },
  posterPath: {
    type: String,
    required: true
  },
  backdropPath: {
    type: String,
    required: true
  },
  firstAirDate: {
    type: Date,
    required: true
  },
  lastAirDate: {
    type: Date,
    required: false
  },
  numberOfSeasons: {
    type: Number,
    required: true,
    min: 1
  },
  numberOfEpisodes: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Returning Series', 'Ended', 'Canceled', 'In Production'],
    required: true
  },
  type: {
    type: String,
    enum: ['Scripted', 'Documentary', 'Reality', 'News', 'Talk Show'],
    default: 'Scripted'
  },
  genres: [{
    type: String,
    required: true
  }],
  networks: [{
    type: String,
    required: false
  }],
  productionCompanies: [{
    type: String,
    required: false
  }],
  originCountry: [{
    type: String,
    required: true,
    minlength: 2,
    maxlength: 2
  }],
  originalLanguage: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 2
  },
  popularity: {
    type: Number,
    default: 0
  },
  voteAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  voteCount: {
    type: Number,
    default: 0
  },
  episodes: [{
    episodeNumber: {
      type: Number,
      required: true,
      min: 1
    },
    seasonNumber: {
      type: Number,
      required: true,
      min: 1
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    overview: {
      type: String,
      required: false,
      maxlength: 1000
    },
    airDate: {
      type: Date,
      required: false
    },
    stillPath: {
      type: String,
      required: false
    },
    runtime: {
      type: Number,
      required: false,
      min: 1
    },
    words: [{
      type: String,
      required: false,
      lowercase: true,
      trim: true
    }]
  }],
  totalWords: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  tags: [{
    type: String,
    required: false,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 创建索引
ShowSchema.index({ tmdbId: 1 });
ShowSchema.index({ title: 1 });
ShowSchema.index({ genres: 1 });
ShowSchema.index({ status: 1 });
ShowSchema.index({ difficulty: 1 });
ShowSchema.index({ popularity: -1 });
ShowSchema.index({ voteAverage: -1 });
ShowSchema.index({ firstAirDate: -1 });
ShowSchema.index({ totalWords: -1 });
ShowSchema.index({ isActive: 1 });

// 虚拟字段：完整标题
ShowSchema.virtual('fullTitle').get(function() {
  return `${this.title} (${this.originalTitle})`;
});

// 虚拟字段：年份
ShowSchema.virtual('year').get(function() {
  return this.firstAirDate.getFullYear();
});

// 虚拟字段：平均每集单词数
ShowSchema.virtual('averageWordsPerEpisode').get(function() {
  return this.numberOfEpisodes > 0 ? Math.round(this.totalWords / this.numberOfEpisodes) : 0;
});

// 方法：添加单词到剧集
ShowSchema.methods.addWordToEpisode = function(seasonNumber: number, episodeNumber: number, word: string) {
  const episode = this.episodes.find(
    (ep: IEpisode) => ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber
  );
  
  if (episode) {
    if (!episode.words.includes(word.toLowerCase())) {
      episode.words.push(word.toLowerCase());
      this.totalWords += 1;
      return this.save();
    }
  }
  
  return Promise.resolve(this);
};

// 方法：从剧集中移除单词
ShowSchema.methods.removeWordFromEpisode = function(seasonNumber: number, episodeNumber: number, word: string) {
  const episode = this.episodes.find(
    (ep: IEpisode) => ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber
  );
  
  if (episode) {
    const wordIndex = episode.words.indexOf(word.toLowerCase());
    if (wordIndex > -1) {
      episode.words.splice(wordIndex, 1);
      this.totalWords = Math.max(0, this.totalWords - 1);
      return this.save();
    }
  }
  
  return Promise.resolve(this);
};

// 方法：获取剧集的所有单词
ShowSchema.methods.getAllWords = function() {
  const allWords = new Set<string>();
  this.episodes.forEach((episode: IEpisode) => {
    episode.words.forEach((word: string) => allWords.add(word));
  });
  return Array.from(allWords);
};

// 方法：更新难度等级
ShowSchema.methods.updateDifficulty = function() {
  const avgWordsPerEpisode = this.averageWordsPerEpisode;
  
  if (avgWordsPerEpisode <= 10) {
    this.difficulty = 'beginner';
  } else if (avgWordsPerEpisode <= 25) {
    this.difficulty = 'intermediate';
  } else {
    this.difficulty = 'advanced';
  }
  
  return this.save();
};

// 静态方法：按难度查找剧集
ShowSchema.statics.findByDifficulty = function(difficulty: string) {
  return this.find({ difficulty, isActive: true }).sort({ popularity: -1 });
};

// 静态方法：按类型查找剧集
ShowSchema.statics.findByType = function(type: string) {
  return this.find({ type, isActive: true }).sort({ popularity: -1 });
};

// 静态方法：查找包含特定单词的剧集
ShowSchema.statics.findByWord = function(word: string) {
  return this.find({
    'episodes.words': word.toLowerCase(),
    isActive: true
  }).sort({ popularity: -1 });
};

export const Show = mongoose.model<IShow>('Show', ShowSchema); 