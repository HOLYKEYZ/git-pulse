import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ posts: [], users: [], repos: [] });
  }

  const session = await auth();
  const headers: Record<string, string> = { "Accept": "application/vnd.github.v3+json" };
  if (session?.user?.login) {
    const token = await getServerSideToken(session.user.login);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // parallel fetch: db posts, github users, github repos
  const [posts, ghUsersRes, ghReposRes] = await Promise.all([
  prisma.post.findMany({
    where: { content: { contains: q, mode: "insensitive" } },
    include: { author: true, _count: { select: { comments: true, reactions: true } } },
    orderBy: { createdAt: "desc" },
    take: 20
  }),
  fetch(`https://api.github.com/search/users?q=${encodeURIComponent(q)}&per_page=10`, { headers }).catch(() => null),
  fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=10`, { headers }).catch(() => null)]
  );

  let githubUsers = [];
  if (ghUsersRes?.ok) {
    const data = await ghUsersRes.json();
    githubUsers = (data.items || []).map((u: any) => ({
      username: u.login,
      avatar: u.avatar_url,
      url: u.html_url
    }));
  }

  let githubRepos = [];
  if (ghReposRes?.ok) {
    const data = await ghReposRes.json();
    githubRepos = (data.items || []).map((r: any) => ({
      name: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language,
      url: r.html_url,
      forks: r.forks_count
    }));
  }

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      type: p.type,
      content: p.content,
      author: {
        username: p.author.username,
        avatar: p.author.avatar ?? "",
        statusEmoji: p.author.statusEmoji,
        statusText: p.author.statusText
      },
      timestamp: p.createdAt.toISOString(),
      likes: p._count.reactions,
      comments: p._count.comments
    })),
    users: githubUsers,
    repos: githubRepos
  });
}