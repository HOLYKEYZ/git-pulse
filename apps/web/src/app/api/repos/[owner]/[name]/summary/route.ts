import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateRepoPitch } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: {params: {owner: string;name: string;};}
)
  const session = await auth();
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

const { owner, name } = params;

  try {
    // fetch repo data from github to build context for the ai
    const repoRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}`,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    if (!repoRes.ok) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    const repo = await repoRes.json();

    // try to fetch readme excerpt for richer context
    let readmeExcerpt: string | undefined;
    try {
      const readmeRes = await fetch(
        `https://api.github.com/repos/${owner}/${name}/readme`,
        {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
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
    } catch {

      // readme fetch is best-effort
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