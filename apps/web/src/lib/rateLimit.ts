import { redis } from './cache';

export default function rateLimit() {
  const windowSecs = 60;

  return {
    check: async (limit: number, token: string) => {
      if (!process.env.UPSTASH_REDIS_REST_URL) {
        throw new Error('Rate limiting is not configured. Please set UPSTASH_REDIS_REST_URL environment variable.');
      }
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
        console.error('Redis Rate limit service error:', err);
        throw new Error('Rate limiting service is unavailable.');
      }
    },
  };
}
