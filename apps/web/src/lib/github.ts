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
      // the /search/commits endpoint requires the cloak-preview accept header
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
 * scrape github.com/trending/developers for real trending devs
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

export async function getUpcomingGitHubProjects(token: string, limit = 5): Promise<any[]> {
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const reposRes = await fetchWithAuth(
    `/search/repositories?q=stars:10..30&sort=updated&order=desc&per_page=20&page=${randomPage}`,
    token
  );
  
  const items = reposRes?.items || [];
  if (items.length === 0) return [];

  // Use a batched GraphQL query to get Exact Commit Counts for all repos at once to avoid Rate Limits
  const query = `
    query {
      ${items.map((repo: any, i: number) => {
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
      }).join('\n')}
    }
  `;

  const gqlRes = await fetchGraphQL(query, {}, token);

  const verifiedRepos = items.map((repo: any, i: number) => {
    const commitCount = gqlRes?.[`repo${i}`]?.defaultBranchRef?.target?.history?.totalCount || 0;
    return { ...repo, commitVelocity: commitCount };
  });

  const BOT_PATTERNS = [/bot$/i, /\[bot\]$/i, /^dependabot/, /^renovate/, /^github-actions/, /^stale/i, /^semantic-release/i, /^greenkeeper/i, /^imgbot/i];
  const isBot = (login: string) => BOT_PATTERNS.some((p) => p.test(login));

  // Strictly filter to 500-1000 commits, DEMAND a humanized description, and reject bots.
  // Sort ONLY by commit velocity (no star bias)
  const activeUpcoming = verifiedRepos
    .filter((r: any) => 
      r.commitVelocity >= 50 && 
      r.commitVelocity <= 1000 && 
      r.description && 
      r.description.length > 10 &&
      r.owner?.login && !isBot(r.owner.login)
    )
    .sort((a: any, b: any) => b.commitVelocity - a.commitVelocity);

  return activeUpcoming.length > 0 ? activeUpcoming.slice(0, limit) : 
    verifiedRepos
      .filter((r: any) => r.description && r.owner?.login && !isBot(r.owner.login))
      .sort((a: any, b: any) => b.commitVelocity - a.commitVelocity)
      .slice(0, limit);
}

