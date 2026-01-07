import { AnimeSummary, AnimeDetail, StreamResponse, SearchResult, AnimeSource, AnimeListResponse, Genre } from '../types';

const BASE_URL = 'https://web-anime-api.vercel.app';

// Helper to normalize response and STRICTLY map fields
const normalizeResponse = (json: any): { list: AnimeSummary[], pagination: any } => {
  let rawList: any[] = [];
  let pagination = { currentPage: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false };

  // 1. Extract the Raw List based on various API structures
  if ((json.statusCode === 200 || json.status === 'Ok' || json.status === 'Success') && (json.data || json.result)) {
    rawList = json.data?.animeList || 
              json.data?.completeAnimeList || 
              json.data?.ongoingAnimeList || 
              json.data?.searchList || 
              json.data?.genreAnimeList || 
              json.data ||
              json.result ||
              [];
    
    if (json.pagination) {
      pagination = json.pagination;
    }
  }

  // 2. Map Raw List to Unified AnimeSummary Interface
  // This prevents 'undefined' IDs which cause navigation errors
  const list: AnimeSummary[] = rawList.map(item => ({
      title: item.title || 'Unknown Title',
      // CRITICAL: Check all possible ID fields
      animeId: item.animeId || item.id || item.slug || '',
      poster: item.poster || item.image || item.thumb || '',
      episodes: item.episodes?.toString() || item.episode?.toString(),
      type: item.type || 'Anime',
      status: item.status,
      releaseDay: item.releaseDay || item.hari,
      latestReleaseDate: item.latestReleaseDate || item.tanggal,
      rating: item.rating,
      slug: item.slug || item.animeId || item.id // Fallback slug
  })).filter(item => item.animeId); // Remove items without ID

  return { list, pagination };
};

export const getOngoingAnime = async (source: AnimeSource, page: number = 1): Promise<AnimeListResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/${source}/ongoing?page=${page}`);
    const json = await response.json();
    const { list, pagination } = normalizeResponse(json);
    return { data: list, pagination };
  } catch (error) {
    console.error(`Error fetching ongoing ${source}:`, error);
    return { data: [], pagination: { currentPage: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false } };
  }
};

export const getCompletedAnime = async (source: AnimeSource, page: number = 1): Promise<AnimeListResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/${source}/completed?page=${page}`);
    const json = await response.json();
    const { list, pagination } = normalizeResponse(json);
    return { data: list, pagination };
  } catch (error) {
    console.error(`Error fetching completed ${source}:`, error);
    return { data: [], pagination: { currentPage: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false } };
  }
};

export const searchAnime = async (source: AnimeSource, query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(`${BASE_URL}/${source}/search?q=${encodeURIComponent(query)}`);
    const json = await response.json();
    
    // Some APIs use path param /search/{query} if query param fails or returns 404
    if (json.statusCode === 404 || (json.data && json.data.length === 0) || (!json.data && !json.result)) {
        try {
            const pathResponse = await fetch(`${BASE_URL}/${source}/search/${encodeURIComponent(query)}`);
            const pathJson = await pathResponse.json();
            const { list } = normalizeResponse(pathJson);
            return list as unknown as SearchResult[];
        } catch {
            // ignore fallback error
        }
    }

    const { list } = normalizeResponse(json);
    return list as unknown as SearchResult[];
  } catch (error) {
    console.error('Error searching anime:', error);
    return [];
  }
};

export const getFullAnimeList = async (source: AnimeSource): Promise<AnimeSummary[]> => {
  try {
    const response = await fetch(`${BASE_URL}/${source}/anime`);
    const json = await response.json();
    const { list } = normalizeResponse(json);
    return list;
  } catch (error) {
    console.error(`Error fetching anime list for ${source}:`, error);
    return [];
  }
};

export const getGenres = async (source: AnimeSource): Promise<Genre[]> => {
  try {
    const response = await fetch(`${BASE_URL}/${source}/genre`);
    const json = await response.json();
    
    if (json.statusCode === 200 && json.data?.genreList) {
        return json.data.genreList;
    }
    if (json.data && Array.isArray(json.data)) return json.data;
    
    return [];
  } catch (error) {
    console.error(`Error fetching genres for ${source}:`, error);
    return [];
  }
};

