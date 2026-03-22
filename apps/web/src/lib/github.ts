/**
 * Comprehensive GitHub API service layer.
 * Uses REST API for user data, repos, events, README.
 * Uses GraphQL API for contribution calendar + pinned repos (not available via REST).
 */

import { withCache } from "./cache";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GitHubUser {
    login: string;
    avatar_url: string;
    name: string | null;
    bio: string | null;
    followers: number;
    following: number;
    public_repos: number;
    location: string | null;
    company: string | null;
    blog: string | null;
    twitter_username: string | null;
    created_at: string;
    public_gists: number;
    html_url: string;
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    pushed_at: string;
    html_url: string;
    fork: boolean;
    archived: boolean;
    topics: string[];
    visibility: string;
    updated_at: string;
    open_issues_count: number;
}

export interface GitHubEvent {
    id: string;
    type: string;
    actor: {
        login: string;
        avatar_url: string;
    };
    repo: {
        name: string;
    };
    payload: {
        action?: string;
        ref?: string;
        ref_type?: string;
        size?: number;
        commits?: Array<{
            sha: string;
            message: string;
            author: { name: string; email: string };
        }>;
        pull_request?: {
            number: number;
            title: string;
            html_url: string;
        };
        release?: {
            tag_name: string;
            body: string;
            html_url: string;
        };
        issue?: {
            number: number;
            title: string;
            html_url: string;
            comments: number;
        };
    };
    created_at: string;
}

export interface ContributionDay {
    contributionCount: number;
    contributionLevel: "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE";
    date: string;
    weekday: number;
}

export interface ContributionWeek {
    contributionDays: ContributionDay[];
}

export interface ContributionData {
    totalContributions: number;
    weeks: ContributionWeek[];
}

