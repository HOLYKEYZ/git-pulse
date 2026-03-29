/**
 * comprehensive github api service layer.
 * uses rest api for user data, repos, events, readme.
 * uses graphql api for contribution calendar + pinned repos (not available via rest).
 */

import { withCache } from "./cache";

// ─── types ───────────────────────────────────────────────────────────────────

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
      author: { name: string; email: string; };
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
  primaryLanguage: { name: string; color: string; } | null;
  url: string;
}

// ─── constants ───────────────────────────────────────────────────────────────

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

// ─── core fetchers ───────────────────────────────────────────────────────────

async function fetchWithAuth(endpoint: string, token: string) {
  const cacheKey = `rest:${token.slice(-10)}:${endpoint}`;

  return withCache(cacheKey, async () => {
    try {
      const res = await fetch(`${GITHUB_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        },
        next: { revalidate: 60 }
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

export async function getGitHubStarredRepos(username: string, token: string, page = 1, perPage = 30): Promise<GitHubRepo[]> {
  return (await fetchWithAuth(`/users/${username}/starred?page=${page}&per_page=${perPage}`, token)) || [];
}

async function fetchGraphQL(query: string, variables: Record<string, unknown>, token: string) {
  // use a hash or enough of the query to guarantee uniqueness across different queries 
  const cacheKey = `gql:${token.slice(-10)}:${query.slice(0, 150).replace(/\s+/g, '')}:${JSON.stringify(variables)}`;

  return withCache(cacheKey, async () => {
    try {
      const res = await fetch(GITHUB_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, variables }),
        next: { revalidate: 120 }
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[GraphQL] HTTP ${res.status}: ${res.statusText}. Token ending: ...${token.slice(-6)}. Body: ${body.slice(0, 300)}`);
        return null;
      }

      const json = await res.json();

      // debug logging for pinned repos query
      if (query.includes("pinnedItems")) {
        console.log(`[GraphQL Pinned Repos for ${variables?.username}] Response:`, JSON.stringify(json, null, 2));
      }

      if (json.errors) {
        console.error("[GraphQL] Errors:", JSON.stringify(json.errors, null, 2));
        // return data even if there are some errors (partial responses)
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

// ─── rest functions ──────────────────────────────────────────────────────────

/**
 * fetch full github user profile (expanded fields)
 */
export async function getGitHubUser(username: string, token: string): Promise<GitHubUser | null> {
  return fetchWithAuth(`/users/${username}`, token);
}

/**
 * fetch a user's repositories (sorted by recently updated)
 */
export async function getGitHubRepos(username: string, token: string, limit = 6): Promise<GitHubRepo[]> {
  const repos = await fetchWithAuth(
    `/users/${username}/repos?sort=updated&per_page=${limit}&type=owner`,
    token
  );
  return repos || [];
}

/**
 * fetch all repos with pagination support for the full repos page
 */
export async function getGitHubAllRepos(
  username: string,
  token: string,
  page = 1,
  perPage = 30,
  sort: "updated" | "pushed" | "full_name" | "created" = "updated")
  : Promise<GitHubRepo[]> {
  const repos = await fetchWithAuth(
    `/users/${username}/repos?sort=${sort}&per_page=${perPage}&page=${page}&type=owner`,
    token
  );
  return repos || [];
}

/**
 * fetch user's received events (activity of people they follow)
 */
export async function getGitHubReceivedEvents(username: string, token: string): Promise<GitHubEvent[]> {
  const events = await fetchWithAuth(`/users/${username}/received_events?per_page=100`, token);
  return events || [];
}

/**
 * fetch the profile readme as pre-rendered html from the special {username}/{username} repo.
 * uses github's html media type so we get rendered markup, not raw markdown.
 */
export async function getGitHubReadme(username: string, token: string): Promise<string | null> {
  const cacheKey = `readme-html:${token.slice(-10)}:${username}`;

  return withCache(cacheKey, async () => {
    try {
      const res = await fetch(`${GITHUB_API_URL}/repos/${username}/${username}/readme`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.html+json"
        },
        next: { revalidate: 300 }
      });

      if (!res.ok) {
        console.error(`GitHub README fetch [${res.status}] for ${username}`);
        return null;
      }

      // with the html accept header, the response body IS the rendered html string
      return await res.text();
    } catch (err) {
      console.error("Failed to fetch README HTML:", err);
      return null;
    }
  });
}

/**
 * Scrape actual GitHub trending repos
 */
export async function getGitHubTrendingRepos(token: string, limit = 5): Promise<any[]> {
  try {
    const res = await fetch('https://github.com/trending', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html"
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      console.error("Failed to fetch trending page", res.status);
      return [];
    }
    
    const html = await res.text();
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    const repos: any[] = [];
    $('article.Box-row').each((i: number, el: any) => {
      if (i >= limit) return false;
      
      const titleEl = $(el).find('h2.h3 a');
      const href = titleEl.attr('href') || '';
      const fullName = href.substring(1); 
      
      const description = $(el).find('p.col-9').text().replace(/\s+/g, ' ').trim();
      const language = $(el).find('[itemprop="programmingLanguage"]').text().trim();
      
      const starsText = $(el).find('a[href$="/stargazers"]').text().trim().replace(/,/g, '');
      const stargazers_count = parseInt(starsText) || 0;
      
      repos.push({
        id: fullName,
        html_url: `https://github.com${href}`,
        full_name: fullName,
        description,
        language,
        stargazers_count
      });
    });
    
    return repos;
  } catch (err) {
    console.error("Error scraping GitHub Trending:", err);
    return [];
  }
}

/**
 * scrape github.com/trending/developers for real trending devs
 */
export async function getGitHubTrendingDevelopers(token: string, limit = 5): Promise<any[]> {
  try {
    const res = await fetch('https://github.com/trending/developers', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html"
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      console.error("Failed to fetch trending developers page", res.status);
      return [];
    }
    
    const html = await res.text();
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    const devs: any[] = [];
    $('article.Box-row').each((i: number, el: any) => {
      if (i >= limit) return false;
      
      const usernameEl = $(el).find('h1.h3 a');
      const href = usernameEl.attr('href') || '';
      const username = href.replace(/^\//, '').trim();
      const avatar = $(el).find('img').attr('src') || '';
      const name = usernameEl.text().replace(/\s+/g, ' ').trim() || username;
      
      // popular repo
      const repoEl = $(el).find('h1.h4 a');
      const repoName = repoEl.text().trim();
      const repoDesc = $(el).find('span.f6').text().trim();
      
      devs.push({
        id: username,
        username,
        avatar,
        name,
        popular_repo: repoName || null,
        popular_repo_description: repoDesc || null,
        html_url: `https://github.com/${username}`,
      });
    });
    
    return devs;
  } catch (err) {
    console.error("Error scraping GitHub Trending Developers:", err);
    return [];
  }
}

/**
 * fetch high-potential lower-starred upcoming projects
 */
export async function getUpcomingGitHubProjects(token: string, limit = 5): Promise<any[]> {
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const repos = await fetchWithAuth(
    `/search/repositories?q=created:>${oneMonthAgo}+stars:50..500&sort=stars&order=desc&per_page=${limit}`,
    token
  );
  return repos?.items || [];
}

/**
 * fetch suggested users (Mid-tier Devs like you)
 * V2: explicitly filters out 0-commit clout chasers
 */
export async function getSuggestedGitHubUsers(token: string, language?: string, limit = 5): Promise<any[]> {
  const q = language ? `language:${language} followers:5..2000 repos:>0 type:user` : `followers:5..2000 repos:>0 type:user`;
  // deterministic page seed changing every 30 minutes
  const randomPage = (Math.floor(Date.now() / (1000 * 60 * 30)) % 10) + 1;
  const usersRes = await fetchWithAuth(
    `/search/users?q=${q}&sort=followers&order=desc&per_page=15&page=${randomPage}`,
    token
  );
  
  const items = usersRes?.items || [];
  if (items.length === 0) return [];

  // parallel fetch to verify active contribution
  const activeChecks = await Promise.all(
    items.slice(0, 10).map(async (user: any) => {
      try {
        const contrib = await getContributionData(user.login, token);
        if (contrib && contrib.totalContributions > 0) return user;
      } catch {}
      return null;
    })
  );

  return activeChecks.filter(Boolean).slice(0, limit);
}

/**
 * fetch proxy for top repos by daily commits (recently pushed with high stars)
 */
export async function getTopReposByDailyCommits(token: string, limit = 5): Promise<any[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const repos = await fetchWithAuth(
    `/search/repositories?q=pushed:>=${oneDayAgo} stars:>500&sort=updated&order=desc&per_page=${limit}`,
    token
  );
  return repos?.items || [];
}

// ─── graphql functions ───────────────────────────────────────────────────────

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
 * fetch real contribution data (365-day calendar) via graphql
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
 * fetch contribution data for a specific year via graphql
 */
export async function getContributionDataForYear(username: string, token: string, year: number): Promise<ContributionData | null> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;
  
  const query = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
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
  
  const data = await fetchGraphQL(query, { username, from, to }, token);
  if (!data?.user?.contributionsCollection?.contributionCalendar) {
    return null;
  }

  return data.user.contributionsCollection.contributionCalendar;
}

/**
 * fetch pinned repos via graphql (not available via rest)
 */
export async function getGitHubPinnedRepos(username: string, token: string): Promise<PinnedRepo[]> {
  const data = await fetchGraphQL(PINNED_REPOS_QUERY, { username }, token);
  if (!data?.user?.pinnedItems?.nodes) return [];

  return data.user.pinnedItems.nodes;
}

// ─── contribution activity ───────────────────────────────────────────────────

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
  totalPrsOpened: number;
  totalPrRepos: number;
  prsOpened: PRDetail[];
  totalIssuesOpened: number;
  totalIssueRepos: number;
  issuesOpened: PRDetail[];
  totalReposCreated: number;
  reposCreated: string[];
  totalPrReviews: number;
  totalReviewRepos: number;
  prReviews: PRDetail[];
  issueComments: PRDetail[];
}

export async function getContributionActivity(username: string, token: string): Promise<MonthlyActivity[]> {
  console.log("[contribution-activity] CALLED for", username);
  try {
    const now = new Date();
    const currentMonthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    console.log("[contribution-activity] month:", currentMonthLabel, "from:", firstDayOfMonth);

      const query = `
        query($login: String!, $from: DateTime!) {
          user(login: $login) {
            contributionsCollection(from: $from) {
              commitContributionsByRepository(maxRepositories: 50) {
                repository { nameWithOwner }
                contributions { totalCount }
              }
              repositoryContributions(first: 50) {
                nodes { repository { nameWithOwner } }
              }
              pullRequestContributionsByRepository(maxRepositories: 50) {
                repository { nameWithOwner }
                contributions(first: 10) {
                  totalCount
                  nodes { pullRequest { title, url, number } }
                }
              }
              issueContributionsByRepository(maxRepositories: 50) {
                repository { nameWithOwner }
                contributions(first: 10) {
                  totalCount
                  nodes { issue { title, url, number } }
                }
              }
              pullRequestReviewContributionsByRepository(maxRepositories: 50) {
                repository { nameWithOwner }
                contributions(first: 10) {
                  totalCount
                  nodes { pullRequest { title, url, number } }
                }
              }
            }
          }
        }
      `;

      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, variables: { login: username, from: firstDayOfMonth } }),
        next: { revalidate: 3600 }
      });

      if (!res.ok) {
        console.error("[contribution-activity] graphql fetch failed", res.status, await res.text());
        return [];
      }

      const json = await res.json();
      if (json.errors || !json.data?.user?.contributionsCollection) {
        console.error("[contribution-activity] graphql response error:", JSON.stringify(json.errors || json, null, 2));
        return [];
      }

      const collection = json.data.user.contributionsCollection;
      
      const monthData: MonthlyActivity = {
        month: currentMonthLabel,
        commits: 0,
        commitRepos: [],
        totalPrsOpened: 0,
        totalPrRepos: 0,
        prsOpened: [],
        totalIssuesOpened: 0,
        totalIssueRepos: 0,
        issuesOpened: [],
        totalReposCreated: 0,
        reposCreated: [],
        totalPrReviews: 0,
        totalReviewRepos: 0,
        prReviews: [],
        issueComments: []
      };

      for (const edge of collection.commitContributionsByRepository || []) {
        if (!edge?.repository?.nameWithOwner) continue;
        const repoName = edge.repository.nameWithOwner;
        const count = edge.contributions?.totalCount || 0;
        monthData.commits += count;
        monthData.commitRepos.push({ name: repoName, count });
      }
      monthData.commitRepos.sort((a, b) => b.count - a.count);

      for (const node of collection.repositoryContributions?.nodes || []) {
        if (node?.repository?.nameWithOwner) {
          monthData.reposCreated.push(node.repository.nameWithOwner);
        }
      }
      monthData.totalReposCreated = monthData.reposCreated.length;

      for (const edge of collection.pullRequestContributionsByRepository || []) {
        if (!edge?.repository?.nameWithOwner) continue;
        const repoName = edge.repository.nameWithOwner;
        const totalPrs = edge.contributions?.totalCount || 0;
        if (totalPrs > 0) {
          monthData.totalPrsOpened += totalPrs;
          monthData.totalPrRepos += 1;
        }
        for (const prNode of edge.contributions?.nodes || []) {
          const pr = prNode?.pullRequest;
          if (!pr) continue;
          monthData.prsOpened.push({
            title: pr.title || `PR #${pr.number}`,
            url: pr.url || `https://github.com/${repoName}/pull/${pr.number}`,
            number: pr.number,
            repo: repoName
          });
        }
      }

      for (const edge of collection.issueContributionsByRepository || []) {
        if (!edge?.repository?.nameWithOwner) continue;
        const repoName = edge.repository.nameWithOwner;
        const totalIssues = edge.contributions?.totalCount || 0;
        if (totalIssues > 0) {
          monthData.totalIssuesOpened += totalIssues;
          monthData.totalIssueRepos += 1;
        }
        for (const issueNode of edge.contributions?.nodes || []) {
          const issue = issueNode?.issue;
          if (!issue) continue;
          monthData.issuesOpened.push({
            title: issue.title || `Issue #${issue.number}`,
            url: issue.url || `https://github.com/${repoName}/issues/${issue.number}`,
            number: issue.number,
            repo: repoName
          });
        }
      }

      for (const edge of collection.pullRequestReviewContributionsByRepository || []) {
        if (!edge?.repository?.nameWithOwner) continue;
        const repoName = edge.repository.nameWithOwner;
        const totalReviews = edge.contributions?.totalCount || 0;
        if (totalReviews > 0) {
          monthData.totalPrReviews += totalReviews;
          monthData.totalReviewRepos += 1;
        }
        for (const reviewNode of edge.contributions?.nodes || []) {
          const pr = reviewNode?.pullRequest;
          if (!pr) continue;
          monthData.prReviews.push({
            title: pr.title || `PR #${pr.number}`,
            url: pr.url || `https://github.com/${repoName}/pull/${pr.number}`,
            number: pr.number,
            repo: repoName
          });
        }
      }

    return [monthData];
  } catch (e) {
    console.error("[contribution-activity] Error formatting GraphQL contributions", e);
    return [];
  }
}

