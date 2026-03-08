# GitPulse

**GitHub's Social Layer. Twitter's Feed Format.**

> Product Requirements Document & SDLC Sprint Plan
> Version 2.0 | March 2026 | 2-Person Team | 4-Week Build

| | |
|---|---|
| **STACK** | Node.js + Express · Next.js 14/16 · PostgreSQL (Supabase) · Prisma · Upstash + BullMQ |
| **TEAM** | 2 devs — Fullstack (me) + Backend (dave) |
| **SCOPE** | Feed · Comments · Threads · Reactions · Algo Feed · Ship It · Repo Cards |
| **SHIP** | 4 weeks — hard deadline |

---

## Executive Summary

GitPulse is what happens when GitHub's identity system meets Twitter's feed format. Developers sign in with GitHub OAuth, their repos auto-populate, and they post into a real-time feed that looks and feels like GitHub — dark mode, monospace accents, repo cards, green contribution-style activity — but scrolls like X/Twitter.

Every design decision must answer one question: **does this feel like GitHub built it?** If the answer is no, it's wrong.

The product includes the full social loop: posts, comments, nested comment threads, emoji reactions, Ship It launch cards, repo embedding, follow graph, and an algorithmic feed. Two developers. Four weeks. Open source from day one.

---

## Problem & Opportunity

Developers need a social layer that respects their context. The current landscape fails them:

- **Twitter/X**: too much noise, developer content gets buried, no native repo context
- **Dev.to / Hashnode**: long-form only, asynchronous, no live repo embeds, no real social graph
- **GitHub Explore**: discovery, not conversation — zero feed, zero follow, zero post
- **LinkedIn**: theatrical, not technical — developers use it out of necessity, not love

**GitPulse's edge**: it knows your repos, your language stack, your contributors. The algo feed can surface posts from people working in your tech stack before you've even followed them. No other platform can do that.

---

## UI/UX Design Direction

### Design Language: GitHub × X/Twitter

The interface is a GitHub skin on a Twitter skeleton. Every component that exists in both products should look like GitHub made it. When in doubt, go darker, go monospace, go green.

| X/Twitter Pattern | GitPulse GitHub Translation |
|---|---|
| White/light background | GitHub dark: `#0D1117` background, `#161B22` cards |
| Blue accent (links, CTA) | GitHub blue `#1F6FEB` for links, GitHub green `#238636` for CTAs |
| Rounded blue Follow button | GitHub-style outlined button: `border: 1px solid #30363D`, hover fills |
| Tweet compose box | GitHub-style textarea with Markdown hint, file attach icon |
| Like / Retweet / Reply icons | GitHub-style icon buttons: react (emoji+), comment bubble, repost |
| Verified blue checkmark | GitHub green dot = active contributor (PRs in last 30 days) |
| Trending topics sidebar | Trending repos sidebar — live star counts, language color dots |
| "What's happening?" prompt | "What are you shipping?" with monospace font placeholder |
| Profile header photo | GitHub contribution graph as profile banner (green heatmap) |
| Tweet thread / reply indent | Threaded comments with GitHub PR review-style left border indent |
| Notification badge (red dot) | GitHub-style orange/yellow notification dot |
| Retweet | Fork-style repost — uses GitHub fork icon, labeled "fork this post" |

### Layout: 3-Column (GitHub Sidebar + X Feed)

- **Left column (240px)**: Navigation — logo, Home, Discover, Notifications, Profile, Settings. Mirrors GitHub's left nav aesthetic.
- **Center column (600px)**: Main feed. Post card width matches GitHub's issue card width. Monospace font for code mentions. Repo cards embedded inline.
- **Right column (300px)**: Trending repos, suggested follows ("Who to follow" → "Who to ship with"), your activity heatmap strip.

**Font rule**: UI text = Segoe UI / -apple-system (GitHub default). Code, repo names, usernames = SFMono / Consolas (GitHub monospace). Never mix these up.

### Post Card Anatomy

