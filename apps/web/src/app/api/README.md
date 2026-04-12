# gitpulse api directory

this directory contains the next.js api routes acting as gitpulse's backend logic for client interactions.

## architecture overview

- **`/image-proxy/route.ts`**: aggressive proxy endpoint handling ssrf protection and cors stripping for rendering external badges (`shields.io`) and `camo.githubusercontent.com` inside profile readmes. caches heavily using edge directives.
- **`/posts/[id]/comments/route.ts`**: handles the creation of new comments and the retrieval of comment threads, which may include nested replies, on posts.
- **`/repos/[owner]/[name]/summary/route.ts`**: fetches repo metadata and pipes the `readmeExcerpt` through google gemini inside `lib/ai.ts` to formulate quick 2-sentence repository pitches dynamically.
- **`/user/status/route.ts`**: mutating endpoint for the set-status implementation. overrides the local database session emoji and text representation.
