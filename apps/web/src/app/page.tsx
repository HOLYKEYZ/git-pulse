import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import { getGitHubReceivedEvents, type GitHubEvent } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import FeedClient from "@/components/FeedClient";
import { type PostProps } from "@/components/PostCard";
import { calculatePostScore } from "@/lib/algo";
import { hasPassedBadge } from "@/lib/badges";
import { getRelativeTime } from "@/lib/utils";
import RightSidebar from "@/components/RightSidebar";
import WelcomeHero from "@/components/WelcomeHero";
import { Suspense } from "react";
import { SidebarSkeleton } from "@/components/Skeletons";

// known bot patterns to filter out
const BOT_PATTERNS = [
/bot$/i, /\[bot\]$/i, /^dependabot/i, /^renovate/i, /^copilot/i,
/^github-actions/i, /^dmca/i, /^snyk/i, /^greenkeeper/i, /^imgbot/i,
/^codecov/i, /^stale/i, /^mergify/i, /^allcontributors/i];


function isBot(login: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(login));
}

/**
 * smart feed: filter out noise (stars, forks, minor pushes) and bots.
 * keep meaningful events: prs, issues, releases, new repos, big pushes.
 */
function isWorthShowing(event: GitHubEvent): boolean {
  // filter bots first
  if (isBot(event.actor.login)) return false;

  switch (event.type) {
    case "PullRequestEvent":{
        if (event.payload.action === "opened") return true;
        const comments = (event.payload.pull_request as any)?.comments ?? 0;
        return comments >= 40;
      }
    case "IssuesEvent":{
        if (event.payload.action === "opened") return true;
        const comments = event.payload.issue?.comments ?? 0;
        return comments >= 40;
      }
    case "DiscussionEvent":{
        const comments = (event.payload as any).discussion?.comments ?? 0;
        return comments >= 25;
      }
    case "ReleaseEvent":
      return true;
    case "CreateEvent":
      return event.payload.ref_type === "repository";
    case "PushEvent":
      return (event.payload.size ?? event.payload.commits?.length ?? 0) >= 10;
    default:
      return false;
  }
}

function mapEventToPost(event: GitHubEvent): PostProps | null {
  const repoUrl = `https://github.com/${event.repo.name}`;
  
  const basePost = {
    id: event.id,
    isExternalEvent: true,
    externalUrl: repoUrl,
    author: {
      username: event.actor.login,
      avatar: event.actor.avatar_url
    },
    timestamp: getRelativeTime(new Date(event.created_at)),
    likes: 0,
    comments: 0
  };

  let isTrending = false;
  if (event.type === "PullRequestEvent" && (event.payload.pull_request as any)?.comments >= 40) isTrending = true;
  if (event.type === "IssuesEvent" && (event.payload.issue?.comments ?? 0) >= 40) isTrending = true;
  if (event.type === "DiscussionEvent" && (event.payload as any).discussion?.comments >= 25) isTrending = true;

  const trendingTag = isTrending ? "\n\n#trending" : "";

  switch (event.type) {
    case "PushEvent":
      return {
        ...basePost,
        type: "standard",
        content: `Pushed ${event.payload.commits?.length ?? 0} commits to [${event.repo.name}](${repoUrl})`
      };
    case "CreateEvent":
      return {
        ...basePost,
        type: "standard",
        content: `🚀 Created new repository [${event.repo.name}](${repoUrl})`
      };
    case "PullRequestEvent":
      const action = event.payload.action === "opened" ? "Opened" : "Updated";
      const prUrl = (event.payload.pull_request as any)?.html_url ?? repoUrl;
      return {
        ...basePost,
        externalUrl: prUrl,
        type: "standard",
        content: `${action} PR #${event.payload.pull_request?.number}: [${event.payload.pull_request?.title ?? "Untitled"}](${prUrl}) in ${event.repo.name}${trendingTag}`
      };
    case "IssuesEvent":
      const issueAction = event.payload.action === "opened" ? "Opened" : "Updated";
      const issueUrl = event.payload.issue?.html_url ?? repoUrl;
      return {
        ...basePost,
        externalUrl: issueUrl,
        type: "standard",
        content: `${issueAction} issue #${event.payload.issue?.number}: [${event.payload.issue?.title ?? "Untitled"}](${issueUrl}) in ${event.repo.name}${trendingTag}`
      };
    case "DiscussionEvent":
      return {
        ...basePost,
        type: "standard",
        content: `Active discussion: ${(event.payload as any).discussion?.title ?? "Untitled"} in ${event.repo.name}${trendingTag}`
      };
    case "ReleaseEvent":
      const releaseUrl = event.payload.release?.html_url ?? repoUrl;
      return {
        ...basePost,
        externalUrl: releaseUrl,
        type: "ship",
        content: `Released [${event.payload.release?.tag_name ?? "new version"}](${releaseUrl}) of ${event.repo.name}`,
        shipDetails: {
          version: event.payload.release?.tag_name ?? "v0.0.0",
          changelog: event.payload.release?.body ?? "No changelog provided."
        }
      };
    default:
      return null;
  }
}

