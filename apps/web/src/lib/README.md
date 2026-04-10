# gitpulse lib directory

this directory contains core logic, api integrations, and utility functions for the gitpulse platform.

## architecture overview

- [ai.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/ai.ts): ai service layer using google's gemini model to generate two-sentence repository pitches with a 24-hour cache ttl.
- [algo.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/algo.ts): core algorithmic logic for calculating post quality scores, cosine similarity for tech stacks, and developer achievement tiers based on multi-signal vectors.
- [auth.config.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/auth.config.ts): edge-compatible nextauth configuration defining standard callback logic for session handling and authorized routing.
- [auth.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/auth.ts): main nextauth initialization handling the github provider registration and jwt/session token mapping.
- [badges.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/badges.ts): determines if a post score passes the quality threshold for the "passed ✅" badge.
- [cache.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/cache.ts): generic asynchronous caching wrapper using an lru-cache instance with configurable ttl to optimize api response times.
- [colors.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/colors.ts): exhaustive dictionary mapping github programming languages to their representative hex color values for ui rendering.
- [contributionCache.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/contributionCache.ts): specialized lru cache instance for storing fetched user contribution statistics with a 24-hour retention period.
- [github.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/github.ts): massive service layer wrapping both github rest v3 and graphql v4 apis, implementing batching logic to prevent 502 gateway timeouts during deep recursive fetches.
- [matching.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/matching.ts): collaboration engine that computes developer similarity matches using cosine distance on tech stack weight vectors retrieved from user repository metadata.
- [prisma.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/prisma.ts): singleton initialization of the prisma orm client with hot-reloading support for local development environments.
- [rateLimit.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/rateLimit.ts): sliding window rate limiting implementation using lru-cache to prevent downstream api abuse by tracking request frequency per identifier.
- [utils.ts](file:///c:/Users/USER/git-pulse/apps/web/src/lib/utils.ts): collection of small, pure utility functions for string formatting, relative time calculation, and common boolean checks.
