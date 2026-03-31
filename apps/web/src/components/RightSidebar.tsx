import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  getGitHubTrendingRepos, getGitHubTrendingDevelopers, 
  getSuggestedGitHubUsers, getTopReposToStar,
  getUpcomingGitHubProjects, getUpcomingGitHubDevs,
  getTopReposByDailyCommits, getTopDevsByDailyCommits,
  getDevelopersLikeYou
} from "@/lib/github";
import CollabWidget from "./CollabWidget";
import TrendingCard from "./TrendingCard";
import ToggleSidebarCard from "./ToggleSidebarCard";

export default async function RightSidebar() {
  const session = await auth();
  const token = session?.user?.accessToken;

  // fetch everything in parallel to avoid waterfalls
  const [
    trendingRepos, trendingDevs,
    upcomingProjects, upcomingDevs,
    activeProjects, activeDevs,
    suggestedUsers, suggestedRepos,
    developersLikeYou
  ] = token ? await Promise.all([
    getGitHubTrendingRepos(token, 5),
    getGitHubTrendingDevelopers(token, 5),
    getUpcomingGitHubProjects(token, 5),
    getUpcomingGitHubDevs(token, 5),
    getTopReposByDailyCommits(token, 5),
    getTopDevsByDailyCommits(token, 5),
    getSuggestedGitHubUsers(token, undefined, 5),
    getTopReposToStar(token, 5),
    session?.user?.login ? getDevelopersLikeYou(session.user.login, token, 5) : Promise.resolve([])
  ]) : [[], [], [], [], [], [], [], [], []];

  return (
    <aside className="hidden w-[350px] shrink-0 lg:block">
      <div className="sticky top-0 pt-3 flex flex-col gap-4">

        {/* trending repos + devs — real data with toggle */}
        <TrendingCard repos={trendingRepos} devs={trendingDevs} />

        {/* upcoming projects w/ devs toggle */}
        <ToggleSidebarCard
          title="Upcoming"
          tab1="Projects"
          tab2="Devs"
          items1={upcomingProjects}
          items2={upcomingDevs}
          type1="repo"
          type2="dev"
          hideCommitCount={true}
          emptyMessage1="No active upcoming projects found."
          emptyMessage2="No fast-growing devs found."
        />

        {/* most active today w/ devs toggle */}
        <ToggleSidebarCard
          title="Most Active Today"
          tab1="Repos"
          tab2="Devs"
          items1={activeProjects}
          items2={activeDevs}
          type1="repo"
          type2="dev"
          emptyMessage1="No heavily pushed repos found."
          emptyMessage2="No highly active devs found today."
        />

        {/* collab matching */}
        {session?.user && <CollabWidget />}

        {/* developers like you */}
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

        {/* who to follow w/ what to star toggle */}
        <ToggleSidebarCard
          title="Explore"
          tab1="Who to follow"
          tab2="What to star"
          items1={suggestedUsers}
          items2={suggestedRepos}
          type1="dev"
          type2="repo"
          hideCommitCount={true}
          emptyMessage1="No suggestions found."
          emptyMessage2="No big repositories found."
        />

        {/* footer */}
        <div className="px-4 text-[13px] text-git-muted flex flex-wrap gap-x-3 gap-y-1">
          <Link href="#" className="hover:underline">About</Link>
          <Link href="#" className="hover:underline">Terms</Link>
          <Link href="#" className="hover:underline">Privacy</Link>
          <span>© 2026 GitPulse</span>
        </div>
      </div>
    </aside>
  );
}