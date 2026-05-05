/**
 * algorithm for gitpulse; ("devs like u", "active 2day", "upcoming devs/repos")
 */


// ─── types ───────────────────────────────────────────────────────────────────

export interface ScoreFactors {
  language: string | null;
  stars: number;
  forks: number;
  daysSincePush: number;
  hasDescription: boolean;
  authorFollowers?: number;
  daysSincePost: number;
  // algorithmv2 — user-specified weights
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
 * calculates a "quality score" for a post based on its embedded repository with full transparency.
 * v3: heavily penalizes 0 commits, heavily weighs commit count and consistency, mitigates follower clout.
 */
export function calculatePostScoreDetailed(factors: ScoreFactors): PostScoreDetail {
  if (!factors) {
    return { score: 0, breakdown: { language: 0, stars: 0, forks: 0, completeness: 0, commitVolume: 0, pushConsistency: 0, recentActivity: 0, followerBias: 0, penalty: 0, decayMultiplier: 1 } };
  }
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
  const safeStars = (typeof factors.stars !== 'number' || Number.isNaN(factors.stars) || factors.stars < 0) ? 0 : factors.stars;
  const safeForks = (typeof factors.forks !== 'number' || Number.isNaN(factors.forks) || factors.forks < 0) ? 0 : factors.forks;
  const safeDaysSincePush = (typeof factors.daysSincePush !== 'number' || Number.isNaN(factors.daysSincePush) || factors.daysSincePush < 0) ? 1 : factors.daysSincePush;
  const safeDaysSincePost = (typeof factors.daysSincePost !== 'number' || Number.isNaN(factors.daysSincePost) || factors.daysSincePost < 0) ? 1 : factors.daysSincePost;

  // 1. tech stack novelty
  const noveltyLanguages = ["Rust", "Zig", "Elixir", "Go", "Gleam", "Ocaml", "Haskell", "F#", "HolyC",];
  const commonLanguages = ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "C", "Ejs", "Html", "Css"];

  if (factors.language) {
    if (noveltyLanguages.includes(factors.language)) {
      breakdown.language = 25;
    } else if (!commonLanguages.includes(factors.language)) {
      breakdown.language = 10;
    }
  }
  score += breakdown.language;

  // 2. stars (reduced max weight to prevent pure popularity dominance)
  if (safeStars >= 20 && safeStars <= 1000) {
    const normalizedStar = Math.min(safeStars, 1000);
    breakdown.stars = 10 + Math.min(normalizedStar * 0.02, 20); // max 30 pts
  } else if (safeStars > 1000) {
    breakdown.stars = 15; // diminishing returns
  } else if (safeStars > 0) {
    breakdown.stars = safeStars * 0.3;
  }
  score += breakdown.stars;

  // 3. forks
  breakdown.forks = Math.min(safeForks * 1.0, 15);
  score += breakdown.forks;

  // 4. completeness
  if (factors.hasDescription) {
    breakdown.completeness = 10;
    score += breakdown.completeness;
  }

  // 5. commit volume (heavily prioritized max 80 pts)
  if (factors.commitCount !== undefined) {
    if (factors.commitCount === 0) {
      breakdown.penalty = -100; // heavily penalize 0 commits
      score += breakdown.penalty;
    } else {
      // steeper log scale to reward solid commit activity
      breakdown.commitVolume = Math.min(Math.log2(factors.commitCount) * 10, 80);
      score += breakdown.commitVolume;
    }
  }

  // 6. push consistency (max 80 pts)
  if (factors.pushConsistency !== undefined && factors.pushConsistency > 0) {
    breakdown.pushConsistency = factors.pushConsistency * 80;
    score += breakdown.pushConsistency;
  }

  // 7. push recency
  if (safeDaysSincePush <= 1) breakdown.recentActivity = 15;
  else if (safeDaysSincePush <= 3) breakdown.recentActivity = 10;
  else if (safeDaysSincePush <= 7) breakdown.recentActivity = 5;
  else if (safeDaysSincePush > 30) breakdown.recentActivity = -5; // stale push penalty
  score += breakdown.recentActivity;

  // 8. author follower bias mitigation
  if (factors.authorFollowers && factors.authorFollowers > 1000) {
    breakdown.followerBias = -10; // offset algorithmic bias for huge accounts
  } else if (factors.authorFollowers !== undefined && factors.authorFollowers < 50) {
    breakdown.followerBias = +10; // boost new/small creators
  }
  score += breakdown.followerBias;

  // 9. post age decay (time since the post was made)
  const decayFactor = 1 + (safeDaysSincePost * 0.1); // -10% per day
  breakdown.decayMultiplier = decayFactor;

  const finalScore = Math.max(score / decayFactor, 0);

  return {
    score: finalScore,
    breakdown
  };
}

/**
 * calculates a "quality score" for a post based on its embedded repository.
 * wrapper for backward compatibility.
 */
export function calculatePostScore(factors: ScoreFactors): number {
  return calculatePostScoreDetailed(factors).score;
}

// ─── developers like you — profiling utilities ──────────────────────────────

export interface LanguageWeight {
  name: string;
  weight: number; // ratio of repos using this language (0-1)
}

export interface DevProfile {
  languages: LanguageWeight[]; // top 3, weighted by repo count
  commitVelocity: number;     // contributions this year / 365
  repoCount: number;
  avgStarsPerRepo: number;
  achievementScore: number;
}

/**
 * computes a dynamic achievement score from scraped github achievement data.
 * every achievement contributes a base weight of 1 (having any achievement signals contribution behavior).
 * the multiplier field from github's own tier system (x2, x4, x16 etc.) naturally
 * amplifies the score — higher tiers indicate more sustained open-source involvement.
 * total score = sum of (1 * tier_multiplier) across all achievements.
 */
export function computeAchievementScore(
  achievements: { name: string; multiplier?: number }[]
): number {
  let total = 0;
  for (const a of achievements) {
    // base weight of 1 per achievement, scaled by github's tier multiplier
    const tier = a.multiplier ?? 1;
    total += tier;
  }
  return total;
}

/**
 * cosine similarity between two language-weight vectors.
 * returns a value between 0 (completely different) and 1 (identical).
 * both vectors are sparse — only matching language names contribute.
 */
export function cosineSimilarity(a: LanguageWeight[], b: LanguageWeight[]): number {
  const bMap = new Map(b.map(l => [l.name, l.weight]));

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const lang of a) {
    const bWeight = bMap.get(lang.name) ?? 0;
    dotProduct += lang.weight * bWeight;
    magA += lang.weight * lang.weight;
  }

  for (const lang of b) {
    magB += lang.weight * lang.weight;
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}
