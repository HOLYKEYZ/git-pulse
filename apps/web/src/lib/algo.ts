export interface ScoreFactors {
    language: string | null;
    stars: number;
    forks: number;
    daysSincePush: number;
    hasDescription: boolean;
    authorFollowers?: number; // Optional, to penalize high followers
    daysSincePost: number;
}

/**
 * Calculates a "Quality Score" for a post based on its embedded repository.
 * The goal is to surface hidden gems rather than just popular repos.
 */
export function calculatePostScore(factors: ScoreFactors): number {
    let score = 0;

    // 1. Tech Stack Novelty (Reward less common, high-interest languages)
    const noveltyLanguages = ["Rust", "Zig", "Elixir", "Go", "Gleam", "Ocaml", "Haskell", "F#"];
    const commonLanguages = ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby"];

    if (factors.language) {
        if (noveltyLanguages.includes(factors.language)) {
            score += 25; // Big boost for novel tech
        } else if (!commonLanguages.includes(factors.language)) {
            score += 10; // Slight boost for niche
        }
    }

    // 2. Base Quality (Stars & Forks)
    // We want to reward SOME traction, but with diminishing returns so big repos don't dominate
    const starScore = Math.min(factors.stars * 0.5, 30); // Max 30 pts from stars
    const forkScore = Math.min(factors.forks * 1.0, 20); // Max 20 pts from forks
    score += starScore + forkScore;

    // 3. Completeness
    if (factors.hasDescription) {
        score += 10;
    }

    // 4. Recent Activity (Active development boost)
    // Penalize if it hasn't been pushed to recently
    if (factors.daysSincePush <= 7) {
        score += 20; // Active this week
    } else if (factors.daysSincePush <= 30) {
        score += 10; // Active this month
    } else if (factors.daysSincePush > 365) {
        score -= 20; // Dead repo penalty
    }

    // 5. Follower Bias (The "Anti-Clout" mechanic)
    // We want to surface hidden gems. Penalize massive accounts slightly.
    if (factors.authorFollowers !== undefined) {
        if (factors.authorFollowers > 10000) {
            score -= 15;
        } else if (factors.authorFollowers < 100) {
            score += 10; // Boost no-name developers
        }
    }

    // 6. Time Decay (Gravity)
    // Posts lose relevance over time
    const decayFactor = Math.pow(Math.max(factors.daysSincePost, 1), 1.2);

    return Math.max(score / decayFactor, 0); // Score can't be negative
}
