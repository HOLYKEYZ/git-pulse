import { auth } from "@/lib/auth";
import { getGitHubFollowers, type GitHubFollowUser } from "@/lib/github";
import Image from "next/image";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
    const session = await auth();
    const { username } = await params;
    const token = session?.user?.accessToken;

    const followers: GitHubFollowUser[] = token ? await getGitHubFollowers(username, token) : [];

    return (
        <div className="flex flex-col animate-slide-up">
            {/* Header */}
            <div className="px-4 py-3 border-b border-git-border flex items-center gap-3">
                <Link href={`/profile/${username}`} className="text-git-muted hover:text-git-text transition-colors">
                    <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current">
                        <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"/>
                    </svg>
                </Link>
                <h1 className="text-base font-semibold text-git-text">
                    People following {username}
                </h1>
                <span className="text-xs text-git-muted bg-git-card px-2 py-0.5 rounded-full border border-git-border">
                    {followers.length}
                </span>
            </div>

            {/* List */}
            <div className="divide-y divide-git-border stagger-children">
                {followers.length === 0 && (
                    <div className="p-8 text-center text-git-muted text-sm animate-fade-in">
                        No followers yet.
                    </div>
                )}

                {followers.map((user) => (
                    <div key={user.login} className="flex items-center gap-3 px-4 py-3 hover:bg-[#161b22]/50 transition-colors">
                        <Link href={`/profile/${user.login}`}>
                            <Image
                                src={user.avatar_url}
                                alt={user.login}
                                width={40}
                                height={40}
                                className="rounded-full border border-git-border"
                            />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <Link href={`/profile/${user.login}`} className="text-sm font-semibold text-git-text hover:text-git-accent transition-colors">
                                {user.name || user.login}
                            </Link>
                            <p className="text-xs text-git-muted">{user.login}</p>
                            {user.bio && <p className="text-xs text-git-muted mt-0.5 truncate">{user.bio}</p>}
                        </div>
                        {session?.user?.login && session.user.login !== user.login && (
                            <FollowButton targetUsername={user.login} initialIsFollowing={false} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
