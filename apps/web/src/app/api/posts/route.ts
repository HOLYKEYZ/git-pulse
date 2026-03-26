import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import rateLimit from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500
});

export async function POST(req: Request) {
  const session = await auth();
  let username: string | null = session?.user?.login || null;
  let userInDb: any = null; // Variable to store user if found via API key

  // fallback: bearer token auth for programmatic access (github action)
  if (!username) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ") && authHeader.slice(7).startsWith("gp_")) {
      const apiKey = authHeader.slice(7); // remove "bearer "
      const tokenUser = await prisma.user.findUnique({
        where: { apiKey },
      // No select clause, fetch full user object to avoid redundant lookup
      });
      if (tokenUser) {
        username = tokenUser.username;
        userInDb = tokenUser; // Store the full user object
      }
    }
  }

  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await limiter.check(10, username);
  } catch {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { content, type, shipDetails, images, repoUrl } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const user = userInDb || await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
    }

    // extract hashtags
    const matchedTags: string[] = content.match(/#[\w-]+/g) || [];
    const hashtags = Array.from(new Set(matchedTags)).map((tag) => tag.substring(1));

    let repoEmbed: any = null;

    // extract repourl from content if not explicitly provided
    let finalRepoUrl = repoUrl;
    if (!finalRepoUrl) {
      const urlMatch = content.match(/https?:\/\/(www\.)?github\.com\/([^\s]+)\/([^\s]+)/);
      if (urlMatch) {
        finalRepoUrl = urlMatch[0];
      }
    }

    // populate repoembed if finalrepourl is provided
    if (finalRepoUrl) {
      try {
        // parse github.com/owner/name
        const match = finalRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          const owner = match[1];
          const repoName = match[2];

          const headers: Record<string, string> = {
            "Accept": "application/vnd.github.v3+json"
          };
          // use session token if available for higher rate limits
          if (session?.user?.accessToken) {
            headers["Authorization"] = `Bearer ${session.user.accessToken}`;
          }

          const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
          if (res.ok) {
            const data = await res.json();
            repoEmbed = {
              name: data.full_name,
              description: data.description,
              language: data.language,
              languageColor: "", // rendered dynamically on client
              stars: data.stargazers_count,
              forks: data.forks_count,
              lastPush: data.pushed_at || data.updated_at || new Date().toISOString(),
              url: data.html_url
            };
          }
        }
      } catch (err) {
        console.error("Failed to fetch repo embed data:", err);
      }
    }

    const post = await prisma.post.create({
      data: {
        content,
        type: type || "standard",
        authorId: user.id,
        shipDetails: shipDetails || null,
        images: images || [],
        repoUrl: finalRepoUrl || null,
        repoEmbed,
        hashtags
      },
      include: {
        author: true
      }
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}