import { auth } from "@/lib/auth";
import {
  getGitHubUser,
  getGitHubRepos,
  getGitHubReadme,
  getGitHubPinnedRepos,
  getContributionData,
  getContributionActivity,
  getUserStats } from
"@/lib/github";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import ContributionActivity from "@/components/ContributionActivity";
import ProfileReadme from "@/components/ProfileReadme";
import PinnedRepos from "@/components/PinnedRepos";
import AchievementsWidget from "@/components/AchievementsWidget";
import RepoCard from "@/components/RepoCard";
import FollowButton from "@/components/FollowButton";
import { PeopleIcon, OrganizationIcon, LocationIcon, LinkIcon } from "@primer/octicons-react";
import ProfileTabs from "@/components/ProfileTabs";
import UserStatus from "@/components/UserStatus";

export default async function ProfilePage({ params }: {params: Promise<{username: string;}>}) {
  const session = await auth();
  const resolvedParams = await params;
  const { username } = resolvedParams;
  const token = session?.user?.accessToken;
  const isOwnProfile = session?.user?.login === username;

  // parallel data fetching — all at once for speed
  const [ghUser, ghRepos, readme, contributions, pinnedRepos, activity, userStats] = await Promise.all([
    token ? getGitHubUser(username, token as string) : null,
    token ? getGitHubRepos(username, token as string, 6) : [],
    token ? getGitHubReadme(username, token as string) : null,
    token ? getContributionData(username, token as string) : null,
    token ? getGitHubPinnedRepos(username, token as string) : [],
    token ? getContributionActivity(username, token as string) : [],
    token ? getUserStats(username, token as string) : null
  ]);

  if (!ghUser) {
    return (
      <div className="p-12 text-center text-git-muted animate-fade-in">
                <svg height="48" viewBox="0 0 24 24" width="48" className="fill-git-muted mx-auto mb-4 opacity-50">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                <p className="text-lg font-semibold">User not found</p>
                <p className="text-sm mt-1">Sign in to view profiles.</p>
            </div>);

  }

  // check follow status
  let initialIsFollowing = false;
  if (session?.user?.login && !isOwnProfile) {
    const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({ where: { username: session.user.login }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } })]
    );
    if (currentUser && targetUser) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: currentUser.id, followingId: targetUser.id } }
      });
      initialIsFollowing = !!follow;
    }
  }

  // fetch user from prisma for status and privacy
  const dbProfileUser = await prisma.user.findUnique({
    where: { username },
    select: { statusEmoji: true, statusText: true, showContributions: true }
  });

  const joinDate = new Date(ghUser.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const joinYear = new Date(ghUser.created_at).getFullYear();

  return (
    <div className="w-full max-w-[1280px] mx-auto p-4 sm:p-6 lg:p-10 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                {/* ── left sidebar (user info - 260px sleek) ──────────────── */}
                <div className="w-full md:w-[260px] shrink-0 flex flex-col gap-5 md:sticky md:top-8 md:self-start">
                    <div className="relative group mx-auto md:mx-0 w-48 h-48 md:w-56 md:h-56">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
              src={ghUser.avatar_url}
              alt={ghUser.login}
              className="relative w-full h-full rounded-full border border-git-border shadow-sm object-cover bg-git-card" />
            
                        {/* status component — absolutely positioned over avatar on desktop / below on mobile */}
                        <div className="absolute -bottom-2 -right-3 md:right-0 z-10">
                            <UserStatus 
                                initialEmoji={dbProfileUser?.statusEmoji || null} 
                                initialText={dbProfileUser?.statusText || null} 
                                isOwnProfile={isOwnProfile} 
                            />
                        </div>
                    </div>

                    <div className="flex flex-col py-3">
                        <h1 className="text-[26px] font-semibold text-git-text leading-tight tracking-tight">
                            {ghUser.name || ghUser.login}
                        </h1>
                        <h2 className="text-[20px] font-light text-git-muted leading-tight">{ghUser.login}</h2>
                    </div>

                    {ghUser.bio &&
          <p className="text-sm text-git-text leading-relaxed whitespace-pre-wrap">{ghUser.bio}</p>
          }

                    {/* action buttons */}
                    <div className="mt-1 w-full flex flex-col gap-2">
                        {!isOwnProfile ?
                          <div className="flex gap-2 w-full">
                            <FollowButton targetUsername={username} initialIsFollowing={initialIsFollowing} className="flex-1 shadow-sm hover:shadow-md transition-shadow" />
                            <a
                              href={`https://github.com/sponsors/${username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-git-border rounded-md text-sm font-medium text-[#db61a2] hover:bg-[#db61a2]/10 hover:border-[#db61a2]/30 transition-all"
                            >
                              <svg viewBox="0 0 16 16" width="16" height="16" className="fill-[#db61a2]">
                                <path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z" />
                              </svg>
                              Sponsor
                            </a>
                          </div> :

            <Link
              href={`/profile/${username}/edit`}
              className="w-full py-1.5 bg-git-card border border-git-border rounded-md text-center text-sm font-semibold text-git-text hover:bg-git-hover transition-all duration-200 block">
              
                                Edit profile
                            </Link>
            }
                    </div>

                    {/* stats — clickable followers/following */}
                    <div className="mt-2 flex items-center gap-2 text-sm text-git-muted">
                        <PeopleIcon size={16} className="fill-current text-git-muted" />
                        <Link
              href={`/profile/${username}/followers`}
              className="hover:text-git-accent transition-colors group">
              
                            <span className="text-git-text font-semibold group-hover:text-git-accent">{ghUser.followers.toLocaleString()}</span> followers
                        </Link>
                        <span>·</span>
                        <Link
              href={`/profile/${username}/following`}
              className="hover:text-git-accent transition-colors group">
              
                            <span className="text-git-text font-semibold group-hover:text-git-accent">{ghUser.following.toLocaleString()}</span> following
                        </Link>
                    </div>

                    {/* meta info */}
                    <div className="mt-3 flex flex-col gap-1.5 text-sm text-git-text">
                        {ghUser.company &&
            <span className="flex items-center gap-2">
                                <OrganizationIcon size={16} className="fill-current text-git-muted" />
                                <span className="truncate">{ghUser.company}</span>
                            </span>
            }
                        {ghUser.location &&
            <span className="flex items-center gap-2">
                                <LocationIcon size={16} className="fill-current text-git-muted" />
                                {ghUser.location}
                            </span>
            }
                        {ghUser.blog &&
            <a href={ghUser.blog.startsWith("http") ? ghUser.blog : `https://${ghUser.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-git-accent hover:underline">
                                <LinkIcon size={16} className="fill-current text-git-muted" />
                                <span className="truncate">{ghUser.blog}</span>
                            </a>
            }
                        {ghUser.twitter_username &&
            <a href={`https://x.com/${ghUser.twitter_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-git-accent hover:underline">
                                <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" className="text-git-muted"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.96H5.078z"></path></svg>
                                @{ghUser.twitter_username}
                            </a>
            }
                    </div>

                    {/* achievements area */}
                    <AchievementsWidget username={username} />

                    {/* organizations */}
                    {userStats && userStats.organizations && userStats.organizations.length > 0 &&
          <div className="border-t border-git-border border-solid mt-4 pt-4">
                            <h2 className="text-xs font-semibold text-git-text mb-2">Organizations</h2>
                            <div className="flex flex-wrap gap-1.5">
                                {userStats.organizations.map((org) =>
              <Link key={org.login} href={`https://github.com/${org.login}`} target="_blank" rel="noopener noreferrer" title={org.name || org.login}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                  src={org.avatarUrl}
                  alt={org.login}
                  width={32}
                  height={32}
                  className="rounded-md border border-git-border hover:opacity-80 transition-opacity" />
                
                                    </Link>
                                )}
                            </div>
                        </div>
                    }
                </div>

                {/* ── right content area ────────────────────────────────────── */}
                <div className="flex-1 flex flex-col gap-8 min-w-0">
                    {/* ── profile tabs ──────────────────────────────────────── */}
                    <ProfileTabs username={username} activeTab="overview" repoCount={ghUser.public_repos} />

                    {/* ── profile readme (content only, no filename header) ── */}
                    {readme && (
                        <div className="w-full mb-2">
                            <ProfileReadme content={readme} username={username} />
                        </div>
                    )}

                    {/* ── pinned repos (only if user has pinned) ────────────── */}
                    {pinnedRepos.length > 0 && <PinnedRepos repos={pinnedRepos} />}

                    {/* ── contribution graph ──────────────────────────────── */}
                    {contributions && (dbProfileUser?.showContributions !== false || isOwnProfile) &&
          <ContributionHeatmap
            weeks={contributions.weeks}
            totalContributions={contributions.totalContributions}
            username={username}
            joinYear={joinYear} />

          }

                    {/* ── contribution activity ────────────────────────────── */}
                    {activity && activity.length > 0 && <ContributionActivity activity={activity} />}

                    {/* ── popular repos (only if no pinned repos) ──────────── */}
                    {pinnedRepos.length === 0 &&
          <div>
                            <div className="flex items-center justify-between mb-4 mt-6">
                                <h2 className="text-base font-normal text-git-text">Popular repositories</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                                {ghRepos.map((repo) =>
              <RepoCard
                key={repo.id}
                name={repo.name}
                description={repo.description || "No description provided."}
                language={repo.language || ""}
                languageColor=""
                stars={repo.stargazers_count}
                forks={repo.forks_count}
                lastPush={new Date(repo.pushed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                url={repo.html_url} />

              )}
                            </div>
                        </div>
          }

                    {/* view all repos link */}
                    <div className="flex justify-start mt-4">
                        <Link
              href={`/profile/${username}/repos`}
              className="text-xs text-git-accent hover:underline">
              
                            View all repositories →
                        </Link>
                    </div>
                </div>
            </div>
        </div>);

}