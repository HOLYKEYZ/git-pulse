import { redis } from './cache';

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export default function rateLimit(options?: RateLimitOptions) {
  const windowSecs = options?.interval ? Math.floor(options.interval / 1000) : 60;

  return {
    check: async (limit: number, token: string) => {
      if (!process.env.UPSTASH_REDIS_REST_URL) return; // fail open if no config

      const key = `ratelimit:${token}`;
      try {
        const currentCount = await redis.incr(key);
        if (currentCount === 1) {
          await redis.expire(key, windowSecs);
        }
        if (currentCount > limit) {
          throw new Error('Rate limit exceeded');
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'Rate limit exceeded') {
          throw err;
        }
        console.error('Redis Rate limit error:', err);
      }
    },
  };
}
