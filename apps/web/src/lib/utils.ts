export function getRelativeTime(date: Date | string | number | null | undefined): string {
    if (!date) return '';
    const time = new Date(date).getTime();
    // Catch invalid dates and the exact unix epoch (1970) which occurs when Date(null) is cast
    if (isNaN(time) || time <= 0) return '';

    const now = Date.now();
    const diffInSeconds = Math.max(0, Math.floor((now - time) / 1000));

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
}

export function isValidHttpUrl(string: string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}

export function hasPassedBadge(score: number): boolean {
    return score >= 40;
}
