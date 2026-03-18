/**
 * Comprehensive GitHub API service layer.
 * Uses REST API for user data, repos, events, README.
 * Uses GraphQL API for contribution calendar + pinned repos (not available via REST).
 */

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
    const res = await fetch(`${GITHUB_API_URL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 60 },
    });

    if (!res.ok) {
        console.error(`GitHub REST error [${res.status}]: ${res.statusText} for ${endpoint}`);
        return null;
    }

    return res.json();
}

async function fetchGraphQL(query: string, variables: Record<string, unknown>, token: string) {
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
        console.error(`GitHub GraphQL error [${res.status}]: ${res.statusText}`);
        return null;
    }

    const json = await res.json();
    if (json.errors) {
        console.error("GitHub GraphQL errors:", json.errors);
        return null;
    }

    return json.data;
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
