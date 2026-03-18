import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGitHubTrendingRepos } from "@/lib/github";

export default async function RightSidebar() {
    const session = await auth();
    const token = session?.user?.accessToken;

    // Fetch real trending repos if we have a token
    const trendingRepos = token ? await getGitHubTrendingRepos(token, 5) : [];

    const suggestedUsers = await prisma.user.findMany({
        take: 3,
        where: {
            NOT: {
                username: session?.user?.login || ""
            }
        },
        select: {
            username: true,
            avatar: true,
            name: true,
        }
    });

    return (
        <aside className="hidden w-[300px] shrink-0 lg:block">
            <div className="sticky top-6 flex flex-col gap-6">

                {/* Trending Repos — REAL DATA */}
                <div className="rounded-xl border border-git-border bg-git-card p-4 animate-fade-in">
                    <h3 className="font-semibold text-git-text mb-4 flex items-center gap-2">
                        <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted">
                            <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/>
                        </svg>
                        Trending
                    </h3>
                    <div className="space-y-4 stagger-children">
                        {trendingRepos.length > 0 ? trendingRepos.map((repo) => (
                            <a
                                key={repo.id}
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block"
                            >
                                <div className="text-sm font-semibold text-git-text group-hover:text-git-blue transition-colors mb-1 truncate">
                                    {repo.full_name}
                                </div>
                                {repo.description && (
                                    <p className="text-[11px] text-git-muted line-clamp-2 mb-1.5">{repo.description}</p>
                                )}
                                <div className="flex items-center gap-3 text-[11px] text-git-muted">
                                    {repo.language && (
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-git-blue" />
                                            {repo.language}
                                        </span>
                                    )}
                                    <span>⭐ {repo.stargazers_count.toLocaleString()}</span>
                                </div>
                            </a>
                        )) : (
                            <div className="text-xs text-git-muted italic">Loading trending repos...</div>
                        )}
                    </div>
                </div>

                {/* Who to ship with */}
                <div className="rounded-xl border border-git-border bg-git-card p-4 animate-fade-in">
                    <h3 className="font-semibold text-git-text mb-4">Who to ship with</h3>
                    <div className="space-y-4">
                        {suggestedUsers.length > 0 ? (
                            suggestedUsers.map(user => (
                                <Link
                                    key={user.username}
                                    href={`/profile/${user.username}`}
                                    className="flex items-center gap-3 group"
                                >
                                    <Image
                                        src={user.avatar || "/icon.png"}
                                        alt={user.username}
                                        width={32}
                                        height={32}
                                        className="rounded-full border border-git-border"
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-git-text group-hover:text-git-blue truncate">
                                            {user.name || user.username}
                                        </span>
                                        <span className="text-[10px] text-git-muted truncate">@{user.username}</span>
                                    </div>
                                    <button className="ml-auto text-[10px] font-bold text-git-blue hover:underline">
                                        Follow
                                    </button>
                                </Link>
                            ))
                        ) : (
                            <div className="text-xs text-git-muted italic">No suggestions found.</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 text-[10px] text-git-muted flex flex-wrap gap-x-3 gap-y-1">
                    <Link href="#" className="hover:text-git-blue">About</Link>
                    <Link href="#" className="hover:text-git-blue">Terms</Link>
                    <Link href="#" className="hover:text-git-blue">Privacy</Link>
                    <span>© 2026 GitPulse</span>
                </div>
            </div>
        </aside>
    );
}