export interface PinnedRepo {
    name: string;
    description: string | null;
    stargazerCount: number;
    forkCount: number;
    primaryLanguage: { name: string; color: string } | null;
    url: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

// ─── Core Fetchers ───────────────────────────────────────────────────────────

async function fetchWithAuth(endpoint: string, token: string) {
    const cacheKey = `rest:${token.slice(-10)}:${endpoint}`;
    
    return withCache(cacheKey, async () => {
        try {
            const res = await fetch(`${GITHUB_API_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                },
                next: { revalidate: 60 },
            });

            if (!res.ok) {
                if (res.status === 403 || res.status === 429) {
                    console.error(`GitHub API Rate Limited on ${endpoint}. Rate limit info:`, {
                        limit: res.headers.get('x-ratelimit-limit'),
                        remaining: res.headers.get('x-ratelimit-remaining'),
                        reset: res.headers.get('x-ratelimit-reset')
                    });
                } else {
                    console.error(`GitHub REST error [${res.status}]: ${res.statusText} for ${endpoint}`);
                }
                return null;
            }

            return await res.json();
        } catch (error) {
            console.error(`[fetchWithAuth] Network/Fetch error for ${endpoint}:`, error);
            return null;
        }
    });
}

async function fetchGraphQL(query: string, variables: Record<string, unknown>, token: string) {
    // Use a hash or enough of the query to guarantee uniqueness across different queries 
    const cacheKey = `gql:${token.slice(-10)}:${query.slice(0, 150).replace(/\s+/g, '')}:${JSON.stringify(variables)}`;
    
    return withCache(cacheKey, async () => {
        try {
            const res = await fetch(GITHUB_GRAPHQL_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query, variables }),
                next: { revalidate: 120 },
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                console.error(`[GraphQL] HTTP ${res.status}: ${res.statusText}. Token ending: ...${token.slice(-6)}. Body: ${body.slice(0, 300)}`);
                return null;
            }

            const json = await res.json();
            
            // Debug logging for pinned repos query
            if (query.includes("pinnedItems")) {
                console.log(`[GraphQL Pinned Repos for ${variables?.username}] Response:`, JSON.stringify(json, null, 2));
            }

            if (json.errors) {
                console.error("[GraphQL] Errors:", JSON.stringify(json.errors, null, 2));
                // Return data even if there are some errors (partial responses)
                if (json.data) {
                    return json.data;
                }
                return null;
            }

            return json.data;
        } catch (error) {
            console.error(`[fetchGraphQL] Network/Fetch error:`, error);
            return null;
        }
    });
}

// ─── REST Functions ──────────────────────────────────────────────────────────

/**
 * Fetch full GitHub user profile (expanded fields)
 */
export async function getGitHubUser(username: string, token: string): Promise<GitHubUser | null> {
    return fetchWithAuth(`/users/${username}`, token);
}

/**
 * Fetch a user's repositories (sorted by recently updated)
 */
export async function getGitHubRepos(username: string, token: string, limit = 6): Promise<GitHubRepo[]> {
    const repos = await fetchWithAuth(
        `/users/${username}/repos?sort=updated&per_page=${limit}&type=owner`,
        token
    );
    return repos || [];
}

/**
 * Fetch ALL repos with pagination support for the full repos page
 */
export async function getGitHubAllRepos(
    username: string,
    token: string,
    page = 1,
    perPage = 30,
    sort: "updated" | "pushed" | "full_name" | "created" = "updated"
): Promise<GitHubRepo[]> {
    const repos = await fetchWithAuth(
        `/users/${username}/repos?sort=${sort}&per_page=${perPage}&page=${page}&type=owner`,
        token
    );
    return repos || [];
}

/**
 * Fetch user's received events (activity of people they follow)
 */
export async function getGitHubReceivedEvents(username: string, token: string): Promise<GitHubEvent[]> {
    const events = await fetchWithAuth(`/users/${username}/received_events?per_page=100`, token);
    return events || [];
}

/**
 * Fetch the profile README from the user's special {username}/{username} repo
 */
export async function getGitHubReadme(username: string, token: string): Promise<string | null> {
    const data = await fetchWithAuth(`/repos/${username}/${username}/readme`, token);
    if (!data?.content) return null;

    // GitHub returns base64-encoded content
    try {
        return Buffer.from(data.content, "base64").toString("utf-8");
    } catch {
        console.error("Failed to decode README content");
        return null;
    }
}

/**
 * Search trending repos (recently created, high stars)
 */
export async function getGitHubTrendingRepos(token: string, limit = 5): Promise<GitHubRepo[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const repos = await fetchWithAuth(
        `/search/repositories?q=created:>${oneDayAgo}&sort=stars&order=desc&per_page=${limit}`,
        token
    );
    return repos?.items || [];
}

// ─── GraphQL Functions ───────────────────────────────────────────────────────

const CONTRIBUTION_QUERY = `
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            contributionLevel
            date
            weekday
          }
        }
      }
    }
  }
}`;

const PINNED_REPOS_QUERY = `
query($username: String!) {
  user(login: $username) {
    pinnedItems(first: 6, types: [REPOSITORY, GIST]) {
      nodes {
        ... on Repository {
          name
          description
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
          url
        }
      }
    }
  }
}`;

/**
 * Fetch real contribution data (365-day calendar) via GraphQL
 */
export async function getContributionData(username: string, token: string): Promise<ContributionData | null> {
    const data = await fetchGraphQL(CONTRIBUTION_QUERY, { username }, token);
    if (!data?.user?.contributionsCollection?.contributionCalendar) {
        console.error(`[getContributionData] No contribution data returned for ${username}. Response:`, JSON.stringify(data)?.slice(0, 200));
        return null;
    }

    return data.user.contributionsCollection.contributionCalendar;
}

/**
 * Fetch pinned repos via GraphQL (not available via REST)
 */
export async function getGitHubPinnedRepos(username: string, token: string): Promise<PinnedRepo[]> {
    const data = await fetchGraphQL(PINNED_REPOS_QUERY, { username }, token);
    if (!data?.user?.pinnedItems?.nodes) return [];

    return data.user.pinnedItems.nodes;
}

// ─── Contribution Activity ───────────────────────────────────────────────────

export interface PRDetail {
    title: string;
    number: number;
    url: string;
    repo: string;
}

export interface MonthlyActivity {
    month: string;
    commits: number;
    commitRepos: { name: string; count: number }[];
    prsOpened: PRDetail[];
    issuesOpened: PRDetail[];
    reposCreated: string[];
    prReviews: PRDetail[];
    issueComments: PRDetail[];
}

/**
 * Fetch user events and aggregate into monthly contribution activity.
 * GitHub API returns max 300 events (10 pages × 30).
 */
export async function getContributionActivity(
    username: string,
    token: string,
    pages = 3
): Promise<MonthlyActivity[]> {
    const allEvents: GitHubEvent[] = [];

    for (let page = 1; page <= pages; page++) {
        const events = await fetchWithAuth(
            `/users/${username}/events?per_page=100&page=${page}`,
            token
        );
        if (!events || events.length === 0) break;
        allEvents.push(...events);
    }

    // Aggregate by month
    const monthMap = new Map<string, {
        commits: number;
        commitRepos: Map<string, number>;
        prsOpened: PRDetail[];
        issuesOpened: PRDetail[];
        reposCreated: string[];
        prReviews: PRDetail[];
        issueComments: PRDetail[];
    }>();

    for (const event of allEvents) {
        const date = new Date(event.created_at);
        const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

        if (!monthMap.has(key)) {
            monthMap.set(key, {
                commits: 0,
                commitRepos: new Map(),
                prsOpened: [],
                issuesOpened: [],
                reposCreated: [],
                prReviews: [],
                issueComments: [],
            });
        }
        const month = monthMap.get(key)!;

        switch (event.type) {
            case "PushEvent":
                const count = event.payload.commits?.length ?? 0;
                month.commits += count;
                const currentCount = month.commitRepos.get(event.repo.name) || 0;
                month.commitRepos.set(event.repo.name, currentCount + count);
                break;
            case "PullRequestEvent":
                if (event.payload.action === "opened" && event.payload.pull_request) {
                    month.prsOpened.push({
                        title: event.payload.pull_request.title || `PR #${event.payload.pull_request.number}`,
                        number: event.payload.pull_request.number,
                        url: event.payload.pull_request.html_url || `https://github.com/${event.repo.name}/pull/${event.payload.pull_request.number}`,
                        repo: event.repo.name
                    });
                }
                break;
            case "IssuesEvent":
                if (event.payload.action === "opened" && event.payload.issue) {
                    month.issuesOpened.push({
                        title: event.payload.issue.title || `Issue #${event.payload.issue.number}`,
                        number: event.payload.issue.number,
                        url: event.payload.issue.html_url || `https://github.com/${event.repo.name}/issues/${event.payload.issue.number}`,
                        repo: event.repo.name
                    });
                }
                break;
            case "IssueCommentEvent":
                if (event.payload.issue) {
                    month.issueComments.push({
                        title: event.payload.issue.title || `Issue #${event.payload.issue.number}`,
                        number: event.payload.issue.number,
                        url: event.payload.issue.html_url || `https://github.com/${event.repo.name}/issues/${event.payload.issue.number}`,
                        repo: event.repo.name
                    });
                }
                break;
            case "PullRequestReviewEvent":
            case "PullRequestReviewCommentEvent":
                if (event.payload.pull_request) {
                    month.prReviews.push({
                        title: event.payload.pull_request.title || `PR #${event.payload.pull_request.number}`,
                        number: event.payload.pull_request.number,
                        url: event.payload.pull_request.html_url || `https://github.com/${event.repo.name}/pull/${event.payload.pull_request.number}`,
                        repo: event.repo.name
                    });
                }
                break;
            case "CreateEvent":
                if (event.payload.ref_type === "repository") {
                    month.reposCreated.push(event.repo.name);
                }
                break;
        }
    }

    // Convert to array, serializable
    return Array.from(monthMap.entries()).map(([monthLabel, data]) => ({
        month: monthLabel,
        commits: data.commits,
        commitRepos: Array.from(data.commitRepos.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count), // Highest commits first
        prsOpened: data.prsOpened,
        issuesOpened: data.issuesOpened,
        reposCreated: data.reposCreated,
        prReviews: data.prReviews,
        issueComments: data.issueComments,
    }));
}

