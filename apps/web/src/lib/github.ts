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
    contributionLevel: "NONE" | "FIRST_QUARTER" | "SECOND_QUARTER" | "THIRD_QUARTER" | "FOURTH_QUARTER";
    date: string;
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

        return res.json();
    });
}

async function fetchGraphQL(query: string, variables: Record<string, unknown>, token: string) {
    // Stringify variables to make a predictable cache key
    const cacheKey = `gql:${token.slice(-10)}:${query.slice(0, 20)}:${JSON.stringify(variables)}`;
    
    return withCache(cacheKey, async () => {
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
            if (res.status === 403 || res.status === 429) {
                console.error(`GitHub GraphQL Rate Limited. Headers:`, {
                    remaining: res.headers.get('x-ratelimit-remaining')
                });
            } else {
                console.error(`GitHub GraphQL error [${res.status}]: ${res.statusText}`);
            }
            return null;
        }

        const json = await res.json();
        if (json.errors) {
            console.error("GitHub GraphQL errors:", json.errors);
            return null;
        }

        return json.data;
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
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const repos = await fetchWithAuth(
        `/search/repositories?q=created:>${oneWeekAgo}&sort=stars&order=desc&per_page=${limit}`,
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
          }
        }
      }
    }
  }
}`;

const PINNED_REPOS_QUERY = `
query($username: String!) {
  user(login: $username) {
    pinnedItems(first: 6, types: REPOSITORY) {
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
    if (!data?.user?.contributionsCollection?.contributionCalendar) return null;

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

export interface MonthlyActivity {
    month: string; // e.g. "March 2026"
    commits: number;
    commitRepos: Set<string> | number;
    prsOpened: number;
    issuesOpened: number;
    reposCreated: string[];
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
        commitRepos: Set<string>;
        prsOpened: number;
        issuesOpened: number;
        reposCreated: string[];
    }>();

    for (const event of allEvents) {
        const date = new Date(event.created_at);
        const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

        if (!monthMap.has(key)) {
            monthMap.set(key, {
                commits: 0,
                commitRepos: new Set(),
                prsOpened: 0,
                issuesOpened: 0,
                reposCreated: [],
            });
        }
        const month = monthMap.get(key)!;

        switch (event.type) {
            case "PushEvent":
                month.commits += event.payload.commits?.length ?? 0;
                month.commitRepos.add(event.repo.name);
                break;
            case "PullRequestEvent":
                if (event.payload.action === "opened") month.prsOpened++;
                break;
            case "IssuesEvent":
                if (event.payload.action === "opened") month.issuesOpened++;
                break;
            case "CreateEvent":
                if (event.payload.ref_type === "repository") {
                    month.reposCreated.push(event.repo.name);
                }
                break;
        }
    }

    // Convert to array, serializable (Sets → numbers)
    return Array.from(monthMap.entries()).map(([monthLabel, data]) => ({
        month: monthLabel,
        commits: data.commits,
        commitRepos: data.commitRepos.size,
        prsOpened: data.prsOpened,
        issuesOpened: data.issuesOpened,
        reposCreated: data.reposCreated,
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
    organizations(first: 10) {
      nodes {
        login
        avatarUrl
        name
      }
    }
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
    if (!data?.user) return null;

    const user = data.user;
    return {
        mergedPRs: user.pullRequests?.totalCount ?? 0,
        totalIssues: user.issues?.totalCount ?? 0,
        totalRepos: user.repositories?.totalCount ?? 0,
        contributedToRepos: user.repositoriesContributedTo?.totalCount ?? 0,
        totalFollowers: user.followers?.totalCount ?? 0,
        starredRepos: (user.repositories?.nodes ?? [])
            .filter((r: { stargazerCount: number }) => r.stargazerCount > 0)
            .map((r: { name: string; stargazerCount: number }) => ({ name: r.name, stars: r.stargazerCount })),
        organizations: user.organizations?.nodes ?? [],
    };
}
