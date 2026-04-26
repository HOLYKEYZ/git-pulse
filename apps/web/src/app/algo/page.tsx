import { prisma } from "@/lib/prisma";
import { Prisma } from '@prisma/client';

type PostWithAuthorAndFollowers = {
  id: number;
  createdAt: Date;
  author: {
    username: string;
    avatar: string | null;
    _count: {
      followers: number;
    };
  };
  repoEmbed: {
    name: string;
    url: string;
    language: string;
    stars: number;
    forks: number;
    lastPush: string | null;
    description: string | null;
    commitCount: number;
    pushConsistency: number;
  };
};

type RepoEmbed = {
  name: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  lastPush: string | null;
  description: string | null;
  commitCount: number;
  pushConsistency: number;
};
import { calculatePostScoreDetailed } from "@/lib/algo";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 0;

export default async function AlgoVisualizationPage() {
let posts: any[] = [];
let errorMessage = null;
try {
  posts = await prisma.post.findMany({
    include: { author: { include: { _count: { select: { followers: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
} catch (error) {
  if (error instanceof Prisma.ClientError) {
    console.error('Prisma Client Error:', error);
    errorMessage = 'Failed to load algorithm data due to a database error. Please try again later.';
  } else if (error instanceof Error) {
    console.error('Unexpected Error:', error);
    errorMessage = 'An unexpected error occurred while loading algorithm data. Please try again later.';
  } else {
    console.error('Unknown Error:', error);
    errorMessage = 'An unknown error occurred while loading algorithm data. Please try again later.';
  }
}

  const scoredPosts = posts
    .filter(p => p.repoEmbed !== null && typeof p.repoEmbed === "object" && !Array.isArray(p.repoEmbed))
    .map(p => {
const r = p.repoEmbed as RepoEmbed;
    const daysSincePost = Math.max((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24), 1);
    const pushDate = r.lastPush ? new Date(r.lastPush) : p.createdAt;
    const daysSincePush = Math.max((Date.now() - pushDate.getTime()) / (1000 * 60 * 60 * 24), 0);

    const { score, breakdown } = calculatePostScoreDetailed({
      language: r.language,
      stars: r.stars || 0,
      forks: r.forks || 0,
      daysSincePush,
      hasDescription: !!r.description,
      daysSincePost,
      commitCount: r.commitCount,
      pushConsistency: r.pushConsistency,
      authorFollowers: p.author._count?.followers || 0
    });

    return {
      post: p,
      repo: r,
      score,
      breakdown
    };
  }).sort((a, b) => b.score - a.score);

return (
  <div className="flex w-full min-h-screen">
    <div className="flex-1 max-w-[900px] border-r border-git-border bg-git-bg min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-git-bg/80 backdrop-blur-md border-b border-git-border px-6 py-4">
        <h1 className="text-xl font-bold text-git-text">Algorithm Visualization (v3)</h1>
        <p className="text-sm text-git-muted mt-1">
          See exactly how the feed ranks repositories based on commit volume, consistency, and time decay.
        </p>
      </div>

      <div className="flex flex-col">
        {errorMessage !== null && (
          <div className="p-12 text-center flex flex-col items-center animate-fade-in mt-10">
            <h3 className="text-xl font-bold text-git-text mb-2">Error Loading Data</h3>
            <p className="text-git-muted max-w-sm">{errorMessage}</p>
          </div>
        )}
        {errorMessage === null && scoredPosts.map(({ post, repo, score, breakdown }, index) => (
          <div key={post.id} className="flex gap-4 px-6 py-5 border-b border-git-border hover:bg-white/[0.02] transition-colors">
            <div className="text-2xl font-black text-git-muted w-8 shrink-0 text-right">
              #{index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/profile/${post.author.username}`} className="flex items-center gap-2 group mb-2">
                    <Image
                      src={post.author.avatar || "/icon.png"}
                      alt={post.author.username}
                      width={24}
                      height={24}
                      className="rounded-full bg-git-muted/20"
                    />
                    <span className="font-semibold text-git-text group-hover:text-git-accent transition-colors">
                      @{post.author.username}
                    </span>
                  </Link>
                  <a href={repo.url || "#"} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-git-accent hover:underline break-words">
                    {repo.name}
                  </a>
                </div>
                
                <div className="shrink-0 flex flex-col items-end">
                  <span className="text-2xl font-black text-git-scoreGreen">{score.toFixed(2)} pts</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Commits" val={`+${breakdown.commitVolume.toFixed(1)}`} raw={repo.commitCount} />
                <StatCard label="Consistency" val={`+${breakdown.pushConsistency.toFixed(1)}`} raw={`${((repo.pushConsistency || 0)*100).toFixed(0)}%`} />
                <StatCard label="Stars" val={`+${breakdown.stars.toFixed(1)}`} raw={repo.stars} />
                <StatCard label="Language" val={`+${breakdown.language.toFixed(1)}`} raw={repo.language || "None"} />
                <StatCard label="Recent Push" val={`${breakdown.recentActivity > 0 ? '+' : ''}${breakdown.recentActivity.toFixed(1)}`} />
                <StatCard label="Follower Bias" val={`${breakdown.followerBias > 0 ? '+' : ''}${breakdown.followerBias.toFixed(1)}`} />
                {breakdown.penalty < 0 && (
                  <StatCard label="0-Commit Penalty" val={`${breakdown.penalty.toFixed(1)}`} className="text-red-400 border-red-900 bg-red-950/20" />
                )}
                <StatCard label="Time Decay Mult." val={`x${breakdown.decayMultiplier.toFixed(2)}`} />
              </div>
            </div>
          </div>
        ))}
        {errorMessage === null && scoredPosts.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center animate-fade-in mt-10">
            <svg viewBox="0 0 16 16" width="48" height="48" className="fill-git-muted opacity-50 mb-4"><path d="M2.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25H2.75Zm-.25-1.5h10.5a1.75 1.75 0 0 1 1.75 1.75v10.5a1.75 1.75 0 0 1-1.75 1.75H2.75A1.75 1.75 0 0 1 1 13.25V2.75C1 1.784 1.784 1 2.75 1ZM8 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM4.75 8.5C4.75 7.672 5.422 7 6.25 7h3.5c.828 0 1.5.672 1.5 1.5v2.25c0 .414-.336.75-.75.75H5.5a.75.75 0 0 1-.75-.75V8.5Z"></path></svg>
            <h3 className="text-xl font-bold text-git-text mb-2">No Repository Posts Found</h3>
            <p className="text-git-muted max-w-sm">The v3 recommendation algorithm exclusively scores embedded GitHub repositories. Standard text posts are not ranked.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

function StatCard({ label, val, raw, className = "" }: { label: string, val: string, raw?: any, className?: string }) {
  return (
    <div className={`p-2.5 rounded-lg border border-git-border bg-git-card flex flex-col ${className}`}>
      <span className="text-[10px] uppercase font-bold text-git-muted tracking-wide">{label}</span>
      <span className="text-sm font-bold text-git-text mt-0.5">{val}</span>
      {raw !== undefined && <span className="text-[11px] text-git-muted mt-1 truncate">{raw}</span>}
    </div>
  );
}
