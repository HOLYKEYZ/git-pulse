import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.accessToken) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

try {
  let nextPageUrl = "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator";
  let allRepos = [];

  while (nextPageUrl) {
    const res = await fetch(nextPageUrl, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
        Accept: "application/vnd.github+json",
      },
      // next 14 fetch options
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ error: "failed to fetch repos" }, { status: res.status });
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

  const mappedRepos = allRepos.map((repo) => ({
    name: repo.name,
    full_name: repo.full_name
  }));

  return NextResponse.json(mappedRepos);
} catch (error: unknown) {
  console.error("Error fetching GitHub repositories:", error);
  return NextResponse.json({ error: "server error" }, { status: 500 });
}
}
