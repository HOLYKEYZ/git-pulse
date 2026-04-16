import React from "react";
import Image from "next/image";
import { getUserAchievements } from "@/lib/github";

export default async function AchievementsWidget({ username }: { username: string }) {
        if (typeof username !== 'string' || username.length === 0) {
          throw new Error('Invalid username provided');
        }
        try {
          const achievements = await getUserAchievements(username);
          if (!achievements || achievements.length === 0) {
            return null;
          }
          return (
            // ... rest of the component remains the same ...
          );
        } catch (error) {
          console.error('Error fetching achievements:', error);
          return <div>Error loading achievements</div>;
        }
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

                {/* GitHub-native styled Tooltip */}
                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-72 p-3 bg-git-card border border-git-border text-git-text rounded-md shadow-xl pointer-events-none">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[14px] text-git-text">{badge.name}</span>
                    {badge.multiplier && (
                      <span className="text-[11px] font-normal text-[#e89196] border border-[#e89196]/30 bg-[#e89196]/10 px-1.5 py-0.5 rounded-full">
                        x{badge.multiplier} tier
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-git-text leading-snug">
                    {badge.description || "Achievement unlocked."}
                  </div>
                  <svg className="absolute text-git-card h-2.5 w-full left-0 top-full drop-shadow-sm" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
}
