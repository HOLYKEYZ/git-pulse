import React from "react";

// achievements rendered as styled emoji circles with inline styles
// (tailwind dynamic classes get tree-shaken, so we use inline gradients)
const ACHIEVEMENTS = [
    { name: "Galaxy Brain", emoji: "🧠", gradient: "linear-gradient(135deg, #9333ea, #4f46e5)" },
    { name: "Pull Shark", emoji: "🦈", gradient: "linear-gradient(135deg, #0891b2, #2563eb)", multiplier: 2 },
    { name: "Pair Extraordinaire", emoji: "👥", gradient: "linear-gradient(135deg, #db2777, #e11d48)" },
    { name: "YOLO", emoji: "🤪", gradient: "linear-gradient(135deg, #eab308, #f97316)" },
    { name: "Quickdraw", emoji: "⚡", gradient: "linear-gradient(135deg, #f59e0b, #ca8a04)" },
    { name: "Starstruck", emoji: "🌟", gradient: "linear-gradient(135deg, #10b981, #0d9488)" }
];

export default function AchievementsWidget() {
    return (
        <div className="border-t border-git-border border-solid mt-4 pt-4 animate-fade-in">
            <h2 className="text-xs font-semibold text-git-text mb-3">Achievements</h2>
            <div className="flex flex-wrap gap-1.5">
                {ACHIEVEMENTS.map((badge) => (
                    <div key={badge.name} className="relative group cursor-pointer">
                        <div
                            style={{ background: badge.gradient }}
                            className="w-[48px] h-[48px] rounded-full overflow-hidden flex items-center justify-center text-xl shadow-sm hover:scale-110 transition-transform"
                        >
                            {badge.emoji}
                        </div>
                        {badge.multiplier && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-[#1b1f23] border border-git-border text-git-text text-[9px] font-bold px-1 py-0 rounded-full z-10">
                                x{badge.multiplier}
                            </div>
                        )}
                        {/* tooltip */}
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-2 py-1 bg-[#24292f] text-white text-[11px] font-medium whitespace-nowrap rounded shadow-lg">
                            {badge.name}
                            <svg className="absolute text-[#24292f] h-1.5 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