Modeled on GitHub Issues/PRs but scrollable like tweets:

- Avatar (GitHub profile pic) + username (@handle) + green dot if active contributor
- Timestamp — relative ("2h ago") in GitHub muted gray `#8B949E`
- Post body — 500 char max. `@user/repo` tags render as inline repo chips
- Embedded Repo Card (if tagged) — dark `#161B22` card, language color dot, stars, forks, last push
- Action bar: Comment count · Reaction picker · Fork (repost) · Bookmark
- Ship It posts: green `border-left`, rocket icon, version badge like a GitHub release tag

---

## Feature Specifications

### F1 — GitHub OAuth & Profile Bootstrap

**Priority: P0. Blocks everything else.**

- GitHub OAuth 2.0 — the only login method, no email/password
- On first login: fetch username, avatar, bio, public repos, languages, follower/following counts
- Store encrypted GitHub access token for subsequent API calls
- Profile page auto-generated from GitHub data — not manually editable in v1
- Profile banner: contribution graph heatmap (generated from GitHub API commit data, rendered as SVG)
- "Active contributor" green dot: user has merged PRs in last 30 days

### F2 — Real-Time Feed

**Priority: P0. The entire product lives or dies on this.**

- Home feed: posts from followed users + algorithmic injections (see F8)
- Real-time updates via Supabase Realtime — WebSocket subscription per user session
- Post compose: textarea (500 char), @user/repo autocomplete, markdown hints, image upload (optional v1 stretch)
- Post types: Standard post, Ship It post (see F6)
- Infinite scroll with cursor-based pagination (no offset — perf matters at scale)
- Feed loads latest 20 posts on mount, fetches older posts on scroll

### F3 — Live Repo Cards

**Priority: P0. Core differentiator — no other platform has this.**

- `@user/repo` syntax in post body → resolves to embedded repo card
- Card: repo name (monospace), description, language color dot, star count, fork count, last push timestamp
- GitHub dark card style: `#161B22` background, `#30363D` border, green star icon
- Data fetched async at post creation time, stored in repos table
- Background BullMQ job refreshes star/fork counts every 6 hours
- Card links to GitHub repo — opens in new tab

### F4 — Comments & Threaded Replies

**Priority: P0. Full comment system.**

- Any post can be commented on — comment count displayed in post card action bar
- Comments support @mentions and @user/repo embeds (same as posts)
- Threaded replies: up to 3 levels of nesting (like GitHub PR review threads)
- Thread visual: GitHub-style left border indent — `2px solid #30363D` per nesting level
- Comment compose appears inline below post on click — no modal, no page navigation
- Comments are real-time — new comments appear without refresh via Supabase Realtime
- Comment reactions: same emoji set as posts
- Post author can resolve/close a thread (collapses thread, shows resolved badge — GitHub PR style)
- Edit own comment within 15 minutes of posting (shows "edited" timestamp)
- Soft delete: deleted comment shows "[deleted]" stub so thread context isn't broken

### F5 — Reactions

**Priority: P0. Applies to both posts and comments.**

- Reaction picker: hover the + icon → GitHub-style emoji popover
- Reaction set: 🚀 rocket, ⭐ star, 🔥 fire, 👀 eyes, ✅ merged, ❤️ heart, 🎉 party
- Multiple reactions per post (like GitHub issues) — not like Twitter's single heart
- Reaction counts displayed inline below post/comment
- A user can add one of each reaction type (not toggle — add more or remove your own)
- Reactions update in real-time via Supabase broadcast

### F6 — Ship It Posts

**Priority: P0. The flagship post type.**

- Triggered by "Ship It" button in compose toolbar — opens structured form
- Required: linked repo (@user/repo), launch description (280 char max)
- Optional: version/release tag (renders as GitHub release badge), up to 5 "What's new" bullets
- Visual treatment: green left border (`#238636`), rocket icon in top-right, version badge
- Ship It posts pinned to top of repo card when someone views `/repo/:owner/:repo`
- Ship It posts get +50 algo feed score boost for followers (see F8)
- "Reactions" on Ship It posts use rocket emoji as primary CTA

