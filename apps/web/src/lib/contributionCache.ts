import { LRUCache } from 'lru-cache';

const CONTRIBUTION_CACHE_MAX_SIZE = 500;
const CONTRIBUTION_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const contributionCache = new LRUCache({
  max: CONTRIBUTION_CACHE_MAX_SIZE,
  ttl: CONTRIBUTION_CACHE_TTL_MS,
});

export default contributionCache;
