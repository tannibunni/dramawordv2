export interface TMDBShow {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    first_air_date: string;
    last_air_date: string;
    status: string;
    type: string;
    genres: Array<{
        id: number;
        name: string;
    }>;
    networks: Array<{
        id: number;
        name: string;
    }>;
    production_companies: Array<{
        id: number;
        name: string;
    }>;
    episode_run_time: number[];
    number_of_seasons: number;
    number_of_episodes: number;
    vote_average: number;
    vote_count: number;
    popularity: number;
    poster_path: string;
    backdrop_path: string;
    original_language: string;
    origin_country: string[];
    created_by: Array<{
        id: number;
        name: string;
        profile_path: string;
    }>;
}
export interface TMDBSearchResponse {
    page: number;
    results: TMDBShow[];
    total_pages: number;
    total_results: number;
}
export interface TMDBSimilarResponse {
    page: number;
    results: TMDBShow[];
    total_pages: number;
    total_results: number;
}
export interface TMDBEpisode {
    id: number;
    name: string;
    overview: string;
    air_date: string;
    episode_number: number;
    season_number: number;
    still_path: string;
    vote_average: number;
    vote_count: number;
}
export interface TMDBSeason {
    id: number;
    name: string;
    overview: string;
    air_date: string;
    season_number: number;
    poster_path: string;
    episodes: TMDBEpisode[];
}
export declare class TMDBService {
    private static getAuthHeaders;
    private static getAuthParams;
    static searchShows(query: string, page?: number): Promise<TMDBSearchResponse>;
    static getShowDetails(showId: number): Promise<TMDBShow>;
    static getSeasonDetails(showId: number, seasonNumber: number): Promise<TMDBSeason>;
    static getSimilarShows(showId: number, page?: number): Promise<TMDBSimilarResponse>;
    static getPopularShows(page?: number): Promise<TMDBSearchResponse>;
    static getOnTheAirShows(page?: number): Promise<TMDBSearchResponse>;
    static getImageUrl(path: string, size?: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'): string;
    static checkConfiguration(): {
        hasApiKey: boolean;
        hasAccessToken: boolean;
        isConfigured: boolean;
    };
}
//# sourceMappingURL=tmdbService.d.ts.map