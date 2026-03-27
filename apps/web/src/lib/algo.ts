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
export interface AlgorithmConfig {
  noveltyLanguages: string[];
  commonLanguages: string[];
  noveltyLanguageBoost: number;
  uncommonLanguageBoost: number;
  starSweetSpotMin: number;
  starSweetSpotMax: number;
  starSweetSpotBaseBoost: number;
  starSweetSpotMultiplier: number;
  starSweetSpotCap: number;
  starOver1kBoost: number;
  smallRepoStarMultiplier: number;
  forkScoreMultiplier: number;
  forkScoreCap: number;
  descriptionBoost: number;
  commitCountLogBase: number;
  commitCountMultiplier: number;
  commitCountCap: number;
  pushConsistencyMultiplier: number;
  pushConsistencyCap: number;
  recentActivity7DaysBoost: number;
  recentActivity30DaysBoost: number;
  oldActivityPenalty: number;
  followerBiasHighThreshold: number;
  followerBiasHighPenalty: number;
  followerBiasLowThreshold: number;
  followerBiasLowBoost: number;
  timeDecayExponent: number;
}

const DEFAULT_ALGORITHM_CONFIG: AlgorithmConfig = {
  noveltyLanguages: ["Rust", "Zig", "Elixir", "Go", "Gleam", "Ocaml", "Haskell", "F#", "HolyC", "Vue", "Angular", "Svelte"],
  commonLanguages: ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "C", "React", "NextJs", "NodeJs", "Express"],
  noveltyLanguageBoost: 25,
  uncommonLanguageBoost: 10,
  starSweetSpotMin: 20,
  starSweetSpotMax: 1000,
  starSweetSpotBaseBoost: 15,
  starSweetSpotMultiplier: 0.03,
  starSweetSpotCap: 30,
  starOver1kBoost: 20,
  smallRepoStarMultiplier: 0.5,
  forkScoreMultiplier: 1.0,
  forkScoreCap: 20,
  descriptionBoost: 10,
  commitCountLogBase: 2,
  commitCountMultiplier: 5,
  commitCountCap: 35,
  pushConsistencyMultiplier: 50,
  pushConsistencyCap: 50,
  recentActivity7DaysBoost: 20,
  recentActivity30DaysBoost: 10,
  oldActivityPenalty: -20,
  followerBiasHighThreshold: 10000,
  followerBiasHighPenalty: -15,
  followerBiasLowThreshold: 100,
  followerBiasLowBoost: 10,
  timeDecayExponent: 1.2,
};

export function calculatePostScore(factors: ScoreFactors, config: Partial<AlgorithmConfig> = {}): number {
  const effectiveConfig = { ...DEFAULT_ALGORITHM_CONFIG, ...config };
  let score = 0;

  if (factors.language) {
    if (effectiveConfig.noveltyLanguages.includes(factors.language)) {
      score += effectiveConfig.noveltyLanguageBoost;
    } else if (!effectiveConfig.commonLanguages.includes(factors.language)) {
      score += effectiveConfig.uncommonLanguageBoost;
    }
  }

  if (factors.stars >= effectiveConfig.starSweetSpotMin && factors.stars <= effectiveConfig.starSweetSpotMax) {
    const normalizedStar = Math.min(factors.stars, effectiveConfig.starSweetSpotMax);
    score += effectiveConfig.starSweetSpotBaseBoost + Math.min(normalizedStar * effectiveConfig.starSweetSpotMultiplier, effectiveConfig.starSweetSpotCap);
  } else if (factors.stars > effectiveConfig.starSweetSpotMax) {
    score += effectiveConfig.starOver1kBoost;
  } else if (factors.stars > 0) {
    score += factors.stars * effectiveConfig.smallRepoStarMultiplier;
  }

  const forkScore = Math.min(factors.forks * effectiveConfig.forkScoreMultiplier, effectiveConfig.forkScoreCap);
  score += forkScore;

  if (factors.hasDescription) {
    score += effectiveConfig.descriptionBoost;
  }

  if (factors.commitCount !== undefined && factors.commitCount > 0) {
    score += Math.min(Math.log2(factors.commitCount) * effectiveConfig.commitCountMultiplier, effectiveConfig.commitCountCap);
  }

  if (factors.pushConsistency !== undefined && factors.pushConsistency > 0) {
    score += factors.pushConsistency * effectiveConfig.pushConsistencyMultiplier;
  }

  if (factors.daysSincePush <= 7) {
    score += effectiveConfig.recentActivity7DaysBoost;
  } else if (factors.daysSincePush <= 30) {
    score += effectiveConfig.recentActivity30DaysBoost;
  } else if (factors.daysSincePush > 365) {
    score += effectiveConfig.oldActivityPenalty;
  }

  if (factors.authorFollowers !== undefined) {
    if (factors.authorFollowers > effectiveConfig.followerBiasHighThreshold) {
      score += effectiveConfig.followerBiasHighPenalty;
    } else if (factors.authorFollowers < effectiveConfig.followerBiasLowThreshold) {
      score += effectiveConfig.followerBiasLowBoost;
    }
  }

  const decayFactor = Math.pow(Math.max(factors.daysSincePost, 1), effectiveConfig.timeDecayExponent);

  return Math.max(score / decayFactor, 0);
}
