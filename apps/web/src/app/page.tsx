import { auth } from "@/lib/auth";
import { getGitHubReceivedEvents, type GitHubEvent } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import FeedClient from "@/components/FeedClient";
import { type PostProps } from "@/components/PostCard";

/**
 * Smart feed: Filter out noise (stars, forks, minor pushes).
 * Keep meaningful events: PRs, issues, releases, new repos, big pushes.
 */
function isWorthShowing(event: GitHubEvent): boolean {
    switch (event.type) {
        case "PullRequestEvent":
            return event.payload.action === "opened";
        case "IssuesEvent":
            return event.payload.action === "opened";
        case "ReleaseEvent":
            return true;
        case "CreateEvent":
            return event.payload.ref_type === "repository";
        case "PushEvent":
            return (event.payload.size ?? event.payload.commits?.length ?? 0) >= 3;
        default:
            return false;
    }
}

function mapEventToPost(event: GitHubEvent): PostProps | null {
    const basePost = {
        id: event.id,
        author: {
            username: event.actor.login,
            avatar: event.actor.avatar_url,
        },
        timestamp: new Date(event.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
        likes: 0,
        comments: 0,
    };

    switch (event.type) {
        case "PushEvent":
            return {
                ...basePost,
                type: "standard",
                content: `Pushed ${event.payload.commits?.length ?? 0} commits to ${event.repo.name}`,
            };
        case "CreateEvent":
            return {
                ...basePost,
                type: "standard",
                content: `🚀 Created new repository ${event.repo.name}`,
            };
        case "PullRequestEvent":
            return {
                ...basePost,
                type: "standard",
                content: `Opened PR #${event.payload.pull_request?.number}: ${event.payload.pull_request?.title ?? "Untitled"} in ${event.repo.name}`,
            };
        case "IssuesEvent":
            return {
                ...basePost,
                type: "standard",
                content: `Opened issue #${event.payload.issue?.number}: ${event.payload.issue?.title ?? "Untitled"} in ${event.repo.name}`,
            };
        case "ReleaseEvent":
            return {
                ...basePost,
                type: "ship",
                content: `Released ${event.payload.release?.tag_name ?? "new version"} of ${event.repo.name}`,
                shipDetails: {
                    version: event.payload.release?.tag_name ?? "v0.0.0",
                    changelog: event.payload.release?.body ?? "No changelog provided.",
                },
            };
        default:
            return null;
    }
}

export default async function HomePage() {
    const session = await auth();

    // Fetch real GitHub events — filtered for quality
    let gitHubPosts: PostProps[] = [];
    if (session?.user?.login && session.user.accessToken) {
        const events = await getGitHubReceivedEvents(session.user.login, session.user.accessToken);
        gitHubPosts = events
            .filter(isWorthShowing)
            .map(mapEventToPost)
            .filter((p): p is PostProps => p !== null)
            .slice(0, 20);
    }

    // Fetch ALL DB posts for the feed (not just from followed users)
    let dbPosts: PostProps[] = [];
    if (session?.user?.login) {
        const posts = await prisma.post.findMany({
            include: { author: true, _count: { select: { comments: true, reactions: true } } },
            orderBy: { createdAt: "desc" },
            take: 30,
        });
        dbPosts = posts.map((p) => ({
            id: p.id,
            type: p.type as "standard" | "ship",
            author: {
                username: p.author.username,
                avatar: p.author.avatar ?? "",
            },
            content: p.content,
            timestamp: p.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            likes: p._count.reactions,
            comments: p._count.comments,
            repoEmbed: p.repoEmbed as PostProps["repoEmbed"],
            shipDetails: p.shipDetails as PostProps["shipDetails"],
        }));
    }

    // Merge DB posts into Discover tab too, so user-created content is always visible
    const discoverPosts = [...dbPosts, ...gitHubPosts]
        .sort((a, b) => {
            // Sort by timestamp descending (rough)
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        })
        .slice(0, 30);

    // Following tab: only posts from people you follow + your own
    let followingPosts: PostProps[] = [];
    if (session?.user?.login) {
        const dbUser = await prisma.user.findUnique({
            where: { username: session.user.login },
            select: { id: true },
        });
        if (dbUser) {
            const followedIds = await prisma.follow.findMany({
                where: { followerId: dbUser.id },
                select: { followingId: true },
            });
            const ids = [dbUser.id, ...followedIds.map((f) => f.followingId)];
            followingPosts = dbPosts.filter((p) => {
                // Keep posts by the user or by users they follow
                return ids.length > 0;
            });

            // Re-query with proper filter
            const filteredPosts = await prisma.post.findMany({
                where: { authorId: { in: ids } },
                include: { author: true, _count: { select: { comments: true, reactions: true } } },
                orderBy: { createdAt: "desc" },
                take: 20,
            });
            followingPosts = filteredPosts.map((p) => ({
                id: p.id,
                type: p.type as "standard" | "ship",
                author: {
                    username: p.author.username,
                    avatar: p.author.avatar ?? "",
                },
                content: p.content,
                timestamp: p.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
                likes: p._count.reactions,
                comments: p._count.comments,
                repoEmbed: p.repoEmbed as PostProps["repoEmbed"],
                shipDetails: p.shipDetails as PostProps["shipDetails"],
            }));
        }
    }

    return (
        <FeedClient
            discoverPosts={discoverPosts}
            followingPosts={followingPosts}
            userName={session?.user?.name ?? ""}
            userAvatar={session?.user?.image ?? ""}
        />
    );
}