// ─── followers / following ──────────────────────────────────────────────────

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

// ─── user achievements scraper ───────────────────────────────────────────

export interface UserAchievement {
  name: string;
  badgeUrl: string;
  description?: string;
  multiplier?: number;
}

export async function getUserAchievements(username: string): Promise<UserAchievement[]> {
  try {
    const res = await fetch(`https://github.com/${username}?tab=achievements`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html"
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const hovercardUrls: string[] = [];
    $('a[href*="achievement="]').each((_: any, el: any) => {
      const url = $(el).find('[data-hovercard-url]').attr('data-hovercard-url');
      if (url && !hovercardUrls.includes(url)) {
        hovercardUrls.push(url);
      }
    });

    // Fetch detailed hovercards in parallel for descriptions and multipliers
    const achievements = await Promise.all(hovercardUrls.map(async (url) => {
      const hcRes = await fetch('https://github.com' + url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const hcHtml = await hcRes.text();
      const $hc = cheerio.load(hcHtml);

      const name = $hc('h3').text().trim();

      let multiplier;
      const tierText = $hc('.achievement-tier-label').text().trim();
      if (tierText.startsWith('x')) {
        multiplier = parseInt(tierText.replace('x', ''), 10);
      }

      const description = $hc('h3').parent().next('div').text().replace(/\s+/g, ' ').trim();

      let badgeUrl = $hc('img.tier-badge').attr('src');
      if (badgeUrl) badgeUrl = badgeUrl.split('?')[0];

      return { name, description, multiplier, badgeUrl: badgeUrl || '' };
    }));

    return achievements.filter(a => a.badgeUrl !== '');
  } catch (error) {
    console.error(`Error scraping achievements for ${username}:`, error);
    return [];
  }
}


// ─── user stats (for achievements) ──────────────────────────────────────────

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
  starredRepos: { name: string; stars: number; }[];
  organizations: { login: string; avatarUrl: string; name: string | null; }[];
}

export async function getUserStats(username: string, token: string): Promise<UserStats | null> {
  const data = await fetchGraphQL(USER_STATS_QUERY, { username }, token);
  if (!data?.user) {
    console.error(`[getUserStats] No user stats returned for ${username}. Response:`, JSON.stringify(data)?.slice(0, 200));
    return null;
  }

  const user = data.user;
  const starredRepos = (user.repositories?.nodes ?? []).
    filter((r: { stargazerCount: number; }) => r.stargazerCount > 0).
    map((r: { name: string; stargazerCount: number; }) => ({ name: r.name, stars: r.stargazerCount }));

  let organizations: { login: string; avatarUrl: string; name: string | null; }[] = [];
  try {
    const orgsData = await fetchWithAuth(`/users/${username}/orgs`, token);
    if (Array.isArray(orgsData)) {
      organizations = orgsData.map((org) => ({
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
    organizations
  };
}

/**
 * fetch total number of commits for a repository
 */
export async function getRepoCommitCount(owner: string, repo: string, token: string): Promise<number> {
  const cacheKey = `repo-commits:${owner}:${repo}`;
  return withCache(cacheKey, async () => {
    try {
      // we use per_page=1 and read the 'link' header to get the total count efficiently
      const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/commits?per_page=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        },
        next: { revalidate: 86400 } // cache for 24h
      });

      if (!res.ok) return 0;

      const link = res.headers.get("link");
      if (!link) return 1; // if no link header, there's only 1 page (1 commit)

      const lastPageMatch = link.match(/page=(\d+)>; rel="last"/);
      if (lastPageMatch) {
        return parseInt(lastPageMatch[1], 10);
      }

      return 1;
    } catch (err) {
      console.error(`Error fetching commit count for ${owner}/${repo}:`, err);
      return 0;
    }
  });
}

/**
 * fetch repository participation stats and calculate consistency ratio
 * (active weeks out of the last 52 weeks)
 */
export async function getRepoConsistency(owner: string, repo: string, token: string): Promise<number> {
  const cacheKey = `repo-consistency:${owner}:${repo}`;
  return withCache(cacheKey, async () => {
    try {
      const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/stats/participation`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        },
        next: { revalidate: 86400 } // cache for 24h
      });

      if (!res.ok) return 0;

      const data = await res.json();
      const allCommits = data.all || [];
      if (allCommits.length === 0) return 0;

      // consistency = ratio of weeks with at least 1 commit
      const activeWeeks = allCommits.filter((count: number) => count > 0).length;
      return activeWeeks / allCommits.length;
    } catch (err) {
      console.error(`Error fetching participation stats for ${owner}/${repo}:`, err);
      return 0;
    }
  });
}