### F7 — Follow System & Discover

**Priority: P0. Social graph backbone.**

- Follow/unfollow users — counts displayed on profile
- Home feed = algorithmic blend of followed users (see F8)
- Discover tab: suggested users ranked by language stack overlap with your public repos
- "Who to ship with" sidebar: top 5 suggestions, follow button inline
- "People who follow X also follow" suggestions on profile pages

### F8 — Algorithmic Feed

**Priority: P0. The feed must be smart from day one.**

Feed score formula (computed at query time, stored in Redis via Upstash for 10min TTL):

- Base score: `1.0` for any post from followed user
- `+50` Ship It post bonus
- `+10` per reaction in first hour (recency-weighted)
- `+5` per comment in first 2 hours
- `+20` if repo language matches your top 3 languages (from your GitHub profile)
- `-30` per hour of age (decay function — fresh content wins)
- Posts with score > threshold get injected into feed even from non-followed users ("Discover injection")

The algo is simple but effective. No ML in v1 — pure heuristics. Feed algo is stateless by design — recalculated per request from cached signals. No background ranking jobs.

---

## Technical Architecture

### System Overview

Two services. One database. A queue layer for async jobs.

| Layer | Technology & Details | Owner |
|---|---|---|
| Frontend | Next.js 14/16 (App Router) + TypeScript + Tailwind (GitHub dark theme config) + shadcn/ui | Fullstack |
| Backend API | Node.js + Express — REST API, feed logic, GitHub API integration, auth middleware | Backend dev |
| Database | PostgreSQL via Supabase — primary store, Realtime subscriptions, Row-Level Security | Backend dev |
| ORM | Prisma — type-safe queries, schema migrations, seeding | Backend dev |
| Realtime | Supabase Realtime — WebSocket broadcast for feed, comments, reactions | Backend dev |
| Cache / Queue | Upstash Redis + BullMQ — feed score cache (10min TTL), GitHub sync jobs, rate limit counters | Backend dev |
| Auth | GitHub OAuth 2.0 + NextAuth.js — sole login, session management, token storage | Fullstack |
| Hosting FE | Vercel — zero-config Next.js, preview deploys per PR | Fullstack |
| Hosting BE | Railway — Docker-based Node/Express, no cold starts, auto-deploy from main | Backend dev |
| CI/CD | GitHub Actions — lint + test on PR, deploy on merge to main | Both |

### Database Schema (Full V1)

Core tables — all timestamps are UTC, all IDs are UUIDs:

| Table | Columns |
|---|---|
| `users` | id · github_id · username · avatar_url · bio · top_languages (JSONB) · github_access_token_enc · created_at |
| `posts` | id · author_id (FK) · content · post_type (STANDARD\|SHIPIT) · parent_post_id (FK, nullable for reposts) · created_at |
| `comments` | id · post_id (FK) · author_id (FK) · parent_comment_id (FK, nullable) · content · is_resolved · deleted_at · edited_at · created_at |
| `reactions` | id · target_type (POST\|COMMENT) · target_id · user_id (FK) · emoji_type · created_at |
| `repos` | id · github_full_name · description · language · stars · forks · last_commit_at · cached_at |
| `post_repos` | post_id (FK) · repo_id (FK) [many-to-many] |
| `follows` | follower_id (FK) · following_id (FK) · created_at [composite PK] |
| `shipit_meta` | post_id (FK) · version_tag · bullets (JSONB) · launched_at |
| `feed_signals` | post_id (FK) · score · computed_at [Redis-first, DB fallback] |

### Key Indexes

- `posts(author_id, created_at DESC)` — feed query performance
- `posts(created_at DESC)` — discover/global feed
- `comments(post_id, created_at)` — thread loading
- `comments(parent_comment_id)` — nested reply queries
- `reactions(target_type, target_id)` — reaction counts per post/comment
- `follows(follower_id)` — feed user list
- `follows(following_id)` — follower counts

