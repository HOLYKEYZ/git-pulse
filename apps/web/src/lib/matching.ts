import { prisma } from "./prisma";
import { withCache } from "./cache";

/**
 * collab matching engine
 * matches developers by tech stack similarity using cosine similarity.
 */

export interface TechWeight {
  language: string;
  weight: number;
}

export interface CollabMatch {
  username: string;
  avatar: string;
  sharedLanguages: string[];
  similarity: number; // 0–1
}

/**
 * build a tech stack profile from a user's repos.
 * weight = proportion of repos using that language.
 */
export async function getUserTechStack(
  username: string,
  token: string
): Promise<TechWeight[]> {
  try {
    if (!username || !token) {
      throw new Error('Input parameters are null or empty');
    }
    const cacheKey = `techstack:${username}`;

    return withCache(cacheKey, async () => {
const res = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=pushed`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid or expired access token');
        } else if (res.status === 403) {
          throw new Error('Access token does not have the required scope');
        } else {
          throw new Error(`Failed to fetch user repositories: ${res.status}`);
        }
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch user repositories: ${res.status}`);
      }

      const repos = await res.json();
      const langCounts: Record<string, number> = {};
      let total = 0;
      for (const repo of repos) {
        if (repo.language && !repo.fork && !repo.archived) {
          langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
          total++;
        }
      }

      if (total === 0) return [];

      return Object.entries(langCounts).map(
        ([language, count]) => ({
          language,
          weight: count / total
        })
      ).sort((a, b) => b.weight - a.weight);
    }, 1000 * 60 * 60); // 1 hour cache
  } catch (error) {
    console.error('Error in getUserTechStack:', error);
    throw error;
  }
}
/**
 * cosine similarity between two tech stack vectors.
 */
function cosineSimilarity(a: TechWeight[], b: TechWeight[]): number {
  if (!a || !b) {
    throw new Error('Input arrays are null or empty');
  }
  if (a.length === 0 || b.length === 0) return 0;
  const allLangs = new Set([
  ...a.map((x) => x.language),
  ...b.map((x) => x.language)]
  );

  const weightMapA = new Map(a.map((x) => [x.language, x.weight]));
  const weightMapB = new Map(b.map((x) => [x.language, x.weight]));

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const lang of allLangs) {
    const wA = weightMapA.get(lang) || 0;
    const wB = weightMapB.get(lang) || 0;
    dotProduct += wA * wB;
    normA += wA * wA;
    normB += wB * wB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * find top n developers similar to the given user.
 */
export async function findSimilarDevs(
  currentUsername: string,
  currentStack: TechWeight[],
  limit = 5
): Promise<CollabMatch[]> {
  try {
    if (!currentUsername || !currentStack) {
      throw new Error('Input parameters are null or empty');
    }
    if (currentStack.length === 0) return [];

    // get all users in my db who have posted (active users)
    const users = await prisma.user.findMany({
      where: {
        username: { not: currentUsername },
        posts: { some: {} } // only users who have posted
      },
      select: {
        username: true,
        avatar: true
      },
      take: 50 // limit the pool for performance
    });

    const matches: CollabMatch[] = [];

    // Fetch all posts for all users in one query
    const allPosts = await prisma.post.findMany({
      where: {
        author: { username: { in: users.map((u) => u.username) } }
      },
      select: {
        id: true,
        repoEmbed: true,
        author: {
          select: { username: true }
        }
      }
    });

    // Group posts by user
    const postsByUser: Record<string, any[]> = {};
    allPosts.forEach((post) => {
      if (!postsByUser[post.author.username]) {
        postsByUser[post.author.username] = [];
      }
      postsByUser[post.author.username].push(post);
    });

    for (const user of users) {
      const posts = postsByUser[user.username] || [];

      // build a lightweight stack from their post repo embeds
      const langCounts: Record<string, number> = {};
      let total = 0;
      for (const post of posts) {
        if (post.repoEmbed) {
          const embed = post.repoEmbed as Record<string, any>;
          if (embed.language) {
            langCounts[embed.language] = (langCounts[embed.language] || 0) + 1;
            total++;
          }
        }
      }

      if (total === 0) continue;

      const userStack: TechWeight[] = Object.entries(langCounts).map(
        ([language, count]) => ({
          language,
          weight: count / total
        })
      );

      const similarity = cosineSimilarity(currentStack, userStack);
      if (similarity > 0.1) {
        // find shared languages
        const currentLangs = new Set(currentStack.map((x) => x.language));
        const sharedLanguages = userStack.filter((x) => currentLangs.has(x.language)).map((x) => x.language);

        matches.push({
          username: user.username,
          avatar: user.avatar || '',
          sharedLanguages,
          similarity
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  } catch (error) {
    console.error('Error in findSimilarDevs:', error);
    throw error;
  }
}