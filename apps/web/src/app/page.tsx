import { auth } from "@/lib/auth";
import { getGitHubReceivedEvents, type GitHubEvent } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import FeedClient from "@/components/FeedClient";
import { type PostProps } from "@/components/PostCard";

// Helper to map a GitHub event into our PostCard format
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
                content: `Pushed ${event.payload.commits?.length ?? 0} commit(s) to ${event.repo.name}`,
            };
        case "WatchEvent":
            return {
                ...basePost,
                type: "standard",
                content: `⭐ Starred ${event.repo.name}`,
            };
        case "CreateEvent":
            return {
                ...basePost,
                type: "standard",
                content: `Created ${event.payload.ref_type} ${event.payload.ref ? `"${event.payload.ref}"` : ""} in ${event.repo.name}`,
            };
        case "ForkEvent":
            return {
                ...basePost,
                type: "standard",
                content: `🍴 Forked ${event.repo.name}`,
            };
        case "PullRequestEvent":
            return {
                ...basePost,
                type: "standard",
                content: `${event.payload.action === "opened" ? "Opened" : "Updated"} PR #${event.payload.pull_request?.number} in ${event.repo.name}: "${event.payload.pull_request?.title}"`,
            };
        case "ReleaseEvent":
            return {
                ...basePost,
                type: "ship",
                content: `Released ${event.payload.release?.tag_name} of ${event.repo.name}`,
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

    // Fetch real GitHub events for the Discover tab
    let gitHubPosts: PostProps[] = [];
    if (session?.user?.login && session.user.accessToken) {
        const events = await getGitHubReceivedEvents(session.user.login, session.user.accessToken);
        gitHubPosts = events
            .map(mapEventToPost)
            .filter((p): p is PostProps => p !== null)
            .slice(0, 20);
    }

    // Fetch DB posts for the Following tab (posts from users the current user follows)
    let dbPosts: PostProps[] = [];
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
            const posts = await prisma.post.findMany({
                where: { authorId: { in: ids } },
                include: { author: true, _count: { select: { comments: true, reactions: true } } },
                orderBy: { createdAt: "desc" },
                take: 20,
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
    }

    return (
        <FeedClient
            discoverPosts={gitHubPosts}
            followingPosts={dbPosts}
            userName={session?.user?.name ?? ""}
            userAvatar={session?.user?.image ?? ""}
        />
    );
}