### API Surface (Express Backend)

| Route | Description |
|---|---|
| `GET /api/feed/:userId` | Algorithmic feed — scored, paginated, cursor-based |
| `POST /api/posts` | Create post, parse @user/repo, enqueue GitHub fetch |
| `DELETE /api/posts/:id` | Soft delete (author only) |
| `GET /api/posts/:id` | Single post + comments preview |
| `GET /api/posts/:id/comments` | Full comment thread (nested, paginated) |
| `POST /api/comments` | Add comment or reply to comment |
| `PATCH /api/comments/:id` | Edit comment (within 15-min window) |
| `DELETE /api/comments/:id` | Soft delete comment |
| `PATCH /api/comments/:id/resolve` | Resolve/collapse thread (post author only) |
| `POST /api/reactions` | Add reaction to post or comment |
| `DELETE /api/reactions/:id` | Remove own reaction |
| `POST /api/follows` | Follow a user |
| `DELETE /api/follows/:targetId` | Unfollow |
| `GET /api/users/:username` | Profile + post history + stats |
| `GET /api/repos/:owner/:repo` | Repo card data (cache-first) |
| `GET /api/discover` | Suggested users (language overlap algo) |
| `GET /api/trending-repos` | Top repos by recent stars (cached 1hr) |
| `POST /api/webhooks/github` | GitHub webhook receiver |

### Comment Threading Implementation

Nested comments use an adjacency list model (`parent_comment_id` FK). Max 3 levels enforced at the API layer — any reply to a level-3 comment gets flattened to level 3. Frontend renders using recursive React component with GitHub-style left-border indentation per level.

For performance: load top-level comments first (`WHERE parent_comment_id IS NULL`), then lazy-load replies per thread on expand. Never load the entire comment tree in one query.

### Algo Feed Query Pattern

On `GET /api/feed/:userId` the Express handler:

1. Fetch list of followed user IDs from `follows` table (cached in Redis, 5min TTL)
2. Fetch recent posts from those users (last 48h, limit 100) + top Discover candidates
3. For each post: compute score from cached reaction/comment counts + recency decay + language match
4. Sort by score DESC, return first 20 with cursor
5. Store computed scores in Upstash with 10min TTL — same query within 10min returns cached result

---

## 4-Week Sprint Plan (2 Devs)

> Reality check: this is an aggressive 4 weeks for 2 people. If week 3 slips, Ship It visual polish and Discover are the first cuts — core feed, comments, and reactions do not move.

### Week 1 — Foundation (Days 1–7)

**Goal: Auth working, DB live, both services deploy, skeleton UI up.**

| Day(s) | Task | Who |
|---|---|---|
| 1–2 | Monorepo setup: `apps/web` (Next.js), `apps/api` (Express), `packages/db` (Prisma), `packages/ui` (shadcn). GitHub Actions CI. | Both |
| 1–2 | Prisma schema v1: all tables, indexes, enums. Initial migration. Supabase project provisioned. | Backend |
| 2–3 | GitHub OAuth + NextAuth.js. Session storage. Encrypted token. Login → redirect to feed. | Fullstack |
| 3–4 | Profile bootstrap: first-login job fetches GitHub user data, repos, languages. Populates users table. | Backend |
| 4–5 | Express API skeleton: middleware (auth, rate limit, error handling), health check, Railway deploy. | Backend |
| 4–5 | Tailwind GitHub dark theme config: color tokens, typography scale, shadcn component overrides. | Fullstack |
| 5–7 | Profile page UI: avatar, contribution heatmap banner, bio, repo list, monospace username. | Fullstack |
| 5–7 | Upstash Redis connection + BullMQ worker process. Base job queue operational. | Backend |

**Exit criteria**: Log in with GitHub → see your profile → both services healthy in production.

