import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import { NextResponse } from "next/server";

import { withCache } from "@/lib/cache";
export async function GET() {
    const session = await auth();
    if (!session?.user?.login) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const serverToken = await getServerSideToken(session.user.login);
    if (!serverToken) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const cacheKey = `github-repos-${session.user.id}`;
    try {
        const allRepos = await withCache(cacheKey, () => fetchUserReposFromGitHub(serverToken));
        return NextResponse.json(allRepos);
    } catch (error: unknown) {
        console.error("Error fetching GitHub repositories:", error);
        return NextResponse.json({ error: "server error" }, { status: 500 });
    }
}

async function fetchUserReposFromGitHub(accessToken: string) {
  let nextPageUrl: string | null = "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator";
  let allRepos: any[] = [];

  while (nextPageUrl) {
    const res: Response = await fetch(nextPageUrl as string, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch repos: ${res.status}`);
    }

    const data = await res.json();
    const repos = data.map((r: any) => ({
      name: r.name,
      full_name: r.full_name
    }));

    allRepos = allRepos.concat(repos);

    const linkHeader = res.headers.get('Link');
    if (linkHeader) {
      const nextPage = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (nextPage) {
        nextPageUrl = nextPage[1];
      } else {
        nextPageUrl = null;
      }
    } else {
      nextPageUrl = null;
    }
  }
  return allRepos;
}
