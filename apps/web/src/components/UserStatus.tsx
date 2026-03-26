"use client";

import { useState } from "react";
import { SmileyIcon, XIcon } from "@primer/octicons-react";
import { useRouter } from "next/navigation";

interface UserStatusProps {
  initialEmoji: string | null;
  initialText: string | null;
  isOwnProfile: boolean;
}

const COMMON_EMOJIS = ["💬", "🎯", "🚀", "🌴", "🤒", "😴", "WORKING", "🏗️"];

export default function UserStatus({ initialEmoji, initialText, isOwnProfile }: UserStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [emoji, setEmoji] = useState(initialEmoji || "");
  const [text, setText] = useState(initialText || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, text }),
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setEmoji("");
    setText("");
    // we could also auto-save here
  };

  if (!isOwnProfile && !initialEmoji && !initialText) return null;

  return (
    <div className="relative">
      {/* status display / toggle */}
      {isOwnProfile ? (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 w-full px-3 py-1.5 rounded-md border border-git-border bg-git-card hover:bg-git-hover transition-all text-left"
        >
          <span className="text-lg">{emoji || <SmileyIcon size={18} className="text-git-muted" />}</span>
          <span className="text-xs text-git-muted truncate">
            {text || "Set status"}
          </span>
        </button>
      ) : (
        (initialEmoji || initialText) && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-git-border bg-git-card/50">
            <span className="text-lg">{initialEmoji}</span>
            <span className="text-xs text-git-text truncate">{initialText}</span>
          </div>
        )
      )}

      {/* modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-git-card border border-git-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-git-border bg-git-bg/50">
              <h3 className="text-sm font-semibold text-git-text">Edit status</h3>
              <button onClick={() => setIsOpen(false)} className="text-git-muted hover:text-git-text transition-colors">
                <XIcon size={18} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-2 p-2 rounded-md bg-git-bg border border-git-border">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="✨"
                  className="w-10 text-center bg-transparent border-none outline-none text-xl"
                  maxLength={2}
                />
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What's happening?"
                  className="flex-1 bg-transparent border-none outline-none text-sm text-git-text"
                  maxLength={80}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {COMMON_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md border transition-all ${
                      emoji === e ? "border-git-accent bg-git-accent/10" : "border-git-border hover:bg-git-hover"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-git-border">
                <button
                  onClick={handleClear}
                  className="text-xs text-git-muted hover:text-red-400 transition-colors"
                >
                  Clear status
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 rounded-md text-xs font-medium text-git-text bg-git-card border border-git-border hover:bg-git-hover"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-md text-xs font-medium bg-git-accent text-white hover:bg-git-accent/90 disabled:opacity-50 transition-all"
                  >
                    {loading ? "Saving..." : "Set status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
