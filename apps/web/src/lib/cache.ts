import { Redis } from '@upstash/redis'

// Global singleton for Edge/Serverless environments
const globalForRedis = global as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

/**
 * Distributed wrapper to cache async function results across all serverless nodes.
 * @param key unique key for the cache entry
 * @param fn the async function to execute if cache misses
 * @param ttl time to live in milliseconds (optional, defaults to 5 min)
 */
export async function withCache<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
  // If Redis is not configured, fall back to executing without caching
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    try {
      return await fn();
    } catch (error) {
      console.error(`[Cache] Error executing function for key: ${key}`, error);
      throw error;
    }
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    console.error(`[Redis] Error reading cache key: ${key}`, error);
    // Consider retrying or falling back to executing the function
  }

  try {
    const result = await fn();
    // Only cache actual datasets
    if (result !== null && result !== undefined && (!Array.isArray(result) || result.length !== 0)) {
      const expirationSeconds = ttl ? Math.floor(ttl / 1000) : 300;
      try {
        await redis.set(key, result, { ex: expirationSeconds });
      } catch (error) {
        console.error(`[Redis] Error setting cache key: ${key}`, error);
      }
    }
    return result;
  } catch (error) {
    console.error(`[Cache] Error fetching data for key: ${key}`, error);
    throw error;
  }
}
