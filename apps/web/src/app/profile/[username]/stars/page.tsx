import { auth } from "@/lib/auth";
import { getGitHubStarredRepos } from "@/lib/github";
import RepoCard from "@/components/RepoCard";
import ProfileTabs from "@/components/ProfileTabs";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Shell: "#89e051",
  HTML: "#e34c26", CSS: "#563d7c", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", Ruby: "#701516"
};

export default async function StarsPage({ params }: {params: {username: string};}) {
  const session = await auth();
  const { username } = params;
  const token = session?.user?.accessToken;

  let repos = []; 
  let hasError = false; 
  
  try { 
    repos = token ? await getGitHubStarredRepos(username, token, 1, 100) : []; 
  } catch (error) { 
    console.error('Error fetching starred repositories:', error); 
    hasError = true; 
  }

  // collect unique languages for the filter display
  const languages = [...new Set((repos || []).map((r) => r.language).filter(Boolean))] as string[];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 animate-slide-up">
      <ProfileTabs username={username} activeTab="stars" repoCount={0} starCount={repos?.length || 0} />

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

      {/* star count */}
      <div className="text-xs text-git-muted">
        {repos?.length || 0} starred repositories
      </div>

      {/* repo list */}
      <div className="flex flex-col gap-3 stagger-children">
        {repos && repos.map((repo) =>
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

      {(!repos || repos.length === 0) && (
        hasError ? (
          <div className="text-center text-git-muted text-sm py-12 border border-dashed border-git-border rounded-lg">
            Failed to load starred repositories. Please try again later.
          </div>
        ) : token ? (
          <div className="text-center text-git-muted text-sm py-12 border border-dashed border-git-border rounded-lg">
            No starred repositories found for this user.
          </div>
        ) : (
          <div className="text-center text-git-muted text-sm py-12 border border-dashed border-git-border rounded-lg">
            Sign in to view starred repositories.
          </div>
        )
      )}
    </div>
  );
}
