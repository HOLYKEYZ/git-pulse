import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// force edge/nodejs runtime without caching
export const dynamic = "force-dynamic";

import { auth } from '@/lib/auth';

// vercel hobby plan kills functions at 60s — we close cleanly at 55s
const SSE_TIMEOUT_MS = 55_000;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.login) return new Response('Unauthorized', { status: 401 });

  const currentUsername = session.user.login;
  const encoder = new TextEncoder();

  // fetch the current user's following list to filter the feed
  const currentUser = await prisma.user.findUnique({
    where: { username: currentUsername },
    select: {
      following: { select: { followingId: true } }
    }
  });
  const followingIds = currentUser?.following.map((f) => f.followingId) || [];

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeEvent = (data: any) => {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    writer.write(encoder.encode(payload)).catch(() => {});
  };

  // send an initial ping to establish connection
  writer.write(encoder.encode(": connected\n\n"));

  let lastCheckedTime = new Date();

  const fetchPostsInterval = setInterval(async () => {
    const now = new Date();
    try {
      // only fetch posts from users the current user follows
      const whereClause: any = {
        createdAt: { gt: lastCheckedTime, lte: now }
      };

      // if the user follows anyone, filter to only those authors
      if (followingIds.length > 0) {
        whereClause.authorId = { in: followingIds };
      }

      const newPosts = await prisma.post.findMany({
        where: whereClause,
        include: {
          author: { select: { username: true, githubId: true } },
          reactions: true,
          repostOf: { include: { author: { select: { username: true, githubId: true } }, reactions: true } }
        },
        orderBy: { createdAt: "desc" }
      });

      lastCheckedTime = now;

      if (newPosts.length > 0) {
        for (const post of newPosts) {
          const isQuote = post.content !== `Reposted by @${post.author.username}`;
          
          let quotedPost = undefined;
          if (post.repostOf && isQuote) {
            quotedPost = {
              id: post.repostOf.id,
              type: post.repostOf.type,
              author: {
                username: post.repostOf.author.username,
                avatar: `https://avatars.githubusercontent.com/u/${post.repostOf.author.githubId}?v=4`
              },
              content: post.repostOf.content,
              timestamp: post.repostOf.createdAt.toISOString(),
              likes: post.repostOf.reactions.length,
              comments: 0,
              reactions: post.repostOf.reactions,
              images: post.repostOf.images,
              repoUrl: post.repostOf.repoUrl,
              repoEmbed: post.repostOf.repoEmbed,
              score: 0,
              passedBadge: false
            };
          }

          writeEvent({
            type: "NEW_POST",
            post: {
              id: post.id,
              type: post.type,
              author: {
                username: post.author.username,
                avatar: `https://avatars.githubusercontent.com/u/${post.author.githubId}?v=4`
              },
              content: post.content,
              timestamp: post.createdAt.toISOString(),
              likes: post.reactions.length,
              comments: 0,
              reactions: post.reactions,
              images: post.images,
              repoUrl: post.repoUrl,
              repoEmbed: post.repoEmbed,
              score: 0,
              passedBadge: false,
              quotedPost,
              isRepost: post.repostOf && !isQuote ? true : undefined,
              repostedBy: post.repostOf && !isQuote ? post.author.username : undefined
            }
          });
        }
      }
    } catch (error) {
      console.error("Feed SSE Error:", error);
    }
  }, 5000);

  // deterministic 55s timeout — close before vercel kills us at 60s
  const timeoutHandle = setTimeout(() => {
    clearInterval(fetchPostsInterval);
    writer.close().catch(() => {});
  }, SSE_TIMEOUT_MS);

  req.signal.addEventListener("abort", () => {
    clearTimeout(timeoutHandle);
    clearInterval(fetchPostsInterval);
    writer.close().catch(() => {});
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}
