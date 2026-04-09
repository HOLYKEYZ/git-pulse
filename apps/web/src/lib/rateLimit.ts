import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export default function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
const tokenCount = tokenCache.get(token) as number || 0;
        tokenCount += 1;
        tokenCache.set(token, tokenCount);
        const currentUsage = tokenCount;
        const isRateLimited = currentUsage > limit;

        if (isRateLimited) {
          reject('Rate limit exceeded');
        } else {
          resolve();
        }
      }),
  };
}
