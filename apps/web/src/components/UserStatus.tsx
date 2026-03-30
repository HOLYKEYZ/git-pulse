"use client";

import { useState, useEffect, useRef } from "react";
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
  const [emoji, setEmoji] = useState(initialEmoji || "");
  const [text, setText] = useState(initialText || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // sync with initial props when they change
  useEffect(() => {
    setEmoji(initialEmoji || "");
    setText(initialText || "");
  }, [initialEmoji, initialText]);

  // click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

const handleSave = async (overrides?: { emoji?: string; text?: string }) => {
  setLoading(true);
  const finalEmoji = overrides?.hasOwnProperty("emoji") ? overrides.emoji : emoji;
  const finalText = overrides?.hasOwnProperty("text") ? overrides.text : text;

  try {
    const res = await fetch("/api/user/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: finalEmoji, text: finalText }),
    });

    if (res.ok) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert('Failed to save status. Please try again.');
    }
  } catch (error) {
    console.error("Failed to save status:", error);
    alert('An error occurred while saving your status.');
  } finally {
    setLoading(false);
  }
};

  const handleClear = async () => {
    setEmoji("");
    setText("");
    await handleSave({ emoji: "", text: "" });
  };

  if (!isOwnProfile && !initialEmoji && !initialText) return null;

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      {/* status toggle button */}
      {isOwnProfile ? (
        <button
          id="set-status-button"
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-git-border bg-git-bg hover:border-git-accent transition-all shadow-sm w-full sm:max-w-[280px] text-left"
          title={text || "Set status"}
        >
          {initialEmoji || initialText ? (
            <div className="flex items-center gap-2 min-w-0 w-full">
              {initialEmoji && <span className="text-[16px] shrink-0">{initialEmoji}</span>}
              {initialText && <span className="text-[13px] text-git-text truncate leading-tight flex-1">{initialText}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 w-full text-git-muted group-hover:text-git-accent transition-colors">
              <SmileyIcon size={16} className="shrink-0" />
              <span className="text-[13px] font-medium leading-tight">Set status</span>
            </div>
          )}
        </button>
      ) : (
        /* non-editable display */
        (initialEmoji || initialText) && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-git-border bg-git-card/50 shadow-sm sm:max-w-[280px]">
            {initialEmoji && <span className="text-[16px] shrink-0">{initialEmoji}</span>}
            {initialText && <span className="text-[13px] text-git-text truncate leading-tight">{initialText}</span>}
          </div>
        )
      )}

      {/* dropdown popover */}
      {isOpen && isOwnProfile && (
        <div className="fixed inset-0 z-[998]" onClick={() => setIsOpen(false)} />
        <div className="absolute top-full left-0 mt-2 z-[999] w-full min-w-[320px] max-w-sm bg-git-bg border border-git-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-3 py-2 border-b border-git-border bg-git-card">
            <h3 className="text-xs font-semibold text-git-text">Edit status</h3>
            <button onClick={() => setIsOpen(false)} className="text-git-muted hover:text-git-text transition-colors p-1">
              <XIcon size={16} />
            </button>
          </div>

          <div className="p-3 flex flex-col gap-3">
            {/* inputs */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-git-bg border border-git-border focus-within:border-git-accent transition-colors">
              <input
                id="status-emoji-input"
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="😊"
                className="w-8 text-center bg-transparent border-none outline-none text-base placeholder:opacity-50"
                maxLength={4}
                title="Type or paste any emoji"
              />
              <div className="w-px h-5 bg-git-border"></div>
              <input
                id="status-text-input"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's happening?"
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-git-text placeholder:text-git-muted"
                maxLength={80}
                autoFocus
              />
            </div>

            {/* suggestions */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-git-muted tracking-wider">Suggestions</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {COMMON_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(emoji === e ? "" : e)}
                    className={`w-7 h-7 flex items-center justify-center rounded border transition-all text-sm ${
                      emoji === e ? "border-git-accent bg-git-accent/10" : "border-git-border bg-git-bg hover:bg-git-hover"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* footer actions */}
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-git-border">
              <button
                onClick={handleClear}
                disabled={loading || (!emoji && !text)}
                className="text-[11px] font-medium text-git-muted hover:text-red-400 transition-colors disabled:opacity-50"
              >
                Clear status
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-md text-[11px] font-medium text-git-text border border-git-border hover:bg-git-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-git-accent text-white hover:bg-git-accent/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {loading ? "Saving..." : "Save status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
