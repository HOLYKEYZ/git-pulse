import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";


// simple in-memory cache to avoid re-querying on every request
let cachedTags: any = null;
let cacheTime = 0;
const CACHE_TTL = 300000; // 5 minutes

export const metadata: Metadata = {
  title: "Explore Trending Tags | GitPulse",
  description: "Discover what developers are talking about on GitPulse"
};

export default async function TagsPage() {
  // aggregate trending hashtags using database-level query
  const now = Date.now();
let trending = cachedTags;
if (trending) {
  // Basic validation for trending tags
  trending = trending.filter((tag: any) => typeof tag[0] === 'string' && typeof tag[1] === 'number');
}
  if (!trending || now - cacheTime > CACHE_TTL) {
    // database-level aggregation using postgresql unnest to avoid fetching all posts into memory
let result: { tag: string; count: bigint }[] = [];
    try {
      result = await prisma.$queryRaw`
        SELECT LOWER(unnest("hashtags")) AS tag, COUNT(*) AS count
        FROM "Post"
        WHERE array_length("hashtags", 1) > 0
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 50
      `;
      if (!result) {
        throw new Error('Failed to fetch trending hashtags');
      }
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      // Additional error handling or fallback can be added here
    }
    
    trending = result.map(r => [r.tag, Number(r.count)]);
    cachedTags = trending;
    cacheTime = now;
  }

  return (
    <div className="flex flex-col animate-slide-up pb-12 w-full max-w-3xl mx-auto">
            <div className="px-4 py-6 border-b border-git-border bg-git-bg sticky top-0 z-10 flex items-center gap-3">
                <span className="text-2xl font-black text-git-text">#</span>
                <h1 className="text-xl font-bold text-git-text">Trending Hashtags</h1>
            </div>

            <div className="p-4 sm:p-6">
                <p className="text-git-muted text-sm mb-6">
                    Discover popular topics, discussions, and technologies trending right now on GitPulse.
                </p>

                {trending.length === 0 ?
        <div className="text-center py-12 text-git-muted bg-git-card border border-git-border rounded-xl">
                        No trending tags yet. Start posting with hashtags!
                    </div> :

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
                        {trending.map(([tag, count]: [string, any], index: number) =>
          <Link
            key={tag}
            href={`/explore/tags/${tag.replace('#', '')}`}
            className="flex items-center justify-between p-4 bg-git-bg border border-git-border hover:border-git-accent rounded-xl transition-all hover:shadow-[0_0_10px_rgba(88,166,255,0.1)] group">
            
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-git-text group-hover:text-git-accent transition-colors truncate">
                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                    </span>
                                    {index < 3 &&
              <span className="text-[10px] text-git-accent font-bold uppercase tracking-wider mt-1">
                                            Trending
                                        </span>
              }
                                </div>
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-git-card border border-git-border text-xs font-mono text-git-muted group-hover:bg-git-accent/10 group-hover:border-git-accent/30 group-hover:text-git-accent transition-colors">
                                    {count}
                                </div>
                            </Link>
          )}
                    </div>
        }
            </div>
        </div>);

}