import { auth } from "@/lib/auth";
import {
    getGitHubUser,
    getGitHubRepos,
    getGitHubReadme,
    getContributionData,
    getGitHubPinnedRepos,
    getContributionActivity,
    getUserStats,
} from "@/lib/github";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import ContributionActivity from "@/components/ContributionActivity";
import ProfileReadme from "@/components/ProfileReadme";
import PinnedRepos from "@/components/PinnedRepos";
import Achievements from "@/components/Achievements";
import RepoCard from "@/components/RepoCard";
import FollowButton from "@/components/FollowButton";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const session = await auth();
    const { username } = await params;
    const token = session?.user?.accessToken;
    const isOwnProfile = session?.user?.login === username;

    // Parallel data fetching — all at once for speed
    const [ghUser, ghRepos, readme, contributions, pinnedRepos, activity, userStats] = await Promise.all([
        token ? getGitHubUser(username, token) : null,
        token ? getGitHubRepos(username, token, 6) : [],
        token ? getGitHubReadme(username, token) : null,
        token ? getContributionData(username, token) : null,
        token ? getGitHubPinnedRepos(username, token) : [],
        token ? getContributionActivity(username, token) : [],
        token ? getUserStats(username, token) : null,
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
        <div className="max-w-[1280px] mx-auto p-4 sm:p-6 lg:p-8 animate-slide-up">
            <div className="flex flex-col md:flex-row gap-8">
                {/* ── Left Sidebar (User Info) ──────────────────────────── */}
                <div className="w-full md:w-[296px] shrink-0 flex flex-col gap-4">
                    <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={ghUser.avatarUrl}
                                alt={ghUser.login}
                                className="w-[296px] h-[296px] rounded-full border border-git-border object-cover bg-git-card z-10 relative"
                            />
                            {ghUser.status && (
                                <div className="absolute bottom-12 right-4 bg-[#0d1117] border border-git-border rounded-full px-3 py-2 flex items-center gap-2 text-sm z-20 shadow-sm">
                                    <span className="text-base leading-none">{ghUser.status.emoji}</span>
                                    <span className="text-git-text max-w-[120px] truncate" title={ghUser.status.message || ""}>
                                        {ghUser.status.message}
                                    </span>
                                </div>
                            )}
                        </div>

                    <div className="flex flex-col py-3">
                        <h1 className="text-[26px] font-semibold text-git-text leading-tight tracking-tight">
                            {ghUser.name || ghUser.login}
                        </h1>
                        <h2 className="text-[20px] font-light text-git-muted leading-tight">{ghUser.login}</h2>
                    </div>

                    {ghUser.bio && (
                        <p className="text-sm text-git-text leading-relaxed whitespace-pre-wrap">{ghUser.bio}</p>
                    )}

                    {/* Action buttons */}
                    <div className="mt-2 w-full">
                        {!isOwnProfile ? (
                            <FollowButton targetUsername={username} initialIsFollowing={initialIsFollowing} className="w-full" />
                        ) : (
                            <div className="w-full py-1.5 bg-git-card border border-git-border rounded-md text-center text-sm font-semibold text-git-muted hover:bg-git-bg hover:text-git-text transition-colors cursor-pointer">
                                Edit profile
                            </div>
                        )}
                    </div>

                    {/* Stats — clickable followers/following */}
                    <div className="mt-2 flex items-center gap-2 text-sm text-git-muted">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" className="fill-current text-git-muted">
                            <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z"></path>
                        </svg>
                        <Link
                            href={`/profile/${username}/followers`}
                            className="hover:text-git-blue transition-colors group"
                        >
                            <span className="text-git-text font-semibold group-hover:text-git-blue">{ghUser.followers.toLocaleString()}</span> followers
                        </Link>
                        <span>·</span>
                        <Link
                            href={`/profile/${username}/following`}
                            className="hover:text-git-blue transition-colors group"
                        >
                            <span className="text-git-text font-semibold group-hover:text-git-blue">{ghUser.following.toLocaleString()}</span> following
                        </Link>
                    </div>

                    {/* Meta info */}
                    <div className="mt-3 flex flex-col gap-1.5 text-sm text-git-text">
                        {ghUser.company && (
                            <span className="flex items-center gap-2">
                                <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current text-git-muted"><path d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.777.871.777 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75Zm4 3A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"/></svg>
                                <span className="truncate">{ghUser.company}</span>
                            </span>
                        )}
                        {ghUser.location && (
                            <span className="flex items-center gap-2">
                                <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current text-git-muted"><path d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192 0ZM8 14.19l3.536-3.535a5 5 0 1 0-7.072 0Zm0-5.44a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Zm0-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"/></svg>
                                {ghUser.location}
                            </span>
                        )}
                        {ghUser.blog && (
                            <a href={ghUser.blog.startsWith("http") ? ghUser.blog : `https://${ghUser.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-git-blue hover:underline">
                                <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current text-git-muted"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"/></svg>
                                <span className="truncate">{ghUser.blog}</span>
                            </a>
                        )}
                        {ghUser.twitter_username && (
                            <a href={`https://x.com/${ghUser.twitter_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-git-blue hover:underline">
                                <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" className="text-git-muted"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.96H5.078z"></path></svg>
                                @{ghUser.twitter_username}
                            </a>
                        )}
                    </div>

                    <div className="border-t border-git-border border-solid mt-4 pt-4 text-xs text-git-muted flex flex-col gap-4">
                        {/* ── Achievements & Organizations ───────────────────────── */}
                        {userStats && <Achievements stats={userStats} />}
                    </div>
                </div>

                {/* ── Right Content Area ────────────────────────────────────── */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    {/* ── Profile README ────────────────────────────────────── */}
                    {readme && (
                        <ProfileReadme content={readme} username={username} />
                    )}

                    {/* ── Pinned Repos (only if user has pinned) ────────────── */}
                    {pinnedRepos.length > 0 && <PinnedRepos repos={pinnedRepos} />}

                    {/* ── Distribution of Contributions ─────────────────────── */}
                    {contributions && (
                        <div className="flex flex-col gap-3">
                            <h2 className="text-base font-normal text-git-text">
                                {contributions.totalContributions.toLocaleString()} contributions in the last year
                            </h2>
                            <ContributionHeatmap
                                weeks={contributions.weeks}
                                totalContributions={contributions.totalContributions}
                            />
                        </div>
                    )}

                    {/* ── Contribution Activity ────────────────────────────── */}
                    <ContributionActivity activity={activity} />

                    {/* ── Popular Repos (ONLY if no pinned repos) ──────────── */}
                    {pinnedRepos.length === 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4 mt-6">
                                <h2 className="text-base font-normal text-git-text">Popular repositories</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
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
                    )}

                    {/* View all repos link */}
                    <div className="flex justify-start mt-4">
                        <Link
                            href={`/profile/${username}/repos`}
                            className="text-xs text-git-blue hover:underline"
                        >
                            View all repositories →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