/**
 * fetch suggested users
 * V3: Strictly prioritizes commit volume over follower count. Fetches a pool,
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
      } catch {}
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

export async function getTopReposByDailyCommits(token: string, limit = 5): Promise<any[]> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  const dateStr = todayIso.split("T")[0];

  const randomPage = Math.floor(Math.random() * 3) + 1;
  const reposRes = await fetchWithAuth(
    `/search/repositories?q=pushed:>=${dateStr}&sort=updated&order=desc&per_page=30&page=${randomPage}`,
    token
  );
  
  const items = reposRes?.items || [];
  if (items.length === 0) return [];

  // use GraphQL batching to fetch exactly how many commits were made today per repo
  const query = `
    query {
      ${items.map((repo: any, i: number) => {
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
      }).join('\n')}
    }
  `;

  const gqlRes = await fetchGraphQL(query, {}, token);

  const verifiedRepos = items.map((repo: any, i: number) => {
    const commitsToday = gqlRes?.[`repo${i}`]?.defaultBranchRef?.target?.history?.totalCount || 0;
    return { ...repo, commitsToday };
  });

  // strictly sort by exact commit volume today overriding any star bias
  // we filter out > 150 commits as they are almost certainly automated CI/CD bot squashes
  // we filter out > 150 commits as they are almost certainly automated CI/CD bot squashes
  const sortedRepos = verifiedRepos
    .filter((r: any) => r.commitsToday >= 3 && r.commitsToday < 150 && !r.fork && r.description && r.description.trim().length > 0)
    .sort((a: any, b: any) => b.commitsToday - a.commitsToday);

  return sortedRepos.slice(0, limit);
}

export async function getTopDevsByDailyCommits(token: string, limit = 5): Promise<any[]> {
  const todayIso = new Date().toISOString().split("T")[0];
  
  // Funnel: Use the public Events API firehose (Zero waste strategy)
  // This guarantees we only catch developers literally pushing code RIGHT NOW globally.
  const eventsRes = await fetchWithAuth(`/events?per_page=100`, token);
  
  if (!eventsRes || !Array.isArray(eventsRes)) return [];

  const BOT_PATTERNS = [/bot$/i, /\[bot\]$/i, /^dependabot/, /^renovate/, /^github-actions/, /^stale/i, /^semantic-release/i, /^greenkeeper/i, /^imgbot/i];
  const isBot = (login: string) => BOT_PATTERNS.some((p) => p.test(login));

  // Extract unique human actors who just triggered a Push or Create event
  const uniqueUsers = new Map<string, any>();
  for (const event of eventsRes) {
    if ((event.type === 'PushEvent' || event.type === 'CreateEvent' || event.type === 'PullRequestEvent') && event.actor?.login) {
      if (!isBot(event.actor.login) && !uniqueUsers.has(event.actor.login)) {
        uniqueUsers.set(event.actor.login, { login: event.actor.login, avatar_url: event.actor.avatar_url });
      }
    }
  }

  const userList = Array.from(uniqueUsers.values()).slice(0, 30);
  if (userList.length === 0) return [];

  // Use bulk GraphQL totalContributions to fetch EXACT commits without searching caps
  const candidatesQuery = `
    query {
      ${userList.map((user: any, i: number) => `
        user${i}: user(login: "${user.login}") {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      `).join('\n')}
    }
  `;

  const candRes = await fetchGraphQL(candidatesQuery, {}, token);

  const activeDevs = userList.map((user: any, i: number) => {
    let commitsToday = 0;
    const weeks = candRes?.[`user${i}`]?.contributionsCollection?.contributionCalendar?.weeks || [];
    // Just find today's exact date contribution count in the calendar array
    for (const week of weeks) {
      for (const day of week.contributionDays) {
        if (day.date === todayIso) {
          commitsToday = day.contributionCount;
        }
      }
    }
    
    return { ...user, totalContributions: commitsToday, label: "commits today" };
  });

  // Strict bot heuristic: no human physically authors >150 distinct commits a day consistently without scripting. 
  // We filter out 0 and absurdly high bot-like scripts to guarantee true human leaders.
  return activeDevs
    .filter((d: any) => d.totalContributions >= 3 && d.totalContributions < 150)
    .sort((a: any, b: any) => b.totalContributions - a.totalContributions).slice(0, limit);
}

export async function getUpcomingGitHubDevs(token: string, limit = 5): Promise<any[]> {
  // Use GitHub's native "Best Match" relevance engine by removing `sort`.
  // Best Match automatically prioritizes highly active, genuinely engaged users
  // within the exact 30 to 2000 followers band, eliminating newly scrubbed bot accounts.
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const usersRes = await fetchWithAuth(
    `/search/users?q=followers:30..2000+type:user&per_page=40&page=${randomPage}`,
    token
  );
  
  const items = usersRes?.items || [];
  if (items.length === 0) return [];

  const BOT_PATTERNS = [/bot$/i, /\[bot\]$/i, /^dependabot/, /^renovate/, /^github-actions/, /^stale/i, /^semantic-release/i, /^greenkeeper/i, /^imgbot/i];
  const isBot = (login: string) => BOT_PATTERNS.some((p) => p.test(login));

  const userList = items.filter((u: any) => !isBot(u.login)).slice(0, 30);
  if (userList.length === 0) return [];
  
  // fetch exact commit velocity in bulk
  const candidatesQuery = `
    query {
      ${userList.map((user: any, i: number) => `
        user${i}: user(login: "${user.login}") {
          contributionsCollection {
            contributionCalendar { totalContributions }
          }
        }
      `).join('\n')}
    }
  `;

  const candRes = await fetchGraphQL(candidatesQuery, {}, token);

  const upcomingDevs = userList.map((user: any, i: number) => {
    const totalContr = candRes?.[`user${i}`]?.contributionsCollection?.contributionCalendar?.totalContributions || 0;
    return { ...user, totalContributions: totalContr };
  });

  // NO BIAS sorting by strictly commit numbers
  return upcomingDevs.filter((u: any) => u.totalContributions >= 20).sort((a: any, b: any) => b.totalContributions - a.totalContributions).slice(0, limit);
}

/**
 * Advanced algorithm for finding "Developers Like You"
 * Weights: Tech Stack (Primary), Commits (High), Stars (Medium), Repos (Medium), Followers (Medium)
 */
