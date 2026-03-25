import { auth } from "@/lib/auth";
import { getGitHubAllRepos } from "@/lib/github";
import RepoCard from "@/components/RepoCard";
import Link from "next/link";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Shell: "#89e051",
  HTML: "#e34c26", CSS: "#563d7c", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", Ruby: "#701516"
};

export default async function ReposPage({ params }: {params: {username: string};}) {
  const session = await auth();
const { username } = params;
  const token = session?.user?.accessToken;

let repos = []; try { repos = token ? await getGitHubAllRepos(username, token, 1, 30, "updated") : []; } catch (error) { console.error('Error fetching repositories:', error); }

  // collect unique languages for the filter display
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))] as string[];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 animate-slide-up">
            {/* header */}
            <div className="flex items-center gap-3">
                <Link href={`/profile/${username}`} className="text-git-muted hover:text-git-accent transition-colors">
                    <svg height="20" viewBox="0 0 16 16" width="20" className="fill-current">
                        <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
                    </svg>
                </Link>
                <h1 className="text-lg font-semibold text-git-text">
                    {username} <span className="text-git-muted font-normal">/ Repositories</span>
                </h1>
            </div>

            {/* language filter chips */}
            {languages.length > 0 &&
      <div className="flex flex-wrap gap-2">
                    {languages.map((lang) =>
        <span
          key={lang}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-git-border text-[11px] text-git-muted hover:border-git-accent hover:text-git-accent cursor-pointer transition-colors">
          
                            <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: LANGUAGE_COLORS[lang] || "#8b949e" }} />
          
                            {lang}
                        </span>
        )}
                </div>
      }

            {/* repo count */}
            <div className="text-xs text-git-muted">
                {repos.length} repositories
            </div>

            {/* repo list */}
            <div className="flex flex-col gap-3 stagger-children">
                {repos.map((repo) =>
        <RepoCard
          key={repo.id}
          name={repo.name}
          description={repo.description || "No description provided."}
          language={repo.language || ""}
          languageColor={LANGUAGE_COLORS[repo.language || ""] || "#8b949e"}
          stars={repo.stargazers_count}
          forks={repo.forks_count}
          lastPush={new Date(repo.pushed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          url={repo.html_url} />

        )}
            </div>

            {repos.length === 0 && (
                token ? (
                    <div className="text-center text-git-muted text-sm py-12">No public repositories found.</div>
                ) : (
                    <div className="text-center text-git-muted text-sm py-12">Sign in to view repositories.</div>
                )
            )}
        </div>);

}