// ─── Followers / Following ──────────────────────────────────────────────────

export interface GitHubFollowUser {
    login: string;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    name: string | null;
}

export async function getGitHubFollowers(username: string, token: string): Promise<GitHubFollowUser[]> {
    const users = await fetchWithAuth(`/users/${username}/followers?per_page=50`, token);
    return users || [];
}

export async function getGitHubFollowing(username: string, token: string): Promise<GitHubFollowUser[]> {
    const users = await fetchWithAuth(`/users/${username}/following?per_page=50`, token);
    return users || [];
}

// ─── User Stats (for Achievements) ──────────────────────────────────────────

const USER_STATS_QUERY = `
query($username: String!) {
  user(login: $username) {
    pullRequests(states: MERGED) { totalCount }
    issues { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER) {
      totalCount
      nodes {
        stargazerCount
        name
      }
    }
    repositoriesContributedTo(contributionTypes: [COMMIT, PULL_REQUEST]) {
      totalCount
    }
    followers { totalCount }
  }
}`;

export interface UserStats {
    mergedPRs: number;
    totalIssues: number;
    totalRepos: number;
    contributedToRepos: number;
    totalFollowers: number;
    starredRepos: { name: string; stars: number }[];
    organizations: { login: string; avatarUrl: string; name: string | null }[];
}

export async function getUserStats(username: string, token: string): Promise<UserStats | null> {
    const data = await fetchGraphQL(USER_STATS_QUERY, { username }, token);
    if (!data?.user) {
        console.error(`[getUserStats] No user stats returned for ${username}. Response:`, JSON.stringify(data)?.slice(0, 200));
        return null;
    }

    const user = data.user;
    const starredRepos = (user.repositories?.nodes ?? [])
        .filter((r: { stargazerCount: number }) => r.stargazerCount > 0)
        .map((r: { name: string; stargazerCount: number }) => ({ name: r.name, stars: r.stargazerCount }));

    let organizations: { login: string; avatarUrl: string; name: string | null }[] = [];
    try {
        const orgsData = await fetchWithAuth(`/users/${username}/orgs`, token);
        if (Array.isArray(orgsData)) {
            organizations = orgsData.map(org => ({
                login: org.login,
                avatarUrl: org.avatar_url,
                name: org.description || null
            }));
        }
    } catch {
        console.error(`Failed to fetch REST orgs for ${username}`);
    }

    return {
        mergedPRs: user.pullRequests?.totalCount ?? 0,
        totalIssues: user.issues?.totalCount ?? 0,
        totalRepos: user.repositories?.totalCount ?? 0,
        contributedToRepos: user.repositoriesContributedTo?.totalCount ?? 0,
        totalFollowers: user.followers?.totalCount ?? 0,
        starredRepos,
        organizations,
    };
}
