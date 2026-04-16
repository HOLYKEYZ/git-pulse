import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import { generateRepoPitch } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { owner: string; name: string } }
) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const serverToken = await getServerSideToken(session.user.login);
  if (!serverToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, name } = params;
  if (typeof owner !== 'string' || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid repository owner or name' }, { status: 400 });
  }
  if (!owner.trim() || !name.trim()) {
    return NextResponse.json({ error: 'Repository owner and name are required' }, { status: 400 });
  }

  try {
    // fetch repo data from github to build context for the ai
    const repoRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
      {
        headers: {
          Authorization: `Bearer ${serverToken}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return NextResponse.json(
          { error: "Repository not found" },
          { status: 404 }
        );
      } else if (repoRes.status === 401 || repoRes.status === 403) {
        return NextResponse.json(
          { error: "Unauthorized or forbidden" },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          { error: "Failed to fetch repository data" },
          { status: 500 }
        );
      }
    }

    const repo = await repoRes.json();

    // try to fetch readme excerpt for richer context
    let readmeExcerpt: string | undefined;
    try {
      const readmeRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/readme`,
        {
          headers: {
          Authorization: `Bearer ${serverToken}`,
            Accept: "application/vnd.github.v3+json"
          }
        }
      );
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        if (readmeData.content) {
          const decoded = Buffer.from(readmeData.content, "base64").toString("utf-8");
          readmeExcerpt = decoded.slice(0, 500);
        }
      }
    } catch (error) {
      console.error('Error fetching readme:', error);
    }
    const pitch = await generateRepoPitch({
      name: repo.name,
      owner: repo.owner.login,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      topics: repo.topics || [],
      readmeExcerpt
    });

    return NextResponse.json({ pitch, repo: `${owner}/${name}` });
  } catch (error) {
    console.error("Error generating repo summary:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
