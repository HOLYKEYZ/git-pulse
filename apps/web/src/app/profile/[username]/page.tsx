import { auth } from "@/lib/auth";
import {
    getGitHubUser,
    getGitHubRepos,
    getGitHubReadme,
    getContributionData,
    getGitHubPinnedRepos,
} from "@/lib/github";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import ProfileReadme from "@/components/ProfileReadme";
import PinnedRepos from "@/components/PinnedRepos";
import RepoCard from "@/components/RepoCard";
import FollowButton from "@/components/FollowButton";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const session = await auth();
    const { username } = await params;
    const token = session?.user?.accessToken;
    const isOwnProfile = session?.user?.login === username;

    // Parallel data fetching for speed
    const [ghUser, ghRepos, readme, contributions, pinnedRepos] = await Promise.all([
        token ? getGitHubUser(username, token) : null,
        token ? getGitHubRepos(username, token, 6) : [],
        token ? getGitHubReadme(username, token) : null,
        token ? getContributionData(username, token) : null,
        token ? getGitHubPinnedRepos(username, token) : [],
    ]);

    if (!ghUser) {
        return (
            <div className="p-12 text-center text-git-muted animate-fade-in">
                <svg height="48" viewBox="0 0 24 24" width="48" className="fill-git-muted mx-auto mb-4 opacity-50">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                <p className="text-lg font-semibold">User not found</p>
                <p className="text-sm mt-1">Sign in to view profiles.</p>
            </div>
        );
    }

    // Check follow status
    let initialIsFollowing = false;
    if (session?.user?.login && !isOwnProfile) {
        const [currentUser, targetUser] = await Promise.all([
            prisma.user.findUnique({ where: { username: session.user.login }, select: { id: true } }),
            prisma.user.findUnique({ where: { username }, select: { id: true } }),
        ]);
        if (currentUser && targetUser) {
            const follow = await prisma.follow.findUnique({
                where: { followerId_followingId: { followerId: currentUser.id, followingId: targetUser.id } },
            });
            initialIsFollowing = !!follow;
        }
    }

    const joinDate = new Date(ghUser.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 animate-slide-up">

            {/* ── Profile Header ────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="relative shrink-0">
                    <Image
                        src={ghUser.avatar_url}
                        alt={ghUser.login}
                        width={128}
                        height={128}
                        className="rounded-full border-2 border-git-border bg-git-bg"
                        priority
                    />
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-git-text leading-tight">
                        {ghUser.name || ghUser.login}
                    </h1>
                    <h2 className="text-lg font-light text-git-muted">{ghUser.login}</h2>

                    {ghUser.bio && (
                        <p className="mt-2 text-sm text-git-text leading-relaxed">{ghUser.bio}</p>
                    )}

                    {/* Action buttons */}
                    <div className="mt-3 flex items-center gap-3">
                        {!isOwnProfile && (
                            <FollowButton targetUsername={username} initialIsFollowing={initialIsFollowing} />
                        )}
                    </div>

                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-4 text-sm text-git-muted">
                        <span className="hover:text-git-blue cursor-pointer">
                            <strong className="text-git-text">{ghUser.followers.toLocaleString()}</strong> followers
                        </span>
                        <span>·</span>
                        <span className="hover:text-git-blue cursor-pointer">
                            <strong className="text-git-text">{ghUser.following.toLocaleString()}</strong> following
                        </span>
                    </div>

                    {/* Meta info */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-git-muted">
                        {ghUser.company && (
                            <span className="flex items-center gap-1">
                                <svg height="14" viewBox="0 0 16 16" width="14" className="fill-current"><path d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.777.871.777 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75Zm4 3A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"/></svg>
                                {ghUser.company}
                            </span>
                        )}
                        {ghUser.location && (
                            <span className="flex items-center gap-1">
                                <svg height="14" viewBox="0 0 16 16" width="14" className="fill-current"><path d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192 0ZM8 14.19l3.536-3.535a5 5 0 1 0-7.072 0Zm0-5.44a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Zm0-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"/></svg>
                                {ghUser.location}
                            </span>
                        )}
                        {ghUser.blog && (
                            <a href={ghUser.blog.startsWith("http") ? ghUser.blog : `https://${ghUser.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-git-blue">
                                <svg height="14" viewBox="0 0 16 16" width="14" className="fill-current"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"/></svg>
                                {ghUser.blog}
                            </a>
                        )}
                        {ghUser.twitter_username && (
                            <a href={`https://x.com/${ghUser.twitter_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-git-blue">
                                @{ghUser.twitter_username}
                            </a>
                        )}
                        <span className="flex items-center gap-1">
                            <svg height="14" viewBox="0 0 16 16" width="14" className="fill-current"><path d="M4.75 0h6.5C12.216 0 13 .784 13 1.75v12.5A1.75 1.75 0 0 1 11.25 16h-6.5A1.75 1.75 0 0 1 3 14.25V1.75C3 .784 3.784 0 4.75 0Zm0 1.5a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25ZM8 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>
                            Joined {joinDate}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Profile README ────────────────────────────────────── */}
            {readme && <ProfileReadme content={readme} />}

            {/* ── Pinned Repos ──────────────────────────────────────── */}
            {pinnedRepos.length > 0 && <PinnedRepos repos={pinnedRepos} />}

            {/* ── Contribution Graph ───────────────────────────────── */}
            {contributions && (
                <ContributionHeatmap
                    weeks={contributions.weeks}
                    totalContributions={contributions.totalContributions}
                />
            )}

            {/* ── Repositories ─────────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-4 border-b border-git-border pb-2">
                    <h2 className="text-base font-semibold text-git-text">Popular repositories</h2>
                    <Link
                        href={`/profile/${username}/repos`}
                        className="text-xs text-git-blue hover:underline"
                    >
                        View all →
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
                    {ghRepos.map((repo) => (
                        <RepoCard
                            key={repo.id}
                            name={repo.name}
                            description={repo.description || "No description provided."}
                            language={repo.language || ""}
                            languageColor=""
                            stars={repo.stargazers_count}
                            forks={repo.forks_count}
                            lastPush={new Date(repo.pushed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            url={repo.html_url}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
