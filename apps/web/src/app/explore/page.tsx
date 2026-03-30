import Link from "next/link";
// Next.js 15 requires server components for direct fetching, so we wrap it
import { auth } from "@/lib/auth";
import TrendingCard from "@/components/TrendingCard";
import { getGitHubTrendingRepos, getGitHubTrendingDevelopers } from "@/lib/github";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore | GitPulse",
  description: "Discover what developers are talking about on GitPulse"
};

export default async function ExplorePage() {
  const session = await auth();
  const token = session?.user?.accessToken || "";

  let trendingRepos: any[] = [];
  let trendingDevs: any[] = [];

  try {
    if (token) {
      const [_repos, _devs] = await Promise.all([
        getGitHubTrendingRepos(token, 25),
        getGitHubTrendingDevelopers(token, 25),
      ]);
      trendingRepos = _repos;
      trendingDevs = _devs;
    }
  } catch (err) {
    console.error("Failed to fetch trending data for explore route", err);
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="sticky top-0 z-10 bg-git-bg/80 backdrop-blur-md border-b border-git-border px-6 py-4">
        <h1 className="text-xl font-bold text-git-text">Explore</h1>
        <p className="text-sm text-git-muted mt-1">
          Discover currently trending projects and developers across the platform.
        </p>
        <div className="flex gap-4 mt-3">
          <Link href="/explore/tags" className="text-sm text-git-accent hover:underline flex items-center gap-1">
            <svg height="14" viewBox="0 0 16 16" width="14" className="fill-current">
              <path d="M5.5 2.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.22.53l-6.25 6.25a.75.75 0 0 1-1.06 0l-5.5-5.5a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 .53-.22Zm.75.75v4.69l-5.72 5.72 4.97 4.97 5.72-5.72V3h-4.97ZM8.75 5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"></path>
            </svg>
            Trending Hashtags
          </Link>
        </div>
      </div>
      
      <div className="p-6">
        <TrendingCard repos={trendingRepos} devs={trendingDevs} isExplorePage={true} />
      </div>
    </div>
  );
}
