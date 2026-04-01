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
 * calculates a "quality score" for a post based on its embedded repository with full transparency.
 * v3: heavily penalizes 0 commits, heavily weighs commit count and consistency, mitigates follower clout.
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

  // 1. tech stack novelty
const NOVELTY_LANGUAGES = ["Rust", "Zig", "Elixir", "Go", "Gleam", "Ocaml", "Haskell", "F#", "HolyC", "Vue", "Angular", "Svelte"];
const COMMON_LANGUAGES = ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "C", "React", "NextJs", "NodeJs", "Express"];
const NOVELTY_LANGUAGE_HIGH_SCORE = 25;
const NOVELTY_LANGUAGE_LOW_SCORE = 10;

if (factors.language) {
  if (NOVELTY_LANGUAGES.includes(factors.language)) {
    breakdown.language = NOVELTY_LANGUAGE_HIGH_SCORE;
  } else if (!COMMON_LANGUAGES.includes(factors.language)) {
    breakdown.language = NOVELTY_LANGUAGE_LOW_SCORE;
  }
}
  score += breakdown.language;

  // 2. stars (reduced max weight to prevent pure popularity dominance)
const STAR_THRESHOLD_LOW = 20;
const STAR_THRESHOLD_HIGH = 1000;
const STAR_WEIGHT = 0.02;
const STAR_MAX_SCORE = 30;
const STAR_DIMINISHING_RETURN_SCORE = 15;
const STAR_LOW_SCORE_WEIGHT = 0.3;

if (factors.stars >= STAR_THRESHOLD_LOW && factors.stars <= STAR_THRESHOLD_HIGH) {
  const normalizedStar = Math.min(factors.stars, STAR_THRESHOLD_HIGH);
  breakdown.stars = 10 + Math.min(normalizedStar * STAR_WEIGHT, STAR_MAX_SCORE - 10); // max 30 pts
} else if (factors.stars > STAR_THRESHOLD_HIGH) {
  breakdown.stars = STAR_DIMINISHING_RETURN_SCORE; // diminishing returns
} else if (factors.stars > 0) {
  breakdown.stars = factors.stars * STAR_LOW_SCORE_WEIGHT;
}
  score += breakdown.stars;

  // 3. forks
const FORK_WEIGHT = 1.0;
const FORK_MAX_SCORE = 15;
breakdown.forks = Math.min(factors.forks * FORK_WEIGHT, FORK_MAX_SCORE);
  score += breakdown.forks;

  // 4. completeness
const COMPLETENESS_SCORE = 10;
if (factors.hasDescription) {
  breakdown.completeness = COMPLETENESS_SCORE;
  score += breakdown.completeness;
}

  // 5. commit volume (heavily prioritized max 80 pts)
const COMMIT_PENALTY_ZERO = -100;
const COMMIT_VOLUME_WEIGHT = 10;
const COMMIT_VOLUME_MAX_SCORE = 80;
if (factors.commitCount !== undefined) {
  if (factors.commitCount === 0) {
    breakdown.penalty = COMMIT_PENALTY_ZERO; // heavily penalize 0 commits
    score += breakdown.penalty;
  } else {
    // steeper log scale to reward solid commit activity
    breakdown.commitVolume = Math.min(Math.log2(factors.commitCount) * COMMIT_VOLUME_WEIGHT, COMMIT_VOLUME_MAX_SCORE);
    score += breakdown.commitVolume;
  }
}

  // 6. push consistency (max 80 pts)
const PUSH_CONSISTENCY_WEIGHT = 80;
if (factors.pushConsistency !== undefined && factors.pushConsistency > 0) {
  breakdown.pushConsistency = factors.pushConsistency * PUSH_CONSISTENCY_WEIGHT;
  score += breakdown.pushConsistency;
}

  // 7. recent activity
const RECENT_ACTIVITY_HIGH_SCORE = 20;
const RECENT_ACTIVITY_MEDIUM_SCORE = 10;
const RECENT_ACTIVITY_PENALTY = -30;
const RECENT_ACTIVITY_HIGH_THRESHOLD = 7;
const RECENT_ACTIVITY_MEDIUM_THRESHOLD = 30;
const RECENT_ACTIVITY_DEAD_THRESHOLD = 365;
if (factors.daysSincePush <= RECENT_ACTIVITY_HIGH_THRESHOLD) {
  breakdown.recentActivity = RECENT_ACTIVITY_HIGH_SCORE;
} else if (factors.daysSincePush <= RECENT_ACTIVITY_MEDIUM_THRESHOLD) {
  breakdown.recentActivity = RECENT_ACTIVITY_MEDIUM_SCORE;
} else if (factors.daysSincePush > RECENT_ACTIVITY_DEAD_THRESHOLD) {
  breakdown.recentActivity = RECENT_ACTIVITY_PENALTY; // stronger penalty for dead projects
}
  score += breakdown.recentActivity;

  // 8. follower bias ("anti-clout" mechanic)
const FOLLOWER_BIAS_PENALTY_LARGE_ACCOUNT = -50;
const FOLLOWER_BIAS_PENALTY_SMALL_ACCOUNT = -20;
const FOLLOWER_BIAS_BOOST_SMALL_CREATOR = 15;
const FOLLOWER_THRESHOLD_LARGE_ACCOUNT = 1000;
const FOLLOWER_THRESHOLD_SMALL_CREATOR = 100;
if (factors.authorFollowers !== undefined) {
  if (factors.authorFollowers > FOLLOWER_THRESHOLD_LARGE_ACCOUNT) {
    // heavily penalize huge accounts who post repos with low activity
    breakdown.followerBias = factors.commitCount === 0 ? FOLLOWER_BIAS_PENALTY_LARGE_ACCOUNT : FOLLOWER_BIAS_PENALTY_SMALL_ACCOUNT;
  } else if (factors.authorFollowers < FOLLOWER_THRESHOLD_SMALL_CREATOR) {
    breakdown.followerBias = FOLLOWER_BIAS_BOOST_SMALL_CREATOR; // boost small creators
  }
}
  score += breakdown.followerBias;

  // 9. time decay
const DECAY_FACTOR_EXPONENT = 1.2;
const decayFactor = Math.pow(Math.max(factors.daysSincePost, 1), DECAY_FACTOR_EXPONENT);
  breakdown.decayMultiplier = 1 / decayFactor;

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
