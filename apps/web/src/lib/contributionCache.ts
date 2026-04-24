import { LRUCache } from 'lru-cache';

const CONTRIBUTION_CACHE_MAX_SIZE = 500;
const CONTRIBUTION_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const validateInput = (input: any) => {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid input type');
  }
  return input;
};

const contributionCache = new LRUCache({
  max: CONTRIBUTION_CACHE_MAX_SIZE,
  ttl: CONTRIBUTION_CACHE_TTL_MS,
});

contributionCache.set = (...args: any[]) => {
  const [key, value] = args;
  const validatedValue = validateInput(value);
  return contributionCache.set(key, validatedValue);
};

contributionCache.get = (...args: any[]) => {
  const [key] = args;
  const value = contributionCache.get(key);
  if (value !== undefined) {
    return validateInput(value);
  }
  return value;
};

export default contributionCache;
