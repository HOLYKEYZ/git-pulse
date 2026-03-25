import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGitHubTrendingRepos, getSuggestedGitHubUsers, getUpcomingGitHubProjects } from "@/lib/github";
import { getLanguageColor } from "@/lib/colors";
import CollabWidget from "./CollabWidget";

export default async function RightSidebar() {
  const session = await auth();
  const token = session?.user?.accessToken;

  // fetch real trending repos if i have a token
  const trendingRepos = token ? await getGitHubTrendingRepos(token, 5) : [];
  
  // fetch upcoming projects with low stars
  const upcomingProjects = token ? await getUpcomingGitHubProjects(token, 3) : [];

  let suggestedUsers = await prisma.user.findMany({
    take: 3,
    where: {
      NOT: {
        username: session?.user?.login || ""
      }
    },
    select: {
      username: true,
      avatar: true,
      name: true
    }
  });

  // if not enough local users, supplement with gh api "devs like you"
  if (suggestedUsers.length < 3 && token) {
    const fallbackLimit = 3 - suggestedUsers.length;
    try {
        const ghDevs = await getSuggestedGitHubUsers(token, undefined, fallbackLimit);
        const ghMapped = ghDevs.map(dev => ({
            username: dev.login,
            avatar: dev.avatar_url,
            name: dev.name || dev.login
        }));
        suggestedUsers = [...suggestedUsers, ...ghMapped];
    } catch {
        // fail silently if gh trending devs fails
    }
  }

  return (
    <aside className="hidden w-[350px] shrink-0 lg:block">
            <div className="sticky top-0 pt-3 flex flex-col gap-4">

                {/* trending repos — real data */}
                <div className="rounded-2xl border border-git-border bg-git-card overflow-hidden">
                    <h3 className="font-bold text-xl text-git-text px-4 pt-3 pb-2">
                        Trending
                    </h3>
                    <div className="stagger-children">
                        {trendingRepos.length > 0 ? trendingRepos.map((repo) =>
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 hover:bg-white/[0.03] transition-colors">
              
                                <div className="text-[15px] font-bold text-git-text mb-0.5 truncate">
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
                                    <span>⭐ {repo.stargazers_count.toLocaleString()}</span>
                                </div>
                            </a>
            ) :
            <div className="px-4 py-6 text-[13px] text-git-muted">Loading trending repos...</div>
            }
                    </div>
                </div>

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
              
                                <div className="text-[15px] font-bold text-[#2ea043] mb-0.5 truncate">
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

                {/* collab matching */}
                {session?.user && <CollabWidget />}

                {/* who to ship with */}
                <div className="rounded-2xl border border-git-border bg-git-card overflow-hidden">
                    <h3 className="font-bold text-xl text-git-text px-4 pt-3 pb-2">Who to follow</h3>
                    <div>
                        {suggestedUsers.length > 0 ?
            suggestedUsers.map((user) =>
            <Link
              key={user.username}
              href={`/profile/${user.username}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group">
              
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
                                    <button className="ml-auto px-4 py-1.5 rounded-full bg-git-text text-black text-[13px] font-bold hover:bg-[#d7dbdc] transition-colors flex-shrink-0">
                                        Follow
                                    </button>
                                </Link>
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
        </aside>);

}