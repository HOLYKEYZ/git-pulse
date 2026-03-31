import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// force edge/nodejs runtime without caching
export const dynamic = "force-dynamic";

import { auth } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const session = await auth(req);
  if (!session) return new Response('Unauthorized', { status: 401 });
  const encoder = new TextEncoder();

  // i create a transformstream to hold the sse connection open
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
      // find any pure-feed visible posts created between lastCheckedTime and now
      const newPosts = await prisma.post.findMany({
        where: {
          createdAt: { gt: lastCheckedTime, lte: now }
        },
        include: {
          author: { select: { username: true, githubId: true } },
          reactions: true
        },
        orderBy: { createdAt: "desc" }
      });

      lastCheckedTime = now;

      if (newPosts.length > 0) {
        // blast posts down the pipe
        for (const post of newPosts) {
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
              passedBadge: false
            }
          });
        }
      }
    } catch (error) {
      console.error("Feed SSE Error:", error);
    }
  }, 5000);

  req.signal.addEventListener("abort", () => {
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