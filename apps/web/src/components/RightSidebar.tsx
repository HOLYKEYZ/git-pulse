import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mock trending repos for now, could fetch from GitHub API later
const TRENDING_REPOS = [
    { id: 1, name: "shadcn-ui/ui", stars: "72.4k", color: "#3178c6", lang: "TypeScript" },
    { id: 2, name: "vercel/next.js", stars: "123k", color: "#3178c6", lang: "TypeScript" },
    { id: 3, name: "neon-database/neon", stars: "10.2k", color: "#3178c6", lang: "TypeScript" },
];

export default async function RightSidebar() {
    const session = await auth();

    console.log("🔥 [RightSidebar] DATABASE_URL TYPE:", typeof process.env.DATABASE_URL, "VAL:", process.env.DATABASE_URL);

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
                
                {/* Trending Repos */}
                <div className="rounded-xl border border-git-border bg-git-card p-4">
                    <h3 className="font-semibold text-git-text mb-4">Trending Repos</h3>
                    <div className="space-y-4">
                        {TRENDING_REPOS.map(repo => (
                            <div key={repo.id} className="group cursor-pointer">
                                <div className="text-sm font-semibold text-git-text group-hover:text-git-blue mb-1 truncate">
                                    {repo.name}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-git-muted">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: repo.color }} />
                                        <span>{repo.lang}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>⭐</span>
                                        <span>{repo.stars}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Who to ship with */}
                <div className="rounded-xl border border-git-border bg-git-card p-4">
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
                                        src={user.avatar || "/default-avatar.png"}
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

                {/* Footer links */}
                <div className="px-4 text-[10px] text-git-muted flex flex-wrap gap-x-3 gap-y-1">
                    <Link href="#" className="hover:text-git-blue">About</Link>
                    <Link href="#" className="hover:text-git-blue">Terms</Link>
                    <Link href="#" className="hover:text-git-blue">Privacy</Link>
                    <Link href="#" className="hover:text-git-blue">Status</Link>
                    <span>© 2026 GitPulse</span>
                </div>
            </div>
        </aside>
    );
}
