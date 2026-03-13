import React from 'react';

// A simple dummy heatmap that looks like GitHub's contribution graph
export default function ContributionHeatmap() {
    const weeks = 52;
    const days = 7;

    // Generate random dummy data with GitHub green colors
const colors = [
    'bg-git-contribution-0', // empty
    'bg-git-contribution-1', // level 1
    'bg-git-contribution-2', // level 2
    'bg-git-contribution-3', // level 3
    'bg-git-contribution-4'  // highest
];

    return (
        <div className="w-full overflow-hidden rounded-xl border border-git-border bg-git-card p-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-git-text">1,432 contributions in the last year</h2>
                <span className="text-xs text-git-muted">Settings</span>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar">
                {Array.from({ length: weeks }).map((_, w) => (
                    <div key={w} className="flex flex-col gap-1 shrink-0">
                        {Array.from({ length: days }).map((_, d) => {
                            // 70% chance of empty, otherwise random color
                            const isContrib = Math.random() > 0.7;
                            const colorClass = isContrib ? colors[Math.floor(Math.random() * 4) + 1] : colors[0];

                            return (
                                <div
                                    key={`${w}-${d}`}
                                    className={`w-[10px] h-[10px] rounded-[2px] ${colorClass}`}
                                    title={`${Math.floor(Math.random() * 10)} contributions on this day`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-git-muted">
                <div>Learn how we count contributions</div>
                <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {colors.map((c, i) => (
                            <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${c}`} />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
