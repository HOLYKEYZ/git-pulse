/**
 * comprehensive github api service layer.
 * uses rest api for user data, repos, events, readme.
 * uses graphql api for contribution calendar + pinned repos (not available via rest).
 */

import { withCache } from "./cache";
import { cosineSimilarity, computeAchievementScore, type LanguageWeight } from "./algo";

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
  visibility?: string;
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




const BOT_PATTERNS = [
  /bot$/i, /\[bot\]$/i,
  /^dependabot/i, /^renovate/i, /^github-actions/i,
  /^stale/i, /^semantic-release/i, /^greenkeeper/i,
  /^imgbot/i, /^snyk/i, /^codecov/i, /^mergify/i,
  /^allcontributors/i, /^copilot/i, /^deepsource/i,
  /cicd/i, /testuser/i, /^service-/i,
  /^[a-z]+-[a-z]+-[a-z0-9]+-[a-z0-9]+$/,
];
const isBot = (login: string) => BOT_PATTERNS.some(p => p.test(login));

async function fetchWithAuth(endpoint: string, token: string) {
  if (typeof endpoint !== 'string' || typeof token !== 'string') {
    throw new Error('Invalid input type');
  }
  if (endpoint.length === 0 || token.length === 0) {
    throw new Error('Input cannot be empty');
  }
  const cacheKey = `rest:${token.slice(-10)}:${endpoint}`;

  return withCache(cacheKey, async () => {
    try {
      const acceptHeader = endpoint.startsWith('/search/commits')
        ? 'application/vnd.github.cloak-preview+json'
        : 'application/vnd.github.v3+json';

      const res = await fetch(`${GITHUB_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: acceptHeader
        },
        next: { revalidate: 60 }
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          console.error(`[GitHub REST] Rate Limited on ${endpoint}. Reset: ${res.headers.get('x-ratelimit-reset')}`);
        } else if (res.status === 404) {
          return null;
        } else {
          console.error(`[GitHub REST] Error ${res.status}: ${res.statusText} for ${endpoint}`);
        }
        return null;
      }

      return await res.json();
    } catch (error) {
      console.error(`[GitHub REST] Network failure for ${endpoint}:`, error);
      return null;
    }
  });
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

/**
 * executes a batched graphql query by chunking items into smaller groups
 * to avoid github's 502 bad gateway on large queries (>10 aliases).
 * each chunk fires in parallel, results are merged into one keyed object.
 */
async function batchGraphQL<T>(
  items: T[],
  buildFragment: (item: T, globalIndex: number) => string,
  token: string,
  chunkSize = 10
): Promise<Record<string, any>> {
  if (items.length === 0) return {};

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  const results = await Promise.all(
    chunks.map(async (chunk, chunkIdx) => {
      const query = `
        query {
          ${chunk.map((item, i) => {
        const globalIdx = chunkIdx * chunkSize + i;
        return buildFragment(item, globalIdx);
      }).join('\n')}
        }
      `;
      return fetchGraphQL(query, {}, token);
    })
  );

  // merge all chunk results into one object
  const merged: Record<string, any> = {};
  for (const result of results) {
    if (result) {
      Object.assign(merged, result);
    }
  }

  return merged;
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
 * fetch all repos with pagination support for full repos page
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
 * uses github's html media type so we get rendered markup, not raw markdown(to get as is).
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
 * scrape github trending repos
 */
export async function getGitHubTrendingRepos(token: string, limit = 5): Promise<any[]> {
  try {
    const res = await fetch('https://github.com/trending?since=daily', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html"
      },
      next: { revalidate: 300 }
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
 * scrape github.com/trending/developers for trending devs
 */
export async function getGitHubTrendingDevelopers(token: string, limit = 5): Promise<any[]> {
  try {
    const res = await fetch('https://github.com/trending/developers?since=daily', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html"
      },
      next: { revalidate: 300 }
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

      // popular repo(s)
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
 * upcoming repos — velocity-based scoring.
 * finds repos created in last 30 days with traction, ranks by growth rate.
 */
export async function getUpcomingGitHubProjects(token: string, limit = 5): Promise<any[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const randomPage = Math.floor(Math.random() * 3) + 1;

  // created in last 30 days, 3-500 stars (upcoming range — not established, not dead)
  const reposRes = await fetchWithAuth(
    `/search/repositories?q=created:>=${dateStr}+stars:3..500&sort=stars&order=desc&per_page=20&page=${randomPage}`,
    token
  );

  const items = reposRes?.items || [];
  if (items.length === 0) return [];

  const cleanItems = items.filter((r: any) =>
    !r.fork &&
    r.description && r.description.trim().length >= 15 &&
    r.stargazers_count <= 500 && // strictly enforce cap
    r.owner?.login && !isBot(r.owner.login)
  ).slice(0, 15);

  if (cleanItems.length === 0) return [];

  // chunked graphql for total commit count (avoids 502 on large batches)
  const gqlRes = await batchGraphQL(
    cleanItems,
    (repo: any, i: number) => {
      const [owner, name] = repo.full_name.split('/');
      return `
        repo${i}: repository(owner: "${owner}", name: "${name}") {
          defaultBranchRef {
            target {
              ... on Commit {
                history { totalCount }
              }
            }
          }
        }
      `;
    },
    token,
    10
  );
  const now = Date.now();

  const scoredRepos = cleanItems.map((repo: any, i: number) => {
    const commitCount = gqlRes?.[`repo${i}`]?.defaultBranchRef?.target?.history?.totalCount || 0;
    const createdAt = new Date(repo.created_at).getTime();
    const daysOld = Math.max(1, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
    const stars = repo.stargazers_count || 0;

    // velocity: growth rate per day
    const velocityScore = (stars / daysOld) * 10 + (commitCount / daysOld) * 5;

    return { ...repo, commitVelocity: commitCount, velocityScore };
  });

  return scoredRepos
    .filter((r: any) => r.commitVelocity >= 5)
    .sort((a: any, b: any) => b.velocityScore - a.velocityScore)
    .slice(0, limit);
}

/**
 * fetch suggested users
 * v3: strictly prioritizes commit volume over follower count. fetches a pool,
 * evaluates exact contributions via GraphQL, and securely sorts by highest volume.
 */
export async function getSuggestedGitHubUsers(token: string, language?: string, limit = 5): Promise<any[]> {
  // query a broad pool of devs (followers > 5 to skip empty bot accounts)
  const q = language ? `language:${language} followers:>5 type:user` : `followers:>5 type:user`;

  // randomize page to guarantee fresh recommendations on load
  const randomPage = Math.floor(Math.random() * 25) + 1;
  const usersRes = await fetchWithAuth(
    `/search/users?q=${q}&per_page=20&page=${randomPage}`,
    token
  );

  const items = usersRes?.items || [];
  if (items.length === 0) return [];

  // parallel fetch real contribution data for all candidates
  const userProfiles = await Promise.all(
    items.map(async (user: any) => {
      try {
        const contrib = await getContributionData(user.login, token);
        if (contrib) {
          return {
            ...user,
            totalContributions: contrib.totalContributions
          };
        }
      } catch { }
      return null;
    })
  );

  // explicitly filter for high-activity users (> 100 commits) and sort exclusively by commit volume
  const activeUsers = userProfiles
    .filter((u): u is any => u !== null && u.totalContributions >= 100)
    .sort((a, b) => b.totalContributions - a.totalContributions);

  // if the highly restrictive filter returned too few, fallback to just sorting what we found by contributions
  if (activeUsers.length < limit) {
    const fallbackUsers = userProfiles
      .filter((u): u is any => u !== null && u.totalContributions > 0)
      .sort((a, b) => b.totalContributions - a.totalContributions);
    return fallbackUsers.slice(0, limit);
  }

  return activeUsers.slice(0, limit);
}

/**
 * most active repos today — commit search + graphql verification.
 * searches repos pushed today, verifies exact commit count since midnight utc.
 */
export async function getTopReposByDailyCommits(token: string, limit = 5): Promise<any[]> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  const dateStr = todayIso.split('T')[0];

  // step 1: three parallel sources for a diverse pool
  const randomPage1 = Math.floor(Math.random() * 5) + 1;
  const randomPage2 = Math.floor(Math.random() * 5) + 1;

  const [searchRes1, searchRes2, eventsRes] = await Promise.all([
    fetchWithAuth(`/search/repositories?q=pushed:>=${dateStr}+stars:<500000&sort=updated&order=desc&per_page=15&page=${randomPage1}`, token),
    fetchWithAuth(`/search/repositories?q=pushed:>=${dateStr}+stars:<500000&sort=stars&order=desc&per_page=10`, token),
    fetchWithAuth(`/events?per_page=100`, token),
  ]);

  // extract repos from event stream PushEvents
  const eventRepoNames = new Set<string>();
  if (Array.isArray(eventsRes)) {
    for (const event of eventsRes) {
      if (event.type === 'PushEvent' && event.repo?.name) {
        eventRepoNames.add(event.repo.name);
      }
    }
  }

  // merge all sources, deduplicate by full_name
  const seen = new Set<string>();
  const allItems: any[] = [];

  for (const item of [...(searchRes1?.items || []), ...(searchRes2?.items || [])]) {
    if (!seen.has(item.full_name)) {
      seen.add(item.full_name);
      allItems.push(item);
    }
  }

  // step 2: pre-filter — cheap, no API call
  const cleanItems = allItems.filter(r =>
    !r.fork &&
    r.description && r.description.trim().length >= 15 &&
    r.stargazers_count < 500000 && // no mega popular repos
    r.owner?.login && !isBot(r.owner.login)
  ).slice(0, 30);

  if (cleanItems.length === 0) return [];

  // step 3: chunked graphql — exact commits since midnight utc (avoids 502)
  const gqlRes = await batchGraphQL(
    cleanItems,
    (repo: any, i: number) => {
      const [owner, name] = repo.full_name.split('/');
      return `
        repo${i}: repository(owner: "${owner}", name: "${name}") {
          defaultBranchRef {
            target {
              ... on Commit {
                history(since: "${todayIso}") { totalCount }
              }
            }
          }
        }
      `;
    },
    token,
    10
  );

  const verifiedRepos = cleanItems.map((repo, i) => {
    const commitsToday = gqlRes?.[`repo${i}`]?.defaultBranchRef?.target?.history?.totalCount || 0;
    return { ...repo, commitsToday };
  });

  // step 4: filter >= 8, < 200, sort desc
  return verifiedRepos
    .filter(r => r.commitsToday >= 8 && r.commitsToday < 200)
    .sort((a, b) => b.commitsToday - a.commitsToday)
    .slice(0, limit);
}

/**
 * most active devs today — event-driven pool building.
 * watches the public event stream for push events, then batch-verifies
 * exact today commit count via graphql totalCommitContributions.
 */
export async function getTopDevsByDailyCommits(token: string, limit = 5): Promise<any[]> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  // step 1: fetch public event stream (people pushing code right now)
  const eventsRes = await fetchWithAuth(`/events?per_page=100`, token);
  const allEvents = Array.isArray(eventsRes) ? eventsRes : [];

  // step 2: count push events per actor — frequency signals highest activity
  const pushCounts = new Map<string, { login: string; avatar_url: string; count: number }>();
  for (const event of allEvents) {
    if (event.type === 'PushEvent' && event.actor?.login) {
      if (isBot(event.actor.login)) continue;
      const existing = pushCounts.get(event.actor.login);
      if (existing) {
        existing.count++;
      } else {
        pushCounts.set(event.actor.login, {
          login: event.actor.login,
          avatar_url: event.actor.avatar_url,
          count: 1
        });
      }
    }
  }

  // step 3: sort by push event frequency, take top 35 for GraphQL verification
  const userList = Array.from(pushCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 35);

  if (userList.length === 0) return [];

  // step 4: chunked graphql — exact today commits (avoids 502)
  const candRes = await batchGraphQL(
    userList,
    (user: any, i: number) => `
      user${i}: user(login: "${user.login}") {
        login
        avatarUrl
        name
        contributionsCollection(from: "${todayIso}") {
          totalCommitContributions
          restrictedContributionsCount
        }
      }
    `,
    token,
    10
  );

  const activeDevs = userList.map((user, i) => {
    const data = candRes?.[`user${i}`];
    const publicCommits = data?.contributionsCollection?.totalCommitContributions || 0;
    const privateCommits = data?.contributionsCollection?.restrictedContributionsCount || 0;
    const commitsToday = publicCommits + privateCommits;

    return {
      login: user.login,
      avatar_url: data?.avatarUrl || user.avatar_url,
      name: data?.name || user.login,
      totalContributions: commitsToday,
      label: commitsToday === 1 ? 'commit today' : 'commits today'
    };
  });

  // step 5: filter >= 5 commits, < 200 (bot threshold), sort desc
  return activeDevs
    .filter(d => d.totalContributions >= 5 && d.totalContributions < 200)
    .sort((a, b) => b.totalContributions - a.totalContributions)
    .slice(0, limit);
}

/**
 * upcoming devs — growth velocity scoring.
 * finds users created in last 90 days with some repos, ranks by contribution velocity.
 */
export async function getUpcomingGitHubDevs(token: string, limit = 5): Promise<any[]> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateStr = ninetyDaysAgo.toISOString().split('T')[0];

  const randomPage = Math.floor(Math.random() * 3) + 1;

  // created in last 90 days, already has some repos (means they're actually building)
  const usersRes = await fetchWithAuth(
    `/search/users?q=created:>=${dateStr}+repos:>2+type:user&per_page=20&page=${randomPage}`,
    token
  );

  const items = usersRes?.items || [];
  if (items.length === 0) return [];

  const userList = items.filter((u: any) => !isBot(u.login)).slice(0, 20);
  if (userList.length === 0) return [];

  // chunked graphql for all candidates (avoids 502)
  const candRes = await batchGraphQL(
    userList,
    (user: any, i: number) => `
      user${i}: user(login: "${user.login}") {
        login
        avatarUrl
        name
        createdAt
        followers { totalCount }
        repositories(privacy: PUBLIC, ownerAffiliations: OWNER) { totalCount }
        contributionsCollection {
          contributionCalendar { totalContributions }
        }
      }
    `,
    token,
    10
  );
  const now = Date.now();

  const scoredDevs = userList.map((user: any, i: number) => {
    const data = candRes?.[`user${i}`];
    if (!data) return null;

    const contributions = data.contributionsCollection?.contributionCalendar?.totalContributions || 0;
    const createdAt = new Date(data.createdAt).getTime();
    const accountAgeDays = Math.max(1, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));

    // velocity: contributions per day of account existence, scaled
    const velocityScore = (contributions / accountAgeDays) * 100;

    return {
      login: data.login,
      avatar_url: data.avatarUrl || user.avatar_url,
      name: data.name || user.login,
      totalContributions: contributions,
      velocityScore,
      label: 'contributions'
    };
  }).filter((u: any): u is any => u !== null && u.totalContributions >= 20);

  return scoredDevs
    .sort((a: any, b: any) => b.velocityScore - a.velocityScore)
    .slice(0, limit);
}

/**
 * fetch starred repos for a user
 */
export async function getGitHubStarredRepos(username: string, token: string, page = 1, perPage = 30): Promise<any[]> {
  const repos = await fetchWithAuth(
    `/users/${username}/starred?sort=created&direction=desc&per_page=${perPage}&page=${page}`,
    token
  );
  return repos || [];
}

/**
 * developers like you — multi-dimensional profile matching.
 * builds a profile vector from top 3 languages, commit velocity, repo count, avg stars.
 * searches across all 3 languages in parallel, deduplicates, and uses cosine similarity
 * plus achievement scoring for the final ranking.
 */
export async function getDevelopersLikeYou(username: string, token: string, limit = 5): Promise<any[]> {
  try {
    // step 1: build MY profile
    const baseQuery = `
      query($login: String!) {
        user(login: $login) {
          repositories(first: 50, orderBy: {field: PUSHED_AT, direction: DESC}, privacy: PUBLIC, ownerAffiliations: OWNER) {
            totalCount
            nodes {
              primaryLanguage { name }
              stargazerCount
            }
          }
          contributionsCollection {
            contributionCalendar { totalContributions }
          }
          followers { totalCount }
        }
      }
    `;

    const result = await fetchGraphQL(baseQuery, { login: username }, token);
    if (!result?.user) return [];

    const myRepoNodes = result.user.repositories.nodes || [];
    const myRepoCount = result.user.repositories.totalCount || 1;
    let myTotalStars = 0;
    const myLangCounts: Record<string, number> = {};

    myRepoNodes.forEach((r: any) => {
      myTotalStars += r.stargazerCount || 0;
      if (r.primaryLanguage?.name) {
        myLangCounts[r.primaryLanguage.name] = (myLangCounts[r.primaryLanguage.name] || 0) + 1;
      }
    });

    const top3Languages: LanguageWeight[] = Object.entries(myLangCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, weight: count / myRepoNodes.length || 1 }));

    if (top3Languages.length === 0) {
      top3Languages.push({ name: 'TypeScript', weight: 1 });
    }

    const myCommits = result.user.contributionsCollection?.contributionCalendar?.totalContributions || 0;
    const myCommitRate = myCommits / 365;
    const myAvgStars = myRepoNodes.length > 0 ? myTotalStars / myRepoNodes.length : 0;
    const myFollowers = result.user.followers?.totalCount || 0;
    const repoRangeLow = Math.max(1, myRepoCount - 8);
    const repoRangeHigh = myRepoCount + 25;

    // step 2: 3 parallel searches, one per language — NO follower range
    const searchPromises = top3Languages.map((lang, idx) => {
      const perPage = idx === 0 ? 15 : 10;
      return fetchWithAuth(
        `/search/users?q=language:${encodeURIComponent(lang.name)}+repos:${repoRangeLow}..${repoRangeHigh}+type:user&per_page=${perPage}`,
        token
      );
    });

    const searchResults = await Promise.all(searchPromises);

    const seen = new Set<string>();
    seen.add(username);
    const candidates: any[] = [];
    for (const res of searchResults) {
      for (const user of (res?.items || [])) {
        if (!seen.has(user.login) && !isBot(user.login)) {
          seen.add(user.login);
          candidates.push(user);
        }
      }
    }

    const topCandidates = candidates.slice(0, 20);
    if (topCandidates.length === 0) return [];

    // step 3: chunked graphql — chunkSize=5 because each user requests first:50 repos (avoids 502)
    const candRes = await batchGraphQL(
      topCandidates,
      (u: any, i: number) => `
        user${i}: user(login: "${u.login}") {
          login
          name
          avatarUrl
          bio
          repositories(first: 50, privacy: PUBLIC, ownerAffiliations: OWNER) {
            totalCount
            nodes {
              primaryLanguage { name }
              stargazerCount
            }
          }
          contributionsCollection {
            contributionCalendar { totalContributions }
          }
          followers { totalCount }
        }
      `,
      token,
      5
    );
    if (!candRes || Object.keys(candRes).length === 0) return [];

    // step 4: score with multi-signal distance
    const scoredDevs: any[] = [];
    for (let i = 0; i < topCandidates.length; i++) {
      const data = candRes[`user${i}`];
      if (!data) continue;

      const candNodes = data.repositories?.nodes || [];
      const candRepoCount = Math.max(candNodes.length, 1);
      let candTotalStars = 0;
      const candLangCounts: Record<string, number> = {};

      candNodes.forEach((r: any) => {
        candTotalStars += r.stargazerCount || 0;
        if (r.primaryLanguage?.name) {
          candLangCounts[r.primaryLanguage.name] = (candLangCounts[r.primaryLanguage.name] || 0) + 1;
        }
      });

      const candTop3: LanguageWeight[] = Object.entries(candLangCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, weight: count / candRepoCount }));

      const candCommits = data.contributionsCollection?.contributionCalendar?.totalContributions || 0;
      const candCommitRate = candCommits / 365;
      const candAvgStars = candTotalStars / candRepoCount;
      const candTotalRepos = data.repositories?.totalCount || 0;
      const candFollowers = data.followers?.totalCount || 0;

      // multi-signal distance — lower = better match
      const langSim = cosineSimilarity(top3Languages, candTop3);
      const commitRateDiff = Math.abs(myCommitRate - candCommitRate) / Math.max(myCommitRate, candCommitRate, 1);
      const repoCountDiff = Math.abs(myRepoCount - candTotalRepos) / Math.max(myRepoCount, candTotalRepos, 1);
      const avgStarsDiff = Math.abs(myAvgStars - candAvgStars) / Math.max(myAvgStars, candAvgStars, 1);
      const followerDiff = Math.abs(myFollowers - candFollowers) / Math.max(myFollowers, candFollowers, 1);

      const distance =
        (1 - langSim) * 3.5  // language most important
        + commitRateDiff * 2.5  // commit velocity next
        + repoCountDiff * 1.0  // scale of work
        + avgStarsDiff * 0.3  // stars 
        + followerDiff * 1.5; // followers weight;

      // find actual shared languages for display
      const sharedLangs = top3Languages
        .filter(l => candTop3.some(c => c.name === l.name))
        .map(l => l.name)
        .slice(0, 2);

      const displaySubtitle = sharedLangs.length > 0
        ? `${sharedLangs.join(' & ')} · ${candCommits} commits/yr`
        : `${candTop3[0]?.name || 'Code'} · ${candCommits} commits/yr`;

      scoredDevs.push({
        login: data.login,
        name: data.name || data.login,
        avatar_url: data.avatarUrl,
        bio: data.bio || '',
        repoName: sharedLangs[0] || top3Languages[0]?.name || 'Code',
        repoDescription: displaySubtitle,
        sharedLanguages: sharedLangs,
        totalContributions: candCommits,
        distance
      });
    }

    // step 5: sort by distance, achievement bonus for top items
    scoredDevs.sort((a, b) => a.distance - b.distance);
    const topItems = scoredDevs.slice(0, limit);

    try {
      const achievementResults = await Promise.all(
        topItems.map(dev => getUserAchievements(dev.login))
      );
      for (let i = 0; i < topItems.length; i++) {
        const achScore = computeAchievementScore(achievementResults[i] || []);
        topItems[i].distance -= Math.min(achScore * 0.1, 1.5);
        topItems[i].achievementScore = achScore;
      }
      topItems.sort((a, b) => a.distance - b.distance);
    } catch {
      // achievements are bonus — don't fail silently breaks the whole function
    }

    return topItems;

  } catch (err) {
    console.error('[getDevelopersLikeYou] Error:', err);
    return [];
  }
}

/**
 * fetch massive repos to star (established projects)
 */
export async function getTopReposToStar(token: string, limit = 5): Promise<any[]> {
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const reposRes = await fetchWithAuth(
    `/search/repositories?q=stars:>10000&sort=stars&order=desc&per_page=20&page=${randomPage}`,
    token
  );

  const items = reposRes?.items || [];
  // shuffle them slightly returning top limit
  return items.sort(() => 0.5 - Math.random()).slice(0, limit);
}

/**
 * fetch user's received events (the tl on gh)
 */
export async function getGitHubTimelineEvents(username: string, token: string, limit = 50): Promise<any[]> {
  try {
    const res = await fetchWithAuth(`/users/${username}/received_events?per_page=${limit}`, token);
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.error("Failed to load GitHub timeline events:", err);
    return [];
  }
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
 * fetch contribution data (365-day calendar) via graphql
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
              commitContributionsByRepository(maxRepositories: 20) {
                repository { nameWithOwner }
                contributions { totalCount }
              }
              repositoryContributions(first: 20) {
                nodes { repository { nameWithOwner } }
              }
              pullRequestContributionsByRepository(maxRepositories: 20) {
                repository { nameWithOwner }
                contributions(first: 5) {
                  totalCount
                  nodes { pullRequest { title, url, number } }
                }
              }
              issueContributionsByRepository(maxRepositories: 20) {
                repository { nameWithOwner }
                contributions(first: 5) {
                  totalCount
                  nodes { issue { title, url, number } }
                }
              }
              pullRequestReviewContributionsByRepository(maxRepositories: 20) {
                repository { nameWithOwner }
                contributions(first: 5) {
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

// ─── user achievements scraper ──────────────────────────────────────────

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
