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
exports.Show = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ShowSchema = new mongoose_1.Schema({
    tmdbId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
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
        required: true,
        index: true
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
ShowSchema.virtual('fullTitle').get(function () {
    return `${this.title} (${this.originalTitle})`;
});
ShowSchema.virtual('year').get(function () {
    return this.firstAirDate.getFullYear();
});
ShowSchema.virtual('averageWordsPerEpisode').get(function () {
    return this.numberOfEpisodes > 0 ? Math.round(this.totalWords / this.numberOfEpisodes) : 0;
});
ShowSchema.methods.addWordToEpisode = function (seasonNumber, episodeNumber, word) {
    const episode = this.episodes.find((ep) => ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber);
    if (episode) {
        if (!episode.words.includes(word.toLowerCase())) {
            episode.words.push(word.toLowerCase());
            this.totalWords += 1;
            return this.save();
        }
    }
    return Promise.resolve(this);
};
ShowSchema.methods.removeWordFromEpisode = function (seasonNumber, episodeNumber, word) {
    const episode = this.episodes.find((ep) => ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber);
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
ShowSchema.methods.getAllWords = function () {
    const allWords = new Set();
    this.episodes.forEach((episode) => {
        episode.words.forEach((word) => allWords.add(word));
    });
    return Array.from(allWords);
};
ShowSchema.methods.updateDifficulty = function () {
    const avgWordsPerEpisode = this.averageWordsPerEpisode;
    if (avgWordsPerEpisode <= 10) {
        this.difficulty = 'beginner';
    }
    else if (avgWordsPerEpisode <= 25) {
        this.difficulty = 'intermediate';
    }
    else {
        this.difficulty = 'advanced';
    }
    return this.save();
};
ShowSchema.statics.findByDifficulty = function (difficulty) {
    return this.find({ difficulty, isActive: true }).sort({ popularity: -1 });
};
ShowSchema.statics.findByType = function (type) {
    return this.find({ type, isActive: true }).sort({ popularity: -1 });
};
ShowSchema.statics.findByWord = function (word) {
    return this.find({
        'episodes.words': word.toLowerCase(),
        isActive: true
    }).sort({ popularity: -1 });
};
exports.Show = mongoose_1.default.model('Show', ShowSchema);
