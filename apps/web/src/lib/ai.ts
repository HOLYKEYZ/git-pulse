import { withCache } from "./cache";

/**
 * ai service for generating 2-sentence repo pitches.
 * uses gemini by default, falls back to heuristic if no api key.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface RepoContext {
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  readmeExcerpt?: string;
}

/**
 * generate a 2-sentence pitch for a repository.
 * results are cached for 24 hours per repo.
 */
export async function generateRepoPitch(repo: RepoContext): Promise<string> {
  if (!repo || !repo.name || !repo.owner || repo.stars == null || repo.forks == null || !repo.topics) {
    throw new Error('Invalid repository context');
  }
  // Sanitize user-input data
  repo.name = repo.name.trim();
  repo.owner = repo.owner.trim();
  repo.description = repo.description ? repo.description.trim() : '';
  if (repo.name.length === 0 || repo.owner.length === 0) {
    throw new Error('Repository name or owner cannot be empty');
  }
  const cacheKey = `ai-pitch:${repo.owner}/${repo.name}`;

  return withCache(
    cacheKey,
    async () => {
      try {
        // try llm first, fall back to heuristic
        if (GEMINI_API_KEY) {
          try {
            return await geminiPitch(repo);
          } catch (error) {
            console.error("[AI] Gemini failed, no pitch generated:", error);
            throw new Error('Failed to generate pitch');
          }
        }
        throw new Error('No API key provided');
      } catch (error) {
        console.error("[AI] Error generating pitch:", error);
        throw error;
      }
    },
    1000 * 60 * 60 * 24 // 24-hour cache ttl
  );
}

/**
 * gemini-powered pitch generation
 */
async function geminiPitch(repo: RepoContext): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a developer advocate writing a compelling 2-sentence pitch for an open-source repository.

Repository: ${repo.owner}/${repo.name}
Description: ${repo.description || "No description provided"}
Language: ${repo.language || "Unknown"}
Stars: ${repo.stars} | Forks: ${repo.forks}
Topics: ${repo.topics.join(", ") || "None"}
${repo.readmeExcerpt ? `README excerpt: ${repo.readmeExcerpt.slice(0, 500)}` : ""}

Write exactly 2 sentences. The first sentence should explain WHAT the project does in plain language. The second sentence should explain WHY a developer should care (unique value prop). Be concise, technical but accessible, and avoid generic praise. Do NOT use markdown or emoji.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // sanity check — if the model returns something too long or weird, fall back
  if (text.length > 400 || text.length < 20) {
    return "";
  }

  return text;
}
