import Link from "next/link";
import { auth } from "@/lib/auth";
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
import { Suspense } from "react";
import { SidebarSkeleton } from "./Skeletons";

async function TrendingSection({ token }: { token: string }) {
  const [repos, devs] = await Promise.all([
    getGitHubTrendingRepos(token, 5),
    getGitHubTrendingDevelopers(token, 5)
  ]);
  return <TrendingCard repos={repos} devs={devs} />;
}

async function UpcomingSection({ token }: { token: string }) {
  const [projects, devs] = await Promise.all([
    getUpcomingGitHubProjects(token, 5),
    getUpcomingGitHubDevs(token, 5)
  ]);
  if (projects.length === 0 && devs.length === 0) return null;
  return (
    <ToggleSidebarCard
      title="Upcoming"
      tab1="Projects"
      tab2="Devs"
      items1={projects}
      items2={devs}
      type1="repo"
      type2="dev"
      hideCommitCount={true}
      emptyMessage1="No active upcoming projects found."
      emptyMessage2="No fast-growing devs found."
    />
  );
}

async function ActiveTodaySection({ token }: { token: string }) {
  const [projects, devs] = await Promise.all([
    getTopReposByDailyCommits(token, 5),
    getTopDevsByDailyCommits(token, 5)
  ]);
  if (projects.length === 0 && devs.length === 0) return null;
  return (
    <ToggleSidebarCard
      title="Most Active Today"
      tab1="Repos"
      tab2="Devs"
      items1={projects}
      items2={devs}
      type1="repo"
      type2="dev"
      emptyMessage1="No heavily pushed repos found."
      emptyMessage2="No highly active devs found today."
    />
  );
}

async function DevelopersLikeYouSection({ token, login }: { token: string; login: string }) {
  const devs = await getDevelopersLikeYou(login, token, 5);
  if (devs.length === 0) return null;
  return (
    <ToggleSidebarCard
      title="Developers Like You"
      tab1="Matches"
      tab2="Ecosystem"
      items1={devs}
      items2={[]}
      type1="dev"
      type2="dev"
      hideCommitCount={true}
      emptyMessage1="No matching developers found."
      emptyMessage2="Ecosystem peers will appear here soon."
    />
  );
}

async function ExploreSection({ token }: { token: string }) {
  const [users, repos] = await Promise.all([
    getSuggestedGitHubUsers(token, undefined, 5),
    getTopReposToStar(token, 5)
  ]);
  return (
    <ToggleSidebarCard
      title="Explore"
      tab1="Who to follow"
      tab2="What to star"
      items1={users}
      items2={repos}
      type1="dev"
      type2="repo"
      hideCommitCount={true}
      emptyMessage1="No suggestions found."
      emptyMessage2="No big repositories found."
    />
  );
}

export default async function RightSidebar() {
  const session = await auth();
  const token = session?.user?.accessToken;

  if (!token) return null;

  return (
    <aside className="hidden w-[350px] shrink-0 lg:block">
      <div className="sticky top-0 pt-3 flex flex-col gap-4">
        <Suspense fallback={<SidebarSkeleton />}>
          <TrendingSection token={token} />
        </Suspense>

        <Suspense fallback={<SidebarSkeleton />}>
          <UpcomingSection token={token} />
        </Suspense>

        <Suspense fallback={<SidebarSkeleton />}>
          <ActiveTodaySection token={token} />
        </Suspense>

        {session?.user && <CollabWidget />}

        {session?.user?.login && (
          <Suspense fallback={<SidebarSkeleton />}>
            <DevelopersLikeYouSection token={token} login={session.user.login} />
          </Suspense>
        )}

        <Suspense fallback={<SidebarSkeleton />}>
          <ExploreSection token={token} />
        </Suspense>

        <div className="px-4 text-[13px] text-git-muted flex flex-wrap gap-x-3 gap-y-1 pb-4">
          <Link href="#" className="hover:underline">About</Link>
          <Link href="#" className="hover:underline">Terms</Link>
          <Link href="#" className="hover:underline">Privacy</Link>
          <span>© 2026 GitPulse</span>
        </div>
      </div>
    </aside>
  );
}