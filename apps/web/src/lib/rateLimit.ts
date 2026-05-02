import { redis } from './cache';

// in-memory fallback for environments without redis
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  interval?: number;           // window in milliseconds (default: 60000)
  uniqueTokenPerInterval?: number; // ignored — kept for backward compat with callers
}

export default function rateLimit(config?: RateLimitConfig) {
  const windowMs = config?.interval ?? 60_000;
  const windowSecs = Math.floor(windowMs / 1000);

  return {
    check: async (limit: number, token: string) => {
      // if redis is not configured, use in-memory fallback (single-instance only)
      if (!process.env.UPSTASH_REDIS_REST_URL) {
        const now = Date.now();
        const entry = inMemoryStore.get(token);

        if (!entry || now >= entry.resetAt) {
          inMemoryStore.set(token, { count: 1, resetAt: now + windowMs });
          return true;
        }

        entry.count += 1;
        if (entry.count <= limit) {
          return true;
        }

        throw new Error('Rate limit exceeded');
      }

      // redis-based rate limiting for distributed environments
      const key = `ratelimit:${token}`;
try {
        const currentCount = await redis.incr(key);
        if (currentCount === 1) {
          await redis.expire(key, windowSecs);
        }
        if (currentCount <= limit) {
          return true;
        } else {
          throw new Error('Rate limit exceeded');
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'Rate limit exceeded') {
          throw err;
        }
        console.error('Redis connection error:', err);
        // Implement a retry mechanism for transient Redis connection issues
        let retries = 0;
        const maxRetries = 3;
        while (retries < maxRetries) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 500ms before retrying
            const currentCount = await redis.incr(key);
            if (currentCount === 1) {
              await redis.expire(key, windowSecs);
            }
            if (currentCount <= limit) {
              return true;
            } else {
              throw new Error('Rate limit exceeded');
            }
          } catch (err) {
            retries++;
            if (retries === maxRetries) {
              throw new Error('Failed to connect to Redis after ' + maxRetries + ' retries');
            }
          }
        }
      }
    },
  };
}
