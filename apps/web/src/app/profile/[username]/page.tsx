import { auth } from "@/lib/auth";
import { getGitHubUser, getGitHubRepos } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import RepoCard from "@/components/RepoCard";
import FollowButton from "@/components/FollowButton";

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    Ruby: "#701516",
};

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const session = await auth();
    const { username } = await params;

    const token = session?.user?.accessToken;
    const isOwnProfile = session?.user?.login === username;

    // Fetch real data from GitHub API
    const ghUser = token ? await getGitHubUser(username, token) : null;
    const ghRepos = token ? await getGitHubRepos(username, token, 6) : [];

    if (!ghUser) {
        return (
            <div className="p-8 text-center text-git-muted">
                <p className="text-lg">User not found or not authenticated.</p>
                <p className="text-sm mt-2">Sign in to view profiles.</p>
            </div>
        );
    }

    // Check follow status in DB
    let initialIsFollowing = false;
    if (session?.user?.login && !isOwnProfile) {
        const currentUser = await prisma.user.findUnique({
            where: { username: session.user.login },
            select: { id: true }
        });
        const targetUser = await prisma.user.findUnique({
            where: { username: username },
            select: { id: true }
        });

        if (currentUser && targetUser) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUser.id,
                        followingId: targetUser.id
                    }
                }
            });
            initialIsFollowing = !!follow;
        }
    }

    return (
        <div className="flex flex-col gap-8 p-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                    <Image
                        src={ghUser.avatar_url}
                        alt={ghUser.login}
                        width={96}
                        height={96}
                        className="rounded-full border border-git-border bg-git-bg"
                    />
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-git-green border-[3px] border-git-card rounded-full" title="Active Contributor" />
                </div>

                <div className="flex flex-col flex-1">
                    <h1 className="text-2xl font-bold text-git-text">{ghUser.name || ghUser.login}</h1>
                    <h2 className="text-xl font-mono text-git-muted">@{ghUser.login}</h2>
                    {ghUser.bio && (
                        <p className="mt-2 text-sm text-git-text max-w-md">{ghUser.bio}</p>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-sm text-git-muted">
                        <span className="hover:text-git-blue cursor-pointer">
                            <strong className="text-git-text">{ghUser.followers}</strong> followers
                        </span>
                        <span>·</span>
                        <span className="hover:text-git-blue cursor-pointer">
                            <strong className="text-git-text">{ghUser.following}</strong> following
                        </span>
                        <span>·</span>
                        <span>
                            <strong className="text-git-text">{ghUser.public_repos}</strong> repos
                        </span>
                    </div>
                </div>

                {!isOwnProfile && (
                    <div className="hidden sm:block">
                        <FollowButton targetUsername={username} initialIsFollowing={initialIsFollowing} />
                    </div>
                )}
            </div>

            {/* Contribution Heatmap */}
            <ContributionHeatmap />

            {/* Repositories */}
            <div>
                <div className="flex items-center justify-between mb-4 border-b border-git-border pb-2">
                    <h2 className="text-lg font-semibold text-git-text">Repositories</h2>
                    <span className="text-xs text-git-muted">{ghRepos.length} shown</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ghRepos.map((repo) => (
                        <RepoCard
                            key={repo.id}
                            name={repo.full_name}
                            description={repo.description || "No description provided."}
                            language={repo.language || "Unknown"}
                            languageColor={LANGUAGE_COLORS[repo.language] || "#8b949e"}
                            stars={repo.stargazers_count}
                            forks={repo.forks_count}
                            lastPush={new Date(repo.pushed_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