function mapPrismaPostToProps(p: {
  id: string;
  type: string;
  content: string;
  createdAt: Date;
  repoEmbed: unknown;
  shipDetails: unknown;
  images?: string[];
  hashtags?: string[];
  repoUrl?: string | null;
  author: {username: string;avatar: string | null; statusEmoji?: string | null; statusText?: string | null;};
  _count: {comments: number;reactions: number;};
  repostOf?: any;
}): PostProps {
  // if this is a repost, recursively map the original post and attach repost metadata
  if (p.repostOf) {
    return {
      ...mapPrismaPostToProps(p.repostOf),
      isRepost: true,
      repostedBy: p.author.username,
      id: p.id // keep the new post ID for uniqueness in React keys
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
      daysSincePost,
      commitCount: r.commitCount,
      pushConsistency: r.pushConsistency
    });
  } else {
    // base score for non-repo posts (images, text) decaying over time
    const daysSincePost = Math.max((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24), 1);
    score = 15 / Math.pow(daysSincePost, 1.2);

    // boost score if has images or hashtags
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
    timestamp: getRelativeTime(p.createdAt),
    likes: p._count.reactions,
    comments: p._count.comments,
    repoEmbed: p.repoEmbed as PostProps["repoEmbed"],
    shipDetails: p.shipDetails as PostProps["shipDetails"],
    images: p.images,
    hashtags: p.hashtags,
    repoUrl: p.repoUrl,
    score,
    passedBadge: hasPassedBadge(score)
  };
}

export default async function HomePage() {
  const session = await auth();

  // unauthenticated users get the welcome landing page
  if (!session) {
    return <WelcomeHero />;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // discover: user-created posts only. scored via algo.
  // ═══════════════════════════════════════════════════════════════════════
  let discoverPosts: PostProps[] = [];
  if (session?.user?.login) {
    // fetch a larger pool to score
    const posts = await prisma.post.findMany({
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
      take: 100
    });
    const mapped = posts.map(mapPrismaPostToProps);
    // sort by algo score descending, then take top 30
    discoverPosts = mapped.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 30);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // following: posts from people you follow + your own posts
  // ═══════════════════════════════════════════════════════════════════════
  let followingPosts: PostProps[] = [];
  if (session?.user?.login) {
    const dbUser = await prisma.user.findUnique({
      where: { username: session.user.login },
      select: { id: true }
    });
    if (dbUser) {
      const followedIds = await prisma.follow.findMany({
        where: { followerId: dbUser.id },
        select: { followingId: true }
      });
      const ids = [dbUser.id, ...followedIds.map((f) => f.followingId)];
      const filteredPosts = await prisma.post.findMany({
        where: { authorId: { in: ids } },
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
        take: 20
      });
      followingPosts = filteredPosts.map(mapPrismaPostToProps);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // activity: real github events, bot-filtered, from followed users
  // ═══════════════════════════════════════════════════════════════════════
  let activityPosts: PostProps[] = [];
  if (session?.user?.login) {
    const token = await getServerSideToken(session.user.login);
    if (token) {
      const events = await getGitHubReceivedEvents(session.user.login, token);
      activityPosts = events.
      filter(isWorthShowing).
      map(mapEventToPost).
      filter((p): p is PostProps => p !== null).
      slice(0, 20);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full">
            <div className="flex-1 w-full lg:max-w-[600px] min-h-screen lg:border-r lg:border-git-border lg:pr-2">
                <FeedClient
          discoverPosts={discoverPosts}
          followingPosts={followingPosts}
          activityPosts={activityPosts}
          userName={session?.user?.name ?? ""}
          userAvatar={session?.user?.image ?? ""} />
        
            </div>
            {/* right sidebar — async, wrapped in suspense */}
            <Suspense fallback={<div className="hidden w-[350px] shrink-0 lg:block"><SidebarSkeleton /></div>}>
                <RightSidebar />
            </Suspense>
        </div>);

}