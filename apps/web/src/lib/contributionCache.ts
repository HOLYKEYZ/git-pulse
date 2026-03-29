import { LRUCache } from 'lru-cache';

const contributionCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days cache
});

export default contributionCache;