### Week 2 — Feed, Posts & Repo Cards (Days 8–14)

**Goal: Post, see feed update live, repo cards work.**

| Day(s) | Task | Who |
|---|---|---|
| 8–9 | `POST /api/posts` endpoint. @user/repo parser (regex + async GitHub fetch). Enqueue repo sync job. | Backend |
| 8–9 | Feed compose UI: GitHub-style textarea, character count, @mention autocomplete skeleton. | Fullstack |
| 9–10 | Repo Card component: dark card, language dot, stars, forks, last push. Links to GitHub. | Fullstack |
| 9–10 | `GET /api/feed/:userId` — basic chronological (algo scoring in week 3). Cursor pagination. | Backend |
| 10–11 | Feed UI: post card component, repo card embed, infinite scroll. | Fullstack |
| 11–12 | Supabase Realtime subscription: posts channel. Live feed updates on new post insert. | Backend |
| 12–13 | BullMQ repo refresh job: re-fetches star/fork counts every 6h, updates repos table. | Backend |
| 13–14 | Ship It compose form: structured fields, version badge input, bullets input. | Fullstack |
| 13–14 | Ship It API: `shipit_meta` table writes, `post_type=SHIPIT` flag. Feed card visual (green border). | Both |

**Exit criteria**: Post text with @user/repo → see repo card → feed updates in real-time → Ship It post renders correctly.

### Week 3 — Comments, Reactions, Follow, Algo Feed (Days 15–21)

**Goal: Full social loop. The hardest week.**

| Day(s) | Task | Who |
|---|---|---|
| 15–16 | Comments API: POST/GET/PATCH/DELETE /api/comments. Nested reply support. Soft delete logic. | Backend |
| 15–16 | Comment thread UI: inline compose, left-border indent per nesting level, GitHub PR style. | Fullstack |
| 16–17 | Comment Realtime: Supabase channel for post comments. New comments appear live. | Backend |
| 17–18 | Resolve thread: `PATCH /api/comments/:id/resolve`. Collapsed resolved thread UI. | Both |
| 17–18 | Reactions API: POST/DELETE /api/reactions, target_type polymorphism (posts + comments). | Backend |
| 18–19 | Reaction picker UI: GitHub emoji popover, counts display, real-time reaction updates. | Fullstack |
| 19–20 | Follow/unfollow API + UI. Follower counts on profile. Feed query filtered by follows. | Both |
| 19–20 | Algo feed scoring: Redis cache, score formula implementation, Discover injection logic. | Backend |
| 20–21 | Discover tab: `GET /api/discover`, suggested users grid, follow inline. | Both |
| 20–21 | "Who to ship with" sidebar component. Trending repos sidebar (cached). | Fullstack |

**Exit criteria**: Post → gets comments → reactions appear live → follow a user → their posts rank higher → Ship It post injects into followers' feeds.

### Week 4 — Polish, Hardening, Launch (Days 22–28)

**Goal: Production-grade, publicly accessible, open source repo live.**

| Day(s) | Task | Who |
|---|---|---|
| 22–23 | Auth hardening: token re-encryption, session expiry, CSRF protection, rate limiting per user. | Backend |
| 22–23 | GitHub API rate limit handling: per-user quota tracking in Redis, graceful degradation UI. | Backend |
| 23–24 | DB performance pass: EXPLAIN ANALYZE on feed query and comment thread query. Add missing indexes. | Backend |
| 24–25 | Mobile responsive pass: compose, feed, comments, profile. GitHub mobile breakpoints. | Fullstack |
| 25–26 | Error states + loading skeletons: feed, comments, repo cards. No naked spinners. | Fullstack |
| 26–27 | Open source prep: MIT license, CONTRIBUTING.md, .env.example, Docker Compose for local dev, README with screenshots. | Fullstack |
| 27–28 | End-to-end smoke test: full user journey from login to Ship It post to comment reaction. | Both |
| 28 | Soft launch: Show HN post, share on Dev.to, post on X/Twitter developer communities. | Both |

