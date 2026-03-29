import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGitHubTrendingRepos, getGitHubTrendingDevelopers, getSuggestedGitHubUsers, getUpcomingGitHubProjects, getTopReposByDailyCommits } from "@/lib/github";
import { getLanguageColor } from "@/lib/colors";
import CollabWidget from "./CollabWidget";
import TrendingCard from "./TrendingCard";

export default async function RightSidebar() {
  const session = await auth();
  const token = session?.user?.accessToken;

  // fetch real trending repos + devs in parallel
  const [trendingRepos, trendingDevs] = token
    ? await Promise.all([
        getGitHubTrendingRepos(token, 5),
        getGitHubTrendingDevelopers(token, 5),
      ])
    : [[], []];
  
  // fetch upcoming projects with low stars
  const upcomingProjects = token ? await getUpcomingGitHubProjects(token, 3) : [];

  // fetch most active repos today
  const activeProjects = token ? await getTopReposByDailyCommits(token, 5) : [];

  // Fetch purely from github to enforce strict commit count requirement and clout-filtering
  let suggestedUsers: any[] = [];
  try {
    const ghDevs = await getSuggestedGitHubUsers(token || "", undefined, 5);
    suggestedUsers = ghDevs.map(dev => ({
      username: dev.login,
      avatar: dev.avatar_url,
      name: dev.name || dev.login
    }));
  } catch (err) {
    console.error("Failed to load suggested GH users", err);
  }

  return (
    <aside className="hidden w-[350px] shrink-0 lg:block">
      <div className="sticky top-0 pt-3 flex flex-col gap-4">

        {/* trending repos + devs — real data with toggle */}
        <TrendingCard repos={trendingRepos} devs={trendingDevs} />

        {/* upcoming projects */}
        <div className="rounded-2xl border border-git-border bg-git-card overflow-hidden">
          <h3 className="font-bold text-xl text-git-text px-4 pt-3 pb-2">
            Upcoming Projects
          </h3>
          <div className="stagger-children">
            {upcomingProjects.length > 0 ? upcomingProjects.map((repo: any) =>
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 hover:bg-white/[0.03] transition-colors">
              <div className="text-[15px] font-bold text-git-success mb-0.5 truncate">
                {repo.full_name}
              </div>
                {repo.description &&
                  <p className="text-[13px] text-git-muted line-clamp-2 mb-1.5 leading-snug">{repo.description}</p>
                }
                <div className="flex items-center gap-3 text-[13px] text-git-muted">
                  {repo.language &&
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                      {repo.language}
                    </span>
                  }
                  <span>⭐ {repo.stargazers_count?.toLocaleString() || 0}</span>
                </div>
              </a>
            ) :
              <div className="px-4 py-6 text-[13px] text-git-muted">No upcoming projects found.</div>
            }
          </div>
        </div>

        {/* most active today */}
        <div className="rounded-2xl border border-git-border bg-git-card overflow-hidden">
          <h3 className="font-bold text-xl text-git-text px-4 pt-3 pb-2">
            Most Active Today
          </h3>
          <div className="stagger-children">
            {activeProjects.length > 0 ? activeProjects.map((repo: any) =>
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 hover:bg-white/[0.03] transition-colors">
              <div className="text-[15px] font-bold text-git-info mb-0.5 truncate">
                {repo.full_name}
              </div>
                {repo.description &&
                  <p className="text-[13px] text-git-muted line-clamp-2 mb-1.5 leading-snug">{repo.description}</p>
                }
                <div className="flex items-center gap-3 text-[13px] text-git-muted">
                  {repo.language &&
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                      {repo.language}
                    </span>
                  }
                  <span>⏱️ updated today</span>
                </div>
              </a>
            ) :
              <div className="px-4 py-6 text-[13px] text-git-muted">No active projects found.</div>
            }
          </div>
        </div>

        {/* collab matching */}
        {session?.user && <CollabWidget />}

        {/* who to follow */}
        <div className="rounded-2xl border border-git-border bg-git-card overflow-hidden">
          <h3 className="font-bold text-xl text-git-text px-4 pt-3 pb-2">Who to follow</h3>
          <div>
            {suggestedUsers.length > 0 ?
              suggestedUsers.map((user) =>
                <div
                  key={user.username}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group">
                  <Link href={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <Image
                      src={user.avatar || "/icon.png"}
                      alt={user.username}
                      width={40}
                      height={40}
                      className="rounded-full flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[15px] font-bold text-git-text group-hover:underline truncate">
                        {user.name || user.username}
                      </span>
                      <span className="text-[13px] text-git-muted truncate">@{user.username}</span>
                    </div>
                  </Link>
                  <Link
                    href={`/profile/${user.username}`}
                    className="ml-auto px-4 py-1.5 rounded-full bg-git-text text-black text-[13px] font-bold hover:bg-[#d7dbdc] transition-colors flex-shrink-0">
                    Follow
                  </Link>
                </div>
              ) :
              <div className="px-4 py-6 text-[13px] text-git-muted">No suggestions found.</div>
            }
          </div>
        </div>

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