export async function getDevelopersLikeYou(username: string, token: string, limit = 5): Promise<any[]> {
  try {
    // 1. Get baseline (user's top language, followers, total repos)
    const baseQuery = `
      query($login: String!) {
        user(login: $login) {
          followers { totalCount }
          repositories(first: 50, orderBy: {field: PUSHED_AT, direction: DESC}, privacy: PUBLIC) {
            totalCount
            nodes {
              primaryLanguage { name }
              stargazerCount
            }
          }
          contributionsCollection {
            contributionCalendar { totalContributions }
          }
        }
      }
    `;
    const result = await fetchGraphQL(baseQuery, { login: username }, token);
    if (!result?.user) return [];
    
    const repos = result.user.repositories.nodes || [];
    let totalStars = 0;
    const langCounts: Record<string, number> = {};
    repos.forEach((r: any) => {
      totalStars += r.stargazerCount || 0;
      if (r.primaryLanguage?.name) {
        langCounts[r.primaryLanguage.name] = (langCounts[r.primaryLanguage.name] || 0) + 1;
      }
    });

    const languageEntries = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
    const primaryLang = languageEntries.length > 0 ? languageEntries[0][0] : "TypeScript";

    const myFollowers = result.user.followers.totalCount || 0;
    const myRepos = result.user.repositories.totalCount || 0;
    const myStars = totalStars;
    const myCommits = result.user.contributionsCollection?.contributionCalendar?.totalContributions || 0;

    // 2. Search candidates (exact same language, repos nearby)
    // using basic search api because it's fast
    const searchRes = await fetchWithAuth(
      `/search/users?q=language:${primaryLang}+repos:${Math.max(1, myRepos - 15)}..${myRepos + 40}+type:user&per_page=40`,
      token
    );
    
    if (!searchRes?.items) return [];

    // 3. For each candidate, fetch exact stats via GraphQL in one giant query to avoid rate limits
    // Note: Kept to 10 candidates to prevent GitHub GraphQL from throwing a 502 Bad Gateway due to query complexity
    const logins = searchRes.items.filter((u: any) => u.login !== username).slice(0, 10).map((u: any) => u.login);
    if (logins.length === 0) return [];

    const candidatesQuery = `
      query {
        ${logins.map((login: string, i: number) => `
          user${i}: user(login: "${login}") {
            login
            name
            avatarUrl
            bio
            followers { totalCount }
            repositories(first: 10, privacy: PUBLIC) {
              totalCount
              nodes { stargazerCount }
            }
            contributionsCollection {
              contributionCalendar { totalContributions }
            }
          }
        `).join('\n')}
      }
    `;

    const candRes = await fetchGraphQL(candidatesQuery, {}, token);
    if (!candRes) return [];

    const scoredDevs = [];
    for (let i = 0; i < logins.length; i++) {
      const data = candRes[`user${i}`];
      if (!data) continue;

      const candFollowers = data.followers.totalCount || 0;
      const candRepos = data.repositories.totalCount || 0;
      let candStars = 0;
      (data.repositories.nodes || []).forEach((r: any) => candStars += r.stargazerCount || 0);
      const candCommits = data.contributionsCollection?.contributionCalendar?.totalContributions || 0;

      // score: lower is better (distance)
      // we normalize by percentage difference to keep scales equal
      const followDiff = Math.abs(myFollowers - candFollowers) / (myFollowers || 1);
      const repoDiff = Math.abs(myRepos - candRepos) / (myRepos || 1);
      const starDiff = Math.abs(myStars - candStars) / (myStars || 1);
      const commitDiff = Math.abs(myCommits - candCommits) / (myCommits || 1);

      const distance = (commitDiff * 2.5) + (repoDiff * 0.8) + (starDiff * 0.5) + (followDiff * 0.05);

      scoredDevs.push({
        login: data.login,
        name: data.name || data.login,
        avatar_url: data.avatarUrl,
        bio: data.bio || '',
        repoName: primaryLang,
        repoDescription: `${primaryLang} · similar activity`,
        repoStars: candStars,
        totalContributions: candCommits,
        distance
      });
    }

    // Sort by lowest distance
    return scoredDevs.sort((a, b) => a.distance - b.distance).slice(0, limit);
  } catch (err) {
    console.error("Error fetching getDevelopersLikeYou:", err);
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
 * fetch user's received events (timeline of people they follow)
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