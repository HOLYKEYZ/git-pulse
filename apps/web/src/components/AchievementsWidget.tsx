import React from "react";
import Image from "next/image";

// Achievement images mapped to typical GitHub badge URLs or local fallbacks
// For demo and UI parity purposes, we use standard GitHub URLs where possible.
const ACHIEVEMENTS = [
    {
        name: "Galaxy Brain",
        url: "https://github.githubassets.com/assets/galaxy-brain-default-1422797e8841.png",
        tier: "default"
    },
    {
        name: "Pull Shark",
        url: "https://github.githubassets.com/assets/pull-shark-default-498c279a747d.png",
        tier: "default",
        multiplier: 2
    },
    {
        name: "Pair Extraordinaire",
        url: "https://github.githubassets.com/assets/pair-extraordinaire-default-7bd04ed68819.png",
        tier: "default"
    },
    {
        name: "YOLO",
        url: "https://github.githubassets.com/assets/yolo-default-be0381fe2ca2.png",
        tier: "default"
    },
    {
        name: "Quickdraw",
        url: "https://github.githubassets.com/assets/quickdraw-default-9d5113d55ab8.png",
        tier: "default"
    },
    {
        name: "Starstruck",
        url: "https://github.githubassets.com/assets/starstruck-default-fba11b51fc3c.png",
        tier: "default"
    }
];

export default function AchievementsWidget() {
    return (
        <div className="border-t border-git-border border-solid mt-4 pt-4 animate-fade-in">
            <h2 className="text-base font-semibold text-git-text mb-3">Achievements</h2>
            <div className="flex flex-wrap gap-2">
                {ACHIEVEMENTS.map((badge) => (
                    <div key={badge.name} className="relative group cursor-pointer group">
                        <div className="w-[60px] h-[60px] rounded-full overflow-hidden border border-git-border bg-[#161b22] hover:border-git-muted transition-colors flex items-center justify-center">
                            <Image
                                src={badge.url}
                                alt={badge.name}
                                width={60}
                                height={60}
                                className="object-contain"
                            />
                        </div>
                        {badge.multiplier && (
                            <div className="absolute -bottom-1 -right-1 bg-[#24292f] border border-git-border text-git-text text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-sm">
                                x{badge.multiplier}
                            </div>
                        )}
                        {/* Tooltip */}
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-2.5 py-1.5 bg-[#24292f] text-white text-[11px] font-medium whitespace-nowrap rounded shadow-lg">
                            {badge.name}
                            <svg className="absolute text-[#24292f] h-1.5 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
