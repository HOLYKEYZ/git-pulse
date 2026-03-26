"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SmileyIcon, XIcon } from "@primer/octicons-react";
import { useRouter } from "next/navigation";

interface UserStatusProps {
  initialEmoji: string | null;
  initialText: string | null;
  isOwnProfile: boolean;
}

const COMMON_EMOJIS = ["💬", "🎯", "🚀", "🌴", "🤒", "😴", "🤝", "🏗️"];

export default function UserStatus({ initialEmoji, initialText, isOwnProfile }: UserStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emoji, setEmoji] = useState(initialEmoji || "");
  const [text, setText] = useState(initialText || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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
  };

  if (!isOwnProfile && !initialEmoji && !initialText) return null;

  const modalContent = isOpen && (
    <div 
      id="status-modal-overlay"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 animate-fade-in text-git-text"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div 
        id="status-modal-content"
        className="w-full max-w-sm bg-git-card border border-git-border rounded-xl shadow-2xl overflow-hidden animate-slide-up"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-git-border bg-git-bg/50">
          <h3 className="text-sm font-semibold text-git-text">Edit status</h3>
          <button onClick={() => setIsOpen(false)} className="text-git-muted hover:text-git-text transition-colors">
            <XIcon size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 p-2 rounded-md bg-git-bg border border-git-border focus-within:border-git-accent transition-colors">
            <input
              id="status-emoji-input"
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="✨"
              className="w-10 text-center bg-transparent border-none outline-none text-xl"
              maxLength={2}
            />
            <input
              id="status-text-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening?"
              className="flex-1 bg-transparent border-none outline-none text-sm text-git-text"
              maxLength={80}
              autoFocus
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
              id="clear-status-button"
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
                id="save-status-button"
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-1.5 rounded-md text-xs font-medium bg-git-accent text-white hover:bg-git-accent/90 disabled:opacity-50 transition-all font-semibold"
              >
                {loading ? "Saving..." : "Set status"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* status display / toggle */}
      {isOwnProfile ? (
        <button
          id="set-status-button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border border-git-border bg-git-bg hover:border-git-accent transition-all shadow-sm overflow-hidden"
          title="Set status"
        >
          {emoji ? (
            <span className="text-lg">{emoji}</span>
          ) : (
            <SmileyIcon size={18} className="text-git-muted group-hover:text-git-accent" />
          )}
        </button>
      ) : (
        (initialEmoji || initialText) && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-git-border bg-git-card/50 shadow-sm max-w-[200px]">
            <span className="text-lg shrink-0">{initialEmoji}</span>
            <span className="text-xs text-git-text truncate">{initialText}</span>
          </div>
        )
      )}

      {/* portal for modal */}
      {mounted && createPortal(modalContent, document.body)}
    </div>
  );
}