**Exit criteria**: Zero P0 bugs. Lighthouse > 80. Rate limit handling confirmed. Repo is public with README screenshots.

---

## Risk Register

| Risk | Impact + Mitigation | Level |
|---|---|---|
| Week 3 scope too much for 2 devs in 7 days | Pre-split tasks day-by-day. If behind by day 18: cut Discover tab, keep comments + reactions + algo feed. | 🔴 High |
| GitHub API rate limits (5000/hr auth) hit under load | All non-blocking fetches go through BullMQ queue. Serve stale repo card data rather than fail. | 🟡 Med |
| Supabase Realtime drops at scale (free tier: 200 concurrent) | Monitor concurrent connections. Upgrade to Supabase Pro ($25/mo) at 150+ concurrent users. | 🟡 Med |
| Comment threading performance — deep nesting slow to query | Enforce 3-level max at API. Load top-level comments first, lazy-load replies. Index on parent_comment_id. | 🟡 Med |
| Algo feed feels empty until user has followed people | Discover injection from day 1: show top-scored global posts even before follows. | 🟡 Med |
| GitHub ToS violation (writing back to GitHub) | Never write to GitHub. Read-only OAuth scopes only: `read:user`, `public_repo`. | 🔴 High |
| Spam abuse on open platform | GitHub OAuth is real-identity friction. Rate limit: 50 posts/day, 200 comments/day per user. | 🟡 Med |

---

## Success Metrics

| Metric | Target |
|---|---|
| Week 1 post-launch signups | 500+ GitHub OAuth signups |
| Ship It posts in first week | 100+ Ship It posts published |
| GitHub repo stars (week 1) | 200+ stars on the open source repo |
| D7 retention | > 20% |
| Comment thread depth | Average thread depth > 2 replies |
| Algo feed click-through | > 15% of Discover-injected posts clicked or reacted to |
| Month 1 registered users | 2,000+ |
| Open source contributors | 50+ PRs or issues from community by month 2 |

---

## Team Structure & Working Norms

| Role | Responsibilities |
|---|---|
| **Fullstack (you)** | Next.js UI, GitHub OAuth + NextAuth, component library, GitHub dark theme, Feed UI, Comment thread UI, Reaction picker, Mobile responsive, Open source setup, PRD owner |
| **Backend dev** | Express API, Prisma schema, Supabase + Realtime, BullMQ job system, Algo feed scoring, GitHub API integration, DB performance, Railway deploy, Auth hardening |

Working norms: async-first. Updates in shared Discord. Weekly 30-min sync on blockers only. PRs < 400 lines. No PR merged without a second set of eyes. Feature flags for anything touching feed logic.

---

## Open Source Strategy

- **License**: MIT
- **Monorepo structure**: `apps/web`, `apps/api`, `packages/db`, `packages/ui`
- `CONTRIBUTING.md` + issue templates + PR checklist on day 1 of week 4
- Public GitHub Projects board: v1 (done), v2 backlog, community requests
- Docker Compose for local dev — one command to run the entire stack
- Build in public: post weekly Ship It updates on GitPulse itself (dogfood from week 2)

---

## V2 Backlog (Deferred)

| Feature | Why Deferred |
|---|---|
| DMs / private messaging | Moderation tooling needs to exist first. High abuse surface. |
| Push / email notifications | Need user base to justify infra. Browser notifications as v2 shortcut. |
| Algorithmic ML ranking | Need data volume (>10k posts) before ML beats heuristics. |
| GitHub webhook real-time star updates | Rate limits + security review needed. Polling works for v1. |
| Org / team accounts | Individual developer identity is the v1 brand. |
| Mobile app (React Native) | PWA in v1. Native when DAU justifies the build cost. |
| Post image/video embeds | Storage cost + CDN complexity. Text + code + repos covers v1. |
| Collaborative filtering feed | Need 6 months of interaction data first. |
