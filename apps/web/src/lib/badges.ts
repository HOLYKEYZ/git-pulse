export interface BadgeProps {
    score: number;
}

/**
 * Determines if a post score passes the quality threshold for the "Passed ✅" badge.
 * Threshold is set based on the maximum possible score (approx ~100 with all boosts).
 */
export const QUALITY_THRESHOLD = 45;

export function hasPassedBadge(score: number): boolean {
    return score >= QUALITY_THRESHOLD;
}
