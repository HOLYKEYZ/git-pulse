import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PostCard, { PostProps } from "@/components/PostCard";
import { calculatePostScore } from "@/lib/algo";
import { getRelativeTime } from "@/lib/utils";
import { hasPassedBadge } from "@/lib/badges";

interface PageProps {
  params: Promise<{tag: string;}>
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params;
  return {
    title: `#${tag} | GitPulse`,
    description: `Explore posts tagged with #${tag}`
  };
}

// reuse the mapper from page.tsx
function mapPrismaPostToProps(p: any): PostProps {
  if (p.repostOf) {
    return {
      ...mapPrismaPostToProps(p.repostOf),
      isRepost: true,
      repostedBy: p.author.username,
      id: p.id
    };
  }

  let score = 0;

  // calculate algorithmic score for the post
  if (p.repoEmbed) {
    const r = p.repoEmbed as Record<string, any>;
    const daysSincePost = Math.max((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24), 1);
    const pushDate = r.lastPush ? new Date(r.lastPush) : p.createdAt;
    const daysSincePush = Math.max((Date.now() - pushDate.getTime()) / (1000 * 60 * 60 * 24), 0);

    score = calculatePostScore({
      language: r.language,
      stars: r.stars || 0,
      forks: r.forks || 0,
      daysSincePush,
      hasDescription: !!r.description,
      daysSincePost
    });
  } else {
    const daysSincePost = Math.max((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24), 1);
    score = 15 / Math.pow(daysSincePost, 1.2);
    if (p.images && p.images.length > 0) score += 5;
    if (p.hashtags && p.hashtags.length > 0) score += 2;
  }

  return {
    id: p.id,
    type: p.type as "standard" | "ship",
    author: {
      username: p.author.username,
      avatar: p.author.avatar ?? "",
      statusEmoji: p.author.statusEmoji,
      statusText: p.author.statusText
    },
    content: p.content,
    timestamp: p.createdAt.toISOString(),
    likes: p._count.reactions,
    comments: p._count.comments,
    repoEmbed: p.repoEmbed,
    shipDetails: p.shipDetails,
    images: p.images,
    hashtags: p.hashtags,
    repoUrl: p.repoUrl,
    score,
    passedBadge: hasPassedBadge(score)
  };
}

export default async function TagFeedPage({ params }: PageProps) {
    const { tag: rawTag } = await params;
    const normalizedTag = rawTag.toLowerCase();

    // fetch posts that contain this exact tag (case insensitive through prisma array bounds)
    const dbPosts = await prisma.post.findMany({
      where: {
        hashtags: {
          has: normalizedTag
        }
      },
    include: { 
      author: true, 
      _count: { select: { comments: true, reactions: true } },
      repostOf: {
        include: {
          author: true,
          _count: { select: { comments: true, reactions: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  // score and sort for quality
  const mapped = dbPosts.map(mapPrismaPostToProps);
  const scoredPosts = mapped.sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="flex flex-col animate-slide-up pb-12 w-full max-w-2xl mx-auto border-x border-git-border min-h-screen pt-[73px] md:pt-0">
            <div className="px-4 py-4 border-b border-git-border bg-git-bg sticky top-0 z-10 flex items-center gap-4">
                <Link href="/explore/tags" className="text-git-muted hover:text-git-accent transition-colors p-2 -ml-2 rounded-full hover:bg-git-card">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" className="fill-current">
                        <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7.25h9.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"></path>
                    </svg>
                </Link>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-git-text leading-tight">{normalizedTag}</h1>
                    <span className="text-xs text-git-muted">{scoredPosts.length} posts</span>
                </div>
            </div>

            <div className="flex flex-col">
                {scoredPosts.length === 0 ?
        <div className="p-12 text-center text-git-muted">
                        No posts found for {normalizedTag}.
                    </div> :

        <div className="stagger-children">
                        {scoredPosts.map((post) =>
          <PostCard key={post.id} post={post} />
          )}
                    </div>
        }
            </div>
        </div>);

}