// API Types for web-anime-api

export type AnimeSource = 'otakudesu' | 'kuramanime';

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AnimeListResponse {
  data: AnimeSummary[];
  pagination: PaginationInfo;
}

export interface AnimeSummary {
  title: string;
  animeId: string;
  poster: string;
  episodes?: string;
  latestReleaseDate?: string;
  releaseDay?: string;
  status?: string; // For completed anime
  rating?: string;
  slug?: string; // fallback
  score?: number; // Jikan score
  type?: string;
}

export interface SearchResult {
  title: string;
  slug: string; 
  poster: string;
  status: string;
  rating: string;
  genres: Genre[];
  url: string;
  type?: string;
}

export interface Genre {
  title: string; // Some APIs return 'title' for genre name
  name: string;
  slug: string;
  url: string;
  id?: string;
}

export interface EpisodeInfo {
  title: string;
  slug: string;
  date: string;
  url: string;
}

export interface AnimeDetail {
  title: string;
  poster: string;
  synopsis: string;
  japanese_title: string;
  score: string;
  producer: string;
  type: string;
  status: string;
  total_episodes: string;
  duration: string;
  release_date: string;
  studio: string;
  genres: Genre[];
  episode_list: EpisodeInfo[];
  // Extended fields from Jikan
  trailer_url?: string;
  mal_id?: number;
  popularity?: number;
  rank?: number;
  rating_system?: string; // PG-13 etc
}

export interface StreamData {
  stream_url: string; 
  server_name?: string;
}

export interface StreamResponse {
  title: string;
  stream_list: {
    resolution: string;
    server: string;
    url: string;      // Direct URL if available
    serverId?: string; // ID to fetch URL if required
  }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}