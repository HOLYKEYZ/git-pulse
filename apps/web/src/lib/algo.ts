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

export interface PostScoreDetail {
  score: number;
  breakdown: {
    language: number;
    stars: number;
    forks: number;
    completeness: number;
    commitVolume: number;
    pushConsistency: number;
    recentActivity: number;
    followerBias: number;
    penalty: number;
    decayMultiplier: number;
  };
}

/**
 * Calculates a "quality score" for a post based on its embedded repository with full transparency.
 * v3: Heavily penalizes 0 commits, heavily weighs commit count and consistency, mitigates follower clout.
 */
export function calculatePostScoreDetailed(factors: ScoreFactors): PostScoreDetail {
  let score = 0;
  const breakdown = {
    language: 0,
    stars: 0,
    forks: 0,
    completeness: 0,
    commitVolume: 0,
    pushConsistency: 0,
    recentActivity: 0,
    followerBias: 0,
    penalty: 0,
    decayMultiplier: 1,
  };

  // 1. Tech stack novelty
  const noveltyLanguages = ["Rust", "Zig", "Elixir", "Go", "Gleam", "Ocaml", "Haskell", "F#", "HolyC", "Vue", "Angular", "Svelte"];
  const commonLanguages = ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "C", "React", "NextJs", "NodeJs", "Express"];

  if (factors.language) {
    if (noveltyLanguages.includes(factors.language)) {
      breakdown.language = 25;
    } else if (!commonLanguages.includes(factors.language)) {
      breakdown.language = 10;
    }
  }
  score += breakdown.language;

  score += breakdown.stars;

  // 3. Forks
  breakdown.forks = Math.min(factors.forks * 1.0, 15);
  score += breakdown.forks;

  // 4. Completeness
  if (factors.hasDescription) {
    breakdown.completeness = 10;
    score += breakdown.completeness;
  }

  // 5. Commit Volume (Heavily prioritized max 80 pts)
  if (factors.commitCount !== undefined) {
    if (factors.commitCount === 0) {
      breakdown.penalty = -100; // Heavily penalize 0 commits
      score += breakdown.penalty;
    } else {
      // Steeper log scale to reward solid commit activity
      breakdown.commitVolume = Math.min(Math.log2(factors.commitCount) * 10, 80);
      score += breakdown.commitVolume;
    }
  }

  // 6. Push Consistency (Max 80 pts)
  if (factors.pushConsistency !== undefined && factors.pushConsistency > 0) {
    breakdown.pushConsistency = factors.pushConsistency * 80;
    score += breakdown.pushConsistency;
  }

  // 7. Recent activity
  if (factors.daysSincePush <= 7) {
    breakdown.recentActivity = 20;
  } else if (factors.daysSincePush <= 30) {
    breakdown.recentActivity = 10;
  } else if (factors.daysSincePush > 365) {
    breakdown.recentActivity = -30; // Stronger penalty for dead projects
  }
  score += breakdown.recentActivity;

  // 8. Follower bias ("anti-clout" mechanic)
  if (factors.authorFollowers !== undefined) {
    if (factors.authorFollowers > 1000) {
      // Heavily penalize huge accounts who post repos with low activity
      breakdown.followerBias = factors.commitCount === 0 ? -50 : -20;
    } else if (factors.authorFollowers < 100) {
      breakdown.followerBias = 15; // Boost small creators
    }
  }
  score += breakdown.followerBias;

}
  // 9. Time decay
  const decayFactor = Math.pow(Math.max(factors.daysSincePost, 1), 1.2);
  breakdown.decayMultiplier = 1 / decayFactor;

  const finalScore = Math.max(score / decayFactor, 0);

  return {
    score: finalScore,
    breakdown
  };
}

/**
 * Calculates a "quality score" for a post based on its embedded repository.
 * Wrapper for backward compatibility.
 */
export function calculatePostScore(factors: ScoreFactors): number {
  return calculatePostScoreDetailed(factors).score;
}
