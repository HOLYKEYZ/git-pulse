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
  const cacheKey = `ai-pitch:${repo.owner}/${repo.name}`;

  return withCache(
    cacheKey,
    async () => {
      // try llm first, fall back to heuristic
      if (GEMINI_API_KEY) {
        try {
          return await geminiPitch(repo);
        } catch (error) {
          console.error("[AI] Gemini failed, no pitch generated:", error);
          return await heuristicPitch(repo);
        }
      }
      return await heuristicPitch(repo);
    },
    1000 * 60 * 60 * 24 // 24-hour cache ttl
  );
}

async function heuristicPitch(repo: RepoContext): Promise<string> {
  const firstSentence = repo.description ? `The ${repo.name} project is a ${repo.description}.` : `The ${repo.name} project is primarily developed in ${repo.language || 'an unspecified language'}.`;
  const secondSentence = repo.stars > 0 || repo.forks > 0 ? `With ${repo.stars} stars and ${repo.forks} forks, this project has gained significant attention from the developer community.` : `This project is categorized under ${repo.topics.join(', ') || 'unknown topics'}.`;
  return `${firstSentence} ${secondSentence}`;
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
