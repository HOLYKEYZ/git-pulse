/**
 * Service functions to query the real GitHub API using the user's OAuth access token.
 */

export interface GitHubUser {
    login: string;
    avatar_url: string;
    name: string;
    bio: string;
    followers: number;
    following: number;
    public_repos: number;
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    language: string;
    stargazers_count: number;
    forks_count: number;
    pushed_at: string;
    html_url: string;
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
        commits?: Array<{
            sha: string;
            message: string;
            author: { name: string; email: string };
        }>;
        pull_request?: {
            number: number;
            title: string;
        };
        release?: {
            tag_name: string;
            body: string;
        };
    };
    created_at: string;
}

const GITHUB_API_URL = "https://api.github.com";

async function fetchWithAuth(endpoint: string, token: string) {
    const res = await fetch(`${GITHUB_API_URL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
        },
        // Revalidate every 60 seconds so we don't spam GitHub on every render
        next: { revalidate: 60 }, 
    });

    if (!res.ok) {
        console.error(`GitHub API error: ${res.statusText}`);
        return null;
    }

    return res.json();
}

/**
 * Fetch a user's GitHub profile data
 */
export async function getGitHubUser(username: string, token: string): Promise<GitHubUser | null> {
    return fetchWithAuth(`/users/${username}`, token);
}

/**
 * Fetch a user's public repositories, sorted by most recently updated
 */
export async function getGitHubRepos(username: string, token: string, limit = 6): Promise<GitHubRepo[]> {
    const repos = await fetchWithAuth(`/users/${username}/repos?sort=updated&per_page=${limit}`, token);
    return repos || [];
}

/**
 * Fetch events received by the user (the activity feed of people they follow on GitHub)
 */
export async function getGitHubReceivedEvents(username: string, token: string): Promise<GitHubEvent[]> {
    const events = await fetchWithAuth(`/users/${username}/received_events`, token);
    return events || [];
}
