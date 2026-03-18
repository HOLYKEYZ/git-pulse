import { LRUCache } from 'lru-cache';

// Global cache instance for the server
// Next.js might re-execute this file in dev, but in production it's a singleton
const globalForCache = global as unknown as {
    apiCache: LRUCache<string, any> | undefined;
};

export const apiCache = globalForCache.apiCache ?? new LRUCache<string, any>({
    max: 500, // Store up to 500 responses
    ttl: 1000 * 60 * 5, // 5 minutes default TTL
});

if (process.env.NODE_ENV !== 'production') globalForCache.apiCache = apiCache;

/**
 * Wrapper to cache async function results.
 * @param key Unique key for the cache entry
 * @param fn The async function to execute if cache misses
 * @param ttl Time to live in milliseconds (optional, defaults to cache default)
 */
export async function withCache<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = apiCache.get(key) as T | undefined;
    if (cached !== undefined) {
        return cached;
    }

    try {
        const result = await fn();
        
        // Don't cache null/undefined or empty arrays to avoid poisoning the cache with bad responses
        // However, if we WANT to cache empty results, we should adjust this logic.
        // For the GitHub API, we usually want to cache successful responses.
        if (result !== null && result !== undefined) {
             if (ttl) {
                 apiCache.set(key, result, { ttl });
             } else {
                 apiCache.set(key, result);
             }
        }
        
        return result;
    } catch (error) {
        console.error(`[Cache] Error fetching data for key: ${key}`, error);
        throw error;
    }
}
