import Link from "next/link";
import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import TrendingCard from "@/components/TrendingCard";
import ToggleSidebarCard from "@/components/ToggleSidebarCard";
import {
  getGitHubTrendingRepos, getGitHubTrendingDevelopers,
  getUpcomingGitHubProjects, getUpcomingGitHubDevs,
  getTopReposByDailyCommits, getTopDevsByDailyCommits,
  getDevelopersLikeYou, getSuggestedGitHubUsers, getTopReposToStar
} from "@/lib/github";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore | GitPulse",
  description: "Discover what developers are talking about on GitPulse"
};

export default async function ExplorePage() {
  const session = await auth().catch((error) => {
    console.error("[Auth] Failed to resolve explore session:", error);
    return null;
  });
  const token = session?.user?.login ? (await getServerSideToken(session.user.login) || "") : "";

  let trendingRepos: any[] = [];
  let trendingDevs: any[] = [];
  let upcomingProjects: any[] = [];
  let upcomingDevs: any[] = [];
  let activeProjects: any[] = [];
  let activeDevs: any[] = [];
  let developersLikeYou: any[] = [];
  let suggestedUsers: any[] = [];
  let suggestedRepos: any[] = [];

  try {
    if (token) {
      const [_trRepos, _trDevs, _upRepos, _upDevs, _acRepos, _acDevs, _devsLikeYou, _sgUsers, _sgRepos] = await Promise.all([
        getGitHubTrendingRepos(token, 15),
        getGitHubTrendingDevelopers(token, 15),
        getUpcomingGitHubProjects(token, 15),
        getUpcomingGitHubDevs(token, 15),
        getTopReposByDailyCommits(token, 15),
        getTopDevsByDailyCommits(token, 15),
        session?.user?.login ? getDevelopersLikeYou(session.user.login, token, 15) : Promise.resolve([]),
        getSuggestedGitHubUsers(token, undefined, 15),
        getTopReposToStar(token, 15)
      ]);
      trendingRepos = _trRepos;
      trendingDevs = _trDevs;
      upcomingProjects = _upRepos;
      upcomingDevs = _upDevs;
      activeProjects = _acRepos;
      activeDevs = _acDevs;
      developersLikeYou = _devsLikeYou;
      suggestedUsers = _sgUsers;
      suggestedRepos = _sgRepos;
    }
  } catch (err) {
    console.error("Failed to fetch data for explore route", err);
  }

  return (
    <div className="flex flex-col w-full min-h-screen pb-12">
      <div className="sticky top-0 z-10 bg-git-bg/80 backdrop-blur-md border-b border-git-border px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-git-text shrink-0 mr-2">Explore</h1>

          {/* Search Bar Implementation aligned next to explore */}
          <div className="flex-1 max-w-md">
            <form action="/search" method="GET" className="relative group w-full">
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-git-muted group-focus-within:text-git-accent transition-colors"><path d="M10.25 2.75a7.5 7.5 0 1 0 5.105 12.984l5.242 5.243a.748.748 0 0 0 1.058-1.058l-5.243-5.242A7.5 7.5 0 1 0 10.25 2.75Zm-6 7.5a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z"></path></svg>
              <input
                type="text"
                name="q"
                placeholder="Search posts, users, and repos..."
                className="w-full bg-git-card border border-git-border rounded-full py-2 pl-10 pr-4 text-[14px] text-git-text placeholder:text-git-muted outline-none focus:border-git-accent focus:bg-git-bg transition-colors"
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue) {
                    // logically sound sanitization: encode instead of redundant replacements
                    const sanitizedInput = inputValue
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .trim();
                    e.target.value = sanitizedInput;
                  }
                }}
              />
            </form>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <Link href="/explore/tags" className="text-sm text-git-accent hover:underline flex items-center gap-1">
            <svg height="14" viewBox="0 0 16 16" width="14" className="fill-current">
              <path d="M5.5 2.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.22.53l-6.25 6.25a.75.75 0 0 1-1.06 0l-5.5-5.5a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 .53-.22Zm.75.75v4.69l-5.72 5.72 4.97 4.97 5.72-5.72V3h-4.97ZM8.75 5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"></path>
            </svg>
            Explore Hashtags
          </Link>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <TrendingCard repos={trendingRepos} devs={trendingDevs} isExplorePage={true} />

        <div className="flex flex-col gap-6">
          {session?.user && developersLikeYou.length > 0 && (
            <ToggleSidebarCard
              title="Developers Like You"
              tab1="Matches"
              tab2="Ecosystem"
              items1={developersLikeYou}
              items2={[]}
              type1="dev"
              type2="dev"
              hideCommitCount={true}
              emptyMessage1="No matching developers found."
              emptyMessage2="Ecosystem peers will appear here soon."
            />
          )}

          <ToggleSidebarCard
            title="Explore"
            tab1="Who to follow"
            tab2="What to star"
            items1={suggestedUsers}
            items2={suggestedRepos}
            type1="dev"
            type2="repo"
            emptyMessage1="No suggested users found."
            emptyMessage2="No repos to star today."
          />

          <ToggleSidebarCard
            title="Upcoming Data"
            tab1="Projects"
            tab2="Devs"
            items1={upcomingProjects}
            items2={upcomingDevs}
            type1="repo"
            type2="dev"
            hideCommitCount={true}
            emptyMessage1="No active upcoming projects found."
            emptyMessage2="No upcoming devs found."
          />

          <ToggleSidebarCard
            title="Most Active Today"
            tab1="Repos"
            tab2="Devs"
            items1={activeProjects}
            items2={activeDevs}
            type1="repo"
            type2="dev"
            emptyMessage1="No highly pushed repos found."
            emptyMessage2="No highly active devs found today."
          />
        </div>
      </div>
    </div>
  );
}
