import React from "react";
import Image from "next/image";
import { getUserAchievements } from "@/lib/github";

export default async function AchievementsWidget({ username }: { username: string }) {
    const achievements = await getUserAchievements(username);

    if (!achievements || achievements.length === 0) {
        return null;
    }

return (
        <div className="border-t border-git-border border-solid mt-4 pt-4 animate-fade-in">
          <h2 className="text-xs font-semibold text-git-text mb-3">Achievements</h2>
          <div className="flex flex-wrap gap-2">
            {achievements.map((badge) => (
              <div key={badge.name} className="relative group cursor-pointer inline-block">
                {/* We don't use rounded-full because GitHub badges are officially natively hexagonal. */}
                <div className="w-[64px] h-[64px] flex items-center justify-center transition-transform hover:scale-110">
                  <Image
                    src={badge.badgeUrl}
                    alt={badge.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>

                {badge.multiplier && (
                  <div className="absolute -bottom-1 -right-1 bg-achievements-background border border-git-border text-git-text text-[10px] font-bold px-1.5 py-0 rounded-full z-10 shadow-sm">
                    x{badge.multiplier}
                  </div>
                )}

                {/* Rich Tooltip displaying the description */}
                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 bg-achievements-hoverBackground backdrop-blur-md border border-git-border text-white text-xs rounded-md shadow-xl pointer-events-none">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[13px]">{badge.name}</span>
                    {badge.multiplier && (
                      <span className="text-[10px] bg-red-500/10 text-red-300 px-1.5 py-0.5 rounded-full border border-red-500/20">
                        x{badge.multiplier} tier
                      </span>
                    )}
                  </div>
                  <div className="text-achievements-descriptionText leading-snug">
                    {badge.description || "Achievement unlocked."}
                  </div>
                  <svg className="absolute text-achievements-hoverBackground h-2 w-full left-0 top-full drop-shadow-sm" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
}
