export interface ScoreFactors {
  language: string | null;
  stars: number;
  forks: number;
  daysSincePush: number;
  hasDescription: boolean;
  authorFollowers?: number;
  daysSincePost: number;
  // algorithm v2 — user-specified weights
  commitCount?: number;       // total commits in repo (or by author)
  pushConsistency?: number;   // ratio of active weeks out of last 52 (0-1)
}

/**
 * calculates a "quality score" for a post based on its embedded repository.
 * v2: weighs by commits, consistency, and stars 20-1k sweet spot.
 */
export function calculatePostScore(factors: ScoreFactors): number {
  let score = 0;

  // 1. tech stack novelty (reward less common, high-interest languages & frameworks)
  const noveltyLanguages = ["Rust", "Zig", "Elixir", "Go", "Gleam", "Ocaml", "Haskell", "F#", "HolyC", "Vue", "Angular", "Svelte"];
  const commonLanguages = ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "C", "React", "NextJs", "NodeJs", "Express"];

  if (factors.language) {
    if (noveltyLanguages.includes(factors.language)) {
      score += 25;
    } else if (!commonLanguages.includes(factors.language)) {
      score += 10;
    }
  }

  // 2. star sweet spot (20-1k gets max boost, <20 is too obscure, >1k is already mainstream)
  if (factors.stars >= 20 && factors.stars <= 1000) {
    // parabolic boost peaking around 200 stars
    const normalizedStar = Math.min(factors.stars, 1000);
    score += 15 + Math.min(normalizedStar * 0.03, 30); // max ~45 pts in sweet spot
  } else if (factors.stars > 1000) {
    // diminishing returns past 1k — still gets some credit but capped
    score += 20;
  } else if (factors.stars > 0) {
    // tiny repos get minimal credit
    score += factors.stars * 0.5;
  }

  // 3. fork traction
  const forkScore = Math.min(factors.forks * 1.0, 20);
  score += forkScore;

  // 4. completeness
  if (factors.hasDescription) {
    score += 10;
  }

  // 5. commit volume — reward active development
  if (factors.commitCount !== undefined && factors.commitCount > 0) {
    // logarithmic scale so 10 commits vs 1000 commits doesn't skew wildly
    score += Math.min(Math.log2(factors.commitCount) * 5, 35); // max ~50 pts
  }

  // 6. push consistency — reward regular contributors (0 to 1 ratio)
  if (factors.pushConsistency !== undefined && factors.pushConsistency > 0) {
    // linear: a dev who pushes 80% of weeks gets 40 pts
    score += factors.pushConsistency * 50; // max 50 pts for perfect consistency
  }

  // 7. recent activity (active development boost)
  if (factors.daysSincePush <= 7) {
    score += 20;
  } else if (factors.daysSincePush <= 30) {
    score += 10;
  } else if (factors.daysSincePush > 365) {
    score -= 20;
  }

  // 8. follower bias (the "anti-clout" mechanic)
  if (factors.authorFollowers !== undefined) {
    if (factors.authorFollowers > 10000) {
      score -= 15;
    } else if (factors.authorFollowers < 100) {
      score += 10;
    }
  }

  // 9. time decay (gravity)
  const decayFactor = Math.pow(Math.max(factors.daysSincePost, 1), 1.2);

  return Math.max(score / decayFactor, 0);
}