# gitpulse components directory

this directory houses all reusable react client and server components that make up the gitpulse user interface.

## architecture overview

- **`AchievementsWidget.tsx`**: server component fetching a user's achievements from `algo.ts` and displaying them with a native github-styled tooltip overlay.
- **`RightSidebar.tsx`**: primary discovery surface aggregating "active today" repositories, algorithmic "developers like you", and "trending" statistics fetched via batch graphql.
- **`ToggleSidebarCard.tsx` / `TrendingCard.tsx`**: dynamic client components providing tabbed views for repositories and developers logic with synced github language colors.
- **`UserStatus.tsx`**: client component replicating github's real-time "set status" (emoji + text) dropdown. utilizes `bg-git-bg` and `bg-git-card` to support both native github dark mode and x midnight dark mode effortlessly.
- **`ProfileReadme.tsx`**: server/client hybrid rendering the raw github markdown html tree fetched via the readmes rest api. includes cheerio sanitation and external source proxies for image rendering.
