import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Force edge/nodejs runtime without caching
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();
    
    // We create a TransformStream to hold the SSE connection open
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const writeEvent = (data: any) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        writer.write(encoder.encode(payload)).catch(() => {});
    };

    // Send an initial ping to establish connection
    writer.write(encoder.encode(": connected\n\n"));

    let lastCheckedTime = new Date();

    const fetchPostsInterval = setInterval(async () => {
        try {
            // Find any pure-feed visible posts created after lastCheckedTime
            const newPosts = await prisma.post.findMany({
                where: {
                    createdAt: { gt: lastCheckedTime }
                },
                include: {
                    author: { select: { username: true, githubId: true } },
                    reactions: true,
                },
                orderBy: { createdAt: "desc" }
            });

            if (newPosts.length > 0) {
                lastCheckedTime = new Date(); // Update watermark
                
                // Blast posts down the pipe
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
                            timestamp: "Just now", // Fast UI
                            likes: post.reactions.length,
                            comments: 0,
                            reactions: post.reactions,
                            images: post.images,
                            repoUrl: post.repoUrl,
                            repoEmbed: post.repoCache as any,
                            score: post.score,
                            passedBadge: post.passedBadge
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Feed SSE Error:", error);
        }
    }, 5000); // Poll DB every 5 seconds for absolute newest items

    req.signal.addEventListener("abort", () => {
        clearInterval(fetchPostsInterval);
        writer.close().catch(() => {});
    });

    return new Response(stream.readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
