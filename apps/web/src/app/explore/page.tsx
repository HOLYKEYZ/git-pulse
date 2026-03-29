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

  let trendingRepos = [];
  let trendingDevs = [];

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
      </div>
      
      <div className="p-6">
        <TrendingCard repos={trendingRepos} devs={trendingDevs} isExplorePage={true} />
      </div>
    </div>
  );
}
