export interface ScoreFactors {
  language: string | null;
  stars: number;
  forks: number;
  daysSincePush: number;
  hasDescription: boolean;
  authorFollowers?: number; // optional, to penalize high followers
  daysSincePost: number;
}

/**
 * calculates a "quality score" for a post based on its embedded repository.
 * the goal is to surface hidden gems rather than just popular repos.
 */
export function calculatePostScore(factors: ScoreFactors): number {
  let score = 0;

  // 1. tech stack novelty (reward less common, high-interest languages & frameworks)
  const noveltyLanguages = ["Rust", "Zig", "Elixir", "Go", "Gleam", "Ocaml", "Haskell", "F#", "HolyC", "Vue", "Angular", "Svelte"];
  const commonLanguages = ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "C", "React", "NextJs", "NodeJs", "Express"];

  if (factors.language) {
    if (noveltyLanguages.includes(factors.language)) {
      score += 25; // big boost for novel tech
    } else if (!commonLanguages.includes(factors.language)) {
      score += 10; // slight boost for niche
    }
  }

  // 2. base quality (stars & forks)
  // i want to reward some traction, but with diminishing returns so big repos don't dominate
  const starScore = Math.min(factors.stars * 0.5, 30); // max 30 pts from stars
  const forkScore = Math.min(factors.forks * 1.0, 20); // max 20 pts from forks
  score += starScore + forkScore;

  // 3. completeness
  if (factors.hasDescription) {
    score += 10;
  }

  // 4. recent activity (active development boost)
  // penalize if it hasn't been pushed to recently
  if (factors.daysSincePush <= 7) {
    score += 20; // active this week
  } else if (factors.daysSincePush <= 30) {
    score += 10; // active this month
  } else if (factors.daysSincePush > 365) {
    score -= 20; // dead repo penalty
  }

  // 5. follower bias (the "anti-clout" mechanic)
  // i want to surface hidden gems. penalize massive accounts slightly.
  if (factors.authorFollowers !== undefined) {
    if (factors.authorFollowers > 10000) {
      score -= 15;
    } else if (factors.authorFollowers < 100) {
      score += 10; // boost no-name developers
    }
  }

  // 6. time decay (gravity)
  // posts lose relevance over time
  const decayFactor = Math.pow(Math.max(factors.daysSincePost, 1), 1.2);

  return Math.max(score / decayFactor, 0); // score can't be negative
}