import { AnimeDetail, AnimeSummary } from '../types';

const JIKAN_BASE = 'https://api.jikan.moe/v4';

// Simple in-memory cache to prevent re-fetching the same title in a session
const posterCache = new Map<string, string>();

// Queue System to prevent 429 Too Many Requests
const requestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

const processQueue = async () => {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (requestQueue.length > 0) {
        const task = requestQueue.shift();
        if (task) {
            await task();
            // Jikan rate limit is roughly 3 req/sec. We wait 400ms between requests to be safe.
            await new Promise(resolve => setTimeout(resolve, 400));
        }
    }
    isProcessingQueue = false;
};

const enqueueRequest = <T>(task: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        requestQueue.push(async () => {
            try {
                const result = await task();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
        processQueue();
    });
};

// Helper to delay requests (legacy, used by getJikanMetadata direct calls)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getJikanMetadata = async (title: string): Promise<Partial<AnimeDetail> | null> => {
  try {
    const cleanTitle = title.replace(/\(.*\)|Sub Indo|Batch/gi, '').trim();
    
    // We use the queue here implicitly if this function is called rapidly, 
    // but usually this is called once per Detail page, so standard fetch is okay with slight delay.
    await delay(300); 
    const response = await fetch(`${JIKAN_BASE}/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`);
    const json = await response.json();

    if (json.data && json.data.length > 0) {
      const result = json.data[0];
      return {
        score: result.score?.toString() || 'N/A',
        total_episodes: result.episodes?.toString() || '?',
        duration: result.duration,
        rating_system: result.rating,
        trailer_url: result.trailer?.embed_url,
        mal_id: result.mal_id,
        popularity: result.popularity,
        rank: result.rank,
        synopsis: result.synopsis,
        poster: result.images?.jpg?.large_image_url || result.images?.jpg?.image_url
      };
    }
    return null;
  } catch (error) {
    console.error("Jikan API Error:", error);
    return null;
  }
};

export const getTopAnime = async (): Promise<AnimeSummary[]> => {
  try {
    const response = await fetch(`${JIKAN_BASE}/top/anime?limit=10&filter=bypopularity`);
    const json = await response.json();
    
    if (json.data) {
      return json.data.map((item: any) => ({
        title: item.title,
        animeId: item.mal_id.toString(), // Store MAL ID as fallback
        slug: '', 
        poster: item.images.jpg.large_image_url || item.images.jpg.image_url, // Use large if available
        rating: item.score?.toString(),
        score: item.score,
        episodes: item.episodes?.toString(),
        type: item.type,
        status: item.status
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
};

// NEW: Function to get high-res poster with queuing
export const getHighQualityPoster = (title: string): Promise<string | null> => {
    const cleanTitle = title.replace(/\(.*\)|Sub Indo|Batch|Episode.*/gi, '').trim();
    
    if (posterCache.has(cleanTitle)) {
        return Promise.resolve(posterCache.get(cleanTitle) || null);
    }

    return enqueueRequest(async () => {
        try {
            const response = await fetch(`${JIKAN_BASE}/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`);
            if (response.status === 429) {
                // If we hit a limit despite queuing, back off
                return null;
            }
            const json = await response.json();
            if (json.data && json.data.length > 0) {
                const img = json.data[0].images?.jpg?.large_image_url || json.data[0].images?.jpg?.image_url;
                if (img) {
                    posterCache.set(cleanTitle, img);
                    return img;
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    });
};