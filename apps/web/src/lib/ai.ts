import { withCache } from "./cache";

/**
 * AI service for generating 2-sentence repo pitches.
 * Uses Gemini by default, falls back to heuristic if no API key.
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
 * Generate a 2-sentence pitch for a repository.
 * Results are cached for 24 hours per repo.
 */
export async function generateRepoPitch(repo: RepoContext): Promise<string> {
    const cacheKey = `ai-pitch:${repo.owner}/${repo.name}`;

    return withCache(
        cacheKey,
        async () => {
            // Try LLM first, fall back to heuristic
            if (GEMINI_API_KEY) {
                try {
                    return await geminiPitch(repo);
                } catch (error) {
                    console.error("[AI] Gemini failed, falling back to heuristic:", error);
                }
            }
            return heuristicPitch(repo);
        },
        1000 * 60 * 60 * 24 // 24-hour cache TTL
    );
}

/**
 * Gemini-powered pitch generation
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

    // Sanity check — if the model returns something too long or weird, fall back
    if (text.length > 400 || text.length < 20) {
        return heuristicPitch(repo);
    }

    return text;
}

/**
 * Heuristic fallback — no LLM needed
 */
function heuristicPitch(repo: RepoContext): string {
    const lang = repo.language || "multi-language";
    const desc = repo.description || `A ${lang} project`;

    // First sentence: what it does
    const what = desc.endsWith(".") ? desc : `${desc}.`;

    // Second sentence: why it matters
    let why: string;
    if (repo.stars > 1000) {
        why = `With ${repo.stars.toLocaleString()} stars, it's a proven tool in the ${lang} ecosystem.`;
    } else if (repo.forks > 100) {
        why = `Actively forked by ${repo.forks} developers — a growing community project.`;
    } else if (repo.topics.length > 0) {
        why = `Built for ${repo.topics.slice(0, 3).join(", ")} developers looking for a solid ${lang} solution.`;
    } else {
        why = `A ${lang} project worth exploring for developers interested in this space.`;
    }

    return `${what} ${why}`;
}
