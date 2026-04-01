import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRelativeTime } from "@/lib/utils";
import { getGitHubReceivedEvents, type GitHubEvent } from "@/lib/github";
import Image from "next/image";
import Link from "next/link";
import { 
  RepoPushIcon, GitPullRequestIcon, IssueOpenedIcon, 
  StarIcon, RepoForkedIcon, RepoIcon, CommentIcon 
} from "@primer/octicons-react";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
    const session = await auth();
    if (!session?.user?.login) {
        redirect("/login");
    }

    let events: GitHubEvent[] = [];
    let hasError = false;

    try {
        const token = session.user.accessToken;
        // Fetch real dashboard events (what the user sees on github.com)
        events = token ? await getGitHubReceivedEvents(session.user.login, token) : [];
    } catch (err) {
        console.error("[Activity] GitHub Fetch Error:", err);
        hasError = true;
    }

    // Optional: filter out spammy bot events to keep it clean
    const BOT_PATTERNS = [/bot$/i, /\[bot\]$/i, /^dependabot/, /^renovate/, /^github-actions/];
    const isBot = (login: string) => BOT_PATTERNS.some((p) => p.test(login));
    const filteredEvents = events.filter(ev => !isBot(ev.actor.login));

    return (
        <div className="w-full max-w-3xl mx-auto min-h-screen pb-12 animate-fade-in border-l border-r border-git-border bg-git-bg">
            <div className="sticky top-0 z-20 bg-git-bg/80 backdrop-blur-md border-b border-git-border px-4 py-3">
                <h1 className="text-xl font-bold text-git-text">Activity</h1>
            </div>

            {hasError ? (
                <div className="text-center py-16 px-4 text-git-muted">
                    <p className="text-sm font-medium">Failed to load timeline. Please try again later.</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-16 px-4 text-git-muted">
                    <p className="text-sm">No activity found in your network.</p>
                </div>
            ) : (
                <div className="flex flex-col pt-4">
                    {filteredEvents.map((ev) => (
                        <GitHubActivityCard key={ev.id} event={ev} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Native GitHub Dashboard Card Component ──────────────────────────────────
function GitHubActivityCard({ event }: { event: GitHubEvent }) {
    const actor = event.actor;
    const repo = event.repo.name;
    const time = getRelativeTime(new Date(event.created_at));

    let icon = <RepoIcon size={16} className="text-git-muted" />;
    let actionText = "interacted with";
    let CardContent = null;

    switch (event.type) {
        case "WatchEvent":
            icon = <StarIcon size={16} className="text-git-muted" />;
            actionText = "starred";
            break;
            
        case "ForkEvent":
            icon = <RepoForkedIcon size={16} className="text-git-muted" />;
            actionText = "forked";
            break;
            
        case "CreateEvent":
            icon = <RepoIcon size={16} className="text-git-muted" />;
            actionText = `created a ${event.payload.ref_type || 'repository'}`;
            if (event.payload.ref_type === 'repository') {
                CardContent = (
                    <div className="mt-2 p-4 rounded-md border border-git-border bg-git-bg text-sm text-git-muted">
                        <Link href={`https://github.com/${repo}`} target="_blank" className="font-semibold text-git-text hover:text-git-accent">
                            {repo}
                        </Link>
                        {(event.payload as any).description && <p className="mt-1">{(event.payload as any).description}</p>}
                    </div>
                );
            }
            break;
            
        case "PushEvent":
            icon = <RepoPushIcon size={16} className="text-git-muted" />;
            const branch = event.payload.ref?.replace('refs/heads/', '') || 'main';
            actionText = `pushed to ${branch} in`;
            
            const commits = event.payload.commits || [];
            if (commits.length > 0) {
                CardContent = (
                    <div className="mt-2 text-[13px] text-git-text bg-transparent">
                        <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-git-border/50">
                            {commits.slice(0, 3).map((commit: any) => (
                                <div key={commit.sha} className="flex items-start gap-2 max-w-full">
                                    <Link 
                                        href={`https://github.com/${repo}/commit/${commit.sha}`} 
                                        target="_blank"
                                        className="text-git-accent font-mono text-xs hover:underline shrink-0"
                                    >
                                        {commit.sha.substring(0, 7)}
                                    </Link>
                                    <span className="truncate text-git-muted group-hover:text-git-text transition-colors">
                                        {commit.message.split('\n')[0]}
                                    </span>
                                </div>
                            ))}
                            {commits.length > 3 && (
                                <div className="text-xs text-git-muted mt-1 ml-1 cursor-pointer hover:text-git-accent">
                                    {commits.length - 3} more commit{commits.length - 3 > 1 ? 's' : ''} »
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
            break;
            
        case "PullRequestEvent":
            icon = <GitPullRequestIcon size={16} className="text-git-muted text-git-green" />;
            actionText = `${event.payload.action} a pull request in`;
            
            const pr = event.payload.pull_request as any;
            if (pr) {
                CardContent = (
                    <div className="mt-2 p-4 rounded-md border border-git-border bg-git-bg group hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <Link href={pr.html_url} target="_blank" className="block">
                            <h3 className="font-semibold text-git-text text-[15px] mb-1 group-hover:text-git-accent transition-colors">
                                {pr.title}
                            </h3>
                            {pr.body && (
                                <p className="text-[13px] text-git-muted line-clamp-2 mb-3">
                                    {pr.body}
                                </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-git-muted">
                                {pr.comments > 0 && (
                                    <span className="flex items-center gap-1">
                                        <CommentIcon size={12} /> {pr.comments}
                                    </span>
                                )}
                            </div>
                        </Link>
                    </div>
                );
            }
            break;
            
        case "IssuesEvent":
            icon = <IssueOpenedIcon size={16} className="text-git-muted text-git-green" />;
            actionText = `${event.payload.action} an issue in`;
            
            const issue = event.payload.issue as any;
            if (issue) {
                CardContent = (
                    <div className="mt-2 p-4 rounded-md border border-git-border bg-git-bg group hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <Link href={issue.html_url} target="_blank" className="block">
                            <h3 className="font-semibold text-git-text text-[15px] mb-1 group-hover:text-git-accent transition-colors">
                                {issue.title}
                            </h3>
                            {issue.body && (
                                <p className="text-[13px] text-git-muted line-clamp-2 mb-3">
                                    {issue.body}
                                </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-git-muted">
                                {issue.comments > 0 && (
                                    <span className="flex items-center gap-1">
                                        <CommentIcon size={12} /> {issue.comments}
                                    </span>
                                )}
                            </div>
                        </Link>
                    </div>
                );
            }
            break;
            
        case "PullRequestReviewEvent":
            icon = <GitPullRequestIcon size={16} className="text-git-muted" />;
            actionText = `${event.payload.action} a pull request review in`;
            break;
            
        case "IssueCommentEvent":
            icon = <CommentIcon size={16} className="text-git-muted" />;
            actionText = `commented on an issue in`;
            break;
            
        case "ReleaseEvent":
            icon = <RepoIcon size={16} className="text-git-muted" />;
            actionText = `${event.payload.action} a release in`;
            break;
            
        default:
            return null; // hide unknown event types
    }

    return (
        <div className="flex gap-3 px-4 py-4 border-b border-git-border">
            {/* Timeline Icon / Thread connection could go here if threaded, but GH native usually just has the layout */}
            <div className="flex flex-col items-center mt-1">
                {icon}
            </div>
            
            <div className="flex-1 min-w-0">
                {/* Header Line */}
                <div className="flex flex-wrap items-center gap-1.5 text-[14px] text-git-muted leading-relaxed">
                    <Link href={`https://github.com/${actor.login}`} target="_blank" className="font-semibold text-git-text hover:text-git-accent hover:underline flex items-center gap-1.5">
                        <Image src={actor.avatar_url} alt={actor.login} width={20} height={20} className="rounded-full bg-git-bg" />
                        {(actor as any).display_login || actor.login}
                    </Link>
                    <span>{actionText}</span>
                    <Link href={`https://github.com/${repo}`} target="_blank" className="font-semibold text-git-text hover:text-git-accent hover:underline">
                        {repo}
                    </Link>
                    <span className="text-[12px] opacity-70 whitespace-nowrap ml-1">{time}</span>
                </div>
                
                {/* Embedded Card Content */}
                {CardContent}
            </div>
        </div>
    );
}
