import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";
import { LRUCache } from 'lru-cache';
const cache = new LRUCache<string, any>({ max: 1, ttl: 300000 }); // 5 minutes

export const metadata: Metadata = {
  title: "Explore Trending Tags | GitPulse",
  description: "Discover what developers are talking about on GitPulse"
};

export default async function TagsPage() {
  // basic aggregation of hashtags
  // in production, this would be a materialized view or indexed aggregation query
const cacheKey = 'trending_tags';
let trending = cache.get(cacheKey);
if (!trending) {
  const posts = await prisma.post.findMany({ select: { hashtags: true } });
  const tagCounts: Record<string, number> = {};
  for (const p of posts) {
    for (const t of p.hashtags || []) {
      const normalized = t.toLowerCase();
      tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
    }
  }
  trending = Object.entries(tagCounts).
  sort((a, b) => b[1] - a[1]).
  slice(0, 50); // top 50 trending
  cache.set(cacheKey, trending);
}

  return (
    <div className="flex flex-col animate-slide-up pb-12 w-full max-w-3xl mx-auto">
            <div className="px-4 py-6 border-b border-git-border bg-[#0d1117] sticky top-0 z-10 flex items-center gap-3">
                <svg height="24" viewBox="0 0 16 16" width="24" className="fill-git-text">
                    <path d="M5.5 2.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.22.53l-6.25 6.25a.75.75 0 0 1-1.06 0l-5.5-5.5a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 .53-.22Zm.75.75v4.69l-5.72 5.72 4.97 4.97 5.72-5.72V3h-4.97ZM8.75 5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"></path>
                </svg>
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