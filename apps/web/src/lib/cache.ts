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
  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error('Invalid cache key');
  }
  if (ttl !== undefined && (typeof ttl !== 'number' || ttl < 0)) {
    throw new Error('Invalid TTL');
  }
  if (typeof fn !== 'function') {
    throw new Error('Invalid function');
  }
  // If Redis is not configured, fall back to executing without caching
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return fn();
  }

try {
    if (!redis) {
      throw new Error('Redis connection not established');
    }
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    console.error(`[Redis] Error reading cache key: ${key}`, error);
  }

  try {
    const result = await fn();
    // Only cache actual datasets
    if (result !== null && result !== undefined && (!Array.isArray(result) || result.length !== 0)) {
      const expirationSeconds = ttl ? Math.floor(ttl / 1000) : 300;
      await redis.set(key, result, { ex: expirationSeconds });
    }
    return result;
  } catch (error) {
    console.error(`[Cache] Error fetching data for key: ${key}`, error);
    throw error;
  }
}