import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePostScore } from "@/lib/algo";
import { auth } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = "force-dynamic";

type DigestPost = Prisma.PostGetPayload<{
  include: {
    author: { select: { username: true; avatar: true } };
    _count: { select: { comments: true; reactions: true } };
  };
}>;

/**
 * weekly digest generator
 * queries the top 10 highest-scored posts from the last 7 days
 * and formats them into a ready-to-copy twitter thread.
 * 
 * protected by a cron_secret query parameter for automated triggers,
 * but also accessible from the admin ui authenticated route.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const QuerySchema = z.object({ secret: z.string().optional() });
  const parseResult = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const secret = parseResult.data.secret;

  // basic auth — either via cron secret or session
  const session = await auth();
interface SessionUser { isAdmin: boolean; }
const isAuthenticatedAdmin = session && session.user && (session.user as unknown as SessionUser).isAdmin;
  if (secret !== process.env.CRON_SECRET && !isAuthenticatedAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
const ONE_WEEK_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MILLISECONDS);

    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: oneWeekAgo }
      },
      include: {
        author: { select: { username: true, avatar: true } },
        _count: { select: { comments: true, reactions: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100 // fetch more, then score and sort
    });

    // score each post
    const scoredPosts = posts.map((p: DigestPost) => {
      let score = 0;
      if (p.repoEmbed) {
        const r = p.repoEmbed as Record<string, any>;
        const daysSincePost = Math.max(
          (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24),
          1
        );
        const pushDate = r.lastPush ? new Date(r.lastPush) : p.createdAt;
        const daysSincePush = Math.max(
          (Date.now() - pushDate.getTime()) / (1000 * 60 * 60 * 24),
          0
        );
        score = calculatePostScore({
          language: r.language,
          stars: r.stars || 0,
          forks: r.forks || 0,
          daysSincePush,
          hasDescription: !!r.description,
          daysSincePost
        });
      } else {
        const daysSincePost = Math.max(
          (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24),
          1
        );
const SCORE_DIVISOR = 15;
const SCORE_POWER = 1.2;
score = SCORE_DIVISOR / Math.pow(daysSincePost, SCORE_POWER);
      }
      return { ...p, score };
    });

    // sort by score descending, take top 10
    const top10 = scoredPosts.sort((a, b) => b.score - a.score).slice(0, 10);

    // format into a twitter thread
    const threadLines = [
    `🧵 Top 10 Hidden Gems on GitPulse this week\n`,
    `These are the highest-quality projects that surfaced — scored by commit activity, tech stack novelty, and community engagement. Not popularity.\n`];


    top10.forEach((post, i) => {
      const repoName = post.repoEmbed ?
      (post.repoEmbed as Record<string, any>).name :
      null;
      const author = `@${post.author.username}`;
      const snippet = post.content.slice(0, 120).replace(/\n/g, " ");
      const reactions = post._count.reactions;
      const comments = post._count.comments;

      threadLines.push(
        `${i + 1}. ${repoName ? `**${repoName}**` : "Post"} by ${author}\n` +
        `   "${snippet}${post.content.length > 120 ? "..." : ""}"\n` +
        `   💬 ${comments} · ❤️ ${reactions} · 📊 Score: ${post.score.toFixed(1)}\n`
      );
    });

    threadLines.push(
      `\nDiscover more on GitPulse -> https://gitpulsefeed.vercel.app\n#github #opensource #buildinpublic`
    );

    const digest = threadLines.join("\n");

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      postCount: top10.length,
      digest,
      posts: top10.map((p) => ({
        id: p.id,
        author: p.author.username,
        score: p.score,
        contentPreview: p.content.slice(0, 80)
      }))
    });
  } catch (error) {
    console.error("Error generating digest:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