export const getAnimeByGenre = async (source: AnimeSource, genreId: string, page: number = 1): Promise<AnimeListResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/${source}/genre/${genreId}?page=${page}`);
    const json = await response.json();
    const { list, pagination } = normalizeResponse(json);
    return { data: list, pagination };
  } catch (error) {
     console.error(`Error fetching genre ${genreId} for ${source}:`, error);
     return { data: [], pagination: { currentPage: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false } };
  }
};

// Internal helper to parse Detail JSON to object
const parseDetailData = (json: any) => {
    if ((json.statusCode === 200 || json.status === 'Ok') && json.data) {
        if (json.data.animeDetail) return json.data.animeDetail;
        if (json.data.anime_detail) return json.data.anime_detail;
        // If data itself is the detail (has title and episode_list)
        if (json.data.title && (json.data.episode_list || json.data.episodeList)) return json.data;
    }
    return null;
}

// Updated with SMART FALLBACK logic
export const getAnimeDetail = async (source: AnimeSource, slug: string): Promise<AnimeDetail | null> => {
  try {
    // 1. Try Direct Fetch
    const response = await fetch(`${BASE_URL}/${source}/anime/${slug}`);
    const json = await response.json();
    
    let data = parseDetailData(json);

    // 2. SMART FALLBACK: If direct fetch fails, search for the slug/title
    // This handles cases where ID is slightly off or mismatched
    if (!data) {
        console.log(`Direct fetch failed for ${slug}, attempting smart search...`);
        // Clean the slug to make it a better search query (remove -sub-indo, etc if needed, or just use as is)
        const searchQuery = slug.replace(/-/g, ' ');
        const searchResults = await searchAnime(source, searchQuery);
        
        if (searchResults.length > 0) {
            // Try the first result
            const bestMatch = searchResults[0];
            const newSlug = bestMatch.slug || bestMatch.url?.split('/').pop();
            
            if (newSlug && newSlug !== slug) {
                console.log(`Found match via search: ${newSlug}. Retrying fetch.`);
                const retryResponse = await fetch(`${BASE_URL}/${source}/anime/${newSlug}`);
                const retryJson = await retryResponse.json();
                data = parseDetailData(retryJson);
            }
        }
    }

    if (data) {
        // Normalize episode list to ensure 'slug' exists for the next step (getEpisodeStream)
        const rawEpisodes = data.episode_list || data.episodeList || [];
        const episode_list = rawEpisodes.map((ep: any) => ({
            title: ep.title,
            date: ep.date || ep.releaseDate,
            // CRITICAL: Ensure we get the episodeId which acts as the slug for the next API call
            // API often returns 'episodeId', 'id', or 'slug'
            slug: ep.slug || ep.episodeId || ep.id,
            url: ep.url
        })).filter((ep: any) => ep.slug); // Filter out invalid episodes

        return {
            ...data,
            episode_list
        };
    }

    return null;
  } catch (error) {
    console.error('Error fetching anime detail:', error);
    return null;
  }
};

export const getEpisodeStream = async (source: AnimeSource, slug: string): Promise<StreamResponse | null> => {
  try {
    // Step 3: GET /otakudesu/episode/{episodeId}
    const response = await fetch(`${BASE_URL}/${source}/episode/${slug}`);
    const json = await response.json();
    
    if ((json.statusCode === 200 || json.status === 'Ok') && json.data) {
        const result = json.data;
        // The API returns a list of servers
        // Expanded to include 'url_list' and 'download_list' which sometimes contain streams
        const rawStreams = result.mirror_list || result.server_list || result.stream_list || result.url_list || [];
        
        const stream_list = rawStreams.map((s: any) => ({
            resolution: s.quality || s.resolution || 'Standard',
            server: s.server || s.driver || s.host || 'Server',
            url: s.url || s.stream_url || s.link || '', 
            // CRITICAL: Robust ID extraction. API often switches field names.
            serverId: s.serverId || s.id || s.mirrorId || s.hash || s.server_id || s._id || s.linkId || '' 
        })).filter((s: any) => s.serverId || (s.url && s.url.startsWith('http')));

        return {
            title: result.title || slug,
            stream_list
        };
    }
    return null;
  } catch (error) {
    console.error('Error fetching episode stream:', error);
    return null;
  }
};

export const getServerUrl = async (source: AnimeSource, serverId: string): Promise<string | null> => {
    try {
        // Step 4: GET /otakudesu/server/{serverId}
        const response = await fetch(`${BASE_URL}/${source}/server/${serverId}`);
        const json = await response.json();

        if ((json.statusCode === 200 || json.status === 'Ok') && json.data) {
            let rawUrl = '';
            
            // Handle if data is just a string
            if (typeof json.data === 'string') {
                rawUrl = json.data;
            } else {
                rawUrl = json.data.url || json.data.iframe || json.data.link || json.data.embed || json.data.playerUrl || '';
            }
            
            if (!rawUrl) return null;

            // Smart extraction if the URL is actually an HTML iframe
            // Enhanced Regex to capture src regardless of quote style
            if (rawUrl.includes('<iframe') || rawUrl.includes('&lt;iframe')) {
                const srcMatch = rawUrl.match(/src\s*=\s*["']([^"']+)["']/i);
                if (srcMatch && srcMatch[1]) {
                    rawUrl = srcMatch[1];
                }
            }

            // Fix protocol relative URLs
            if (rawUrl.startsWith('//')) {
                rawUrl = 'https:' + rawUrl;
            }

            return rawUrl;
        }
        return null;
    } catch (error) {
        console.error('Error fetching server url:', error);
        return null;
    }
}

export const getCategoryAnime = async (source: AnimeSource, category: 'movie' | 'ova', page: number = 1): Promise<AnimeListResponse> => {
    const slugMap: Record<string, string> = {
        'movie': 'movie',
        'ova': 'ova'
    };
    return getAnimeByGenre(source, slugMap[category], page);
}